"""Files CRUD + folders + sharing + upload routes"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from datetime import datetime, timezone
from typing import Optional, List
from . import db, get_current_user, generate_uuid
from schemas import FileModel, FileCreate, FileUpdate, Folder, FolderCreate

router = APIRouter(prefix="/api", tags=["files"])


@router.get("/files")
async def get_files(
    folder_id: Optional[str] = None,
    project_id: Optional[str] = None,
    file_type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"$or": [
        {"uploaded_by": current_user["id"]},
        {"shared_with": current_user["id"]},
        {"shared_with_teams": current_user.get("team_id")}
    ]}
    if folder_id:
        query["folder_id"] = folder_id
    if project_id:
        query["project_id"] = project_id
    if file_type:
        query["file_type"] = file_type
    files = await db.files.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return files


@router.get("/files/folders/list")
async def get_folders(
    parent_id: Optional[str] = None,
    project_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"$or": [{"created_by": current_user["id"]}, {"shared_with": current_user["id"]}]}
    if parent_id is not None:
        query["parent_id"] = parent_id
    if project_id:
        query["project_id"] = project_id
    folders = await db.folders.find(query, {"_id": 0}).to_list(100)
    return folders


@router.post("/files/folders")
async def create_folder(folder_data: FolderCreate, current_user: dict = Depends(get_current_user)):
    folder = Folder(**folder_data.model_dump(), created_by=current_user["id"])
    folder_dict = folder.model_dump()
    folder_dict['created_at'] = folder_dict['created_at'].isoformat()
    folder_dict['updated_at'] = folder_dict['updated_at'].isoformat()
    await db.folders.insert_one({**folder_dict})
    return folder


@router.get("/files/{file_id}")
async def get_file(file_id: str, current_user: dict = Depends(get_current_user)):
    file = await db.files.find_one({"id": file_id}, {"_id": 0})
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    return file


@router.post("/files")
async def create_file(file_data: FileCreate, current_user: dict = Depends(get_current_user)):
    file = FileModel(**file_data.model_dump(), uploaded_by=current_user["id"])
    file_dict = file.model_dump()
    file_dict['created_at'] = file_dict['created_at'].isoformat()
    file_dict['updated_at'] = file_dict['updated_at'].isoformat()
    await db.files.insert_one({**file_dict})
    return file


@router.put("/files/{file_id}")
async def update_file(file_id: str, update_data: FileUpdate, current_user: dict = Depends(get_current_user)):
    file = await db.files.find_one({"id": file_id}, {"_id": 0})
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    if file["uploaded_by"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only the uploader can edit this file")
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.files.update_one({"id": file_id}, {"$set": update_dict})
    return {"message": "File updated successfully"}


@router.delete("/files/{file_id}")
async def delete_file(file_id: str, current_user: dict = Depends(get_current_user)):
    file = await db.files.find_one({"id": file_id}, {"_id": 0})
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    if file["uploaded_by"] != current_user["id"] and "admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Access denied")
    await db.files.delete_one({"id": file_id})
    return {"message": "File deleted successfully"}


@router.post("/files/{file_id}/share")
async def share_file(file_id: str, user_ids: List[str] = [], team_ids: List[str] = [], current_user: dict = Depends(get_current_user)):
    file = await db.files.find_one({"id": file_id}, {"_id": 0})
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    if file["uploaded_by"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only the uploader can share this file")
    await db.files.update_one(
        {"id": file_id},
        {"$set": {"is_shared": True, "shared_with": user_ids, "shared_with_teams": team_ids, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "File shared successfully"}


@router.post("/files/upload")
async def upload_file_multipart(
    file: UploadFile = File(...),
    folder_id: Optional[str] = Form(None),
    project_id: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    import base64
    MAX_SIZE = 20 * 1024 * 1024
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 20MB")
    b64_data = base64.b64encode(content).decode('utf-8')
    file_ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    content_type = file.content_type or 'application/octet-stream'
    file_doc = {
        "id": generate_uuid(), "name": file.filename, "file_type": file_ext,
        "content_type": content_type, "size": len(content),
        "file_data": f"data:{content_type};base64,{b64_data}",
        "folder_id": folder_id, "project_id": project_id, "category": category,
        "uploaded_by": current_user["id"], "is_shared": False, "shared_with": [], "shared_with_teams": [],
        "created_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.files.insert_one({**file_doc})
    file_doc.pop("file_data", None)
    return file_doc
