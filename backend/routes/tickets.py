from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime, timezone
from models.ticket import Ticket, TicketCreate, TicketUpdate, TicketComment, TicketCommentCreate

router = APIRouter(prefix="/tickets", tags=["Tickets"])

db = None

def set_db(database):
    global db
    db = database

async def get_current_user(credentials):
    pass

@router.get("", response_model=List[Ticket])
async def get_tickets(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    assigned_to: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    # Admins/support see all, others see their own
    if "admin" in current_user.get("roles", []) or "support" in current_user.get("roles", []):
        query = {}
    else:
        query = {"created_by": current_user["id"]}
    
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    if category:
        query["category"] = category
    if assigned_to:
        query["assigned_to"] = assigned_to
    
    tickets = await db.tickets.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for ticket in tickets:
        for field in ['created_at', 'updated_at', 'resolved_at', 'closed_at', 'first_response_at', 'sla_due_at']:
            if ticket.get(field) and isinstance(ticket[field], str):
                ticket[field] = datetime.fromisoformat(ticket[field])
    return tickets

@router.get("/stats")
async def get_ticket_stats(current_user: dict = Depends(get_current_user)):
    if "admin" not in current_user.get("roles", []) and "support" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Access denied")
    
    total = await db.tickets.count_documents({})
    open_count = await db.tickets.count_documents({"status": "open"})
    in_progress = await db.tickets.count_documents({"status": "in_progress"})
    resolved = await db.tickets.count_documents({"status": "resolved"})
    
    # By priority
    high_priority = await db.tickets.count_documents({"priority": "high", "status": {"$ne": "closed"}})
    urgent = await db.tickets.count_documents({"priority": "urgent", "status": {"$ne": "closed"}})
    
    # By category
    categories = {}
    pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}}
    ]
    async for doc in db.tickets.aggregate(pipeline):
        categories[doc["_id"]] = doc["count"]
    
    return {
        "total": total,
        "open": open_count,
        "in_progress": in_progress,
        "resolved": resolved,
        "high_priority": high_priority,
        "urgent": urgent,
        "by_category": categories
    }

@router.get("/{ticket_id}")
async def get_ticket(ticket_id: str, current_user: dict = Depends(get_current_user)):
    ticket = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Check access
    if ticket["created_by"] != current_user["id"]:
        if "admin" not in current_user.get("roles", []) and "support" not in current_user.get("roles", []):
            raise HTTPException(status_code=403, detail="Access denied")
    
    return ticket

@router.post("", response_model=Ticket)
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

@router.put("/{ticket_id}", response_model=Ticket)
async def update_ticket(ticket_id: str, update_data: TicketUpdate, current_user: dict = Depends(get_current_user)):
    ticket = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Only creator or admin/support can update
    if ticket["created_by"] != current_user["id"]:
        if "admin" not in current_user.get("roles", []) and "support" not in current_user.get("roles", []):
            raise HTTPException(status_code=403, detail="Access denied")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Set resolved_at if status changed to resolved
    if update_data.status == "resolved" and ticket.get("status") != "resolved":
        update_dict["resolved_at"] = datetime.now(timezone.utc).isoformat()
    
    # Set closed_at if status changed to closed
    if update_data.status == "closed" and ticket.get("status") != "closed":
        update_dict["closed_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.tickets.update_one({"id": ticket_id}, {"$set": update_dict})
    updated_ticket = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    return updated_ticket

@router.delete("/{ticket_id}")
async def delete_ticket(ticket_id: str, current_user: dict = Depends(get_current_user)):
    ticket = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    if ticket["created_by"] != current_user["id"] and "admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.tickets.delete_one({"id": ticket_id})
    await db.ticket_comments.delete_many({"ticket_id": ticket_id})
    return {"message": "Ticket deleted successfully"}

# Comments
@router.get("/{ticket_id}/comments")
async def get_ticket_comments(ticket_id: str, current_user: dict = Depends(get_current_user)):
    ticket = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Check access
    is_admin_or_support = "admin" in current_user.get("roles", []) or "support" in current_user.get("roles", [])
    if ticket["created_by"] != current_user["id"] and not is_admin_or_support:
        raise HTTPException(status_code=403, detail="Access denied")
    
    query = {"ticket_id": ticket_id}
    # Non-admin users shouldn't see internal comments
    if not is_admin_or_support:
        query["is_internal"] = False
    
    comments = await db.ticket_comments.find(query, {"_id": 0}).sort("created_at", 1).to_list(1000)
    
    # Enrich with user info
    for comment in comments:
        user = await db.users.find_one({"id": comment["user_id"]}, {"_id": 0, "full_name": 1, "email": 1})
        comment["user"] = user
    
    return comments

@router.post("/{ticket_id}/comments")
async def add_ticket_comment(ticket_id: str, comment_data: TicketCommentCreate, current_user: dict = Depends(get_current_user)):
    ticket = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    is_admin_or_support = "admin" in current_user.get("roles", []) or "support" in current_user.get("roles", [])
    if ticket["created_by"] != current_user["id"] and not is_admin_or_support:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Only admin/support can add internal comments
    if comment_data.is_internal and not is_admin_or_support:
        raise HTTPException(status_code=403, detail="Only support staff can add internal comments")
    
    comment = TicketComment(
        ticket_id=ticket_id,
        user_id=current_user["id"],
        content=comment_data.content,
        is_internal=comment_data.is_internal,
        attachments=comment_data.attachments
    )
    comment_dict = comment.model_dump()
    comment_dict['created_at'] = comment_dict['created_at'].isoformat()
    comment_dict['updated_at'] = comment_dict['updated_at'].isoformat()
    
    await db.ticket_comments.insert_one({**comment_dict})
    
    # Set first response time if this is first response from support
    if is_admin_or_support and not ticket.get("first_response_at"):
        await db.tickets.update_one(
            {"id": ticket_id},
            {"$set": {"first_response_at": comment_dict['created_at']}}
        )
    
    # Update ticket
    await db.tickets.update_one(
        {"id": ticket_id},
        {"$set": {"updated_at": comment_dict['created_at']}}
    )
    
    return comment
