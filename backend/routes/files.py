from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime, timezone
from models.file import File, FileCreate, FileUpdate, Folder, FolderCreate, FolderUpdate

router = APIRouter(prefix="/files", tags=["Files"])

db = None

def set_db(database):
    global db
    db = database

async def get_current_user(credentials):
    pass

@router.get("")
async def get_files(
    folder_id: Optional[str] = None,
    project_id: Optional[str] = None,
    file_type: Optional[str] = None,
    tag: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"$or": [
        {"uploaded_by": current_user["id"]},
        {"shared_with": current_user["id"]},
        {"shared_with_teams": current_user.get("team_id")}
    ]}
    
    if folder_id:
        query["folder_id"] = folder_id
    elif folder_id is None and not project_id:
        # Root level files (no folder)
        query["folder_id"] = None
    
    if project_id:
        query["project_id"] = project_id
    if file_type:
        query["file_type"] = file_type
    if tag:
        query["tags"] = tag
    
    files = await db.files.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return files

@router.get("/shared")
async def get_shared_files(current_user: dict = Depends(get_current_user)):
    query = {
        "is_shared": True,
        "$or": [
            {"shared_with": current_user["id"]},
            {"shared_with_teams": current_user.get("team_id")}
        ],
        "uploaded_by": {"$ne": current_user["id"]}
    }
    files = await db.files.find(query, {"_id": 0}).to_list(1000)
    return files

@router.get("/{file_id}")
async def get_file(file_id: str, current_user: dict = Depends(get_current_user)):
    file = await db.files.find_one({"id": file_id}, {"_id": 0})
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check access
    if file["uploaded_by"] != current_user["id"]:
        if current_user["id"] not in file.get("shared_with", []):
            if current_user.get("team_id") not in file.get("shared_with_teams", []):
                raise HTTPException(status_code=403, detail="Access denied")
    
    return file

@router.post("")
async def create_file(file_data: FileCreate, current_user: dict = Depends(get_current_user)):
    file = File(
        **file_data.model_dump(),
        uploaded_by=current_user["id"]
    )
    file_dict = file.model_dump()
    file_dict['created_at'] = file_dict['created_at'].isoformat()
    file_dict['updated_at'] = file_dict['updated_at'].isoformat()
    
    await db.files.insert_one({**file_dict})
    return file

@router.put("/{file_id}")
async def update_file(file_id: str, update_data: FileUpdate, current_user: dict = Depends(get_current_user)):
    file = await db.files.find_one({"id": file_id}, {"_id": 0})
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    if file["uploaded_by"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only the uploader can edit this file")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.files.update_one({"id": file_id}, {"$set": update_dict})
    updated_file = await db.files.find_one({"id": file_id}, {"_id": 0})
    return updated_file

@router.delete("/{file_id}")
async def delete_file(file_id: str, current_user: dict = Depends(get_current_user)):
    file = await db.files.find_one({"id": file_id}, {"_id": 0})
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    if file["uploaded_by"] != current_user["id"] and "admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.files.delete_one({"id": file_id})
    return {"message": "File deleted successfully"}

@router.post("/{file_id}/share")
async def share_file(file_id: str, user_ids: List[str] = [], team_ids: List[str] = [], current_user: dict = Depends(get_current_user)):
    file = await db.files.find_one({"id": file_id}, {"_id": 0})
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    if file["uploaded_by"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only the uploader can share this file")
    
    await db.files.update_one(
        {"id": file_id},
        {"$set": {
            "is_shared": True,
            "shared_with": user_ids,
            "shared_with_teams": team_ids,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"message": "File shared successfully"}

# Folders
@router.get("/folders/list")
async def get_folders(
    parent_id: Optional[str] = None,
    project_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"$or": [
        {"created_by": current_user["id"]},
        {"shared_with": current_user["id"]},
        {"shared_with_teams": current_user.get("team_id")}
    ]}
    
    if parent_id is not None:
        query["parent_id"] = parent_id
    elif parent_id is None and not project_id:
        query["parent_id"] = None
    
    if project_id:
        query["project_id"] = project_id
    
    folders = await db.folders.find(query, {"_id": 0}).to_list(100)
    return folders

@router.post("/folders")
async def create_folder(folder_data: FolderCreate, current_user: dict = Depends(get_current_user)):
    folder = Folder(
        **folder_data.model_dump(),
        created_by=current_user["id"]
    )
    folder_dict = folder.model_dump()
    folder_dict['created_at'] = folder_dict['created_at'].isoformat()
    folder_dict['updated_at'] = folder_dict['updated_at'].isoformat()
    
    await db.folders.insert_one({**folder_dict})
    return folder

@router.put("/folders/{folder_id}")
async def update_folder(folder_id: str, update_data: FolderUpdate, current_user: dict = Depends(get_current_user)):
    folder = await db.folders.find_one({"id": folder_id}, {"_id": 0})
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    if folder["created_by"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only the creator can edit this folder")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.folders.update_one({"id": folder_id}, {"$set": update_dict})
    return {"message": "Folder updated successfully"}

@router.delete("/folders/{folder_id}")
async def delete_folder(folder_id: str, current_user: dict = Depends(get_current_user)):
    folder = await db.folders.find_one({"id": folder_id}, {"_id": 0})
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    if folder["created_by"] != current_user["id"] and "admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Move files and subfolders to parent
    await db.files.update_many({"folder_id": folder_id}, {"$set": {"folder_id": folder.get("parent_id")}})
    await db.folders.update_many({"parent_id": folder_id}, {"$set": {"parent_id": folder.get("parent_id")}})
    
    await db.folders.delete_one({"id": folder_id})
    return {"message": "Folder deleted successfully"}
