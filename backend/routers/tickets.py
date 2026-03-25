"""Tickets Router - Tickets CRUD, Comments, Auto-routing & Escalation"""
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
    assigned_to_name: Optional[str] = None
    routed_to: Optional[str] = None
    escalated_from: Optional[str] = None
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


# ── Auto-routing helpers ──

async def _find_ticket_assignee(creator_user: dict, category: str):
    """Find who the ticket should be assigned to based on category.
    - training_application / bursary_application → subgroup head or division head
    - hr_query / technical_support → None (admin pool)
    """
    if category in ("training_application", "bursary_application"):
        division = creator_user.get("division", "")
        department = creator_user.get("department") or creator_user.get("subgroup", "")

        # Check subgroup head first
        if department and division:
            sg = await db.subgroups.find_one(
                {"division_name": division, "name": department}, {"_id": 0}
            )
            if sg and sg.get("leader_id"):
                return sg["leader_id"]

        # Fall back to division head
        if division:
            config = await db.division_group_configs.find_one(
                {"division_name": division}, {"_id": 0}
            )
            if config and config.get("leader_id"):
                return config["leader_id"]

    return None


async def _notify_ticket_recipients(ticket_dict: dict, creator: dict, category: str):
    """Send notifications to the right people based on ticket category."""
    now = datetime.now(timezone.utc).isoformat()
    title_short = ticket_dict.get("title", "")[:60]
    creator_name = creator.get("full_name", "Unknown")

    notifs = []

    if category in ("training_application", "bursary_application"):
        # Notify the assigned head
        assigned = ticket_dict.get("assigned_to")
        if assigned and assigned != creator["id"]:
            label = "Training Application" if category == "training_application" else "Bursary Application"
            notifs.append({
                "id": generate_uuid(),
                "user_id": assigned,
                "type": "ticket_assigned",
                "title": f"New {label} Ticket",
                "message": f"{creator_name} submitted: {title_short}",
                "reference_id": ticket_dict["id"],
                "reference_type": "ticket",
                "is_read": False,
                "created_at": now,
            })

    elif category == "hr_query":
        # Notify all admins
        admins = await db.users.find(
            {"roles": {"$in": ["admin", "super_admin"]}, "is_active": True},
            {"_id": 0, "id": 1}
        ).to_list(200)
        for adm in admins:
            if adm["id"] != creator["id"]:
                notifs.append({
                    "id": generate_uuid(),
                    "user_id": adm["id"],
                    "type": "ticket_assigned",
                    "title": "New HR Query Ticket",
                    "message": f"{creator_name} submitted: {title_short}",
                    "reference_id": ticket_dict["id"],
                    "reference_type": "ticket",
                    "is_read": False,
                    "created_at": now,
                })

    elif category == "technical_support":
        # Notify all super_admins and admins
        admins = await db.users.find(
            {"roles": {"$in": ["admin", "super_admin"]}, "is_active": True},
            {"_id": 0, "id": 1}
        ).to_list(200)
        for adm in admins:
            if adm["id"] != creator["id"]:
                notifs.append({
                    "id": generate_uuid(),
                    "user_id": adm["id"],
                    "type": "ticket_assigned",
                    "title": "New Technical Support Ticket",
                    "message": f"{creator_name} submitted: {title_short}",
                    "reference_id": ticket_dict["id"],
                    "reference_type": "ticket",
                    "is_read": False,
                    "created_at": now,
                })

    if notifs:
        await db.notifications.insert_many([{**n} for n in notifs])


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
        # Non-admins see tickets they created OR tickets assigned to them
        query = {"$or": [
            {"created_by": current_user["id"]},
            {"assigned_to": current_user["id"]},
        ]}

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
    if _is_admin_or_support(current_user):
        base = {}
    else:
        base = {"$or": [
            {"created_by": current_user["id"]},
            {"assigned_to": current_user["id"]},
        ]}

    total = await db.tickets.count_documents(base)

    if _is_admin_or_support(current_user):
        open_count = await db.tickets.count_documents({"status": "open"})
        in_progress = await db.tickets.count_documents({"status": "in_progress"})
        resolved = await db.tickets.count_documents({"status": "resolved"})
    else:
        open_count = await db.tickets.count_documents({"$and": [base, {"status": "open"}]})
        in_progress = await db.tickets.count_documents({"$and": [base, {"status": "in_progress"}]})
        resolved = await db.tickets.count_documents({"$and": [base, {"status": "resolved"}]})

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

    is_owner = ticket["created_by"] == current_user["id"]
    is_assigned = ticket.get("assigned_to") == current_user["id"]
    if not is_owner and not is_assigned and not _is_admin_or_support(current_user):
        raise HTTPException(status_code=403, detail="Access denied")

    return ticket


