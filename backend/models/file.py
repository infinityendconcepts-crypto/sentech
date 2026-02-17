from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from .base import BaseDBModel, generate_uuid, current_time

class File(BaseDBModel):
    name: str
    original_name: str
    file_type: str  # document, image, video, audio, archive, other
    mime_type: str
    size: int  # in bytes
    url: str
    folder_id: Optional[str] = None
    uploaded_by: str
    project_id: Optional[str] = None
    tags: List[str] = []
    description: Optional[str] = None
    is_shared: bool = False
    shared_with: List[str] = []  # user_ids
    shared_with_teams: List[str] = []  # team_ids
    version: int = 1
    previous_versions: List[Dict[str, Any]] = []  # [{version, url, uploaded_at}]

class FileCreate(BaseModel):
    name: str
    original_name: str
    file_type: str
    mime_type: str
    size: int
    url: str
    folder_id: Optional[str] = None
    project_id: Optional[str] = None
    tags: List[str] = []
    description: Optional[str] = None

class FileUpdate(BaseModel):
    name: Optional[str] = None
    folder_id: Optional[str] = None
    tags: Optional[List[str]] = None
    description: Optional[str] = None
    is_shared: Optional[bool] = None
    shared_with: Optional[List[str]] = None
    shared_with_teams: Optional[List[str]] = None

class Folder(BaseDBModel):
    name: str
    parent_id: Optional[str] = None
    created_by: str
    project_id: Optional[str] = None
    color: Optional[str] = None
    is_shared: bool = False
    shared_with: List[str] = []
    shared_with_teams: List[str] = []

class FolderCreate(BaseModel):
    name: str
    parent_id: Optional[str] = None
    project_id: Optional[str] = None
    color: Optional[str] = None

class FolderUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[str] = None
    color: Optional[str] = None
    is_shared: Optional[bool] = None
    shared_with: Optional[List[str]] = None
    shared_with_teams: Optional[List[str]] = None
