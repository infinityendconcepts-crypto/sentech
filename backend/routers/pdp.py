"""PDP (Personal Development Plan) CRUD routes"""
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from typing import Optional
from . import db, get_current_user, generate_uuid
from schemas import PDPEntry, PDPCreate, PDPUpdate

router = APIRouter(prefix="/api", tags=["pdp"])


@router.get("/pdp")
async def get_pdp_entries(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if "admin" not in current_user.get("roles", []):
        query["user_id"] = current_user["id"]
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    entries = await db.pdp.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return entries


@router.get("/pdp/{entry_id}")
async def get_pdp_entry(entry_id: str, current_user: dict = Depends(get_current_user)):
    entry = await db.pdp.find_one({"id": entry_id}, {"_id": 0})
    if not entry:
        raise HTTPException(status_code=404, detail="PDP entry not found")
    if "admin" not in current_user.get("roles", []) and entry.get("user_id") != current_user["id"]:
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
    return entry


@router.put("/pdp/{entry_id}")
async def update_pdp_entry(entry_id: str, update_data: PDPUpdate, current_user: dict = Depends(get_current_user)):
    entry = await db.pdp.find_one({"id": entry_id}, {"_id": 0})
    if not entry:
        raise HTTPException(status_code=404, detail="PDP entry not found")
    if "admin" not in current_user.get("roles", []) and entry.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    if update_dict.get("status") == "completed" and not entry.get("completed_at"):
        update_dict["completed_at"] = datetime.now(timezone.utc).isoformat()
    await db.pdp.update_one({"id": entry_id}, {"$set": update_dict})
    updated = await db.pdp.find_one({"id": entry_id}, {"_id": 0})
    return updated


@router.delete("/pdp/{entry_id}")
async def delete_pdp_entry(entry_id: str, current_user: dict = Depends(get_current_user)):
    entry = await db.pdp.find_one({"id": entry_id}, {"_id": 0})
    if not entry:
        raise HTTPException(status_code=404, detail="PDP entry not found")
    if "admin" not in current_user.get("roles", []) and entry.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    await db.pdp.delete_one({"id": entry_id})
    return {"message": "PDP entry deleted successfully"}
