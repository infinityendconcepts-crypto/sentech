"""Reports and Dashboard Stats Router"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from typing import Optional
from datetime import datetime, timezone
import io

from routers import db, get_current_user, generate_uuid

router = APIRouter(prefix="/api", tags=["reports"])


@router.get("/reports/dashboard")
async def get_dashboard_charts(current_user: dict = Depends(get_current_user)):
    total_users = await db.users.count_documents({})
    active_users = await db.users.count_documents({"is_active": True})
    inactive_users = total_users - active_users

    division_pipeline = [
        {"$group": {"_id": "$division", "count": {"$sum": 1}}},
        {"$match": {"_id": {"$ne": None}}},
    ]
    division_data = []
    async for doc in db.users.aggregate(division_pipeline):
        if doc["_id"]:
            division_data.append({"name": doc["_id"], "value": doc["count"]})

    total_apps = await db.applications.count_documents({})
    pending_apps = await db.applications.count_documents({"status": "pending"})
    approved_apps = await db.applications.count_documents({"status": "approved"})

    total_tasks = await db.tasks.count_documents({})
    completed_tasks = await db.tasks.count_documents({"status": "done"})

    open_tickets = await db.tickets.count_documents({"status": "open"})
    closed_tickets = await db.tickets.count_documents({"status": "closed"})

    # Expense breakdown from application additional_expenses
    expense_types = {"Flights": 0, "Accommodation": 0, "Car Hire/Shuttle": 0, "Catering": 0}
    total_app_expenses = 0
    applicant_expenses = []

    for coll_name in ["applications", "training_applications"]:
        coll = db[coll_name]
        cursor = coll.find({"additional_expenses": {"$exists": True}}, {"_id": 0})
        async for app in cursor:
            exp = app.get("additional_expenses", {})
            flights = exp.get("flights", 0) or 0
            accommodation = exp.get("accommodation", 0) or 0
            car = exp.get("car_hire_or_shuttle", 0) or 0
            catering = exp.get("catering", 0) or 0
            total = flights + accommodation + car + catering
            if total > 0:
                expense_types["Flights"] += flights
                expense_types["Accommodation"] += accommodation
                expense_types["Car Hire/Shuttle"] += car
                expense_types["Catering"] += catering
                total_app_expenses += total
                applicant_expenses.append({
                    "applicant": app.get("applicant_name") or app.get("full_name", "Unknown"),
                    "type": coll_name.replace("_applications", "").replace("applications", "bursary"),
                    "total": total,
                })

    return {
        "users": {
            "total": total_users,
            "active": active_users,
            "inactive": inactive_users,
            "by_division": division_data,
        },
        "applications": {
            "total": total_apps,
            "pending": pending_apps,
            "approved": approved_apps,
        },
        "tasks": {
            "total": total_tasks,
            "completed": completed_tasks,
        },
        "tickets": {
            "open": open_tickets,
            "closed": closed_tickets,
        },
        "expense_breakdown": {
            "by_type": [{"name": k, "value": v} for k, v in expense_types.items()],
            "by_applicant": applicant_expenses,
            "total_application_expenses": total_app_expenses,
        },
    }


@router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    is_admin = "admin" in current_user.get("roles", []) or "super_admin" in current_user.get("roles", [])
    if is_admin:
        total_applications = await db.applications.count_documents({})
        pending_applications = await db.applications.count_documents({"status": "pending"})
        approved_applications = await db.applications.count_documents({"status": "approved"})
        training_applications = await db.training_applications.count_documents({})
        open_tickets = await db.tickets.count_documents({"status": "open"})
        active_users = await db.users.count_documents({"is_active": True})
    else:
        total_applications = await db.applications.count_documents({"user_id": current_user["id"]})
        pending_applications = await db.applications.count_documents({"user_id": current_user["id"], "status": "pending"})
        approved_applications = await db.applications.count_documents({"user_id": current_user["id"], "status": "approved"})
        training_applications = await db.training_applications.count_documents({"user_id": current_user["id"]})
        open_tickets = await db.tickets.count_documents({"created_by": current_user["id"], "status": "open"})
        active_users = 0

    unread_notifications = await db.notifications.count_documents({"user_id": current_user["id"], "is_read": False})

    return {
        "total_applications": total_applications,
        "pending_applications": pending_applications,
        "approved_applications": approved_applications,
        "training_applications": training_applications,
        "open_tickets": open_tickets,
        "unread_notifications": unread_notifications,
        "active_users": active_users,
    }


@router.get("/dashboard/recent-activity")
async def get_recent_activity(current_user: dict = Depends(get_current_user)):
    is_admin = "admin" in current_user.get("roles", []) or "super_admin" in current_user.get("roles", [])
    activities = []

    notifications = await db.notifications.find(
        {"user_id": current_user["id"]}, {"_id": 0}
    ).sort("created_at", -1).limit(10).to_list(10)
    for n in notifications:
        activities.append({
            "id": n.get("id", ""), "type": n.get("type", "notification"),
            "title": n.get("title", "Notification"),
            "description": n.get("message", ""),
            "created_at": n.get("created_at", ""), "icon": "bell",
        })

    app_query = {} if is_admin else {"user_id": current_user["id"]}
    recent_apps = await db.applications.find(app_query, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    for a in recent_apps:
        applicant = a.get("applicant_name") or a.get("full_name") or "Unknown"
        activities.append({
            "id": a.get("id", ""), "type": "application",
            "title": f"Bursary Application - {a.get('status', 'submitted').title()}",
            "description": f"{applicant} - {a.get('institution', 'N/A')}",
            "created_at": a.get("created_at", ""), "icon": "file-text",
        })

    ta_query = {} if is_admin else {"user_id": current_user["id"]}
    recent_tas = await db.training_applications.find(ta_query, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    for t in recent_tas:
        applicant = t.get("applicant_name") or t.get("full_name") or "Unknown"
        activities.append({
            "id": t.get("id", ""), "type": "training_application",
            "title": f"Training Application - {t.get('status', 'submitted').title()}",
            "description": f"{applicant} - {t.get('training_title', 'N/A')}",
            "created_at": t.get("created_at", ""), "icon": "graduation-cap",
        })

    tkt_query = {} if is_admin else {"created_by": current_user["id"]}
    recent_tickets = await db.tickets.find(tkt_query, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    for tk in recent_tickets:
        activities.append({
            "id": tk.get("id", ""), "type": "ticket",
            "title": f"Ticket: {tk.get('title', 'Untitled')}",
            "description": f"Status: {tk.get('status', 'open').title()} - Priority: {tk.get('priority', 'medium').title()}",
            "created_at": tk.get("created_at", ""), "icon": "ticket",
        })

    activities.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return activities[:15]


@router.get("/dashboard/report-summary")
async def get_dashboard_report_summary(current_user: dict = Depends(get_current_user)):
    total_users = await db.users.count_documents({})
    active_users = await db.users.count_documents({"is_active": True})
    total_bursary = await db.applications.count_documents({})
    approved_bursary = await db.applications.count_documents({"status": "approved"})
    total_training = await db.training_applications.count_documents({})
    approved_training = await db.training_applications.count_documents({"status": "approved"})
    total_expenses = 0
    expenses_cursor = db.expenses.find({}, {"_id": 0, "amount": 1})
    async for exp in expenses_cursor:
        total_expenses += exp.get("amount", 0)
    open_tickets = await db.tickets.count_documents({"status": "open"})
    closed_tickets = await db.tickets.count_documents({"status": "closed"})

    return {
        "total_users": total_users, "active_users": active_users,
        "total_bursary_applications": total_bursary, "approved_bursary_applications": approved_bursary,
        "total_training_applications": total_training, "approved_training_applications": approved_training,
        "total_expenses": total_expenses,
        "open_tickets": open_tickets, "closed_tickets": closed_tickets,
    }
