from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from .base import BaseDBModel, generate_uuid, current_time

class Lead(BaseDBModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    position: Optional[str] = None
    source: str = "website"  # website, referral, linkedin, event, cold_call, other
    status: str = "new"  # new, contacted, qualified, proposal, negotiation, won, lost
    value: float = 0.0
    currency: str = "ZAR"
    assigned_to: Optional[str] = None
    assignee_name: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = []
    last_contact_date: Optional[datetime] = None
    next_follow_up: Optional[datetime] = None
    lost_reason: Optional[str] = None
    created_by: str

class LeadCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    position: Optional[str] = None
    source: str = "website"
    status: str = "new"
    value: float = 0.0
    assigned_to: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = []
    next_follow_up: Optional[datetime] = None

class LeadUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    position: Optional[str] = None
    source: Optional[str] = None
    status: Optional[str] = None
    value: Optional[float] = None
    assigned_to: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    last_contact_date: Optional[datetime] = None
    next_follow_up: Optional[datetime] = None
    lost_reason: Optional[str] = None

class Prospect(BaseDBModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    position: Optional[str] = None
    source: str = "website"
    status: str = "identified"  # identified, researching, approached, engaged, qualified, disqualified
    interest_level: str = "medium"  # low, medium, high
    budget_range: Optional[str] = None
    timeline: Optional[str] = None
    assigned_to: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = []
    last_contact_date: Optional[datetime] = None
    next_action: Optional[str] = None
    next_action_date: Optional[datetime] = None
    created_by: str

class ProspectCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    position: Optional[str] = None
    source: str = "website"
    interest_level: str = "medium"
    budget_range: Optional[str] = None
    timeline: Optional[str] = None
    assigned_to: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = []

class ProspectUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    position: Optional[str] = None
    source: Optional[str] = None
    status: Optional[str] = None
    interest_level: Optional[str] = None
    budget_range: Optional[str] = None
    timeline: Optional[str] = None
    assigned_to: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    next_action: Optional[str] = None
    next_action_date: Optional[datetime] = None
