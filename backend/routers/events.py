"""Events CRUD routes"""
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from typing import Optional
from . import db, get_current_user, generate_uuid
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from server import Event, EventCreate, EventUpdate

router = APIRouter()


@router.get("/events")
async def get_events(
    event_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if event_type:
        query["event_type"] = event_type
    if start_date:
        query["start_date"] = {"$gte": start_date}
    if end_date:
        if "start_date" in query:
            query["start_date"]["$lte"] = end_date + "T23:59:59"
        else:
            query["start_date"] = {"$lte": end_date + "T23:59:59"}
    events = await db.events.find(query, {"_id": 0}).sort("start_date", 1).to_list(1000)
    return events


@router.get("/events/{event_id}")
async def get_event(event_id: str, current_user: dict = Depends(get_current_user)):
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.post("/events")
async def create_event(event_data: EventCreate, current_user: dict = Depends(get_current_user)):
    event = Event(**event_data.model_dump(), created_by=current_user["id"])
    event_dict = event.model_dump()
    event_dict['created_at'] = event_dict['created_at'].isoformat()
    event_dict['updated_at'] = event_dict['updated_at'].isoformat()
    await db.events.insert_one({**event_dict})
    return event


@router.put("/events/{event_id}")
async def update_event(event_id: str, update_data: EventUpdate, current_user: dict = Depends(get_current_user)):
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.events.update_one({"id": event_id}, {"$set": update_dict})
    return {"message": "Event updated successfully"}


@router.delete("/events/{event_id}")
async def delete_event(event_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.events.delete_one({"id": event_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "Event deleted successfully"}
