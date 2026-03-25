"""Settings, Roles, Dashboard Preferences, FAQs, BBBEE, Report Export routes"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone
from typing import Optional
from . import db, get_current_user, generate_uuid, is_admin_user, generate_excel, generate_pdf
import io
import json
from schemas import (SystemSettings, SystemSettingsUpdate, Role, RoleCreate,
                     BBBEERecord, FAQ, FAQCreate, FAQUpdate)

router = APIRouter(prefix="/api", tags=["settings"])


# ============== BBBEE ==============

@router.get("/bbbee")
async def get_bbbee_records(current_user: dict = Depends(get_current_user)):
    records = await db.bbbee.find({}, {"_id": 0}).to_list(1000)
    return records

@router.post("/bbbee")
async def create_bbbee_record(record_data: dict, current_user: dict = Depends(get_current_user)):
    record = BBBEERecord(**record_data)
    record_dict = record.model_dump()
    record_dict['verification_date'] = record_dict['verification_date'].isoformat()
    record_dict['expiry_date'] = record_dict['expiry_date'].isoformat()
    record_dict['created_at'] = record_dict['created_at'].isoformat()
    await db.bbbee.insert_one({**record_dict})
    return record


# ============== SETTINGS ==============

@router.get("/settings")
async def get_settings(current_user: dict = Depends(get_current_user)):
    settings = await db.settings.find_one({"id": "system_settings"}, {"_id": 0})
    if not settings:
        default_settings = SystemSettings()
        settings_dict = default_settings.model_dump()
        settings_dict['created_at'] = settings_dict['created_at'].isoformat()
        settings_dict['updated_at'] = settings_dict['updated_at'].isoformat()
        await db.settings.insert_one({**settings_dict})
        return default_settings
    return settings

@router.put("/settings")
async def update_settings(update_data: SystemSettingsUpdate, current_user: dict = Depends(get_current_user)):
    if not any(r in current_user.get("roles", []) for r in ["admin", "manager", "super_admin"]):
        raise HTTPException(status_code=403, detail="Only admins and managers can update settings")
    settings = await db.settings.find_one({"id": "system_settings"}, {"_id": 0})
    if not settings:
        default_settings = SystemSettings()
        settings_dict = default_settings.model_dump()
        update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
        settings_dict.update(update_dict)
        settings_dict['created_at'] = settings_dict['created_at'].isoformat()
        settings_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
        await db.settings.insert_one({**settings_dict})
        return {k: v for k, v in settings_dict.items() if k != "_id"}
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.settings.update_one({"id": "system_settings"}, {"$set": update_dict})
    updated_settings = await db.settings.find_one({"id": "system_settings"}, {"_id": 0})
    return updated_settings

@router.post("/settings/smtp/test")
async def test_smtp(email: str, current_user: dict = Depends(get_current_user)):
    if "admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Only admins can test SMTP")
    settings = await db.settings.find_one({"id": "system_settings"}, {"_id": 0})
    if not settings or not settings.get("smtp_host"):
        raise HTTPException(status_code=400, detail="SMTP not configured")
    return {"message": f"Test email would be sent to {email}", "status": "simulated"}


# ============== ROLES ==============

@router.get("/settings/roles")
async def get_roles(current_user: dict = Depends(get_current_user)):
    roles = await db.roles.find({}, {"_id": 0}).to_list(100)
    if not roles:
        default_roles = [
            Role(
                name="admin", description="Full system access",
                permissions={
                    "applications": ["create", "read", "update", "delete"],
                    "sponsors": ["create", "read", "update", "delete"],
                    "projects": ["create", "read", "update", "delete"],
                    "tasks": ["create", "read", "update", "delete"],
                    "settings": ["create", "read", "update", "delete"],
                },
                is_system=True
            ),
            Role(
                name="manager", description="Team management access",
                permissions={
                    "applications": ["create", "read", "update"],
                    "projects": ["create", "read", "update"],
                    "tasks": ["create", "read", "update", "delete"],
                },
                is_system=True
            ),
            Role(
                name="employee", description="Standard employee access",
                permissions={
                    "tasks": ["create", "read", "update"],
                    "notes": ["create", "read", "update", "delete"],
                },
                is_system=True
            ),
        ]
        for role in default_roles:
            role_dict = role.model_dump()
            role_dict['created_at'] = role_dict['created_at'].isoformat()
            role_dict['updated_at'] = role_dict['updated_at'].isoformat()
            await db.roles.insert_one({**role_dict})
        roles = await db.roles.find({}, {"_id": 0}).to_list(100)
    return roles

@router.post("/settings/roles")
async def create_role(role_data: RoleCreate, current_user: dict = Depends(get_current_user)):
    if not is_admin_user(current_user):
        raise HTTPException(status_code=403, detail="Only admins can create roles")
    existing = await db.roles.find_one({"name": role_data.name}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Role name already exists")
    role = Role(**role_data.model_dump())
    role_dict = role.model_dump()
    role_dict['created_at'] = role_dict['created_at'].isoformat()
    role_dict['updated_at'] = role_dict['updated_at'].isoformat()
    await db.roles.insert_one({**role_dict})
    return role

@router.put("/settings/roles/{role_id}")
async def update_role(role_id: str, update_data: dict, current_user: dict = Depends(get_current_user)):
    if not is_admin_user(current_user):
        raise HTTPException(status_code=403, detail="Only admins can update roles")
    role = await db.roles.find_one({"id": role_id}, {"_id": 0})
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    update_fields = {}
    if "description" in update_data:
        update_fields["description"] = update_data["description"]
    if "permissions" in update_data:
        update_fields["permissions"] = update_data["permissions"]
    update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.roles.update_one({"id": role_id}, {"$set": update_fields})
    updated = await db.roles.find_one({"id": role_id}, {"_id": 0})
    return updated

@router.delete("/settings/roles/{role_id}")
async def delete_role(role_id: str, current_user: dict = Depends(get_current_user)):
    if not is_admin_user(current_user):
        raise HTTPException(status_code=403, detail="Only admins can delete roles")
    role = await db.roles.find_one({"id": role_id}, {"_id": 0})
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    if role.get("is_system"):
        raise HTTPException(status_code=400, detail="Cannot delete system roles")
    await db.roles.delete_one({"id": role_id})
    return {"message": "Role deleted"}


# ============== DASHBOARD PREFERENCES ==============

@router.get("/settings/dashboard-preferences")
async def get_dashboard_preferences(current_user: dict = Depends(get_current_user)):
    prefs = await db.dashboard_preferences.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not prefs:
        return {
            "user_id": current_user["id"],
            "visible_widgets": ["applications", "training", "expenses", "users", "tickets", "tasks", "quick_actions"],
            "layout": "default",
        }
    return prefs

@router.put("/settings/dashboard-preferences")
async def update_dashboard_preferences(prefs_data: dict, current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    prefs = {
        "user_id": current_user["id"],
        "visible_widgets": prefs_data.get("visible_widgets", []),
        "layout": prefs_data.get("layout", "default"),
        "updated_at": now,
    }
    await db.dashboard_preferences.update_one(
        {"user_id": current_user["id"]},
        {"$set": prefs},
        upsert=True
    )
    return prefs


# ============== FAQs ==============

@router.get("/settings/faqs")
async def get_faqs(
    category: Optional[str] = None,
    published_only: bool = True,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if category:
        query["category"] = category
    if published_only:
        query["is_published"] = True
    faqs = await db.faqs.find(query, {"_id": 0}).sort("order", 1).to_list(1000)
    return faqs

@router.post("/settings/faqs")
async def create_faq(faq_data: FAQCreate, current_user: dict = Depends(get_current_user)):
    if "admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Only admins can create FAQs")
    faq = FAQ(**faq_data.model_dump())
    faq_dict = faq.model_dump()
    faq_dict['created_at'] = faq_dict['created_at'].isoformat()
    faq_dict['updated_at'] = faq_dict['updated_at'].isoformat()
    await db.faqs.insert_one({**faq_dict})
    return faq

@router.put("/settings/faqs/{faq_id}")
async def update_faq(faq_id: str, update_data: FAQUpdate, current_user: dict = Depends(get_current_user)):
    if "admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Only admins can update FAQs")
    faq = await db.faqs.find_one({"id": faq_id}, {"_id": 0})
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.faqs.update_one({"id": faq_id}, {"$set": update_dict})
    return {"message": "FAQ updated successfully"}

@router.delete("/settings/faqs/{faq_id}")
async def delete_faq(faq_id: str, current_user: dict = Depends(get_current_user)):
    if "admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Only admins can delete FAQs")
    result = await db.faqs.delete_one({"id": faq_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="FAQ not found")
    return {"message": "FAQ deleted successfully"}


# ============== REPORT EXPORT ==============

@router.get("/reports/export/{report_type}")
async def export_report(
    report_type: str,
    format: str = "json",
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    date_query = {}
    if date_from:
        date_query["$gte"] = date_from
    if date_to:
        date_query["$lte"] = date_to + "T23:59:59"

    query = {}
    if date_query:
        query["created_at"] = date_query

    if report_type == "applications":
        data = await db.applications.find(query, {"_id": 0}).to_list(10000)
    elif report_type == "expenses":
        eq = {}
        if date_query:
            eq["date"] = date_query
        data = await db.expenses.find(eq, {"_id": 0}).to_list(10000)
    elif report_type == "tasks":
        data = await db.tasks.find(query, {"_id": 0}).to_list(10000)
    elif report_type == "tickets":
        data = await db.tickets.find(query, {"_id": 0}).to_list(10000)
    elif report_type == "users":
        data = await db.users.find(query, {"_id": 0, "password_hash": 0}).to_list(10000)
    elif report_type == "training_applications":
        data = await db.training_applications.find(query, {"_id": 0}).to_list(10000)
    else:
        raise HTTPException(status_code=400, detail="Invalid report type")

    for item in data:
        for key, value in item.items():
            if isinstance(value, datetime):
                item[key] = value.isoformat()

    if format == "excel":
        title = report_type.replace("_", " ").title()
        excel_stream = generate_excel(data, title=title)
        return StreamingResponse(
            iter([excel_stream.getvalue()]),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={report_type}_report.xlsx"}
        )
    elif format == "pdf":
        title = f"{report_type.replace('_', ' ').title()} Report"
        pdf_stream = generate_pdf(data, title=title)
        return StreamingResponse(
            iter([pdf_stream.getvalue()]),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={report_type}_report.pdf"}
        )
    elif format == "csv":
        if not data:
            return StreamingResponse(
                io.StringIO("No data"),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename={report_type}_report.csv"}
            )
        import csv
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
        return StreamingResponse(
            io.StringIO(output.getvalue()),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={report_type}_report.csv"}
        )
    else:
        return StreamingResponse(
            io.StringIO(json.dumps(data, indent=2, default=str)),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename={report_type}_report.json"}
        )
