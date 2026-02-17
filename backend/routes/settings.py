from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from models.settings import SystemSettings, SystemSettingsUpdate, Role, RoleCreate, RoleUpdate, FAQ, FAQCreate, FAQUpdate

router = APIRouter(prefix="/settings", tags=["Settings"])

db = None

def set_db(database):
    global db
    db = database

async def get_current_user(credentials):
    pass

# System Settings
@router.get("")
async def get_settings(current_user: dict = Depends(get_current_user)):
    settings = await db.settings.find_one({"id": "system_settings"}, {"_id": 0})
    if not settings:
        # Create default settings
        default_settings = SystemSettings()
        settings_dict = default_settings.model_dump()
        settings_dict['created_at'] = settings_dict['created_at'].isoformat()
        settings_dict['updated_at'] = settings_dict['updated_at'].isoformat()
        await db.settings.insert_one({**settings_dict})
        return default_settings
    return settings

@router.put("")
async def update_settings(update_data: SystemSettingsUpdate, current_user: dict = Depends(get_current_user)):
    if "admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Only admins can update settings")
    
    settings = await db.settings.find_one({"id": "system_settings"}, {"_id": 0})
    if not settings:
        # Create with updates
        default_settings = SystemSettings()
        settings_dict = default_settings.model_dump()
        update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
        settings_dict.update(update_dict)
        settings_dict['created_at'] = settings_dict['created_at'].isoformat()
        settings_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
        await db.settings.insert_one({**settings_dict})
        return settings_dict
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.settings.update_one({"id": "system_settings"}, {"$set": update_dict})
    updated_settings = await db.settings.find_one({"id": "system_settings"}, {"_id": 0})
    return updated_settings

# SMTP Test
@router.post("/smtp/test")
async def test_smtp(email: str, current_user: dict = Depends(get_current_user)):
    if "admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Only admins can test SMTP")
    
    settings = await db.settings.find_one({"id": "system_settings"}, {"_id": 0})
    if not settings or not settings.get("smtp_host"):
        raise HTTPException(status_code=400, detail="SMTP not configured")
    
    # In production, actually send a test email
    # For now, just validate the config exists
    return {"message": f"Test email would be sent to {email}", "status": "simulated"}

