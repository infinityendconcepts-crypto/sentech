"""Auth Router - Registration, Login, Microsoft SSO, OTP"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
import secrets
import msal
import requests
import asyncio
import os

from routers import (
    db, get_current_user, generate_uuid, create_access_token,
    get_password_hash, verify_password, logger, is_admin_user, is_manager_or_admin,
    send_email_notification, get_app_url,
    MICROSOFT_CLIENT_ID, MICROSOFT_TENANT_ID, MICROSOFT_CLIENT_SECRET,
    MICROSOFT_AUTHORITY, MICROSOFT_SCOPE, FRONTEND_URL,
)

router = APIRouter(prefix="/api", tags=["auth"])

# --- Models ---

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str = ""
    student_id: Optional[str] = None
    roles: List[str] = ["employee"]

class UserLogin(BaseModel):
    email: str
    password: str

class PasswordSetup(BaseModel):
    email: str
    new_password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

# Local User model for registration
class _User(BaseModel):
    id: str = ""
    email: str
    full_name: str = ""
    surname: Optional[str] = None
    roles: List[str] = ["employee"]
    team_id: Optional[str] = None
    department: str = ""
    division: str = ""
    position: str = ""
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool = True
    is_verified: bool = False
    requires_password_setup: bool = False
    student_id: Optional[str] = None
    permissions: Dict = {}
    bio: Optional[str] = None
    password_hash: str = ""
    created_at: datetime = None
    updated_at: datetime = None

    def __init__(self, **data):
        if not data.get("id"):
            data["id"] = generate_uuid()
        now = datetime.now(timezone.utc)
        if not data.get("created_at"):
            data["created_at"] = now
        if not data.get("updated_at"):
            data["updated_at"] = now
        super().__init__(**data)


# --- OTP constants ---
OTP_EXPIRE_MINUTES = 10


def _send_otp_smtp(to_email: str, otp_code: str):
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    smtp_host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    smtp_user = os.environ.get("SMTP_USERNAME", "")
    smtp_pass = os.environ.get("SMTP_PASSWORD", "")
    from_name = os.environ.get("SMTP_FROM_NAME", "Sentech Bursary")
    from_email = os.environ.get("SMTP_FROM_EMAIL", smtp_user)
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Your {from_name} Login Code"
    msg["From"] = f"{from_name} <{from_email}>"
    msg["To"] = to_email
    html = f"""
    <html><body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:20px">
      <h2 style="color:#0056B3;">Sentech Bursary System</h2>
      <p>Your one-time login code is:</p>
      <div style="background:#E8F0FE;border:1px solid #0056B3;border-radius:8px;text-align:center;padding:24px;margin:20px 0;">
        <h1 style="color:#0056B3;letter-spacing:12px;font-size:36px;margin:0">{otp_code}</h1>
      </div>
      <p>This code expires in <strong>{OTP_EXPIRE_MINUTES} minutes</strong>. Do not share it with anyone.</p>
      <p style="color:#888;font-size:12px">If you didn't request this, please ignore this email.</p>
    </body></html>
    """
    msg.attach(MIMEText(html, "html"))
    msg.attach(MIMEText(f"Your login code: {otp_code}. Expires in {OTP_EXPIRE_MINUTES} minutes.", "plain"))
    with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
        server.ehlo()
        server.starttls()
        if smtp_user and smtp_pass:
            server.login(smtp_user, smtp_pass)
        server.sendmail(from_email, [to_email], msg.as_string())


# --- Routes ---

@router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = _User(
        email=user_data.email,
        full_name=user_data.full_name,
        password_hash=get_password_hash(user_data.password),
        student_id=user_data.student_id,
        roles=user_data.roles,
        is_verified=True
    )
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    user_dict['updated_at'] = user_dict['updated_at'].isoformat()
    await db.users.insert_one({**user_dict})
    access_token = create_access_token(data={"sub": user.id})
    user_response = {k: v for k, v in user_dict.items() if k != 'password_hash'}
    return TokenResponse(access_token=access_token, user=user_response)


@router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    if user.get("requires_password_setup", False):
        raise HTTPException(status_code=403, detail="Password setup required",
                            headers={"X-Requires-Password-Setup": "true"})
    if not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    if not user.get("is_active"):
        raise HTTPException(status_code=400, detail="Account is inactive")
    access_token = create_access_token(data={"sub": user["id"]})
    user_response = {k: v for k, v in user.items() if k != 'password_hash'}
    # Aggregate RBAC permissions
    role_permissions = {}
    user_roles = user.get("roles", [])
    if user_roles:
        role_docs = await db.roles.find({"name": {"$in": user_roles}}, {"_id": 0}).to_list(20)
        for role_doc in role_docs:
            for module, perms in role_doc.get("permissions", {}).items():
                if module not in role_permissions:
                    role_permissions[module] = []
                role_permissions[module] = list(set(role_permissions[module] + perms))
    user_response["role_permissions"] = role_permissions
    # Check head status — from user record OR division/subgroup leadership
    uid = user["id"]
    is_head = user.get("is_head", False)
    division = user.get("division", "")
    if not is_head and division:
        config = await db.division_groups.find_one({"division_name": division}, {"_id": 0})
        if config and config.get("leader_id") == uid:
            is_head = True
        if not is_head:
            sg_count = await db.subgroups.count_documents({"division_name": division, "leader_id": uid})
            if sg_count > 0:
                is_head = True
    user_response["is_head"] = is_head
    return TokenResponse(access_token=access_token, user=user_response)


@router.post("/auth/check-password-setup")
async def check_password_setup(email_data: dict):
    email = email_data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        return {"requires_setup": False, "exists": False}
    return {"requires_setup": user.get("requires_password_setup", False), "exists": True, "full_name": user.get("full_name", "")}


@router.post("/auth/setup-password")
async def setup_password(setup_data: PasswordSetup):
    user = await db.users.find_one({"email": setup_data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.get("requires_password_setup", False):
        raise HTTPException(status_code=400, detail="Password setup not required for this user")
    password_hash = get_password_hash(setup_data.new_password)
    await db.users.update_one(
        {"email": setup_data.email},
        {"$set": {"password_hash": password_hash, "requires_password_setup": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    updated_user = await db.users.find_one({"email": setup_data.email}, {"_id": 0})
    access_token = create_access_token(data={"sub": updated_user["id"]})
    user_response = {k: v for k, v in updated_user.items() if k != 'password_hash'}
    return TokenResponse(access_token=access_token, user=user_response)


@router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {k: v for k, v in current_user.items() if k != 'password_hash'}


@router.get("/auth/microsoft/login")
async def microsoft_login():
    msal_app = msal.ConfidentialClientApplication(
        MICROSOFT_CLIENT_ID, authority=MICROSOFT_AUTHORITY, client_credential=MICROSOFT_CLIENT_SECRET,
    )
    redirect_uri = f"{os.getenv('REACT_APP_BACKEND_URL')}/auth/microsoft/callback"
    auth_url = msal_app.get_authorization_request_url(MICROSOFT_SCOPE, redirect_uri=redirect_uri, state=secrets.token_urlsafe(16))
    return {"auth_url": auth_url}


@router.get("/auth/microsoft/callback")
async def microsoft_callback(code: str, state: str):
    try:
        msal_app = msal.ConfidentialClientApplication(
            MICROSOFT_CLIENT_ID, authority=MICROSOFT_AUTHORITY, client_credential=MICROSOFT_CLIENT_SECRET,
        )
        redirect_uri = f"{os.getenv('REACT_APP_BACKEND_URL')}/auth/microsoft/callback"
        result = msal_app.acquire_token_by_authorization_code(code, scopes=MICROSOFT_SCOPE, redirect_uri=redirect_uri)
        if "access_token" not in result:
            raise HTTPException(status_code=400, detail="Failed to acquire token")
        graph_response = requests.get("https://graph.microsoft.com/v1.0/me", headers={"Authorization": f"Bearer {result['access_token']}"})
        if graph_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info")
        user_info = graph_response.json()
        email = user_info.get("mail") or user_info.get("userPrincipalName")
        user = await db.users.find_one({"email": email}, {"_id": 0})
        if not user:
            new_user = _User(email=email, full_name=user_info.get("displayName"), is_verified=True, roles=["employee"])
            user_dict = new_user.model_dump()
            user_dict['created_at'] = user_dict['created_at'].isoformat()
            user_dict['updated_at'] = user_dict['updated_at'].isoformat()
            await db.users.insert_one({**user_dict})
            user = user_dict
        access_token = create_access_token(data={"sub": user["id"]})
        return RedirectResponse(url=f"{FRONTEND_URL}/auth/callback?token={access_token}&user={user['id']}")
    except Exception as e:
        logger.error(f"Microsoft auth error: {str(e)}")
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=auth_failed")


@router.post("/auth/request-otp")
async def request_otp(body: dict):
    email = body.get("email", "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    otp_code = "".join([str(secrets.randbelow(10)) for _ in range(6)])
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRE_MINUTES)
    await db.otps.delete_many({"email": email})
    await db.otps.insert_one({"email": email, "otp": otp_code, "attempts": 0, "expires_at": expires_at, "created_at": datetime.now(timezone.utc)})
    smtp_configured = bool(os.environ.get("SMTP_USERNAME", "").strip())
    if smtp_configured:
        try:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, _send_otp_smtp, email, otp_code)
            logger.info(f"OTP email sent to {email}")
        except Exception as e:
            logger.error(f"SMTP send failed for {email}: {e}")
            raise HTTPException(status_code=500, detail="Failed to send OTP email.")
    else:
        logger.info(f"[DEV MODE] OTP for {email}: {otp_code}")
    return {"message": "OTP sent to your email", "email": email, "dev_note": f"OTP: {otp_code}" if not smtp_configured else None}


@router.post("/auth/verify-otp")
async def verify_otp(body: dict):
    email = body.get("email", "").strip().lower()
    otp_input = body.get("otp", "").strip()
    if not email or not otp_input:
        raise HTTPException(status_code=400, detail="Email and OTP are required")
    record = await db.otps.find_one({"email": email})
    if not record:
        raise HTTPException(status_code=400, detail="No OTP found. Please request a new one.")
    if record.get("attempts", 0) >= 5:
        raise HTTPException(status_code=429, detail="Too many attempts. Please request a new OTP.")
    expires_at = record.get("expires_at")
    if isinstance(expires_at, datetime):
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expires_at:
            raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
    if record["otp"] != otp_input:
        await db.otps.update_one({"email": email}, {"$inc": {"attempts": 1}})
        remaining = 4 - record.get("attempts", 0)
        raise HTTPException(status_code=400, detail=f"Invalid OTP. {max(remaining, 0)} attempts remaining.")
    await db.otps.delete_many({"email": email})
    user = await db.users.find_one({"email": email}, {"_id": 0, "password_hash": 0})
    if not user:
        new_user = _User(email=email, full_name=email.split("@")[0].title(), roles=["employee"], is_verified=True)
        user_dict = new_user.model_dump()
        user_dict["created_at"] = user_dict["created_at"].isoformat()
        user_dict["updated_at"] = user_dict["updated_at"].isoformat()
        await db.users.insert_one({**user_dict})
        user = {k: v for k, v in user_dict.items() if k not in ("_id",)}
    access_token = create_access_token(data={"sub": user["id"]})
    return {"access_token": access_token, "token_type": "bearer", "user": user}

# --- Password Reset ---

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class AdminResetPasswordRequest(BaseModel):
    user_id: str
    new_password: str


@router.put("/auth/change-password")
async def change_own_password(data: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    """Self password reset — user changes their own password."""
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(data.current_password, user.get("password_hash", "")):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    new_hash = get_password_hash(data.new_password)
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"password_hash": new_hash, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Password changed successfully"}


@router.put("/auth/reset-user-password")
async def reset_user_password(data: AdminResetPasswordRequest, current_user: dict = Depends(get_current_user)):
    """Admin/manager resets another user's password.
    - Super admins and hr_admin: can reset any user
    - Managers: can only reset users in their own division/department
    """
    target_user = await db.users.find_one({"id": data.user_id}, {"_id": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Permission checks
    is_super = "super_admin" in current_user.get("roles", [])
    is_hr = "hr_admin" in current_user.get("roles", [])
    is_admin = "admin" in current_user.get("roles", [])
    is_mgr = "manager" in current_user.get("roles", [])

    if is_super or is_hr or is_admin:
        # Super admins, admins, HR admin can reset anyone
        pass
    elif is_mgr:
        # Managers can only reset users in their division
        mgr_division = current_user.get("division", "")
        target_division = target_user.get("division", "")
        if not mgr_division or mgr_division != target_division:
            raise HTTPException(status_code=403, detail="You can only reset passwords for users in your division")
    else:
        raise HTTPException(status_code=403, detail="You don't have permission to reset passwords")

    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")

    new_hash = get_password_hash(data.new_password)
    await db.users.update_one(
        {"id": data.user_id},
        {"$set": {
            "password_hash": new_hash,
            "requires_password_setup": False,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }}
    )

    # Send email notification to the user
    target_email = target_user.get("email", "")
    if target_email:
        asyncio.create_task(send_email_notification(
            target_email,
            "Password Reset",
            f"<p>Your password has been reset by an administrator. Please log in with your new password.</p>",
            f"{get_app_url()}/login",
        ))

    return {"message": f"Password reset for {target_user.get('full_name', target_email)}"}


@router.post("/auth/forgot-password")
async def forgot_password(body: dict):
    """Request password reset via email OTP."""
    email = body.get("email", "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        # Don't reveal if email exists
        return {"message": "If the email exists, a reset code has been sent."}

    # Generate OTP — mark any existing reset OTP for this email as expired
    otp_code = f"{secrets.randbelow(10**6):06d}"
    await db.otps.update_many(
        {"email": email, "type": "password_reset"},
        {"$set": {"expired": True}}
    )
    await db.otps.insert_one({
        "email": email,
        "otp": otp_code,
        "type": "password_reset",
        "attempts": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat(),
    })

    # Send OTP via email (async, non-blocking)
    otp_html = f"""
    <p>Your password reset code is:</p>
    <div style="background:#E8F0FE;border:1px solid #0056B3;border-radius:8px;text-align:center;padding:24px;margin:20px 0;">
      <h1 style="color:#0056B3;letter-spacing:12px;font-size:36px;margin:0">{otp_code}</h1>
    </div>
    <p>This code expires in <strong>15 minutes</strong>. Do not share it with anyone.</p>
    """
    asyncio.create_task(send_email_notification(email, "Password Reset Code", otp_html))
    return {"message": "If the email exists, a reset code has been sent."}


@router.post("/auth/reset-password-with-otp")
async def reset_password_with_otp(body: dict):
    """Reset password using OTP code."""
    email = body.get("email", "").strip().lower()
    otp = body.get("otp", "").strip()
    new_password = body.get("new_password", "")

    if not email or not otp or not new_password:
        raise HTTPException(status_code=400, detail="Email, OTP, and new password are required")
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    record = await db.otps.find_one({"email": email, "type": "password_reset", "expired": {"$ne": True}})
    if not record:
        raise HTTPException(status_code=400, detail="No reset request found. Please request a new code.")

    # Check expiry
    expires = record.get("expires_at", "")
    if expires and datetime.fromisoformat(expires) < datetime.now(timezone.utc):
        await db.otps.update_one({"_id": record["_id"]}, {"$set": {"expired": True}})
        raise HTTPException(status_code=400, detail="Reset code has expired. Please request a new one.")

    # Check attempts
    if record.get("attempts", 0) >= 5:
        await db.otps.update_one({"_id": record["_id"]}, {"$set": {"expired": True}})
        raise HTTPException(status_code=400, detail="Too many attempts. Please request a new code.")

    if record.get("otp") != otp:
        await db.otps.update_one({"_id": record["_id"]}, {"$inc": {"attempts": 1}})
        remaining = 4 - record.get("attempts", 0)
        raise HTTPException(status_code=400, detail=f"Invalid code. {max(remaining, 0)} attempts remaining.")

    # Reset password — mark OTP as used
    await db.otps.update_one({"_id": record["_id"]}, {"$set": {"expired": True, "used": True}})
    new_hash = get_password_hash(new_password)
    await db.users.update_one(
        {"email": email},
        {"$set": {
            "password_hash": new_hash,
            "requires_password_setup": False,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }}
    )
    return {"message": "Password has been reset successfully. You can now log in."}

