from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from .base import BaseDBModel, generate_uuid, current_time

class Expense(BaseDBModel):
    title: str
    description: Optional[str] = None
    amount: float
    currency: str = "ZAR"
    category: str  # travel, equipment, software, office, training, other
    date: datetime
    submitted_by: str
    user_id: Optional[str] = None  # If expense is for a specific user
    project_id: Optional[str] = None
    sponsor_id: Optional[str] = None
    status: str = "pending"  # pending, approved, rejected, reimbursed
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    receipt_url: Optional[str] = None
    receipts: List[Dict[str, str]] = []  # [{name, url}]
    notes: Optional[str] = None
    payment_method: Optional[str] = None
    vendor: Optional[str] = None
    is_recurring: bool = False
    recurrence_details: Optional[Dict[str, Any]] = None

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
    payment_method: Optional[str] = None
    vendor: Optional[str] = None

class ExpenseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    date: Optional[datetime] = None
    user_id: Optional[str] = None
    project_id: Optional[str] = None
    sponsor_id: Optional[str] = None
    status: Optional[str] = None
    approved_by: Optional[str] = None
    receipt_url: Optional[str] = None
    notes: Optional[str] = None
