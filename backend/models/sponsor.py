from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from .base import BaseDBModel, generate_uuid, current_time

class Sponsor(BaseDBModel):
    name: str
    organization: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    contact_person: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    total_contribution: float = 0.0
    currency: str = "ZAR"
    active_bursaries: int = 0
    status: str = "active"  # active, inactive, pending
    type: str = "corporate"  # corporate, individual, government, ngo
    bbbee_level: Optional[int] = None
    notes: Optional[str] = None
    tags: List[str] = []
    logo_url: Optional[str] = None
    created_by: str

class SponsorCreate(BaseModel):
    name: str
    organization: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    contact_person: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    total_contribution: float = 0.0
    type: str = "corporate"
    bbbee_level: Optional[int] = None
    notes: Optional[str] = None
    tags: List[str] = []

class SponsorUpdate(BaseModel):
    name: Optional[str] = None
    organization: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    contact_person: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    total_contribution: Optional[float] = None
    active_bursaries: Optional[int] = None
    status: Optional[str] = None
    type: Optional[str] = None
    bbbee_level: Optional[int] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    logo_url: Optional[str] = None

class SponsorContact(BaseDBModel):
    sponsor_id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    is_primary: bool = False
    notes: Optional[str] = None
    created_by: str

class SponsorContactCreate(BaseModel):
    sponsor_id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    is_primary: bool = False
    notes: Optional[str] = None

class SponsorContactUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    is_primary: Optional[bool] = None
    notes: Optional[str] = None
