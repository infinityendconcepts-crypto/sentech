from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from .base import BaseDBModel, generate_uuid, current_time

class Meeting(BaseDBModel):
    title: str
    description: Optional[str] = None
    meeting_type: str = "general"  # general, zoom, teams
    meeting_link: Optional[str] = None
    meeting_id: Optional[str] = None
    meeting_password: Optional[str] = None
    start_time: datetime
    end_time: datetime
    timezone: str = "Africa/Johannesburg"
    organizer_id: str
    attendee_ids: List[str] = []
    status: str = "scheduled"  # scheduled, in_progress, completed, cancelled
    recurrence: Optional[Dict[str, Any]] = None  # For recurring meetings
    notes: Optional[str] = None
    recording_url: Optional[str] = None
    project_id: Optional[str] = None
    reminder_sent: bool = False

class MeetingCreate(BaseModel):
    title: str
    description: Optional[str] = None
    meeting_type: str = "general"
    meeting_link: Optional[str] = None
    meeting_id: Optional[str] = None
    meeting_password: Optional[str] = None
    start_time: datetime
    end_time: datetime
    timezone: str = "Africa/Johannesburg"
    attendee_ids: List[str] = []
    recurrence: Optional[Dict[str, Any]] = None
    project_id: Optional[str] = None

class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    meeting_type: Optional[str] = None
    meeting_link: Optional[str] = None
    meeting_id: Optional[str] = None
    meeting_password: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    timezone: Optional[str] = None
    attendee_ids: Optional[List[str]] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    recording_url: Optional[str] = None
