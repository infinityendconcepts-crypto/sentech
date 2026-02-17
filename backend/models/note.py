from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from .base import BaseDBModel, generate_uuid, current_time

class Note(BaseDBModel):
    title: str
    content: str
    created_by: str
    folder_id: Optional[str] = None
    tags: List[str] = []
    color: Optional[str] = None
    is_pinned: bool = False
    is_shared: bool = False
    shared_with: List[str] = []  # user_ids who can view
    shared_with_teams: List[str] = []  # team_ids who can view
    attachments: List[Dict[str, str]] = []  # [{name, url, type}]

class NoteCreate(BaseModel):
    title: str
    content: str
    folder_id: Optional[str] = None
    tags: List[str] = []
    color: Optional[str] = None
    is_pinned: bool = False
    is_shared: bool = False
    shared_with: List[str] = []
    shared_with_teams: List[str] = []

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    folder_id: Optional[str] = None
    tags: Optional[List[str]] = None
    color: Optional[str] = None
    is_pinned: Optional[bool] = None
    is_shared: Optional[bool] = None
    shared_with: Optional[List[str]] = None
    shared_with_teams: Optional[List[str]] = None

class NoteFolder(BaseDBModel):
    name: str
    created_by: str
    parent_id: Optional[str] = None
    color: Optional[str] = None
    is_shared: bool = False
    shared_with: List[str] = []
    shared_with_teams: List[str] = []

class NoteFolderCreate(BaseModel):
    name: str
    parent_id: Optional[str] = None
    color: Optional[str] = None
    is_shared: bool = False
    shared_with: List[str] = []
    shared_with_teams: List[str] = []
