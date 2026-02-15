from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import secrets
import hashlib
import msal
import requests

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Bursary Management System")
api_router = APIRouter(prefix="/api")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production-min-32-chars")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

MICROSOFT_CLIENT_ID = os.getenv("MICROSOFT_CLIENT_ID")
MICROSOFT_TENANT_ID = os.getenv("MICROSOFT_TENANT_ID")
MICROSOFT_CLIENT_SECRET = os.getenv("MICROSOFT_CLIENT_SECRET")
MICROSOFT_AUTHORITY = f"https://login.microsoftonline.com/{MICROSOFT_TENANT_ID}"
MICROSOFT_SCOPE = ["User.Read"]

FRONTEND_URL = os.getenv("REACT_APP_BACKEND_URL", "http://localhost:3000").replace("/api", "")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    password_hash: Optional[str] = None
    roles: List[str] = ["student"]
    is_active: bool = True
    is_verified: bool = False
    student_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    student_id: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class ApplicationStep(BaseModel):
    step_number: int
    step_name: str
    data: Dict[str, Any]
    completed: bool = False
    completed_at: Optional[datetime] = None

class BursaryApplication(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_email: str
    status: str = "draft"
    current_step: int = 1
    steps: List[ApplicationStep] = []
    personal_info: Dict[str, Any] = {}
    academic_info: Dict[str, Any] = {}
    financial_info: Dict[str, Any] = {}
    documents: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    submitted_at: Optional[datetime] = None

class ApplicationCreate(BaseModel):
    personal_info: Optional[Dict[str, Any]] = {}
    academic_info: Optional[Dict[str, Any]] = {}
    financial_info: Optional[Dict[str, Any]] = {}
    documents: Optional[Dict[str, Any]] = {}

class ApplicationUpdate(BaseModel):
    current_step: Optional[int] = None
    status: Optional[str] = None
    personal_info: Optional[Dict[str, Any]] = None
    academic_info: Optional[Dict[str, Any]] = None
    financial_info: Optional[Dict[str, Any]] = None
    documents: Optional[Dict[str, Any]] = None

class Sponsor(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    organization: str
    contact_email: EmailStr
    contact_phone: Optional[str] = None
    total_contribution: float = 0.0
    active_bursaries: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BBBEERecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    organization_name: str
    bbbee_level: int
    score: float
    verification_date: datetime
    expiry_date: datetime
    status: str = "active"
    documents: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    status: str = "active"
    start_date: datetime
    end_date: Optional[datetime] = None
    budget: float = 0.0
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Task(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    status: str = "pending"
    priority: str = "medium"
    assigned_to: Optional[str] = None
    due_date: Optional[datetime] = None
    project_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Lead(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    phone: Optional[str] = None
    source: str
    status: str = "new"
    notes: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Note(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    created_by: str
    tags: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    from_user: str
    to_user: str
    subject: str
    content: str
    read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Ticket(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    status: str = "open"
    priority: str = "medium"
    created_by: str
    assigned_to: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    resolved_at: Optional[datetime] = None

class Expense(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    description: str
    amount: float
    category: str
    date: datetime
    submitted_by: str
    status: str = "pending"
    approved_by: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        password_hash=get_password_hash(user_data.password),
        student_id=user_data.student_id,
        is_verified=True
    )
    
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    user_dict['updated_at'] = user_dict['updated_at'].isoformat()
    
    insert_doc = {**user_dict}
    await db.users.insert_one(insert_doc)
    
    access_token = create_access_token(data={"sub": user.id})
    user_response = {k: v for k, v in user_dict.items() if k != 'password_hash' and k != '_id'}
    
    return TokenResponse(access_token=access_token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    if not user.get("is_active"):
        raise HTTPException(status_code=400, detail="Account is inactive")
    
    access_token = create_access_token(data={"sub": user["id"]})
    user_response = {k: v for k, v in user.items() if k != 'password_hash'}
    
    return TokenResponse(access_token=access_token, user=user_response)

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    user_response = {k: v for k, v in current_user.items() if k != 'password_hash'}
    return user_response

@api_router.get("/auth/microsoft/login")
async def microsoft_login():
    """Initiate Microsoft OAuth login"""
    msal_app = msal.ConfidentialClientApplication(
        MICROSOFT_CLIENT_ID,
        authority=MICROSOFT_AUTHORITY,
        client_credential=MICROSOFT_CLIENT_SECRET,
    )
    
    redirect_uri = f"{os.getenv('REACT_APP_BACKEND_URL')}/auth/microsoft/callback"
    
    auth_url = msal_app.get_authorization_request_url(
        MICROSOFT_SCOPE,
        redirect_uri=redirect_uri,
        state=secrets.token_urlsafe(16)
    )
    
    return {"auth_url": auth_url}

@api_router.get("/auth/microsoft/callback")
async def microsoft_callback(code: str, state: str):
    """Handle Microsoft OAuth callback"""
    try:
        msal_app = msal.ConfidentialClientApplication(
            MICROSOFT_CLIENT_ID,
            authority=MICROSOFT_AUTHORITY,
            client_credential=MICROSOFT_CLIENT_SECRET,
        )
        
        redirect_uri = f"{os.getenv('REACT_APP_BACKEND_URL')}/auth/microsoft/callback"
        
        result = msal_app.acquire_token_by_authorization_code(
            code,
            scopes=MICROSOFT_SCOPE,
            redirect_uri=redirect_uri
        )
        
        if "access_token" not in result:
            raise HTTPException(status_code=400, detail="Failed to acquire token")
        
        # Get user info from Microsoft Graph
        graph_response = requests.get(
            "https://graph.microsoft.com/v1.0/me",
            headers={"Authorization": f"Bearer {result['access_token']}"}
        )
        
        if graph_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info")
        
        user_info = graph_response.json()
        
        # Check if user exists
        user = await db.users.find_one({"email": user_info.get("mail") or user_info.get("userPrincipalName")}, {"_id": 0})
        
        if not user:
            # Create new user
            new_user = User(
                email=user_info.get("mail") or user_info.get("userPrincipalName"),
                full_name=user_info.get("displayName"),
                is_verified=True,
                roles=["student"]
            )
            user_dict = new_user.model_dump()
            user_dict['created_at'] = user_dict['created_at'].isoformat()
            user_dict['updated_at'] = user_dict['updated_at'].isoformat()
            
            insert_doc = {**user_dict}
            await db.users.insert_one(insert_doc)
            user = user_dict
        
        # Create JWT token
        access_token = create_access_token(data={"sub": user["id"]})
        
        # Redirect to frontend with token
        frontend_redirect = f"{FRONTEND_URL}/auth/callback?token={access_token}&user={user['id']}"
        return RedirectResponse(url=frontend_redirect)
        
    except Exception as e:
        logger.error(f"Microsoft auth error: {str(e)}")
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=auth_failed")

@api_router.post("/applications", response_model=BursaryApplication)
async def create_application(app_data: ApplicationCreate, current_user: dict = Depends(get_current_user)):
    application = BursaryApplication(
        user_id=current_user["id"],
        user_email=current_user["email"],
        personal_info=app_data.personal_info,
        academic_info=app_data.academic_info,
        financial_info=app_data.financial_info,
        documents=app_data.documents
    )
    
    app_dict = application.model_dump()
    app_dict['created_at'] = app_dict['created_at'].isoformat()
    app_dict['updated_at'] = app_dict['updated_at'].isoformat()
    if app_dict['submitted_at']:
        app_dict['submitted_at'] = app_dict['submitted_at'].isoformat()
    
    await db.applications.insert_one(app_dict)
    return application

@api_router.get("/applications", response_model=List[BursaryApplication])
async def get_applications(current_user: dict = Depends(get_current_user)):
    if "admin" in current_user.get("roles", []):
        applications = await db.applications.find({}, {"_id": 0}).to_list(1000)
    else:
        applications = await db.applications.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(1000)
    
    for app in applications:
        if isinstance(app.get('created_at'), str):
            app['created_at'] = datetime.fromisoformat(app['created_at'])
        if isinstance(app.get('updated_at'), str):
            app['updated_at'] = datetime.fromisoformat(app['updated_at'])
        if app.get('submitted_at') and isinstance(app['submitted_at'], str):
            app['submitted_at'] = datetime.fromisoformat(app['submitted_at'])
    
    return applications

@api_router.get("/applications/{application_id}", response_model=BursaryApplication)
async def get_application(application_id: str, current_user: dict = Depends(get_current_user)):
    application = await db.applications.find_one({"id": application_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if application["user_id"] != current_user["id"] and "admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if isinstance(application.get('created_at'), str):
        application['created_at'] = datetime.fromisoformat(application['created_at'])
    if isinstance(application.get('updated_at'), str):
        application['updated_at'] = datetime.fromisoformat(application['updated_at'])
    if application.get('submitted_at') and isinstance(application['submitted_at'], str):
        application['submitted_at'] = datetime.fromisoformat(application['submitted_at'])
    
    return application

@api_router.put("/applications/{application_id}", response_model=BursaryApplication)
async def update_application(application_id: str, update_data: ApplicationUpdate, current_user: dict = Depends(get_current_user)):
    application = await db.applications.find_one({"id": application_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if application["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    if update_data.status == "submitted":
        update_dict["submitted_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.applications.update_one({"id": application_id}, {"$set": update_dict})
    
    updated_app = await db.applications.find_one({"id": application_id}, {"_id": 0})
    if isinstance(updated_app.get('created_at'), str):
        updated_app['created_at'] = datetime.fromisoformat(updated_app['created_at'])
    if isinstance(updated_app.get('updated_at'), str):
        updated_app['updated_at'] = datetime.fromisoformat(updated_app['updated_at'])
    if updated_app.get('submitted_at') and isinstance(updated_app['submitted_at'], str):
        updated_app['submitted_at'] = datetime.fromisoformat(updated_app['submitted_at'])
    
    return updated_app

@api_router.get("/sponsors", response_model=List[Sponsor])
async def get_sponsors(current_user: dict = Depends(get_current_user)):
    sponsors = await db.sponsors.find({}, {"_id": 0}).to_list(1000)
    for sponsor in sponsors:
        if isinstance(sponsor.get('created_at'), str):
            sponsor['created_at'] = datetime.fromisoformat(sponsor['created_at'])
    return sponsors

@api_router.post("/sponsors", response_model=Sponsor)
async def create_sponsor(sponsor_data: Sponsor, current_user: dict = Depends(get_current_user)):
    sponsor_dict = sponsor_data.model_dump()
    sponsor_dict['created_at'] = sponsor_dict['created_at'].isoformat()
    await db.sponsors.insert_one(sponsor_dict)
    return sponsor_data

@api_router.get("/bbbee", response_model=List[BBBEERecord])
async def get_bbbee_records(current_user: dict = Depends(get_current_user)):
    records = await db.bbbee.find({}, {"_id": 0}).to_list(1000)
    for record in records:
        for field in ['verification_date', 'expiry_date', 'created_at']:
            if isinstance(record.get(field), str):
                record[field] = datetime.fromisoformat(record[field])
    return records

@api_router.post("/bbbee", response_model=BBBEERecord)
async def create_bbbee_record(record_data: BBBEERecord, current_user: dict = Depends(get_current_user)):
    record_dict = record_data.model_dump()
    record_dict['verification_date'] = record_dict['verification_date'].isoformat()
    record_dict['expiry_date'] = record_dict['expiry_date'].isoformat()
    record_dict['created_at'] = record_dict['created_at'].isoformat()
    await db.bbbee.insert_one(record_dict)
    return record_data

@api_router.get("/projects", response_model=List[Project])
async def get_projects(current_user: dict = Depends(get_current_user)):
    projects = await db.projects.find({}, {"_id": 0}).to_list(1000)
    for project in projects:
        for field in ['start_date', 'end_date', 'created_at']:
            if project.get(field) and isinstance(project[field], str):
                project[field] = datetime.fromisoformat(project[field])
    return projects

@api_router.post("/projects", response_model=Project)
async def create_project(project_data: Project, current_user: dict = Depends(get_current_user)):
    project_dict = project_data.model_dump()
    project_dict['start_date'] = project_dict['start_date'].isoformat()
    if project_dict['end_date']:
        project_dict['end_date'] = project_dict['end_date'].isoformat()
    project_dict['created_at'] = project_dict['created_at'].isoformat()
    await db.projects.insert_one(project_dict)
    return project_data

@api_router.get("/tasks", response_model=List[Task])
async def get_tasks(current_user: dict = Depends(get_current_user)):
    tasks = await db.tasks.find({}, {"_id": 0}).to_list(1000)
    for task in tasks:
        for field in ['due_date', 'created_at']:
            if task.get(field) and isinstance(task[field], str):
                task[field] = datetime.fromisoformat(task[field])
    return tasks

@api_router.post("/tasks", response_model=Task)
async def create_task(task_data: Task, current_user: dict = Depends(get_current_user)):
    task_dict = task_data.model_dump()
    if task_dict['due_date']:
        task_dict['due_date'] = task_dict['due_date'].isoformat()
    task_dict['created_at'] = task_dict['created_at'].isoformat()
    await db.tasks.insert_one(task_dict)
    return task_data

@api_router.get("/leads", response_model=List[Lead])
async def get_leads(current_user: dict = Depends(get_current_user)):
    leads = await db.leads.find({}, {"_id": 0}).to_list(1000)
    for lead in leads:
        if isinstance(lead.get('created_at'), str):
            lead['created_at'] = datetime.fromisoformat(lead['created_at'])
    return leads

@api_router.post("/leads", response_model=Lead)
async def create_lead(lead_data: Lead, current_user: dict = Depends(get_current_user)):
    lead_dict = lead_data.model_dump()
    lead_dict['created_at'] = lead_dict['created_at'].isoformat()
    await db.leads.insert_one(lead_dict)
    return lead_data

@api_router.get("/notes", response_model=List[Note])
async def get_notes(current_user: dict = Depends(get_current_user)):
    notes = await db.notes.find({"created_by": current_user["id"]}, {"_id": 0}).to_list(1000)
    for note in notes:
        for field in ['created_at', 'updated_at']:
            if isinstance(note.get(field), str):
                note[field] = datetime.fromisoformat(note[field])
    return notes

@api_router.post("/notes", response_model=Note)
async def create_note(note_data: Note, current_user: dict = Depends(get_current_user)):
    note_dict = note_data.model_dump()
    note_dict['created_by'] = current_user["id"]
    note_dict['created_at'] = note_dict['created_at'].isoformat()
    note_dict['updated_at'] = note_dict['updated_at'].isoformat()
    await db.notes.insert_one(note_dict)
    return note_data

@api_router.get("/messages", response_model=List[Message])
async def get_messages(current_user: dict = Depends(get_current_user)):
    messages = await db.messages.find(
        {"$or": [{"from_user": current_user["id"]}, {"to_user": current_user["id"]}]},
        {"_id": 0}
    ).to_list(1000)
    for message in messages:
        if isinstance(message.get('created_at'), str):
            message['created_at'] = datetime.fromisoformat(message['created_at'])
    return messages

@api_router.post("/messages", response_model=Message)
async def create_message(message_data: Message, current_user: dict = Depends(get_current_user)):
    message_dict = message_data.model_dump()
    message_dict['from_user'] = current_user["id"]
    message_dict['created_at'] = message_dict['created_at'].isoformat()
    await db.messages.insert_one(message_dict)
    return message_data

@api_router.get("/tickets", response_model=List[Ticket])
async def get_tickets(current_user: dict = Depends(get_current_user)):
    if "admin" in current_user.get("roles", []):
        tickets = await db.tickets.find({}, {"_id": 0}).to_list(1000)
    else:
        tickets = await db.tickets.find({"created_by": current_user["id"]}, {"_id": 0}).to_list(1000)
    
    for ticket in tickets:
        for field in ['created_at', 'resolved_at']:
            if ticket.get(field) and isinstance(ticket[field], str):
                ticket[field] = datetime.fromisoformat(ticket[field])
    return tickets

@api_router.post("/tickets", response_model=Ticket)
async def create_ticket(ticket_data: Ticket, current_user: dict = Depends(get_current_user)):
    ticket_dict = ticket_data.model_dump()
    ticket_dict['created_by'] = current_user["id"]
    ticket_dict['created_at'] = ticket_dict['created_at'].isoformat()
    if ticket_dict['resolved_at']:
        ticket_dict['resolved_at'] = ticket_dict['resolved_at'].isoformat()
    await db.tickets.insert_one(ticket_dict)
    return ticket_data

@api_router.get("/expenses", response_model=List[Expense])
async def get_expenses(current_user: dict = Depends(get_current_user)):
    if "admin" in current_user.get("roles", []):
        expenses = await db.expenses.find({}, {"_id": 0}).to_list(1000)
    else:
        expenses = await db.expenses.find({"submitted_by": current_user["id"]}, {"_id": 0}).to_list(1000)
    
    for expense in expenses:
        for field in ['date', 'created_at']:
            if isinstance(expense.get(field), str):
                expense[field] = datetime.fromisoformat(expense[field])
    return expenses

@api_router.post("/expenses", response_model=Expense)
async def create_expense(expense_data: Expense, current_user: dict = Depends(get_current_user)):
    expense_dict = expense_data.model_dump()
    expense_dict['submitted_by'] = current_user["id"]
    expense_dict['date'] = expense_dict['date'].isoformat()
    expense_dict['created_at'] = expense_dict['created_at'].isoformat()
    await db.expenses.insert_one(expense_dict)
    return expense_data

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    if "admin" in current_user.get("roles", []):
        total_applications = await db.applications.count_documents({})
        pending_applications = await db.applications.count_documents({"status": "pending"})
        approved_applications = await db.applications.count_documents({"status": "approved"})
        total_sponsors = await db.sponsors.count_documents({})
        active_projects = await db.projects.count_documents({"status": "active"})
        open_tickets = await db.tickets.count_documents({"status": "open"})
    else:
        total_applications = await db.applications.count_documents({"user_id": current_user["id"]})
        pending_applications = await db.applications.count_documents({"user_id": current_user["id"], "status": "pending"})
        approved_applications = await db.applications.count_documents({"user_id": current_user["id"], "status": "approved"})
        total_sponsors = await db.sponsors.count_documents({})
        active_projects = 0
        open_tickets = await db.tickets.count_documents({"created_by": current_user["id"], "status": "open"})
    
    return {
        "total_applications": total_applications,
        "pending_applications": pending_applications,
        "approved_applications": approved_applications,
        "total_sponsors": total_sponsors,
        "active_projects": active_projects,
        "open_tickets": open_tickets
    }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()