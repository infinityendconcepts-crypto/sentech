"""Tickets Router - Tickets CRUD, Comments"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, List
from datetime import datetime, timezone

from routers import (
    db, get_current_user, generate_uuid, is_admin_user,
)

router = APIRouter(prefix="/api", tags=["tickets"])


def current_time():
    return datetime.now(timezone.utc)


# ── Models ──

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


def _is_admin_or_support(user: dict) -> bool:
    roles = user.get("roles", [])
    return "admin" in roles or "super_admin" in roles or "support" in roles


# ── Routes ──

@router.get("/tickets")
async def get_tickets(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    if _is_admin_or_support(current_user):
        query = {}
    else:
        query = {"created_by": current_user["id"]}

    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    if category:
        query["category"] = category

    tickets = await db.tickets.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return tickets


@router.get("/tickets/stats")
async def get_ticket_stats(current_user: dict = Depends(get_current_user)):
    total = await db.tickets.count_documents({})
    open_count = await db.tickets.count_documents({"status": "open"})
    in_progress = await db.tickets.count_documents({"status": "in_progress"})
    resolved = await db.tickets.count_documents({"status": "resolved"})

    return {
        "total": total,
        "open": open_count,
        "in_progress": in_progress,
        "resolved": resolved
    }


@router.get("/tickets/{ticket_id}")
async def get_ticket(ticket_id: str, current_user: dict = Depends(get_current_user)):
    ticket = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if ticket["created_by"] != current_user["id"]:
        if not _is_admin_or_support(current_user):
            raise HTTPException(status_code=403, detail="Access denied")

    return ticket


@router.post("/tickets")
async def create_ticket(ticket_data: TicketCreate, current_user: dict = Depends(get_current_user)):
    ticket = Ticket(
        **ticket_data.model_dump(),
        created_by=current_user["id"]
    )
    ticket_dict = ticket.model_dump()
    ticket_dict['created_at'] = ticket_dict['created_at'].isoformat()
    ticket_dict['updated_at'] = ticket_dict['updated_at'].isoformat()

    await db.tickets.insert_one({**ticket_dict})
    return ticket


@router.put("/tickets/{ticket_id}")
async def update_ticket(ticket_id: str, update_data: TicketUpdate, current_user: dict = Depends(get_current_user)):
    ticket = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if ticket["created_by"] != current_user["id"]:
        if not _is_admin_or_support(current_user):
            raise HTTPException(status_code=403, detail="Access denied")

    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()

    if update_data.status == "resolved" and ticket.get("status") != "resolved":
        update_dict["resolved_at"] = datetime.now(timezone.utc).isoformat()

    if update_data.status == "closed" and ticket.get("status") != "closed":
        update_dict["closed_at"] = datetime.now(timezone.utc).isoformat()

    await db.tickets.update_one({"id": ticket_id}, {"$set": update_dict})

    if update_data.status and update_data.status != ticket.get("status") and ticket["created_by"] != current_user["id"]:
        notif = {
            "id": generate_uuid(),
            "user_id": ticket["created_by"],
            "type": "ticket_response",
            "title": "Ticket Status Updated",
            "message": f"Your ticket '{ticket.get('title', '')}' has been updated to: {update_data.status}",
            "reference_id": ticket_id,
            "reference_type": "ticket",
            "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.notifications.insert_one({**notif})

    return {"message": "Ticket updated successfully"}


@router.delete("/tickets/{ticket_id}")
async def delete_ticket(ticket_id: str, current_user: dict = Depends(get_current_user)):
    ticket = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if ticket["created_by"] != current_user["id"] and not _is_admin_or_support(current_user):
        raise HTTPException(status_code=403, detail="Access denied")

    await db.tickets.delete_one({"id": ticket_id})
    await db.ticket_comments.delete_many({"ticket_id": ticket_id})
    return {"message": "Ticket deleted successfully"}


@router.get("/tickets/{ticket_id}/comments")
async def get_ticket_comments(ticket_id: str, current_user: dict = Depends(get_current_user)):
    ticket = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    admin_or_support = _is_admin_or_support(current_user)
    if ticket["created_by"] != current_user["id"] and not admin_or_support:
        raise HTTPException(status_code=403, detail="Access denied")

    query = {"ticket_id": ticket_id}
    if not admin_or_support:
        query["is_internal"] = False

    comments = await db.ticket_comments.find(query, {"_id": 0}).sort("created_at", 1).to_list(1000)

    for comment in comments:
        user = await db.users.find_one({"id": comment["user_id"]}, {"_id": 0, "full_name": 1, "email": 1})
        comment["user"] = user

    return comments


@router.post("/tickets/{ticket_id}/comments")
async def add_ticket_comment(ticket_id: str, comment_data: TicketCommentCreate, current_user: dict = Depends(get_current_user)):
    ticket = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    comment = TicketComment(
        ticket_id=ticket_id,
        user_id=current_user["id"],
        content=comment_data.content,
        is_internal=comment_data.is_internal
    )
    comment_dict = comment.model_dump()
    comment_dict['created_at'] = comment_dict['created_at'].isoformat()
    comment_dict['updated_at'] = comment_dict['updated_at'].isoformat()

    await db.ticket_comments.insert_one({**comment_dict})

    await db.tickets.update_one(
        {"id": ticket_id},
        {"$set": {"updated_at": comment_dict['created_at']}}
    )

    if not comment_data.is_internal and ticket["created_by"] != current_user["id"]:
        notif = {
            "id": generate_uuid(),
            "user_id": ticket["created_by"],
            "type": "ticket_response",
            "title": "New Response on Your Ticket",
            "message": f"New comment on '{ticket.get('title', '')}': {comment_data.content[:80]}",
            "reference_id": ticket_id,
            "reference_type": "ticket",
            "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.notifications.insert_one({**notif})

    return comment
