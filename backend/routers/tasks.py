"""Tasks CRUD + assign + export routes"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone
from typing import Optional
from . import db, get_current_user, generate_uuid, generate_excel
import sys, os, io
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from server import Task, TaskCreate, TaskUpdate, generate_pdf

router = APIRouter()


@router.get("/tasks")
async def get_tasks(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_to: Optional[str] = None,
    project_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    is_admin = "admin" in current_user.get("roles", []) or "super_admin" in current_user.get("roles", [])
    query = {}
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    if assigned_to:
        query["assigned_to"] = assigned_to
    if project_id:
        query["project_id"] = project_id
    if not is_admin:
        query["$or"] = [
            {"assigned_to": current_user["id"]},
            {"assigned_users.user_id": current_user["id"]},
            {"created_by": current_user["id"]},
        ]
    tasks = await db.tasks.find(query, {"_id": 0}).to_list(1000)
    return tasks


@router.get("/tasks/{task_id}")
async def get_task(task_id: str, current_user: dict = Depends(get_current_user)):
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post("/tasks")
async def create_task(task_data: TaskCreate, current_user: dict = Depends(get_current_user)):
    task = Task(**task_data.model_dump(), created_by=current_user["id"])
    if task.assigned_to:
        assignee = await db.users.find_one({"id": task.assigned_to}, {"_id": 0, "full_name": 1})
        if assignee:
            task.assignee_name = assignee.get("full_name")
    if task.project_id:
        project = await db.projects.find_one({"id": task.project_id}, {"_id": 0, "name": 1})
        if project:
            task.project_name = project.get("name")
    task_dict = task.model_dump()
    task_dict['created_at'] = task_dict['created_at'].isoformat()
    task_dict['updated_at'] = task_dict['updated_at'].isoformat()
    if task_dict.get('due_date'):
        task_dict['due_date'] = task_dict['due_date'].isoformat()
    if task_dict.get('start_date'):
        task_dict['start_date'] = task_dict['start_date'].isoformat()
    await db.tasks.insert_one({**task_dict})
    return task


@router.put("/tasks/{task_id}")
async def update_task(task_id: str, update_data: TaskUpdate, current_user: dict = Depends(get_current_user)):
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    if update_data.status == "completed" and task.get("status") != "completed":
        update_dict["completed_at"] = datetime.now(timezone.utc).isoformat()
        update_dict["progress"] = 100
    for field in ['due_date', 'start_date']:
        if field in update_dict and isinstance(update_dict[field], datetime):
            update_dict[field] = update_dict[field].isoformat()
    if update_data.assigned_to:
        assignee = await db.users.find_one({"id": update_data.assigned_to}, {"_id": 0, "full_name": 1})
        if assignee:
            update_dict["assignee_name"] = assignee.get("full_name")
    await db.tasks.update_one({"id": task_id}, {"$set": update_dict})
    return await db.tasks.find_one({"id": task_id}, {"_id": 0})


@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, current_user: dict = Depends(get_current_user)):
    is_admin = "admin" in current_user.get("roles", []) or "super_admin" in current_user.get("roles", [])
    if not is_admin:
        raise HTTPException(status_code=403, detail="Only admins can delete tasks")
    result = await db.tasks.delete_one({"id": task_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted successfully"}


@router.post("/tasks/{task_id}/assign")
async def assign_users_to_task(task_id: str, body: dict, current_user: dict = Depends(get_current_user)):
    is_admin = "admin" in current_user.get("roles", []) or "super_admin" in current_user.get("roles", [])
    if not is_admin:
        raise HTTPException(status_code=403, detail="Only admins can assign users")
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    user_ids = body.get("user_ids", [])
    existing = task.get("assigned_users", [])
    existing_ids = {u["user_id"] for u in existing}
    new_assignments = []
    for uid in user_ids:
        if uid in existing_ids:
            continue
        user = await db.users.find_one({"id": uid}, {"_id": 0, "full_name": 1, "email": 1})
        if user:
            new_assignments.append({
                "user_id": uid, "full_name": user.get("full_name", ""),
                "email": user.get("email", ""),
                "assigned_at": datetime.now(timezone.utc).isoformat(),
                "assigned_by": current_user["id"],
            })
    all_assigned = existing + new_assignments
    await db.tasks.update_one({"id": task_id}, {"$set": {"assigned_users": all_assigned, "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"message": f"Assigned {len(new_assignments)} user(s)", "assigned_users": all_assigned}


@router.delete("/tasks/{task_id}/assign/{user_id}")
async def unassign_user_from_task(task_id: str, user_id: str, current_user: dict = Depends(get_current_user)):
    is_admin = "admin" in current_user.get("roles", []) or "super_admin" in current_user.get("roles", [])
    if not is_admin:
        raise HTTPException(status_code=403, detail="Only admins can unassign users")
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    await db.tasks.update_one({"id": task_id}, {"$pull": {"assigned_users": {"user_id": user_id}}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"message": "User unassigned"}


@router.get("/tasks/export/excel")
async def export_tasks_excel(
    status: Optional[str] = None, priority: Optional[str] = None,
    date_from: Optional[str] = None, date_to: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    tasks = await db.tasks.find(query, {"_id": 0}).to_list(10000)
    if date_from:
        tasks = [t for t in tasks if t.get("due_date") and t["due_date"] >= date_from]
    if date_to:
        tasks = [t for t in tasks if t.get("due_date") and t["due_date"] <= date_to + "T23:59:59"]
    export_data = [{"Title": t.get("title", ""), "Status": t.get("status", "").replace("_", " ").title(),
        "Priority": t.get("priority", "").title(), "Assignee": t.get("assignee_name", ""),
        "Project": t.get("project_name", ""), "Due Date": t.get("due_date", "")[:10] if t.get("due_date") else "",
        "Progress": f"{t.get('progress', 0)}%", "Tags": ", ".join(t.get("tags", []))} for t in tasks]
    excel_stream = generate_excel(export_data, title="Tasks")
    return StreamingResponse(iter([excel_stream.getvalue()]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=tasks_export.xlsx"})


@router.get("/tasks/export/pdf")
async def export_tasks_pdf(
    status: Optional[str] = None, priority: Optional[str] = None,
    date_from: Optional[str] = None, date_to: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    tasks = await db.tasks.find(query, {"_id": 0}).to_list(10000)
    if date_from:
        tasks = [t for t in tasks if t.get("due_date") and t["due_date"] >= date_from]
    if date_to:
        tasks = [t for t in tasks if t.get("due_date") and t["due_date"] <= date_to + "T23:59:59"]
    export_data = [{"Title": t.get("title", ""), "Status": t.get("status", "").replace("_", " ").title(),
        "Priority": t.get("priority", "").title(), "Assignee": t.get("assignee_name", ""),
        "Due Date": t.get("due_date", "")[:10] if t.get("due_date") else "",
        "Progress": f"{t.get('progress', 0)}%"} for t in tasks]
    pdf_stream = generate_pdf(export_data, title="Tasks Report")
    return StreamingResponse(iter([pdf_stream.getvalue()]), media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=tasks_export.pdf"})
