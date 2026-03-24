"""Expenses Router - Standalone expenses CRUD, export, stats, application expenses"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, List
from datetime import datetime, timezone

from routers import (
    db, get_current_user, generate_uuid, is_admin_user,
    generate_excel, StreamingResponse,
)

router = APIRouter(prefix="/api", tags=["expenses"])


def current_time():
    return datetime.now(timezone.utc)


# ── Models ──

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


# ── Routes ──

@router.get("/expenses")
async def get_expenses(
    status: Optional[str] = None,
    category: Optional[str] = None,
    project_id: Optional[str] = None,
    sponsor_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    if is_admin_user(current_user):
        query = {}
    else:
        query = {"submitted_by": current_user["id"]}

    if status:
        query["status"] = status
    if category:
        query["category"] = category
    if project_id:
        query["project_id"] = project_id
    if sponsor_id:
        query["sponsor_id"] = sponsor_id
    if date_from:
        query.setdefault("date", {})["$gte"] = date_from
    if date_to:
        query.setdefault("date", {})["$lte"] = date_to + "T23:59:59"

    expenses = await db.expenses.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    return expenses


@router.get("/expenses/export/excel")
async def export_expenses_excel(
    status: Optional[str] = None,
    category: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    tab: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Export expenses to XLSX with filters"""
    if tab == "bursary" or tab == "training":
        is_admin = is_admin_user(current_user)
        user_query = {} if is_admin else {"user_id": current_user["id"]}
        coll = db.applications if tab == "bursary" else db.training_applications
        apps = await coll.find(
            {**user_query, "additional_expenses": {"$exists": True}}, {"_id": 0}
        ).to_list(10000)
        rows = []
        for app in apps:
            exp = app.get("additional_expenses", {})
            total = sum(exp.get(k, 0) for k in ["flights", "accommodation", "car_hire_or_shuttle", "catering"] if isinstance(exp.get(k), (int, float)))
            if total <= 0:
                continue
            row = {
                "applicant": app.get("applicant_name") or app.get("full_name", ""),
                "status": app.get("status", ""),
                "flights": exp.get("flights", 0),
                "accommodation": exp.get("accommodation", 0),
                "car_hire_shuttle": exp.get("car_hire_or_shuttle", 0),
                "catering": exp.get("catering", 0),
                "total": total,
            }
            if tab == "training":
                row["training_type"] = app.get("training_type") or app.get("service_provider", "")
            rows.append(row)
        excel_stream = generate_excel(rows, title=f"{tab.title()} Expenses")
    else:
        query = {} if is_admin_user(current_user) else {"submitted_by": current_user["id"]}
        if status:
            query["status"] = status
        if category:
            query["category"] = category
        if date_from:
            query.setdefault("date", {})["$gte"] = date_from
        if date_to:
            query.setdefault("date", {})["$lte"] = date_to + "T23:59:59"
        raw = await db.expenses.find(query, {"_id": 0}).sort("date", -1).to_list(10000)
        rows = []
        for e in raw:
            rows.append({
                "title": e.get("title", ""),
                "category": e.get("category", ""),
                "amount": e.get("amount", 0),
                "date": str(e.get("date", ""))[:10],
                "status": e.get("status", ""),
                "vendor": e.get("vendor", ""),
                "description": e.get("description", ""),
            })
        excel_stream = generate_excel(rows, title="Expenses")

    return StreamingResponse(
        iter([excel_stream.getvalue()]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=expenses_export.xlsx"}
    )


@router.get("/expenses/stats")
async def get_expense_stats(current_user: dict = Depends(get_current_user)):
    if is_admin_user(current_user):
        query = {}
    else:
        query = {"submitted_by": current_user["id"]}

    expenses = await db.expenses.find(query, {"_id": 0}).to_list(10000)

    total = sum(e.get("amount", 0) for e in expenses)
    pending = sum(e.get("amount", 0) for e in expenses if e.get("status") == "pending")
    approved = sum(e.get("amount", 0) for e in expenses if e.get("status") == "approved")

    by_category = {}
    for e in expenses:
        cat = e.get("category", "other")
        by_category[cat] = by_category.get(cat, 0) + e.get("amount", 0)

    return {
        "total": total,
        "pending": pending,
        "approved": approved,
        "by_category": by_category,
        "count": len(expenses)
    }


@router.get("/expenses/application-expenses")
async def get_all_application_expenses(current_user: dict = Depends(get_current_user)):
    is_admin = is_admin_user(current_user)
    user_query = {} if is_admin else {"user_id": current_user["id"]}

    bursary_apps = await db.applications.find(
        {**user_query, "additional_expenses": {"$exists": True}}, {"_id": 0}
    ).to_list(1000)

    training_apps = await db.training_applications.find(
        {**user_query, "additional_expenses": {"$exists": True}}, {"_id": 0}
    ).to_list(1000)

    bursary_expenses = []
    for app in bursary_apps:
        exp = app.get("additional_expenses", {})
        total = sum(float(exp.get(k, 0) or 0) for k in ["flights", "accommodation", "car_hire_or_shuttle", "catering"])
        if total > 0:
            user = await db.users.find_one({"id": app["user_id"]}, {"_id": 0, "full_name": 1})
            fi = app.get("financial_info", {})
            requested_amount = fi.get("total_amount") or fi.get("amount_requested") or fi.get("bursary_amount") or 0
            bursary_expenses.append({
                "application_id": app["id"],
                "application_type": "bursary",
                "applicant_name": user.get("full_name", "Unknown") if user else app.get("user_email", "Unknown"),
                "status": app.get("status", "draft"),
                "submitted_at": app.get("submitted_at"),
                "created_at": app.get("created_at"),
                "requested_amount": float(requested_amount) if requested_amount else 0,
                "expenses": exp,
                "total": total,
            })

    training_expenses = []
    for app in training_apps:
        exp = app.get("additional_expenses", {})
        total = sum(float(exp.get(k, 0) or 0) for k in ["flights", "accommodation", "car_hire_or_shuttle", "catering"])
        if total > 0:
            user = await db.users.find_one({"id": app["user_id"]}, {"_id": 0, "full_name": 1})
            ti = app.get("training_info", {})
            requested_amount = ti.get("total_amount") or ti.get("amount_requested") or 0
            training_expenses.append({
                "application_id": app["id"],
                "application_type": "training",
                "applicant_name": user.get("full_name", "Unknown") if user else "Unknown",
                "training_type": ti.get("training_type", ""),
                "service_provider": ti.get("service_provider", ""),
                "status": app.get("status", "draft"),
                "submitted_at": app.get("submitted_at"),
                "created_at": app.get("created_at"),
                "requested_amount": float(requested_amount) if requested_amount else 0,
                "expenses": exp,
                "total": total,
            })

    return {"bursary": bursary_expenses, "training": training_expenses}


@router.get("/expenses/available-applications")
async def get_available_applications_for_expenses(current_user: dict = Depends(get_current_user)):
    """Get all applications (bursary + training) available for expense submission"""
    is_admin = is_admin_user(current_user)
    user_query = {} if is_admin else {"user_id": current_user["id"]}

    bursary_apps = await db.applications.find(
        {**user_query, "status": {"$nin": ["draft"]}}, {"_id": 0}
    ).to_list(1000)
    training_apps = await db.training_applications.find(
        {**user_query, "status": {"$nin": ["draft"]}}, {"_id": 0}
    ).to_list(1000)

    result = []
    for app in bursary_apps:
        user = await db.users.find_one({"id": app["user_id"]}, {"_id": 0, "full_name": 1})
        fi = app.get("financial_info", {})
        requested_amount = fi.get("total_amount") or fi.get("amount_requested") or fi.get("bursary_amount") or 0
        has_expenses = bool(app.get("additional_expenses"))
        result.append({
            "id": app["id"],
            "type": "bursary",
            "applicant_name": user.get("full_name", "Unknown") if user else app.get("user_email", "Unknown"),
            "user_email": app.get("user_email", ""),
            "status": app.get("status", ""),
            "requested_amount": float(requested_amount) if requested_amount else 0,
            "has_expenses": has_expenses,
            "existing_expenses": app.get("additional_expenses") if has_expenses else None,
            "created_at": app.get("created_at"),
        })
    for app in training_apps:
        user = await db.users.find_one({"id": app["user_id"]}, {"_id": 0, "full_name": 1})
        ti = app.get("training_info", {})
        requested_amount = ti.get("total_amount") or ti.get("amount_requested") or 0
        has_expenses = bool(app.get("additional_expenses"))
        result.append({
            "id": app["id"],
            "type": "training",
            "applicant_name": user.get("full_name", "Unknown") if user else app.get("user_email", "Unknown"),
            "user_email": app.get("user_email", ""),
            "status": app.get("status", ""),
            "training_type": ti.get("training_type", ""),
            "service_provider": ti.get("service_provider", ""),
            "requested_amount": float(requested_amount) if requested_amount else 0,
            "has_expenses": has_expenses,
            "existing_expenses": app.get("additional_expenses") if has_expenses else None,
            "created_at": app.get("created_at"),
        })
    return result


@router.get("/expenses/{expense_id}")
async def get_expense(expense_id: str, current_user: dict = Depends(get_current_user)):
    expense = await db.expenses.find_one({"id": expense_id}, {"_id": 0})
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    if expense["submitted_by"] != current_user["id"] and not is_admin_user(current_user):
        raise HTTPException(status_code=403, detail="Access denied")

    return expense


@router.post("/expenses")
async def create_expense(expense_data: ExpenseCreate, current_user: dict = Depends(get_current_user)):
    expense = Expense(
        **expense_data.model_dump(),
        submitted_by=current_user["id"]
    )
    expense_dict = expense.model_dump()
    expense_dict['date'] = expense_dict['date'].isoformat()
    expense_dict['created_at'] = expense_dict['created_at'].isoformat()
    expense_dict['updated_at'] = expense_dict['updated_at'].isoformat()

    await db.expenses.insert_one({**expense_dict})
    return expense


@router.put("/expenses/{expense_id}")
async def update_expense(expense_id: str, update_data: ExpenseUpdate, current_user: dict = Depends(get_current_user)):
    expense = await db.expenses.find_one({"id": expense_id}, {"_id": 0})
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    if expense["submitted_by"] != current_user["id"] and not is_admin_user(current_user):
        raise HTTPException(status_code=403, detail="Access denied")

    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()

    if 'date' in update_dict and isinstance(update_dict['date'], datetime):
        update_dict['date'] = update_dict['date'].isoformat()

    await db.expenses.update_one({"id": expense_id}, {"$set": update_dict})
    return {"message": "Expense updated successfully"}


@router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str, current_user: dict = Depends(get_current_user)):
    expense = await db.expenses.find_one({"id": expense_id}, {"_id": 0})
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    if expense["submitted_by"] != current_user["id"] and not is_admin_user(current_user):
        raise HTTPException(status_code=403, detail="Access denied")

    if expense.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Cannot delete approved or rejected expenses")

    await db.expenses.delete_one({"id": expense_id})
    return {"message": "Expense deleted successfully"}


@router.post("/expenses/{expense_id}/approve")
async def approve_expense(expense_id: str, current_user: dict = Depends(get_current_user)):
    if not is_admin_user(current_user):
        raise HTTPException(status_code=403, detail="Only admins can approve expenses")

    expense = await db.expenses.find_one({"id": expense_id}, {"_id": 0})
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    await db.expenses.update_one(
        {"id": expense_id},
        {"$set": {
            "status": "approved",
            "approved_by": current_user["id"],
            "approved_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"message": "Expense approved successfully"}


@router.post("/expenses/{expense_id}/reject")
async def reject_expense(expense_id: str, reason: str = "", current_user: dict = Depends(get_current_user)):
    if not is_admin_user(current_user):
        raise HTTPException(status_code=403, detail="Only admins can reject expenses")

    await db.expenses.update_one(
        {"id": expense_id},
        {"$set": {
            "status": "rejected",
            "notes": reason,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"message": "Expense rejected"}
