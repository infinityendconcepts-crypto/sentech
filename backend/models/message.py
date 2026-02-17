from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from .base import BaseDBModel, generate_uuid, current_time

class Message(BaseDBModel):
    conversation_id: str
    sender_id: str
    content: str
    message_type: str = "text"  # text, file, image
    attachments: List[Dict[str, str]] = []  # [{name, url, type, size}]
    is_read: bool = False
    read_by: List[str] = []  # For group conversations
    is_deleted: bool = False

class MessageCreate(BaseModel):
    conversation_id: str
    content: str
    message_type: str = "text"
    attachments: List[Dict[str, str]] = []

class Conversation(BaseDBModel):
    name: Optional[str] = None  # For group chats
    type: str = "direct"  # direct, group
    participant_ids: List[str]
    created_by: str
    last_message_id: Optional[str] = None
    last_message_at: Optional[datetime] = None
    is_archived: bool = False
    unread_count: Dict[str, int] = {}  # {user_id: count}

class ConversationCreate(BaseModel):
    name: Optional[str] = None
    type: str = "direct"
    participant_ids: List[str]

class ConversationUpdate(BaseModel):
    name: Optional[str] = None
    is_archived: Optional[bool] = None
