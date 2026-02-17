from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from .base import BaseDBModel, generate_uuid, current_time

class SystemSettings(BaseDBModel):
    id: str = "system_settings"  # Singleton
    
    # SMTP Settings
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_use_tls: bool = True
    smtp_from_email: Optional[str] = None
    smtp_from_name: str = "Sentech Bursary System"
    
    # Zoom Settings
    zoom_api_key: Optional[str] = None
    zoom_api_secret: Optional[str] = None
    zoom_account_id: Optional[str] = None
    
    # Microsoft Teams Settings
    teams_tenant_id: Optional[str] = None
    teams_client_id: Optional[str] = None
    teams_client_secret: Optional[str] = None
    
    # General Settings
    company_name: str = "Sentech"
    company_logo_url: Optional[str] = None
    primary_color: str = "#0056B3"
    secondary_color: str = "#6B7280"
    timezone: str = "Africa/Johannesburg"
    date_format: str = "DD/MM/YYYY"
    currency: str = "ZAR"
    
    # Feature Toggles
    features_enabled: Dict[str, bool] = {
        "applications": True,
        "sponsors": True,
        "bbbee": True,
        "projects": True,
        "tasks": True,
        "leads": True,
        "prospects": True,
        "meetings": True,
        "notes": True,
        "messages": True,
        "team": True,
        "tickets": True,
        "expenses": True,
        "reports": True,
        "files": True
    }
    
    # Page Customization
    page_settings: Dict[str, Dict[str, Any]] = {}

class SystemSettingsUpdate(BaseModel):
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
    company_name: Optional[str] = None
    company_logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    timezone: Optional[str] = None
    date_format: Optional[str] = None
    currency: Optional[str] = None
    features_enabled: Optional[Dict[str, bool]] = None
    page_settings: Optional[Dict[str, Dict[str, Any]]] = None

class Role(BaseDBModel):
    name: str
    description: Optional[str] = None
    permissions: Dict[str, List[str]] = {}  # {module: [create, read, update, delete]}
    is_system: bool = False  # System roles cannot be deleted
    is_active: bool = True

class RoleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    permissions: Dict[str, List[str]] = {}

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[Dict[str, List[str]]] = None
    is_active: Optional[bool] = None

class FAQ(BaseDBModel):
    question: str
    answer: str
    category: str = "general"
    order: int = 0
    is_published: bool = True
    helpful_count: int = 0
    not_helpful_count: int = 0

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
