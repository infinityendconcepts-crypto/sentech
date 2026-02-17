from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from .base import BaseDBModel, generate_uuid, current_time

class Ticket(BaseDBModel):
    title: str
    description: str
    category: str = "general"  # general, technical, billing, feature_request, bug
    priority: str = "medium"  # low, medium, high, urgent
    status: str = "open"  # open, in_progress, waiting, resolved, closed
    created_by: str
    assigned_to: Optional[str] = None
    team_id: Optional[str] = None
    project_id: Optional[str] = None
    tags: List[str] = []
    attachments: List[Dict[str, str]] = []
    resolution: Optional[str] = None
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    first_response_at: Optional[datetime] = None
    sla_due_at: Optional[datetime] = None

class TicketCreate(BaseModel):
    title: str
    description: str
    category: str = "general"
    priority: str = "medium"
    project_id: Optional[str] = None
    tags: List[str] = []
    attachments: List[Dict[str, str]] = []

class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    team_id: Optional[str] = None
    tags: Optional[List[str]] = None
    resolution: Optional[str] = None

class TicketComment(BaseDBModel):
    ticket_id: str
    user_id: str
    content: str
    is_internal: bool = False  # Internal notes not visible to ticket creator
    attachments: List[Dict[str, str]] = []

class TicketCommentCreate(BaseModel):
    ticket_id: str
    content: str
    is_internal: bool = False
    attachments: List[Dict[str, str]] = []
