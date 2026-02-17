from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from .base import BaseDBModel, generate_uuid, current_time

class Task(BaseDBModel):
    title: str
    description: Optional[str] = None
    status: str = "todo"  # todo, in_progress, blocked, completed
    priority: str = "medium"  # low, medium, high
    assigned_to: Optional[str] = None
    assignee_name: Optional[str] = None
    due_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    project_id: Optional[str] = None
    project_name: Optional[str] = None
    created_by: str
    tags: List[str] = []
    progress: int = 0  # 0-100
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    checklist: List[Dict[str, Any]] = []  # [{id, text, completed}]
    attachments: List[Dict[str, str]] = []
    watchers: List[str] = []

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "todo"
    priority: str = "medium"
    assigned_to: Optional[str] = None
    due_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    project_id: Optional[str] = None
    tags: List[str] = []
    estimated_hours: Optional[float] = None
    checklist: List[Dict[str, Any]] = []

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[str] = None
    due_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    project_id: Optional[str] = None
    tags: Optional[List[str]] = None
    progress: Optional[int] = None
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    checklist: Optional[List[Dict[str, Any]]] = None
    watchers: Optional[List[str]] = None
