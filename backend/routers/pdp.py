"""PDP (Personal Development Plan) CRUD routes"""
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from typing import Optional
from . import db, get_current_user, generate_uuid, notify_and_email, send_email_notification, get_app_url, logger
from schemas import PDPEntry, PDPCreate, PDPUpdate
import asyncio

router = APIRouter(prefix="/api", tags=["pdp"])


async def _get_head_user_ids(current_user: dict):
    """Get user IDs that a head can see (users in their division/subgroups)."""
    division = current_user.get("division", "")
    if not division:
        return []
    users = await db.users.find({"division": division}, {"_id": 0, "id": 1}).to_list(10000)
    return [u["id"] for u in users]


async def _notify_division_heads_and_admins(user_id: str, user_name: str, title: str, message: str, ref_id: str, ref_type: str, link_path: str):
    """Notify admins + the head of the user's division."""
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "division": 1})
    division = user.get("division", "") if user else ""

    # Notify admins
    admins = await db.users.find(
        {"roles": {"$in": ["admin", "super_admin"]}},
        {"_id": 0, "id": 1}
    ).to_list(200)
    for adm in admins:
        if adm["id"] != user_id:
            await notify_and_email(adm["id"], title, message, ref_id, ref_type, link_path)

    # Notify division head(s)
    if division:
        config = await db.division_groups.find_one({"division_name": division}, {"_id": 0, "leader_id": 1})
        if config and config.get("leader_id") and config["leader_id"] != user_id:
            await notify_and_email(config["leader_id"], title, message, ref_id, ref_type, link_path)
        # Also subgroup leaders
        subgroups = await db.subgroups.find({"division_name": division}, {"_id": 0, "leader_id": 1}).to_list(100)
        for sg in subgroups:
            if sg.get("leader_id") and sg["leader_id"] != user_id and sg["leader_id"] not in [a["id"] for a in admins]:
                await notify_and_email(sg["leader_id"], title, message, ref_id, ref_type, link_path)

    # Also check users with is_head=True in the same division
    if division:
        heads = await db.users.find(
            {"is_head": True, "division": division, "id": {"$ne": user_id}},
            {"_id": 0, "id": 1}
        ).to_list(50)
        notified = {a["id"] for a in admins}
        for h in heads:
            if h["id"] not in notified:
                await notify_and_email(h["id"], title, message, ref_id, ref_type, link_path)


