from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime, timezone
from models.expense import Expense, ExpenseCreate, ExpenseUpdate

router = APIRouter(prefix="/expenses", tags=["Expenses"])

db = None

def set_db(database):
    global db
    db = database

async def get_current_user(credentials):
    pass

@router.get("", response_model=List[Expense])
async def get_expenses(
    status: Optional[str] = None,
    category: Optional[str] = None,
    project_id: Optional[str] = None,
    user_id: Optional[str] = None,
    sponsor_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    # Admins see all, others see their own
    if "admin" in current_user.get("roles", []):
        query = {}
    else:
        query = {"submitted_by": current_user["id"]}
    
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    if project_id:
        query["project_id"] = project_id
    if user_id:
        query["user_id"] = user_id
    if sponsor_id:
        query["sponsor_id"] = sponsor_id
    
    expenses = await db.expenses.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    for expense in expenses:
        for field in ['date', 'created_at', 'updated_at', 'approved_at']:
            if expense.get(field) and isinstance(expense[field], str):
                expense[field] = datetime.fromisoformat(expense[field])
    return expenses

@router.get("/stats")
async def get_expense_stats(
    period: str = "month",
    current_user: dict = Depends(get_current_user)
):
    if "admin" in current_user.get("roles", []):
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
    
    by_project = {}
    for e in expenses:
        if e.get("project_id"):
            by_project[e["project_id"]] = by_project.get(e["project_id"], 0) + e.get("amount", 0)
    
    return {
        "total": total,
        "pending": pending,
        "approved": approved,
        "by_category": by_category,
        "by_project": by_project,
        "count": len(expenses)
    }

@router.get("/{expense_id}")
async def get_expense(expense_id: str, current_user: dict = Depends(get_current_user)):
    expense = await db.expenses.find_one({"id": expense_id}, {"_id": 0})
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    if expense["submitted_by"] != current_user["id"] and "admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Access denied")
    
    return expense

@router.post("", response_model=Expense)
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

@router.put("/{expense_id}", response_model=Expense)
async def update_expense(expense_id: str, update_data: ExpenseUpdate, current_user: dict = Depends(get_current_user)):
    expense = await db.expenses.find_one({"id": expense_id}, {"_id": 0})
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    # Only submitter can edit, only admin can approve/reject
    if expense["submitted_by"] != current_user["id"] and "admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    if 'date' in update_dict and isinstance(update_dict['date'], datetime):
        update_dict['date'] = update_dict['date'].isoformat()
    
    await db.expenses.update_one({"id": expense_id}, {"$set": update_dict})
    updated_expense = await db.expenses.find_one({"id": expense_id}, {"_id": 0})
    return updated_expense

@router.delete("/{expense_id}")
async def delete_expense(expense_id: str, current_user: dict = Depends(get_current_user)):
    expense = await db.expenses.find_one({"id": expense_id}, {"_id": 0})
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    if expense["submitted_by"] != current_user["id"] and "admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Can only delete pending expenses
    if expense.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Cannot delete approved or rejected expenses")
    
    await db.expenses.delete_one({"id": expense_id})
    return {"message": "Expense deleted successfully"}

@router.post("/{expense_id}/approve")
async def approve_expense(expense_id: str, current_user: dict = Depends(get_current_user)):
    if "admin" not in current_user.get("roles", []):
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

@router.post("/{expense_id}/reject")
async def reject_expense(expense_id: str, reason: str = "", current_user: dict = Depends(get_current_user)):
    if "admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Only admins can reject expenses")
    
    expense = await db.expenses.find_one({"id": expense_id}, {"_id": 0})
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    await db.expenses.update_one(
        {"id": expense_id},
        {"$set": {
            "status": "rejected",
            "notes": reason,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"message": "Expense rejected"}
