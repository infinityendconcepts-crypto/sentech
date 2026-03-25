"""All Pydantic models for the Sentech Bursary Management System"""
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid


def generate_uuid():
    return str(uuid.uuid4())

def current_time():
    return datetime.now(timezone.utc)


# ============== USER MODELS ==============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    email: EmailStr
    full_name: str
    surname: Optional[str] = None
    password_hash: Optional[str] = None
    roles: List[str] = ["student"]
    team_id: Optional[str] = None
    department: Optional[str] = None
    division: Optional[str] = None
    position: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool = True
    is_verified: bool = False
    requires_password_setup: bool = False
    student_id: Optional[str] = None
    permissions: Dict[str, Any] = {}
    bio: Optional[str] = None
    ofo_major_group: Optional[str] = None
    ofo_sub_major_group: Optional[str] = None
    ofo_occupation: Optional[str] = None
    ofo_code: Optional[str] = None
    personnel_number: Optional[str] = None
    id_number: Optional[str] = None
    race: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    start_date: Optional[str] = None
    years_of_service: Optional[float] = None
    level: Optional[str] = None
    created_at: datetime = Field(default_factory=current_time)
    updated_at: datetime = Field(default_factory=current_time)

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: Optional[str] = None
    surname: Optional[str] = None
    student_id: Optional[str] = None
    roles: List[str] = ["student"]
    team_id: Optional[str] = None
    department: Optional[str] = None
    division: Optional[str] = None
    position: Optional[str] = None
    phone: Optional[str] = None
    requires_password_setup: bool = False
    ofo_major_group: Optional[str] = None
    ofo_sub_major_group: Optional[str] = None
    ofo_occupation: Optional[str] = None
    ofo_code: Optional[str] = None
    personnel_number: Optional[str] = None
    id_number: Optional[str] = None
    race: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    start_date: Optional[str] = None
    years_of_service: Optional[float] = None
    level: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    surname: Optional[str] = None
    bio: Optional[str] = None
    roles: Optional[List[str]] = None
    team_id: Optional[str] = None
    department: Optional[str] = None
    division: Optional[str] = None
    position: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: Optional[bool] = None
    requires_password_setup: Optional[bool] = None
    ofo_major_group: Optional[str] = None
    ofo_sub_major_group: Optional[str] = None
    ofo_occupation: Optional[str] = None
    ofo_code: Optional[str] = None
    personnel_number: Optional[str] = None
    id_number: Optional[str] = None
    race: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    email: Optional[str] = None
    start_date: Optional[str] = None
    years_of_service: Optional[float] = None
    level: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class PasswordSetup(BaseModel):
    email: EmailStr
    new_password: str


# ============== ORGANIZATION MODELS ==============

class Division(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    name: str
    description: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=current_time)
    updated_at: datetime = Field(default_factory=current_time)

class Department(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    name: str
    division_id: str
    description: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=current_time)
    updated_at: datetime = Field(default_factory=current_time)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]


# ============== TEAM MODELS ==============

