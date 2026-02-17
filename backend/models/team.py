from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from .base import BaseDBModel, generate_uuid, current_time

class Team(BaseDBModel):
    name: str
    description: Optional[str] = None
    leader_id: Optional[str] = None
    member_ids: List[str] = []
    department: Optional[str] = None
    color: Optional[str] = "#0056B3"
    is_active: bool = True

class TeamCreate(BaseModel):
    name: str
    description: Optional[str] = None
    leader_id: Optional[str] = None
    member_ids: List[str] = []
    department: Optional[str] = None
    color: Optional[str] = "#0056B3"

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    leader_id: Optional[str] = None
    member_ids: Optional[List[str]] = None
    department: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None