@router.get("/pdp")
async def get_pdp_entries(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    division: Optional[str] = None,
    department: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    is_admin = any(r in current_user.get("roles", []) for r in ["admin", "super_admin"])
    is_head = current_user.get("is_head", False)

    query = {}
    if is_admin:
        # Admins see all — optionally filter by division/department
        if division:
            user_ids = [u["id"] for u in await db.users.find({"division": division}, {"_id": 0, "id": 1}).to_list(10000)]
            query["user_id"] = {"$in": user_ids}
        if department:
            user_ids_dept = [u["id"] for u in await db.users.find({"department": department}, {"_id": 0, "id": 1}).to_list(10000)]
            if "user_id" in query:
                query["user_id"] = {"$in": list(set(query["user_id"]["$in"]) & set(user_ids_dept))}
            else:
                query["user_id"] = {"$in": user_ids_dept}
    elif is_head:
        # Heads see only their division's PDPs
        head_user_ids = await _get_head_user_ids(current_user)
        if division:
            div_user_ids = [u["id"] for u in await db.users.find({"division": division}, {"_id": 0, "id": 1}).to_list(10000)]
            head_user_ids = list(set(head_user_ids) & set(div_user_ids))
        if department:
            dept_user_ids = [u["id"] for u in await db.users.find({"department": department}, {"_id": 0, "id": 1}).to_list(10000)]
            head_user_ids = list(set(head_user_ids) & set(dept_user_ids))
        query["user_id"] = {"$in": head_user_ids}
    else:
        # Regular employees see only their own
        query["user_id"] = current_user["id"]

    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    entries = await db.pdp.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return entries


@router.get("/pdp/filters")
async def get_pdp_filters(current_user: dict = Depends(get_current_user)):
    """Return available divisions and departments for filtering."""
    is_admin = any(r in current_user.get("roles", []) for r in ["admin", "super_admin"])
    is_head = current_user.get("is_head", False)

    if is_admin:
        divisions = await db.users.distinct("division")
        departments = await db.users.distinct("department")
    elif is_head:
        division = current_user.get("division", "")
        divisions = [division] if division else []
        departments = await db.users.distinct("department", {"division": division}) if division else []
    else:
        divisions = []
        departments = []

    return {
        "divisions": sorted([d for d in divisions if d]),
        "departments": sorted([d for d in departments if d]),
    }


@router.get("/pdp/{entry_id}")
async def get_pdp_entry(entry_id: str, current_user: dict = Depends(get_current_user)):
    entry = await db.pdp.find_one({"id": entry_id}, {"_id": 0})
    if not entry:
        raise HTTPException(status_code=404, detail="PDP entry not found")
    is_admin = any(r in current_user.get("roles", []) for r in ["admin", "super_admin"])
    is_head = current_user.get("is_head", False)
    if not is_admin and not is_head and entry.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    if is_head and not is_admin:
        head_ids = await _get_head_user_ids(current_user)
        if entry.get("user_id") not in head_ids and entry.get("user_id") != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
    return entry


@router.post("/pdp")
async def create_pdp_entry(entry_data: PDPCreate, current_user: dict = Depends(get_current_user)):
    entry = PDPEntry(
        **entry_data.model_dump(),
        user_id=current_user["id"],
        user_name=current_user.get("full_name", "")
    )
    entry_dict = entry.model_dump()
    entry_dict["created_at"] = entry_dict["created_at"].isoformat()
    entry_dict["updated_at"] = entry_dict["updated_at"].isoformat()
    await db.pdp.insert_one({**entry_dict})

    # Notify division heads and admins
    if entry_data.status == "pending_approval":
        await _notify_division_heads_and_admins(
            current_user["id"],
            current_user.get("full_name", "An employee"),
            "New PDP Submitted for Approval",
            f"{current_user.get('full_name', 'An employee')} has submitted a PDP entry for approval: {entry_data.title}",
            entry_dict["id"], "pdp", "/pdp",
        )
    return entry


@router.put("/pdp/{entry_id}")
async def update_pdp_entry(entry_id: str, update_data: PDPUpdate, current_user: dict = Depends(get_current_user)):
    entry = await db.pdp.find_one({"id": entry_id}, {"_id": 0})
    if not entry:
        raise HTTPException(status_code=404, detail="PDP entry not found")
    is_admin = any(r in current_user.get("roles", []) for r in ["admin", "super_admin"])
    is_head = current_user.get("is_head", False)
    if not is_admin and not is_head and entry.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    if update_dict.get("status") == "completed" and not entry.get("completed_at"):
        update_dict["completed_at"] = datetime.now(timezone.utc).isoformat()

    old_status = entry.get("status")
    new_status = update_dict.get("status")

    await db.pdp.update_one({"id": entry_id}, {"$set": update_dict})
    updated = await db.pdp.find_one({"id": entry_id}, {"_id": 0})

    # Notifications on status change
    if new_status and new_status != old_status:
        entry_owner = entry.get("user_id")
        if new_status == "pending_approval" and entry_owner == current_user["id"]:
            await _notify_division_heads_and_admins(
                entry_owner, current_user.get("full_name", ""), 
                "PDP Submitted for Approval",
                f"{current_user.get('full_name', 'An employee')} submitted PDP for approval: {entry.get('title', '')}",
                entry_id, "pdp", "/pdp",
            )
        elif new_status in ("approved", "rejected") and entry_owner != current_user["id"]:
            await notify_and_email(
                entry_owner,
                f"PDP {new_status.title()}",
                f"Your PDP entry '{entry.get('title', '')}' has been {new_status} by {current_user.get('full_name', 'a manager')}.",
                entry_id, "pdp", "/pdp",
            )
        elif new_status == "completed" and entry_owner != current_user["id"]:
            await notify_and_email(
                entry_owner,
                "PDP Marked as Completed",
                f"Your PDP entry '{entry.get('title', '')}' has been marked as completed.",
                entry_id, "pdp", "/pdp",
            )

    return updated


@router.delete("/pdp/{entry_id}")
async def delete_pdp_entry(entry_id: str, current_user: dict = Depends(get_current_user)):
    entry = await db.pdp.find_one({"id": entry_id}, {"_id": 0})
    if not entry:
        raise HTTPException(status_code=404, detail="PDP entry not found")
    is_admin = any(r in current_user.get("roles", []) for r in ["admin", "super_admin"])
    if not is_admin and entry.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    await db.pdp.delete_one({"id": entry_id})
    return {"message": "PDP entry deleted successfully"}