# Roles
@router.get("/roles")
async def get_roles(current_user: dict = Depends(get_current_user)):
    roles = await db.roles.find({}, {"_id": 0}).to_list(100)
    
    # Add default roles if none exist
    if not roles:
        default_roles = [
            Role(
                name="admin",
                description="Full system access",
                permissions={
                    "applications": ["create", "read", "update", "delete"],
                    "sponsors": ["create", "read", "update", "delete"],
                    "projects": ["create", "read", "update", "delete"],
                    "tasks": ["create", "read", "update", "delete"],
                    "leads": ["create", "read", "update", "delete"],
                    "prospects": ["create", "read", "update", "delete"],
                    "meetings": ["create", "read", "update", "delete"],
                    "notes": ["create", "read", "update", "delete"],
                    "messages": ["create", "read", "update", "delete"],
                    "team": ["create", "read", "update", "delete"],
                    "tickets": ["create", "read", "update", "delete"],
                    "expenses": ["create", "read", "update", "delete"],
                    "reports": ["create", "read", "update", "delete"],
                    "files": ["create", "read", "update", "delete"],
                    "settings": ["create", "read", "update", "delete"],
                },
                is_system=True
            ),
            Role(
                name="manager",
                description="Team management access",
                permissions={
                    "applications": ["create", "read", "update"],
                    "sponsors": ["read"],
                    "projects": ["create", "read", "update"],
                    "tasks": ["create", "read", "update", "delete"],
                    "leads": ["create", "read", "update"],
                    "prospects": ["create", "read", "update"],
                    "meetings": ["create", "read", "update", "delete"],
                    "notes": ["create", "read", "update", "delete"],
                    "messages": ["create", "read", "update", "delete"],
                    "team": ["read"],
                    "tickets": ["create", "read", "update"],
                    "expenses": ["create", "read", "update"],
                    "reports": ["read"],
                    "files": ["create", "read", "update", "delete"],
                },
                is_system=True
            ),
            Role(
                name="employee",
                description="Standard employee access",
                permissions={
                    "applications": ["read"],
                    "projects": ["read"],
                    "tasks": ["create", "read", "update"],
                    "meetings": ["create", "read", "update"],
                    "notes": ["create", "read", "update", "delete"],
                    "messages": ["create", "read", "update", "delete"],
                    "tickets": ["create", "read"],
                    "expenses": ["create", "read"],
                    "files": ["create", "read"],
                },
                is_system=True
            ),
            Role(
                name="student",
                description="Student/applicant access",
                permissions={
                    "applications": ["create", "read", "update"],
                    "notes": ["create", "read", "update", "delete"],
                    "messages": ["create", "read"],
                    "tickets": ["create", "read"],
                    "files": ["read"],
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

@router.post("/roles")
async def create_role(role_data: RoleCreate, current_user: dict = Depends(get_current_user)):
    if "admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Only admins can create roles")
    
    # Check if role name exists
    existing = await db.roles.find_one({"name": role_data.name}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Role name already exists")
    
    role = Role(**role_data.model_dump())
    role_dict = role.model_dump()
    role_dict['created_at'] = role_dict['created_at'].isoformat()
    role_dict['updated_at'] = role_dict['updated_at'].isoformat()
    
    await db.roles.insert_one({**role_dict})
    return role

@router.put("/roles/{role_id}")
async def update_role(role_id: str, update_data: RoleUpdate, current_user: dict = Depends(get_current_user)):
    if "admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Only admins can update roles")
    
    role = await db.roles.find_one({"id": role_id}, {"_id": 0})
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.roles.update_one({"id": role_id}, {"$set": update_dict})
    return {"message": "Role updated successfully"}

@router.delete("/roles/{role_id}")
async def delete_role(role_id: str, current_user: dict = Depends(get_current_user)):
    if "admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Only admins can delete roles")
    
    role = await db.roles.find_one({"id": role_id}, {"_id": 0})
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    if role.get("is_system"):
        raise HTTPException(status_code=400, detail="Cannot delete system roles")
    
    await db.roles.delete_one({"id": role_id})
    return {"message": "Role deleted successfully"}

# Page Customization
@router.get("/pages/{page_name}")
async def get_page_settings(page_name: str, current_user: dict = Depends(get_current_user)):
    settings = await db.settings.find_one({"id": "system_settings"}, {"_id": 0})
    if not settings:
        return {}
    return settings.get("page_settings", {}).get(page_name, {})

@router.put("/pages/{page_name}")
async def update_page_settings(page_name: str, page_settings: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    if "admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Only admins can update page settings")
    
    await db.settings.update_one(
        {"id": "system_settings"},
        {"$set": {f"page_settings.{page_name}": page_settings, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"message": "Page settings updated successfully"}

# FAQs
@router.get("/faqs")
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

@router.post("/faqs")
async def create_faq(faq_data: FAQCreate, current_user: dict = Depends(get_current_user)):
    if "admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Only admins can create FAQs")
    
    faq = FAQ(**faq_data.model_dump())
    faq_dict = faq.model_dump()
    faq_dict['created_at'] = faq_dict['created_at'].isoformat()
    faq_dict['updated_at'] = faq_dict['updated_at'].isoformat()
    
    await db.faqs.insert_one({**faq_dict})
    return faq

@router.put("/faqs/{faq_id}")
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

@router.delete("/faqs/{faq_id}")
async def delete_faq(faq_id: str, current_user: dict = Depends(get_current_user)):
    if "admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Only admins can delete FAQs")
    
    result = await db.faqs.delete_one({"id": faq_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="FAQ not found")
    return {"message": "FAQ deleted successfully"}

@router.post("/faqs/{faq_id}/feedback")
async def faq_feedback(faq_id: str, helpful: bool, current_user: dict = Depends(get_current_user)):
    faq = await db.faqs.find_one({"id": faq_id}, {"_id": 0})
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    
    if helpful:
        await db.faqs.update_one({"id": faq_id}, {"$inc": {"helpful_count": 1}})
    else:
        await db.faqs.update_one({"id": faq_id}, {"$inc": {"not_helpful_count": 1}})
    
    return {"message": "Feedback recorded"}
