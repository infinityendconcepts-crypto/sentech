"""Applications Router - Bursary & Training Applications, Settings, Expenses"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime, timezone

from routers import (
    db, get_current_user, generate_uuid, is_admin_user,
    send_email_notification, logger,
)

router = APIRouter(prefix="/api", tags=["applications"])


async def can_approve_application(current_user: dict, applicant_user_id: str) -> bool:
    """Check if current user can approve: admin, super_admin, or division/subgroup head of applicant"""
    if is_admin_user(current_user):
        return True
    # Check if current user is the division leader or subgroup leader of the applicant
    applicant = await db.users.find_one({"id": applicant_user_id}, {"_id": 0, "division": 1, "department": 1})
    if not applicant:
        return False
    division = applicant.get("division", "")
    if division:
        # Check division leader
        config = await db.division_group_configs.find_one({"division_name": division}, {"_id": 0})
        if config and config.get("leader_id") == current_user["id"]:
            return True
        # Check subgroup leader
        subgroups = await db.subgroups.find({"division_name": division}, {"_id": 0}).to_list(100)
        for sg in subgroups:
            if sg.get("leader_id") == current_user["id"]:
                member_ids = [m.get("user_id") for m in sg.get("members", [])]
                if applicant_user_id in member_ids:
                    return True
    return False

# --- Pydantic Models ---

class ApplicationCreate(BaseModel):
    status: Optional[str] = "draft"
    current_step: Optional[int] = 1
    personal_info: Optional[Dict[str, Any]] = {}
    employment_info: Optional[Dict[str, Any]] = {}
    academic_info: Optional[Dict[str, Any]] = {}
    academic_bursary_info: Optional[Dict[str, Any]] = {}
    financial_info: Optional[Dict[str, Any]] = {}
    documents: Optional[Dict[str, Any]] = {}

class ApplicationUpdate(BaseModel):
    current_step: Optional[int] = None
    status: Optional[str] = None
    status_note: Optional[str] = None
    status_updated_at: Optional[str] = None
    personal_info: Optional[Dict[str, Any]] = None
    employment_info: Optional[Dict[str, Any]] = None
    academic_info: Optional[Dict[str, Any]] = None
    academic_bursary_info: Optional[Dict[str, Any]] = None
    financial_info: Optional[Dict[str, Any]] = None
    documents: Optional[Dict[str, Any]] = None
    approved_documents: Optional[Dict[str, Any]] = None

class TrainingApplicationCreate(BaseModel):
    status: Optional[str] = "draft"
    current_step: Optional[int] = 1
    personal_info: Optional[Dict[str, Any]] = {}
    employment_info: Optional[Dict[str, Any]] = {}
    training_info: Optional[Dict[str, Any]] = {}
    documents: Optional[Dict[str, Any]] = {}

class TrainingApplicationUpdate(BaseModel):
    current_step: Optional[int] = None
    status: Optional[str] = None
    status_note: Optional[str] = None
    personal_info: Optional[Dict[str, Any]] = None
    employment_info: Optional[Dict[str, Any]] = None
    training_info: Optional[Dict[str, Any]] = None
    documents: Optional[Dict[str, Any]] = None


# ============== BURSARY APPLICATIONS ==============

@router.get("/applications")
async def get_applications(current_user: dict = Depends(get_current_user)):
    if is_admin_user(current_user):
        applications = await db.applications.find({}, {"_id": 0}).to_list(1000)
    else:
        applications = await db.applications.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(1000)
    return applications

@router.get("/applications/{application_id}")
async def get_application(application_id: str, current_user: dict = Depends(get_current_user)):
    application = await db.applications.find_one({"id": application_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    if application["user_id"] != current_user["id"] and not is_admin_user(current_user):
        raise HTTPException(status_code=403, detail="Access denied")
    return application

@router.post("/applications")
async def create_application(app_data: ApplicationCreate, current_user: dict = Depends(get_current_user)):
    app_dict = {
        "id": generate_uuid(),
        "user_id": current_user["id"],
        "user_email": current_user["email"],
        "status": app_data.status or "draft",
        "current_step": app_data.current_step or 1,
        "personal_info": app_data.personal_info or {},
        "academic_info": app_data.academic_info or {},
        "financial_info": app_data.financial_info or {},
        "documents": app_data.documents or {},
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if app_data.employment_info:
        app_dict['employment_info'] = app_data.employment_info
    if app_data.academic_bursary_info:
        app_dict['academic_bursary_info'] = app_data.academic_bursary_info
    if app_data.status == "pending":
        app_dict['submitted_at'] = datetime.now(timezone.utc).isoformat()
    await db.applications.insert_one({**app_dict})
    return app_dict

@router.put("/applications/{application_id}")
async def update_application(application_id: str, update_data: ApplicationUpdate, current_user: dict = Depends(get_current_user)):
    application = await db.applications.find_one({"id": application_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    admin = is_admin_user(current_user)
    is_head = await can_approve_application(current_user, application["user_id"])
    if application["user_id"] != current_user["id"] and not admin and not is_head:
        raise HTTPException(status_code=403, detail="Access denied")
    # 24hr edit window enforcement
    if not admin and application["user_id"] == current_user["id"]:
        submitted_at = application.get("submitted_at")
        if submitted_at and application.get("status") not in ["draft"]:
            submitted_time = datetime.fromisoformat(submitted_at.replace("Z", "+00:00")) if isinstance(submitted_at, str) else submitted_at
            now = datetime.now(timezone.utc)
            if (now - submitted_time).total_seconds() > 86400:
                if not application.get("re_edit_approved"):
                    raise HTTPException(status_code=403, detail="Edit window expired. Please request re-edit from your profile page.")
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    if update_data.status in ["pending", "submitted"]:
        update_dict["submitted_at"] = datetime.now(timezone.utc).isoformat()
    if application.get("re_edit_approved"):
        update_dict["re_edit_approved"] = False
        update_dict["re_edit_requested"] = False
    await db.applications.update_one({"id": application_id}, {"$set": update_dict})
    updated_app = await db.applications.find_one({"id": application_id}, {"_id": 0})
    if update_data.status and update_data.status != application.get("status") and application["user_id"] != current_user["id"]:
        notif = {
            "id": generate_uuid(), "user_id": application["user_id"], "type": "status_change",
            "title": "Application Status Updated", "message": f"Your bursary application status changed to: {update_data.status}",
            "reference_id": application_id, "reference_type": "application", "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.notifications.insert_one({**notif})
    return updated_app

@router.post("/applications/{application_id}/request-re-edit")
async def request_bursary_re_edit(application_id: str, body: dict = {}, current_user: dict = Depends(get_current_user)):
    application = await db.applications.find_one({"id": application_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    if application["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    if application.get("re_edit_requested"):
        raise HTTPException(status_code=400, detail="Re-edit already requested")
    now = datetime.now(timezone.utc).isoformat()
    await db.applications.update_one({"id": application_id}, {"$set": {
        "re_edit_requested": True, "re_edit_requested_at": now,
        "re_edit_reason": body.get("reason", ""), "re_edit_approved": False, "updated_at": now,
    }})
    admins = await db.users.find({"roles": {"$in": ["admin", "super_admin"]}}, {"_id": 0, "id": 1, "email": 1, "full_name": 1}).to_list(100)
    for admin in admins:
        notif = {
            "id": generate_uuid(), "user_id": admin["id"], "type": "status_change",
            "title": "Re-edit Request: Bursary Application",
            "message": f"{current_user.get('full_name', 'A user')} has requested to re-edit their bursary application",
            "reference_id": application_id, "reference_type": "application", "is_read": False, "created_at": now,
        }
        await db.notifications.insert_one({**notif})
        await send_email_notification(
            admin.get("email", ""), "Re-edit Request: Bursary Application",
            f"<p>{current_user.get('full_name', 'A user')} has requested to re-edit their bursary application.</p>"
            f"<p>Reason: {body.get('reason', 'Not specified')}</p>"
            f"<p>Please log in to review and approve or deny this request.</p>"
        )
    return {"message": "Re-edit request submitted"}

@router.put("/applications/{application_id}/allow-re-edit")
async def allow_bursary_re_edit(application_id: str, body: dict = {}, current_user: dict = Depends(get_current_user)):
    if not is_admin_user(current_user):
        raise HTTPException(status_code=403, detail="Only admins can approve re-edits")
    application = await db.applications.find_one({"id": application_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    approved = body.get("approved", True)
    now = datetime.now(timezone.utc).isoformat()
    update = {"re_edit_approved": approved, "re_edit_responded_at": now, "re_edit_responded_by": current_user["id"], "updated_at": now}
    if not approved:
        update["re_edit_requested"] = False
    await db.applications.update_one({"id": application_id}, {"$set": update})
    notif = {
        "id": generate_uuid(), "user_id": application["user_id"], "type": "status_change",
        "title": "Re-edit Request " + ("Approved" if approved else "Denied"),
        "message": f"Your bursary application re-edit request has been {'approved. You can now edit your application.' if approved else 'denied.'}",
        "reference_id": application_id, "reference_type": "application", "is_read": False, "created_at": now,
    }
    await db.notifications.insert_one({**notif})
    return {"message": f"Re-edit {'approved' if approved else 'denied'}"}

@router.delete("/applications/{application_id}")
async def delete_application(application_id: str, current_user: dict = Depends(get_current_user)):
    if not is_admin_user(current_user):
        raise HTTPException(status_code=403, detail="Only admins can delete applications")
    result = await db.applications.delete_one({"id": application_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"message": "Application deleted"}

@router.post("/applications/batch-delete")
async def batch_delete_applications(body: dict, current_user: dict = Depends(get_current_user)):
    if not is_admin_user(current_user):
        raise HTTPException(status_code=403, detail="Only admins can delete applications")
    ids = body.get("application_ids", [])
    if not ids:
        raise HTTPException(status_code=400, detail="No applications selected")
    result = await db.applications.delete_many({"id": {"$in": ids}})
    return {"message": f"Deleted {result.deleted_count} application(s)", "count": result.deleted_count}


# ============== APPLICATION SETTINGS ==============

@router.get("/application-settings")
async def get_application_settings(current_user: dict = Depends(get_current_user)):
    settings = await db.application_settings.find_one({"id": "app_settings"}, {"_id": 0})
    if not settings:
        settings = {
            "id": "app_settings", "bursary_open": True, "training_open": True,
            "bursary_deadline": None, "training_deadline": None,
            "bursary_close_days_before": 8, "training_close_days_before": 8,
        }
    return settings

@router.put("/application-settings")
async def update_application_settings(body: dict, current_user: dict = Depends(get_current_user)):
    if not is_admin_user(current_user):
        raise HTTPException(status_code=403, detail="Only admins can update application settings")
    now = datetime.now(timezone.utc).isoformat()
    body["updated_at"] = now
    body["updated_by"] = current_user["id"]
    await db.application_settings.update_one({"id": "app_settings"}, {"$set": body}, upsert=True)
    if body.get("bursary_open") or body.get("training_open"):
        app_type = "Bursary" if body.get("bursary_open") else "Training"
        users = await db.users.find({"is_active": True}, {"_id": 0, "id": 1}).to_list(10000)
        for u in users:
            if u["id"] == current_user["id"]:
                continue
            notif = {
                "id": generate_uuid(), "user_id": u["id"], "type": "announcement",
                "title": f"{app_type} Applications Now Open",
                "message": f"{app_type} applications are now accepting submissions. Apply before the deadline.",
                "is_read": False, "created_at": now,
            }
            await db.notifications.insert_one({**notif})
    return await db.application_settings.find_one({"id": "app_settings"}, {"_id": 0})


# ============== TRAINING APPLICATIONS ==============

@router.get("/training-applications")
async def get_training_applications(current_user: dict = Depends(get_current_user)):
    if is_admin_user(current_user):
        applications = await db.training_applications.find({}, {"_id": 0}).to_list(1000)
    else:
        applications = await db.training_applications.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(1000)
    return applications

@router.get("/training-applications/{application_id}")
async def get_training_application(application_id: str, current_user: dict = Depends(get_current_user)):
    application = await db.training_applications.find_one({"id": application_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Training application not found")
    if application["user_id"] != current_user["id"] and not is_admin_user(current_user):
        raise HTTPException(status_code=403, detail="Access denied")
    return application

@router.post("/training-applications")
async def create_training_application(app_data: TrainingApplicationCreate, current_user: dict = Depends(get_current_user)):
    app_dict = {
        "id": generate_uuid(), "user_id": current_user["id"], "user_email": current_user["email"],
        "status": app_data.status or "draft", "current_step": app_data.current_step or 1,
        "personal_info": app_data.personal_info or {}, "employment_info": app_data.employment_info or {},
        "training_info": app_data.training_info or {}, "documents": app_data.documents or {},
        "created_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if app_data.status == "pending":
        app_dict['submitted_at'] = datetime.now(timezone.utc).isoformat()
    await db.training_applications.insert_one({**app_dict})
    return app_dict

@router.put("/training-applications/{application_id}")
async def update_training_application(application_id: str, update_data: TrainingApplicationUpdate, current_user: dict = Depends(get_current_user)):
    application = await db.training_applications.find_one({"id": application_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Training application not found")
    admin = is_admin_user(current_user)
    is_head = await can_approve_application(current_user, application["user_id"])
    if application["user_id"] != current_user["id"] and not admin and not is_head:
        raise HTTPException(status_code=403, detail="Access denied")
    if not admin and application["user_id"] == current_user["id"]:
        submitted_at = application.get("submitted_at")
        if submitted_at and application.get("status") not in ["draft"]:
            submitted_time = datetime.fromisoformat(submitted_at.replace("Z", "+00:00")) if isinstance(submitted_at, str) else submitted_at
            now = datetime.now(timezone.utc)
            if (now - submitted_time).total_seconds() > 86400:
                if not application.get("re_edit_approved"):
                    raise HTTPException(status_code=403, detail="Edit window expired. Please request re-edit from your profile page.")
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    if update_data.status in ["pending", "submitted"]:
        update_dict["submitted_at"] = datetime.now(timezone.utc).isoformat()
    if application.get("re_edit_approved"):
        update_dict["re_edit_approved"] = False
        update_dict["re_edit_requested"] = False
    await db.training_applications.update_one({"id": application_id}, {"$set": update_dict})
    return await db.training_applications.find_one({"id": application_id}, {"_id": 0})

@router.put("/training-applications/{application_id}/status")
async def update_training_application_status(application_id: str, status_data: dict, current_user: dict = Depends(get_current_user)):
    application = await db.training_applications.find_one({"id": application_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Training application not found")
    if not is_admin_user(current_user) and not await can_approve_application(current_user, application["user_id"]):
        raise HTTPException(status_code=403, detail="Only admins or division/subgroup heads can update application status")
    update_dict = {"status": status_data.get("status"), "updated_at": datetime.now(timezone.utc).isoformat()}
    if status_data.get("status_note"):
        update_dict["status_note"] = status_data.get("status_note")
    await db.training_applications.update_one({"id": application_id}, {"$set": update_dict})
    updated_app = await db.training_applications.find_one({"id": application_id}, {"_id": 0})
    new_status = status_data.get("status")
    if new_status and new_status != application.get("status") and application["user_id"] != current_user["id"]:
        notif = {
            "id": generate_uuid(), "user_id": application["user_id"], "type": "status_change",
            "title": "Training Application Status Updated",
            "message": f"Your training application status changed to: {new_status}",
            "reference_id": application_id, "reference_type": "application", "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.notifications.insert_one({**notif})
    return updated_app

@router.delete("/training-applications/{application_id}")
async def delete_training_application(application_id: str, current_user: dict = Depends(get_current_user)):
    application = await db.training_applications.find_one({"id": application_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Training application not found")
    if application["user_id"] != current_user["id"] and not is_admin_user(current_user):
        raise HTTPException(status_code=403, detail="Access denied")
    await db.training_applications.delete_one({"id": application_id})
    return {"message": "Training application deleted successfully"}

@router.post("/training-applications/batch-delete")
async def batch_delete_training_applications(body: dict, current_user: dict = Depends(get_current_user)):
    if not is_admin_user(current_user):
        raise HTTPException(status_code=403, detail="Only admins can delete applications")
    ids = body.get("application_ids", [])
    if not ids:
        raise HTTPException(status_code=400, detail="No applications selected")
    result = await db.training_applications.delete_many({"id": {"$in": ids}})
    return {"message": f"Deleted {result.deleted_count} application(s)", "count": result.deleted_count}

@router.post("/training-applications/{application_id}/request-re-edit")
async def request_training_re_edit(application_id: str, body: dict = {}, current_user: dict = Depends(get_current_user)):
    application = await db.training_applications.find_one({"id": application_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Training application not found")
    if application["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    if application.get("re_edit_requested"):
        raise HTTPException(status_code=400, detail="Re-edit already requested")
    now = datetime.now(timezone.utc).isoformat()
    await db.training_applications.update_one({"id": application_id}, {"$set": {
        "re_edit_requested": True, "re_edit_requested_at": now,
        "re_edit_reason": body.get("reason", ""), "re_edit_approved": False, "updated_at": now,
    }})
    admins = await db.users.find({"roles": {"$in": ["admin", "super_admin"]}}, {"_id": 0, "id": 1}).to_list(100)
    for admin in admins:
        notif = {
            "id": generate_uuid(), "user_id": admin["id"], "type": "status_change",
            "title": "Re-edit Request: Training Application",
            "message": f"{current_user.get('full_name', 'A user')} has requested to re-edit their training application",
            "reference_id": application_id, "reference_type": "application", "is_read": False, "created_at": now,
        }
        await db.notifications.insert_one({**notif})
    return {"message": "Re-edit request submitted"}

@router.put("/training-applications/{application_id}/allow-re-edit")
async def allow_training_re_edit(application_id: str, body: dict = {}, current_user: dict = Depends(get_current_user)):
    if not is_admin_user(current_user):
        raise HTTPException(status_code=403, detail="Only admins can approve re-edits")
    application = await db.training_applications.find_one({"id": application_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Training application not found")
    approved = body.get("approved", True)
    now = datetime.now(timezone.utc).isoformat()
    update = {"re_edit_approved": approved, "re_edit_responded_at": now, "re_edit_responded_by": current_user["id"], "updated_at": now}
    if not approved:
        update["re_edit_requested"] = False
    await db.training_applications.update_one({"id": application_id}, {"$set": update})
    notif = {
        "id": generate_uuid(), "user_id": application["user_id"], "type": "status_change",
        "title": "Re-edit Request " + ("Approved" if approved else "Denied"),
        "message": f"Your training application re-edit request has been {'approved. You can now edit your application.' if approved else 'denied.'}",
        "reference_id": application_id, "reference_type": "application", "is_read": False, "created_at": now,
    }
    await db.notifications.insert_one({**notif})
    return {"message": f"Re-edit {'approved' if approved else 'denied'}"}


# ============== APPLICATION EXPENSES ==============

@router.post("/applications/{application_id}/expenses")
async def add_bursary_application_expenses(application_id: str, expenses_data: dict, current_user: dict = Depends(get_current_user)):
    application = await db.applications.find_one({"id": application_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    if application["user_id"] != current_user["id"] and not is_admin_user(current_user):
        raise HTTPException(status_code=403, detail="Access denied")
    now = datetime.now(timezone.utc).isoformat()
    additional_expenses = {
        "flights": expenses_data.get("flights", 0), "flights_notes": expenses_data.get("flights_notes", ""),
        "accommodation": expenses_data.get("accommodation", 0), "accommodation_notes": expenses_data.get("accommodation_notes", ""),
        "car_hire_or_shuttle": expenses_data.get("car_hire_or_shuttle", 0), "car_hire_or_shuttle_notes": expenses_data.get("car_hire_or_shuttle_notes", ""),
        "catering": expenses_data.get("catering", 0), "catering_notes": expenses_data.get("catering_notes", ""),
    }
    await db.applications.update_one({"id": application_id}, {"$set": {"additional_expenses": additional_expenses, "updated_at": now}})
    return {"message": "Expenses added successfully", "additional_expenses": additional_expenses}

@router.post("/training-applications/{application_id}/expenses")
async def add_training_application_expenses(application_id: str, expenses_data: dict, current_user: dict = Depends(get_current_user)):
    application = await db.training_applications.find_one({"id": application_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Training application not found")
    if application["user_id"] != current_user["id"] and not is_admin_user(current_user):
        raise HTTPException(status_code=403, detail="Access denied")
    now = datetime.now(timezone.utc).isoformat()
    additional_expenses = {
        "flights": expenses_data.get("flights", 0), "flights_notes": expenses_data.get("flights_notes", ""),
        "accommodation": expenses_data.get("accommodation", 0), "accommodation_notes": expenses_data.get("accommodation_notes", ""),
        "car_hire_or_shuttle": expenses_data.get("car_hire_or_shuttle", 0), "car_hire_or_shuttle_notes": expenses_data.get("car_hire_or_shuttle_notes", ""),
        "catering": expenses_data.get("catering", 0), "catering_notes": expenses_data.get("catering_notes", ""),
    }
    await db.training_applications.update_one({"id": application_id}, {"$set": {"additional_expenses": additional_expenses, "updated_at": now}})
    return {"message": "Expenses added successfully", "additional_expenses": additional_expenses}