@router.post("/tickets")
async def create_ticket(ticket_data: TicketCreate, current_user: dict = Depends(get_current_user)):
    # Auto-assign based on category
    assigned_to = await _find_ticket_assignee(current_user, ticket_data.category)
    assigned_name = None
    if assigned_to:
        head_user = await db.users.find_one({"id": assigned_to}, {"_id": 0, "full_name": 1})
        assigned_name = head_user.get("full_name") if head_user else None

    # Determine routing label
    routed_to = None
    if ticket_data.category == "technical_support":
        routed_to = "admins"
    elif ticket_data.category == "hr_query":
        routed_to = "admins"
    elif assigned_to:
        routed_to = "head"

    ticket = Ticket(
        **ticket_data.model_dump(),
        created_by=current_user["id"],
        assigned_to=assigned_to,
        assigned_to_name=assigned_name,
        routed_to=routed_to,
    )
    ticket_dict = ticket.model_dump()
    ticket_dict['created_at'] = ticket_dict['created_at'].isoformat()
    ticket_dict['updated_at'] = ticket_dict['updated_at'].isoformat()

    await db.tickets.insert_one({**ticket_dict})

    # Send notifications
    await _notify_ticket_recipients(ticket_dict, current_user, ticket_data.category)

    return ticket


@router.put("/tickets/{ticket_id}")
async def update_ticket(ticket_id: str, update_data: TicketUpdate, current_user: dict = Depends(get_current_user)):
    ticket = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    is_owner = ticket["created_by"] == current_user["id"]
    is_assigned = ticket.get("assigned_to") == current_user["id"]
    if not is_owner and not is_assigned and not _is_admin_or_support(current_user):
        raise HTTPException(status_code=403, detail="Access denied")

    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()

    # ── Escalation: category changed → re-route ──
    old_category = ticket.get("category", "")
    new_category = update_data.category
    if new_category and new_category != old_category:
        update_dict["escalated_from"] = old_category

        # Find creator for re-routing
        creator = await db.users.find_one({"id": ticket["created_by"]}, {"_id": 0})
        if creator:
            new_assigned = await _find_ticket_assignee(creator, new_category)
        else:
            new_assigned = None

        if new_category in ("technical_support", "hr_query"):
            update_dict["assigned_to"] = None
            update_dict["assigned_to_name"] = None
            update_dict["routed_to"] = "admins"
        elif new_assigned:
            head_user = await db.users.find_one({"id": new_assigned}, {"_id": 0, "full_name": 1})
            update_dict["assigned_to"] = new_assigned
            update_dict["assigned_to_name"] = head_user.get("full_name") if head_user else None
            update_dict["routed_to"] = "head"
        else:
            update_dict["assigned_to"] = None
            update_dict["assigned_to_name"] = None
            update_dict["routed_to"] = None

        # Add system comment about escalation
        label_map = {
            "training_application": "Training Application",
            "bursary_application": "Bursary Application",
            "hr_query": "HR Query",
            "technical_support": "Technical Support",
        }
        old_label = label_map.get(old_category, old_category)
        new_label = label_map.get(new_category, new_category)
        escalation_comment = {
            "id": generate_uuid(),
            "ticket_id": ticket_id,
            "user_id": current_user["id"],
            "content": f"Escalated ticket from \"{old_label}\" to \"{new_label}\"",
            "is_internal": False,
            "attachments": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.ticket_comments.insert_one({**escalation_comment})

        # Notify new recipients
        updated_ticket = {**ticket, **update_dict}
        escalator = current_user
        await _notify_ticket_recipients(updated_ticket, escalator, new_category)

    if update_data.status == "resolved" and ticket.get("status") != "resolved":
        update_dict["resolved_at"] = datetime.now(timezone.utc).isoformat()

    if update_data.status == "closed" and ticket.get("status") != "closed":
        update_dict["closed_at"] = datetime.now(timezone.utc).isoformat()

    await db.tickets.update_one({"id": ticket_id}, {"$set": update_dict})

    # Notify ticket creator about status change
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
    is_assigned = ticket.get("assigned_to") == current_user["id"]
    if ticket["created_by"] != current_user["id"] and not admin_or_support and not is_assigned:
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
