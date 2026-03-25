"""Teams CRUD + members routes"""
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from . import db, get_current_user, generate_uuid
from schemas import Team, TeamCreate, TeamUpdate

router = APIRouter(prefix="/api", tags=["teams"])


@router.get("/teams")
async def get_teams(current_user: dict = Depends(get_current_user)):
    teams = await db.teams.find({}, {"_id": 0}).to_list(1000)
    return teams


@router.get("/teams/{team_id}")
async def get_team(team_id: str, current_user: dict = Depends(get_current_user)):
    team = await db.teams.find_one({"id": team_id}, {"_id": 0})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team


@router.post("/teams")
async def create_team(team_data: TeamCreate, current_user: dict = Depends(get_current_user)):
    team = Team(**team_data.model_dump())
    team_dict = team.model_dump()
    team_dict['created_at'] = team_dict['created_at'].isoformat()
    team_dict['updated_at'] = team_dict['updated_at'].isoformat()
    await db.teams.insert_one({**team_dict})
    return team


@router.put("/teams/{team_id}")
async def update_team(team_id: str, update_data: TeamUpdate, current_user: dict = Depends(get_current_user)):
    team = await db.teams.find_one({"id": team_id}, {"_id": 0})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.teams.update_one({"id": team_id}, {"$set": update_dict})
    return {"message": "Team updated successfully"}


@router.delete("/teams/{team_id}")
async def delete_team(team_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.teams.delete_one({"id": team_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Team not found")
    return {"message": "Team deleted successfully"}


@router.get("/teams/{team_id}/members")
async def get_team_members(team_id: str, current_user: dict = Depends(get_current_user)):
    team = await db.teams.find_one({"id": team_id}, {"_id": 0})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    members = await db.users.find({"team_id": team_id}, {"_id": 0, "password_hash": 0}).to_list(100)
    return members


@router.post("/teams/{team_id}/members/{user_id}")
async def add_team_member(team_id: str, user_id: str, current_user: dict = Depends(get_current_user)):
    team = await db.teams.find_one({"id": team_id}, {"_id": 0})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    member_ids = team.get("member_ids", [])
    if user_id not in member_ids:
        member_ids.append(user_id)
        await db.teams.update_one({"id": team_id}, {"$set": {"member_ids": member_ids}})
    await db.users.update_one({"id": user_id}, {"$set": {"team_id": team_id}})
    return {"message": "Member added successfully"}


@router.delete("/teams/{team_id}/members/{user_id}")
async def remove_team_member(team_id: str, user_id: str, current_user: dict = Depends(get_current_user)):
    team = await db.teams.find_one({"id": team_id}, {"_id": 0})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    member_ids = team.get("member_ids", [])
    if user_id in member_ids:
        member_ids.remove(user_id)
        await db.teams.update_one({"id": team_id}, {"$set": {"member_ids": member_ids}})
    await db.users.update_one({"id": user_id}, {"$set": {"team_id": None}})
    return {"message": "Member removed successfully"}
