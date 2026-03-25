"""Meetings CRUD routes"""
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from typing import Optional
from . import db, get_current_user, generate_uuid
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from server import Meeting, MeetingCreate, MeetingUpdate

router = APIRouter()


@router.get("/meetings")
async def get_meetings(
    status: Optional[str] = None,
    meeting_type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"$or": [
        {"organizer_id": current_user["id"]},
        {"attendee_ids": current_user["id"]}
    ]}
    if status:
        query["status"] = status
    if meeting_type:
        query["meeting_type"] = meeting_type
    meetings = await db.meetings.find(query, {"_id": 0}).to_list(1000)
    return meetings


@router.get("/meetings/{meeting_id}")
async def get_meeting(meeting_id: str, current_user: dict = Depends(get_current_user)):
    meeting = await db.meetings.find_one({"id": meeting_id}, {"_id": 0})
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting


@router.post("/meetings")
async def create_meeting(meeting_data: MeetingCreate, current_user: dict = Depends(get_current_user)):
    meeting = Meeting(**meeting_data.model_dump(), organizer_id=current_user["id"])
    meeting_dict = meeting.model_dump()
    meeting_dict['start_time'] = meeting_dict['start_time'].isoformat()
    meeting_dict['end_time'] = meeting_dict['end_time'].isoformat()
    meeting_dict['created_at'] = meeting_dict['created_at'].isoformat()
    meeting_dict['updated_at'] = meeting_dict['updated_at'].isoformat()
    await db.meetings.insert_one({**meeting_dict})

    # Auto-create event for this meeting
    event_dict = {
        "id": generate_uuid(),
        "title": meeting_dict.get("title", "Meeting"),
        "description": meeting_dict.get("description", ""),
        "start_date": meeting_dict.get("start_time"),
        "end_date": meeting_dict.get("end_time"),
        "event_type": "meeting",
        "location": meeting_dict.get("location", ""),
        "organizer_id": current_user["id"],
        "attendee_ids": meeting_dict.get("attendee_ids", []),
        "meeting_id": meeting_dict["id"],
        "meeting_link": meeting_dict.get("meeting_link", ""),
        "is_recurring": False,
        "created_by": current_user["id"],
        "created_at": meeting_dict["created_at"],
        "updated_at": meeting_dict["updated_at"],
    }
    await db.events.insert_one({**event_dict})

    # Notify attendees
    for attendee_id in meeting_dict.get("attendee_ids", []):
        if attendee_id != current_user["id"]:
            notif = {
                "id": generate_uuid(), "user_id": attendee_id, "type": "meeting_invite",
                "title": "New Meeting Invitation",
                "message": f"You've been invited to: {meeting_dict.get('title', 'Meeting')}",
                "reference_id": meeting_dict["id"], "reference_type": "meeting",
                "is_read": False, "created_at": datetime.now(timezone.utc).isoformat(),
            }
            await db.notifications.insert_one({**notif})
    return meeting


@router.put("/meetings/{meeting_id}")
async def update_meeting(meeting_id: str, update_data: MeetingUpdate, current_user: dict = Depends(get_current_user)):
    meeting = await db.meetings.find_one({"id": meeting_id}, {"_id": 0})
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    for field in ['start_time', 'end_time']:
        if field in update_dict and isinstance(update_dict[field], datetime):
            update_dict[field] = update_dict[field].isoformat()
    await db.meetings.update_one({"id": meeting_id}, {"$set": update_dict})
    return {"message": "Meeting updated successfully"}


@router.delete("/meetings/{meeting_id}")
async def delete_meeting(meeting_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.meetings.delete_one({"id": meeting_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return {"message": "Meeting deleted successfully"}
