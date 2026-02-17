from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime, timezone
from models.meeting import Meeting, MeetingCreate, MeetingUpdate

router = APIRouter(prefix="/meetings", tags=["Meetings"])

db = None

def set_db(database):
    global db
    db = database

async def get_current_user(credentials):
    pass

@router.get("", response_model=List[Meeting])
async def get_meetings(
    status: Optional[str] = None,
    meeting_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
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
    for meeting in meetings:
        for field in ['start_time', 'end_time', 'created_at', 'updated_at']:
            if isinstance(meeting.get(field), str):
                meeting[field] = datetime.fromisoformat(meeting[field])
    return meetings

@router.get("/{meeting_id}")
async def get_meeting(meeting_id: str, current_user: dict = Depends(get_current_user)):
    meeting = await db.meetings.find_one({"id": meeting_id}, {"_id": 0})
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting

@router.post("", response_model=Meeting)
async def create_meeting(meeting_data: MeetingCreate, current_user: dict = Depends(get_current_user)):
    meeting = Meeting(
        **meeting_data.model_dump(),
        organizer_id=current_user["id"]
    )
    meeting_dict = meeting.model_dump()
    meeting_dict['start_time'] = meeting_dict['start_time'].isoformat()
    meeting_dict['end_time'] = meeting_dict['end_time'].isoformat()
    meeting_dict['created_at'] = meeting_dict['created_at'].isoformat()
    meeting_dict['updated_at'] = meeting_dict['updated_at'].isoformat()
    
    await db.meetings.insert_one({**meeting_dict})
    return meeting

@router.put("/{meeting_id}", response_model=Meeting)
async def update_meeting(meeting_id: str, update_data: MeetingUpdate, current_user: dict = Depends(get_current_user)):
    meeting = await db.meetings.find_one({"id": meeting_id}, {"_id": 0})
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Convert datetime fields
    for field in ['start_time', 'end_time']:
        if field in update_dict and isinstance(update_dict[field], datetime):
            update_dict[field] = update_dict[field].isoformat()
    
    await db.meetings.update_one({"id": meeting_id}, {"$set": update_dict})
    updated_meeting = await db.meetings.find_one({"id": meeting_id}, {"_id": 0})
    return updated_meeting

@router.delete("/{meeting_id}")
async def delete_meeting(meeting_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.meetings.delete_one({"id": meeting_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return {"message": "Meeting deleted successfully"}

@router.post("/{meeting_id}/cancel")
async def cancel_meeting(meeting_id: str, current_user: dict = Depends(get_current_user)):
    meeting = await db.meetings.find_one({"id": meeting_id}, {"_id": 0})
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    if meeting["organizer_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only organizer can cancel the meeting")
    
    await db.meetings.update_one(
        {"id": meeting_id}, 
        {"$set": {"status": "cancelled", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Meeting cancelled successfully"}

@router.get("/upcoming/list")
async def get_upcoming_meetings(limit: int = 5, current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    meetings = await db.meetings.find(
        {
            "$or": [
                {"organizer_id": current_user["id"]},
                {"attendee_ids": current_user["id"]}
            ],
            "start_time": {"$gte": now},
            "status": {"$ne": "cancelled"}
        },
        {"_id": 0}
    ).sort("start_time", 1).limit(limit).to_list(limit)
    return meetings
