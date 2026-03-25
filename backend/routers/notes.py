"""Notes CRUD + folders + sharing routes"""
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from typing import Optional, List
from . import db, get_current_user, generate_uuid
from schemas import Note, NoteCreate, NoteUpdate, NoteFolder, NoteFolderCreate

router = APIRouter(prefix="/api", tags=["notes"])


@router.get("/notes")
async def get_notes(
    folder_id: Optional[str] = None,
    is_shared: Optional[bool] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"$or": [
        {"created_by": current_user["id"]},
        {"shared_with": current_user["id"]},
        {"shared_with_teams": current_user.get("team_id")}
    ]}
    if folder_id:
        query["folder_id"] = folder_id
    if is_shared is not None:
        query["is_shared"] = is_shared
    notes = await db.notes.find(query, {"_id": 0}).to_list(1000)
    return notes


@router.get("/notes/shared")
async def get_shared_notes(current_user: dict = Depends(get_current_user)):
    query = {
        "is_shared": True,
        "$or": [
            {"shared_with": current_user["id"]},
            {"shared_with_teams": current_user.get("team_id")}
        ],
        "created_by": {"$ne": current_user["id"]}
    }
    notes = await db.notes.find(query, {"_id": 0}).to_list(1000)
    return notes


@router.get("/notes/folders/list")
async def get_note_folders(current_user: dict = Depends(get_current_user)):
    folders = await db.note_folders.find(
        {"$or": [{"created_by": current_user["id"]}, {"shared_with": current_user["id"]}]},
        {"_id": 0}
    ).to_list(100)
    return folders


@router.post("/notes/folders")
async def create_note_folder(folder_data: NoteFolderCreate, current_user: dict = Depends(get_current_user)):
    folder = NoteFolder(**folder_data.model_dump(), created_by=current_user["id"])
    folder_dict = folder.model_dump()
    folder_dict['created_at'] = folder_dict['created_at'].isoformat()
    folder_dict['updated_at'] = folder_dict['updated_at'].isoformat()
    await db.note_folders.insert_one({**folder_dict})
    return folder


@router.get("/notes/{note_id}")
async def get_note(note_id: str, current_user: dict = Depends(get_current_user)):
    note = await db.notes.find_one({"id": note_id}, {"_id": 0})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.post("/notes")
async def create_note(note_data: NoteCreate, current_user: dict = Depends(get_current_user)):
    note = Note(**note_data.model_dump(), created_by=current_user["id"])
    note_dict = note.model_dump()
    note_dict['created_at'] = note_dict['created_at'].isoformat()
    note_dict['updated_at'] = note_dict['updated_at'].isoformat()
    await db.notes.insert_one({**note_dict})
    return note


@router.put("/notes/{note_id}")
async def update_note(note_id: str, update_data: NoteUpdate, current_user: dict = Depends(get_current_user)):
    note = await db.notes.find_one({"id": note_id}, {"_id": 0})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if note["created_by"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only the creator can edit this note")
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.notes.update_one({"id": note_id}, {"$set": update_dict})
    return await db.notes.find_one({"id": note_id}, {"_id": 0})


@router.delete("/notes/{note_id}")
async def delete_note(note_id: str, current_user: dict = Depends(get_current_user)):
    note = await db.notes.find_one({"id": note_id}, {"_id": 0})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if note["created_by"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only the creator can delete this note")
    await db.notes.delete_one({"id": note_id})
    return {"message": "Note deleted successfully"}


@router.post("/notes/{note_id}/share")
async def share_note(note_id: str, user_ids: List[str] = [], team_ids: List[str] = [], current_user: dict = Depends(get_current_user)):
    note = await db.notes.find_one({"id": note_id}, {"_id": 0})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if note["created_by"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only the creator can share this note")
    await db.notes.update_one(
        {"id": note_id},
        {"$set": {"is_shared": True, "shared_with": user_ids, "shared_with_teams": team_ids, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Note shared successfully"}
