"""PDP (Personal Development Plan) CRUD routes"""
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from typing import Optional
from . import db, get_current_user, generate_uuid
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from server import PDPEntry, PDPCreate, PDPUpdate

router = APIRouter()


@router.get("/pdp")
async def get_pdp_entries(
    category: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    is_admin = "admin" in current_user.get("roles", []) or "super_admin" in current_user.get("roles", [])
    query = {} if is_admin else {"user_id": current_user["id"]}
    if category:
        query["category"] = category
    if status:
        query["status"] = status
    entries = await db.pdp_entries.find(query, {"_id": 0}).to_list(1000)
    return entries


@router.get("/pdp/{entry_id}")
async def get_pdp_entry(entry_id: str, current_user: dict = Depends(get_current_user)):
    entry = await db.pdp_entries.find_one({"id": entry_id}, {"_id": 0})
    if not entry:
        raise HTTPException(status_code=404, detail="PDP entry not found")
    is_admin = "admin" in current_user.get("roles", []) or "super_admin" in current_user.get("roles", [])
    if not is_admin and entry.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    return entry


@router.post("/pdp")
async def create_pdp_entry(entry_data: PDPCreate, current_user: dict = Depends(get_current_user)):
    entry = PDPEntry(**entry_data.model_dump(), user_id=current_user["id"])
    entry_dict = entry.model_dump()
    entry_dict['created_at'] = entry_dict['created_at'].isoformat()
    entry_dict['updated_at'] = entry_dict['updated_at'].isoformat()
    await db.pdp_entries.insert_one({**entry_dict})
    return entry


@router.put("/pdp/{entry_id}")
async def update_pdp_entry(entry_id: str, update_data: PDPUpdate, current_user: dict = Depends(get_current_user)):
    entry = await db.pdp_entries.find_one({"id": entry_id}, {"_id": 0})
    if not entry:
        raise HTTPException(status_code=404, detail="PDP entry not found")
    is_admin = "admin" in current_user.get("roles", []) or "super_admin" in current_user.get("roles", [])
    if not is_admin and entry.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.pdp_entries.update_one({"id": entry_id}, {"$set": update_dict})
    return await db.pdp_entries.find_one({"id": entry_id}, {"_id": 0})


@router.delete("/pdp/{entry_id}")
async def delete_pdp_entry(entry_id: str, current_user: dict = Depends(get_current_user)):
    entry = await db.pdp_entries.find_one({"id": entry_id}, {"_id": 0})
    if not entry:
        raise HTTPException(status_code=404, detail="PDP entry not found")
    is_admin = "admin" in current_user.get("roles", []) or "super_admin" in current_user.get("roles", [])
    if not is_admin and entry.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    await db.pdp_entries.delete_one({"id": entry_id})
    return {"message": "PDP entry deleted successfully"}
