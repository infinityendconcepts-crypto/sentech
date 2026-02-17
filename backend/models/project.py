from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from .base import BaseDBModel, generate_uuid, current_time

class Project(BaseDBModel):
    name: str
    description: Optional[str] = None
    status: str = "active"  # planning, active, on_hold, completed, cancelled
    project_type: str = "internal"  # internal, client
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    deadline: Optional[datetime] = None
    budget: float = 0.0
    spent: float = 0.0
    currency: str = "ZAR"
    has_budget: bool = True
    client_id: Optional[str] = None
    client_name: Optional[str] = None
    sponsor_id: Optional[str] = None
    team_id: Optional[str] = None
    manager_id: Optional[str] = None
    member_ids: List[str] = []
    tags: List[str] = []
    color: Optional[str] = "#0056B3"
    progress: int = 0  # 0-100
    priority: str = "medium"  # low, medium, high
    created_by: str

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    status: str = "active"
    project_type: str = "internal"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    deadline: Optional[datetime] = None
    budget: float = 0.0
    has_budget: bool = True
    client_id: Optional[str] = None
    sponsor_id: Optional[str] = None
    team_id: Optional[str] = None
    manager_id: Optional[str] = None
    member_ids: List[str] = []
    tags: List[str] = []
    color: Optional[str] = "#0056B3"
    priority: str = "medium"

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    project_type: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    deadline: Optional[datetime] = None
    budget: Optional[float] = None
    spent: Optional[float] = None
    has_budget: Optional[bool] = None
    client_id: Optional[str] = None
    sponsor_id: Optional[str] = None
    team_id: Optional[str] = None
    manager_id: Optional[str] = None
    member_ids: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    color: Optional[str] = None
    progress: Optional[int] = None
    priority: Optional[str] = None

class Client(BaseDBModel):
    name: str
    company: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    contact_person: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool = True
    created_by: str

class ClientCreate(BaseModel):
    name: str
    company: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    contact_person: Optional[str] = None
    notes: Optional[str] = None

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    contact_person: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None