class Team(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    name: str
    description: Optional[str] = None
    leader_id: Optional[str] = None
    member_ids: List[str] = []
    department: Optional[str] = None
    color: Optional[str] = "#0056B3"
    is_active: bool = True
    created_at: datetime = Field(default_factory=current_time)
    updated_at: datetime = Field(default_factory=current_time)

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


# ============== MEETING MODELS ==============

class Meeting(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    title: str
    description: Optional[str] = None
    meeting_type: str = "general"
    meeting_link: Optional[str] = None
    meeting_id: Optional[str] = None
    meeting_password: Optional[str] = None
    start_time: datetime
    end_time: datetime
    timezone: str = "Africa/Johannesburg"
    organizer_id: str
    attendee_ids: List[str] = []
    status: str = "scheduled"
    notes: Optional[str] = None
    project_id: Optional[str] = None
    created_at: datetime = Field(default_factory=current_time)
    updated_at: datetime = Field(default_factory=current_time)

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
    project_id: Optional[str] = None

class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    meeting_type: Optional[str] = None
    meeting_link: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    attendee_ids: Optional[List[str]] = None


# ============== NOTE MODELS ==============

class Note(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    title: str
    content: str
    created_by: str
    folder_id: Optional[str] = None
    tags: List[str] = []
    color: Optional[str] = None
    is_pinned: bool = False
    is_shared: bool = False
    shared_with: List[str] = []
    shared_with_teams: List[str] = []
    created_at: datetime = Field(default_factory=current_time)
    updated_at: datetime = Field(default_factory=current_time)

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

class NoteFolder(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    name: str
    created_by: str
    parent_id: Optional[str] = None
    color: Optional[str] = None
    is_shared: bool = False
    shared_with: List[str] = []
    shared_with_teams: List[str] = []
    created_at: datetime = Field(default_factory=current_time)
    updated_at: datetime = Field(default_factory=current_time)

class NoteFolderCreate(BaseModel):
    name: str
    parent_id: Optional[str] = None
    color: Optional[str] = None
    is_shared: bool = False
    shared_with: List[str] = []
    shared_with_teams: List[str] = []


# ============== MESSAGE MODELS ==============

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    conversation_id: str
    sender_id: str
    content: str
    message_type: str = "text"
    attachments: List[Dict[str, str]] = []
    is_read: bool = False
    read_by: List[str] = []
    is_deleted: bool = False
    created_at: datetime = Field(default_factory=current_time)
    updated_at: datetime = Field(default_factory=current_time)

class MessageCreate(BaseModel):
    conversation_id: Optional[str] = None
    content: str
    message_type: str = "text"
    attachments: List[Dict[str, str]] = []

class Conversation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    name: Optional[str] = None
    type: str = "direct"
    participant_ids: List[str]
    created_by: str
    last_message_id: Optional[str] = None
    last_message_at: Optional[datetime] = None
    is_archived: bool = False
    unread_count: Dict[str, int] = {}
    created_at: datetime = Field(default_factory=current_time)
    updated_at: datetime = Field(default_factory=current_time)

class ConversationCreate(BaseModel):
    name: Optional[str] = None
    type: str = "direct"
    participant_ids: List[str]


# ============== EXPENSE MODELS ==============

class Expense(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    title: str
    description: Optional[str] = None
    amount: float
    currency: str = "ZAR"
    category: str
    date: datetime
    submitted_by: str
    user_id: Optional[str] = None
    project_id: Optional[str] = None
    sponsor_id: Optional[str] = None
    status: str = "pending"
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    receipt_url: Optional[str] = None
    notes: Optional[str] = None
    vendor: Optional[str] = None
    created_at: datetime = Field(default_factory=current_time)
    updated_at: datetime = Field(default_factory=current_time)

class ExpenseCreate(BaseModel):
    title: str
    description: Optional[str] = None
    amount: float
    currency: str = "ZAR"
    category: str
    date: datetime
    user_id: Optional[str] = None
    project_id: Optional[str] = None
    sponsor_id: Optional[str] = None
    receipt_url: Optional[str] = None
    notes: Optional[str] = None
    vendor: Optional[str] = None

class ExpenseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    date: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None


# ============== TICKET MODELS ==============

class Ticket(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    title: str
    description: str
    category: str = "general"
    priority: str = "medium"
    status: str = "open"
    created_by: str
    assigned_to: Optional[str] = None
    team_id: Optional[str] = None
    project_id: Optional[str] = None
    tags: List[str] = []
    attachments: List[Dict[str, str]] = []
    resolution: Optional[str] = None
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=current_time)
    updated_at: datetime = Field(default_factory=current_time)

class TicketCreate(BaseModel):
    title: str
    description: str
    category: str = "general"
    priority: str = "medium"
    project_id: Optional[str] = None
    tags: List[str] = []

class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    resolution: Optional[str] = None

class TicketComment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    ticket_id: str
    user_id: str
    content: str
    is_internal: bool = False
    attachments: List[Dict[str, str]] = []
    created_at: datetime = Field(default_factory=current_time)
    updated_at: datetime = Field(default_factory=current_time)

class TicketCommentCreate(BaseModel):
    ticket_id: str
    content: str
    is_internal: bool = False


# ============== FILE MODELS ==============

class FileModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    name: str
    original_name: str
    file_type: str
    mime_type: str
    size: int
    url: str
    folder_id: Optional[str] = None
    uploaded_by: str
    project_id: Optional[str] = None
    tags: List[str] = []
    description: Optional[str] = None
    is_shared: bool = False
    shared_with: List[str] = []
    shared_with_teams: List[str] = []
    created_at: datetime = Field(default_factory=current_time)
    updated_at: datetime = Field(default_factory=current_time)

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

class Folder(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    name: str
    parent_id: Optional[str] = None
    created_by: str
    project_id: Optional[str] = None
    color: Optional[str] = None
    is_shared: bool = False
    shared_with: List[str] = []
    shared_with_teams: List[str] = []
    created_at: datetime = Field(default_factory=current_time)
    updated_at: datetime = Field(default_factory=current_time)

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


# ============== TASK MODELS ==============

class Task(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    title: str
    description: Optional[str] = None
    status: str = "todo"
    priority: str = "medium"
    assigned_to: Optional[str] = None
    assignee_name: Optional[str] = None
    due_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    project_id: Optional[str] = None
    project_name: Optional[str] = None
    created_by: str
    tags: List[str] = []
    progress: int = 0
    attendance: List[Dict[str, Any]] = []
    comments: List[Dict[str, Any]] = []
    images: List[Dict[str, Any]] = []
    created_at: datetime = Field(default_factory=current_time)
    updated_at: datetime = Field(default_factory=current_time)

class TaskCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: str
    description: Optional[str] = None
    status: str = "todo"
    priority: str = "medium"
    assigned_to: Optional[str] = None
    assignee_name: Optional[str] = None
    due_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    project_id: Optional[str] = None
    project_name: Optional[str] = None
    tags: List[str] = []
    attendance: List[Dict[str, Any]] = []
    comments: List[Dict[str, Any]] = []
    images: List[Dict[str, Any]] = []

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
    attendance: Optional[List[Dict[str, Any]]] = None
    comments: Optional[List[Dict[str, Any]]] = None
    images: Optional[List[Dict[str, Any]]] = None


# ============== PROJECT MODELS ==============

class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    name: str
    description: Optional[str] = None
    status: str = "active"
    project_type: str = "internal"
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
    progress: int = 0
    priority: str = "medium"
    created_by: str
    created_at: datetime = Field(default_factory=current_time)
    updated_at: datetime = Field(default_factory=current_time)

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
    manager_id: Optional[str] = None
    member_ids: List[str] = []
    tags: List[str] = []
    priority: str = "medium"

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    budget: Optional[float] = None
    spent: Optional[float] = None
    progress: Optional[int] = None
    priority: Optional[str] = None
    member_ids: Optional[List[str]] = None


# ============== CLIENT MODELS ==============

class Client(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    name: str
    company: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    contact_person: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool = True
    created_by: str
    created_at: datetime = Field(default_factory=current_time)
    updated_at: datetime = Field(default_factory=current_time)

class ClientCreate(BaseModel):
    name: str
    company: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    contact_person: Optional[str] = None
    notes: Optional[str] = None


# ============== LEAD MODELS ==============

class Lead(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    position: Optional[str] = None
    source: str = "website"
    status: str = "new"
    value: float = 0.0
    currency: str = "ZAR"
    assigned_to: Optional[str] = None
    assignee_name: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = []
    last_contact_date: Optional[datetime] = None
    next_follow_up: Optional[datetime] = None
    created_by: str
    created_at: datetime = Field(default_factory=current_time)
    updated_at: datetime = Field(default_factory=current_time)

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

class LeadUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    source: Optional[str] = None
    status: Optional[str] = None
    value: Optional[float] = None
    assigned_to: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None


# ============== PROSPECT MODELS ==============

class Prospect(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    position: Optional[str] = None
    source: str = "website"
    status: str = "identified"
    interest_level: str = "medium"
    budget_range: Optional[str] = None
    assigned_to: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = []
    next_action: Optional[str] = None
    next_action_date: Optional[datetime] = None
    created_by: str
    created_at: datetime = Field(default_factory=current_time)
    updated_at: datetime = Field(default_factory=current_time)

class ProspectCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    source: str = "website"
    interest_level: str = "medium"
    assigned_to: Optional[str] = None
    notes: Optional[str] = None

class ProspectUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    status: Optional[str] = None
    interest_level: Optional[str] = None
    assigned_to: Optional[str] = None
    notes: Optional[str] = None
    next_action: Optional[str] = None
    next_action_date: Optional[datetime] = None


# ============== SPONSOR MODELS ==============

class Sponsor(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
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
    status: str = "active"
    type: str = "corporate"
    bbbee_level: Optional[int] = None
    notes: Optional[str] = None
    tags: List[str] = []
    created_by: str
    created_at: datetime = Field(default_factory=current_time)
    updated_at: datetime = Field(default_factory=current_time)

class SponsorCreate(BaseModel):
    name: str
    organization: str
    email: Optional[str] = None
    phone: Optional[str] = None
    contact_person: Optional[str] = None
    contact_email: Optional[str] = None
    total_contribution: float = 0.0
    type: str = "corporate"
    bbbee_level: Optional[int] = None

class SponsorUpdate(BaseModel):
    name: Optional[str] = None
    organization: Optional[str] = None
    email: Optional[str] = None
    contact_person: Optional[str] = None
    total_contribution: Optional[float] = None
    active_bursaries: Optional[int] = None
    status: Optional[str] = None
    bbbee_level: Optional[int] = None

class SponsorContact(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    sponsor_id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    is_primary: bool = False
    notes: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=current_time)
    updated_at: datetime = Field(default_factory=current_time)

class SponsorContactCreate(BaseModel):
    sponsor_id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    is_primary: bool = False


# ============== APPLICATION MODELS ==============

class BursaryApplication(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    user_id: str
    user_email: str
    status: str = "draft"
    current_step: int = 1
    personal_info: Dict[str, Any] = {}
    academic_info: Dict[str, Any] = {}
    financial_info: Dict[str, Any] = {}
    documents: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=current_time)
    updated_at: datetime = Field(default_factory=current_time)
    submitted_at: Optional[datetime] = None

class ApplicationCreate(BaseModel):
    status: Optional[str] = "draft"
    current_step: Optional[int] = 1
    personal_info: Optional[Dict[str, Any]] = {}
    academic_info: Optional[Dict[str, Any]] = {}
    academic_bursary_info: Optional[Dict[str, Any]] = {}
    employment_info: Optional[Dict[str, Any]] = {}
    financial_info: Optional[Dict[str, Any]] = {}
    documents: Optional[Dict[str, Any]] = {}

class ApplicationUpdate(BaseModel):
    current_step: Optional[int] = None
    status: Optional[str] = None
    status_note: Optional[str] = None
    status_updated_at: Optional[str] = None
    personal_info: Optional[Dict[str, Any]] = None
    academic_info: Optional[Dict[str, Any]] = None
    academic_bursary_info: Optional[Dict[str, Any]] = None
    employment_info: Optional[Dict[str, Any]] = None
    financial_info: Optional[Dict[str, Any]] = None
    documents: Optional[Dict[str, Any]] = None

class ApplicationDocumentReupload(BaseModel):
    model_config = ConfigDict(extra="ignore")
    document_type: str
    file_name: str
    file_data: str
    notes: Optional[str] = None


# ============== BBBEE MODELS ==============

class BBBEERecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    organization_name: str
    bbbee_level: int
    score: float
    verification_date: datetime
    expiry_date: datetime
    status: str = "active"
    documents: List[str] = []
    created_at: datetime = Field(default_factory=current_time)


# ============== SETTINGS MODELS ==============

class SystemSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "system_settings"
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_use_tls: bool = True
    smtp_from_email: Optional[str] = None
    smtp_from_name: str = "Sentech Bursary System"
    zoom_api_key: Optional[str] = None
    zoom_api_secret: Optional[str] = None
    zoom_account_id: Optional[str] = None
    teams_tenant_id: Optional[str] = None
    teams_client_id: Optional[str] = None
    teams_client_secret: Optional[str] = None
    teams_webhook_url: Optional[str] = None
    company_name: str = "Sentech"
    company_tagline: Optional[str] = "Bursary Management System"
    company_email: Optional[str] = None
    company_phone: Optional[str] = None
    company_address: Optional[str] = None
    primary_color: str = "#0056B3"
    timezone: str = "Africa/Johannesburg"
    currency: str = "ZAR"
    features_enabled: Dict[str, bool] = {}
    page_settings: Dict[str, Dict[str, Any]] = {}
    created_at: datetime = Field(default_factory=current_time)
    updated_at: datetime = Field(default_factory=current_time)

class SystemSettingsUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_use_tls: Optional[bool] = None
    smtp_from_email: Optional[str] = None
    smtp_from_name: Optional[str] = None
    zoom_api_key: Optional[str] = None
    zoom_api_secret: Optional[str] = None
    zoom_account_id: Optional[str] = None
    teams_tenant_id: Optional[str] = None
    teams_client_id: Optional[str] = None
    teams_client_secret: Optional[str] = None
    teams_webhook_url: Optional[str] = None
    company_name: Optional[str] = None
    company_tagline: Optional[str] = None
    company_email: Optional[str] = None
    company_phone: Optional[str] = None
    company_address: Optional[str] = None
    primary_color: Optional[str] = None
    timezone: Optional[str] = None
    currency: Optional[str] = None
    features_enabled: Optional[Dict[str, bool]] = None
    page_settings: Optional[Dict[str, Dict[str, Any]]] = None


# ============== ROLE MODELS ==============

class Role(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    name: str
    description: Optional[str] = None
    permissions: Dict[str, List[str]] = {}
    is_system: bool = False
    is_active: bool = True
    created_at: datetime = Field(default_factory=current_time)
    updated_at: datetime = Field(default_factory=current_time)

class RoleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    permissions: Dict[str, List[str]] = {}

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[Dict[str, List[str]]] = None
    is_active: Optional[bool] = None


# ============== PDP MODELS ==============

class PDPEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    user_id: str
    user_name: Optional[str] = None
    learn_what: str
    action_plan: str
    resources_support: str
    success_criteria: str
    target_date: Optional[str] = None
    review_date: Optional[str] = None
    status: str = "not_started"
    priority: str = "medium"
    category: Optional[str] = None
    notes: Optional[str] = None
    assigned_to: Optional[str] = None
    assigned_to_name: Optional[str] = None
    assigned_to_email: Optional[str] = None
    completed_at: Optional[str] = None
    created_at: datetime = Field(default_factory=current_time)
    updated_at: datetime = Field(default_factory=current_time)

class PDPCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    learn_what: str
    action_plan: str
    resources_support: str
    success_criteria: str
    target_date: Optional[str] = None
    review_date: Optional[str] = None
    status: Optional[str] = "not_started"
    priority: Optional[str] = "medium"
    category: Optional[str] = None
    notes: Optional[str] = None
    assigned_to: Optional[str] = None
    assigned_to_name: Optional[str] = None
    assigned_to_email: Optional[str] = None

class PDPUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    learn_what: Optional[str] = None
    action_plan: Optional[str] = None
    resources_support: Optional[str] = None
    success_criteria: Optional[str] = None
    target_date: Optional[str] = None
    review_date: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    notes: Optional[str] = None
    assigned_to: Optional[str] = None
    assigned_to_name: Optional[str] = None
    assigned_to_email: Optional[str] = None


# ============== EVENT MODELS ==============

class Event(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    title: str
    description: Optional[str] = None
    start_date: str
    end_date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    location: Optional[str] = None
    event_type: str = "event"
    color: Optional[str] = "#0056B3"
    attendees: List[str] = []
    all_day: bool = False
    recurrence: Optional[str] = None
    created_by: Optional[str] = None
    created_by_name: Optional[str] = None
    created_at: datetime = Field(default_factory=current_time)
    updated_at: datetime = Field(default_factory=current_time)

class EventCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: str
    description: Optional[str] = None
    start_date: str
    end_date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    location: Optional[str] = None
    event_type: Optional[str] = "event"
    color: Optional[str] = "#0056B3"
    attendees: Optional[List[str]] = []
    all_day: Optional[bool] = False

class EventUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    location: Optional[str] = None
    event_type: Optional[str] = None
    color: Optional[str] = None
    attendees: Optional[List[str]] = None
    all_day: Optional[bool] = None


# ============== FAQ MODELS ==============

class FAQ(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    question: str
    answer: str
    category: str = "general"
    order: int = 0
    is_published: bool = True
    helpful_count: int = 0
    not_helpful_count: int = 0
    created_at: datetime = Field(default_factory=current_time)
    updated_at: datetime = Field(default_factory=current_time)

class FAQCreate(BaseModel):
    question: str
    answer: str
    category: str = "general"
    order: int = 0
    is_published: bool = True

class FAQUpdate(BaseModel):
    question: Optional[str] = None
    answer: Optional[str] = None
    category: Optional[str] = None
    order: Optional[int] = None
    is_published: Optional[bool] = None
