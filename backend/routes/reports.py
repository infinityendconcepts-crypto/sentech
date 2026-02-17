from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import io
import json

router = APIRouter(prefix="/reports", tags=["Reports"])

db = None

def set_db(database):
    global db
    db = database

async def get_current_user(credentials):
    pass

@router.get("/dashboard")
async def get_dashboard_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get comprehensive dashboard statistics"""
    # Applications stats
    total_applications = await db.applications.count_documents({})
    pending_applications = await db.applications.count_documents({"status": "pending"})
    approved_applications = await db.applications.count_documents({"status": "approved"})
    rejected_applications = await db.applications.count_documents({"status": "rejected"})
    
    # Sponsors stats
    total_sponsors = await db.sponsors.count_documents({})
    active_sponsors = await db.sponsors.count_documents({"status": "active"})
    
    # Projects stats
    total_projects = await db.projects.count_documents({})
    active_projects = await db.projects.count_documents({"status": "active"})
    
    # Tasks stats
    total_tasks = await db.tasks.count_documents({})
    completed_tasks = await db.tasks.count_documents({"status": "completed"})
    in_progress_tasks = await db.tasks.count_documents({"status": "in_progress"})
    
    # Expenses stats
    expenses = await db.expenses.find({}, {"_id": 0, "amount": 1, "status": 1}).to_list(10000)
    total_expenses = sum(e.get("amount", 0) for e in expenses)
    approved_expenses = sum(e.get("amount", 0) for e in expenses if e.get("status") == "approved")
    
    # Tickets stats
    open_tickets = await db.tickets.count_documents({"status": "open"})
    
    # Leads stats
    total_leads = await db.leads.count_documents({})
    won_leads = await db.leads.count_documents({"status": "won"})
    
    return {
        "applications": {
            "total": total_applications,
            "pending": pending_applications,
            "approved": approved_applications,
            "rejected": rejected_applications
        },
        "sponsors": {
            "total": total_sponsors,
            "active": active_sponsors
        },
        "projects": {
            "total": total_projects,
            "active": active_projects
        },
        "tasks": {
            "total": total_tasks,
            "completed": completed_tasks,
            "in_progress": in_progress_tasks,
            "completion_rate": round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 1)
        },
        "expenses": {
            "total": total_expenses,
            "approved": approved_expenses
        },
        "tickets": {
            "open": open_tickets
        },
        "leads": {
            "total": total_leads,
            "won": won_leads,
            "conversion_rate": round((won_leads / total_leads * 100) if total_leads > 0 else 0, 1)
        }
    }

@router.get("/applications")
async def get_applications_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if status:
        query["status"] = status
    
    applications = await db.applications.find(query, {"_id": 0}).to_list(10000)
    
    # Group by status
    by_status = {}
    for app in applications:
        s = app.get("status", "unknown")
        by_status[s] = by_status.get(s, 0) + 1
    
    # Group by month
    by_month = {}
    for app in applications:
        created = app.get("created_at", "")
        if created:
            if isinstance(created, str):
                month = created[:7]  # YYYY-MM
            else:
                month = created.strftime("%Y-%m")
            by_month[month] = by_month.get(month, 0) + 1
    
    return {
        "total": len(applications),
        "by_status": by_status,
        "by_month": dict(sorted(by_month.items())),
        "data": applications
    }

@router.get("/expenses")
async def get_expenses_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    category: Optional[str] = None,
    project_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if category:
        query["category"] = category
    if project_id:
        query["project_id"] = project_id
    
    expenses = await db.expenses.find(query, {"_id": 0}).to_list(10000)
    
    total = sum(e.get("amount", 0) for e in expenses)
    
    # Group by category
    by_category = {}
    for e in expenses:
        cat = e.get("category", "other")
        by_category[cat] = by_category.get(cat, 0) + e.get("amount", 0)
    
    # Group by project
    by_project = {}
    for e in expenses:
        proj = e.get("project_id")
        if proj:
            by_project[proj] = by_project.get(proj, 0) + e.get("amount", 0)
    
    # Group by status
    by_status = {}
    for e in expenses:
        s = e.get("status", "unknown")
        by_status[s] = by_status.get(s, 0) + e.get("amount", 0)
    
    # Group by month
    by_month = {}
    for e in expenses:
        date = e.get("date", "")
        if date:
            if isinstance(date, str):
                month = date[:7]
            else:
                month = date.strftime("%Y-%m")
            by_month[month] = by_month.get(month, 0) + e.get("amount", 0)
    
    return {
        "total": total,
        "count": len(expenses),
        "by_category": by_category,
        "by_project": by_project,
        "by_status": by_status,
        "by_month": dict(sorted(by_month.items())),
        "data": expenses
    }

@router.get("/tasks")
async def get_tasks_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    project_id: Optional[str] = None,
    assigned_to: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if project_id:
        query["project_id"] = project_id
    if assigned_to:
        query["assigned_to"] = assigned_to
    
    tasks = await db.tasks.find(query, {"_id": 0}).to_list(10000)
    
    # Group by status
    by_status = {}
    for t in tasks:
        s = t.get("status", "unknown")
        by_status[s] = by_status.get(s, 0) + 1
    
    # Group by priority
    by_priority = {}
    for t in tasks:
        p = t.get("priority", "medium")
        by_priority[p] = by_priority.get(p, 0) + 1
    
    # Group by assignee
    by_assignee = {}
    for t in tasks:
        a = t.get("assigned_to") or "unassigned"
        by_assignee[a] = by_assignee.get(a, 0) + 1
    
    completed = len([t for t in tasks if t.get("status") == "completed"])
    
    return {
        "total": len(tasks),
        "completed": completed,
        "completion_rate": round((completed / len(tasks) * 100) if tasks else 0, 1),
        "by_status": by_status,
        "by_priority": by_priority,
        "by_assignee": by_assignee,
        "data": tasks
    }

@router.get("/export/{report_type}")
async def export_report(
    report_type: str,
    format: str = "json",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Export report data in JSON or CSV format"""
    
    # Get the data based on report type
    if report_type == "applications":
        data = await db.applications.find({}, {"_id": 0}).to_list(10000)
    elif report_type == "expenses":
        data = await db.expenses.find({}, {"_id": 0}).to_list(10000)
    elif report_type == "tasks":
        data = await db.tasks.find({}, {"_id": 0}).to_list(10000)
    elif report_type == "projects":
        data = await db.projects.find({}, {"_id": 0}).to_list(10000)
    elif report_type == "sponsors":
        data = await db.sponsors.find({}, {"_id": 0}).to_list(10000)
    elif report_type == "leads":
        data = await db.leads.find({}, {"_id": 0}).to_list(10000)
    elif report_type == "tickets":
        data = await db.tickets.find({}, {"_id": 0}).to_list(10000)
    else:
        raise HTTPException(status_code=400, detail="Invalid report type")
    
    # Convert datetime objects to strings
    for item in data:
        for key, value in item.items():
            if isinstance(value, datetime):
                item[key] = value.isoformat()
    
    if format == "csv":
        if not data:
            return StreamingResponse(
                io.StringIO("No data"),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename={report_type}_report.csv"}
            )
        
        # Create CSV
        import csv
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
        
        return StreamingResponse(
            io.StringIO(output.getvalue()),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={report_type}_report.csv"}
        )
    else:
        # JSON format
        return StreamingResponse(
            io.StringIO(json.dumps(data, indent=2, default=str)),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename={report_type}_report.json"}
        )
