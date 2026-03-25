"""Divisions, Departments, Division Groups, Subgroups routes"""
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone, timedelta
from typing import Optional
from . import db, get_current_user, generate_uuid, is_admin_user

router = APIRouter(prefix="/api", tags=["divisions"])


# ============== DIVISIONS ==============

@router.get("/divisions")
async def get_divisions(current_user: dict = Depends(get_current_user)):
    divisions = await db.divisions.find({}, {"_id": 0}).to_list(100)
    return divisions

@router.post("/divisions")
async def create_division(division_data: dict, current_user: dict = Depends(get_current_user)):
    if not is_admin_user(current_user):
        raise HTTPException(status_code=403, detail="Only admins can create divisions")
    division = {
        "id": generate_uuid(),
        "name": division_data.get("name"),
        "description": division_data.get("description", ""),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.divisions.insert_one({**division})
    return division

@router.put("/divisions/{division_id}")
async def update_division(division_id: str, division_data: dict, current_user: dict = Depends(get_current_user)):
    if not is_admin_user(current_user):
        raise HTTPException(status_code=403, detail="Only admins can update divisions")
    update_dict = {k: v for k, v in division_data.items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.divisions.update_one({"id": division_id}, {"$set": update_dict})
    updated = await db.divisions.find_one({"id": division_id}, {"_id": 0})
    return updated

@router.delete("/divisions/{division_id}")
async def delete_division(division_id: str, current_user: dict = Depends(get_current_user)):
    if not is_admin_user(current_user):
        raise HTTPException(status_code=403, detail="Only admins can delete divisions")
    await db.divisions.delete_one({"id": division_id})
    return {"message": "Division deleted successfully"}


# ============== DEPARTMENTS ==============

@router.get("/departments")
async def get_departments(division_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if division_id:
        query["division_id"] = division_id
    departments = await db.departments.find(query, {"_id": 0}).to_list(500)
    return departments

@router.post("/departments")
async def create_department(dept_data: dict, current_user: dict = Depends(get_current_user)):
    if not is_admin_user(current_user):
        raise HTTPException(status_code=403, detail="Only admins can create departments")
    department = {
        "id": generate_uuid(),
        "name": dept_data.get("name"),
        "division_id": dept_data.get("division_id"),
        "description": dept_data.get("description", ""),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.departments.insert_one({**department})
    return department

@router.put("/departments/{dept_id}")
async def update_department(dept_id: str, dept_data: dict, current_user: dict = Depends(get_current_user)):
    if not is_admin_user(current_user):
        raise HTTPException(status_code=403, detail="Only admins can update departments")
    update_dict = {k: v for k, v in dept_data.items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.departments.update_one({"id": dept_id}, {"$set": update_dict})
    updated = await db.departments.find_one({"id": dept_id}, {"_id": 0})
    return updated

@router.delete("/departments/{dept_id}")
async def delete_department(dept_id: str, current_user: dict = Depends(get_current_user)):
    if not is_admin_user(current_user):
        raise HTTPException(status_code=403, detail="Only admins can delete departments")
    await db.departments.delete_one({"id": dept_id})
    return {"message": "Department deleted successfully"}


# ============== DIVISION GROUPS ==============

@router.get("/division-groups")
async def get_division_groups(current_user: dict = Depends(get_current_user)):
    is_admin = is_admin_user(current_user)
    uid = current_user["id"]
    divisions = await db.divisions.find({}, {"_id": 0}).to_list(100)
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    group_configs = await db.division_groups.find({}, {"_id": 0}).to_list(100)
    config_map = {gc["division_name"]: gc for gc in group_configs}
    all_subgroups = await db.subgroups.find({}, {"_id": 0}).to_list(500)
    user_map = {u["id"]: u for u in users}

    groups = []
    for div in divisions:
        div_name = div["name"]
        all_div_members = [u for u in users if u.get("division") == div_name]
        config = config_map.get(div_name, {})
        div_subgroups = [sg for sg in all_subgroups if sg.get("division_name") == div_name]
        subgroup_member_ids = set()
        now_str = datetime.now(timezone.utc).isoformat()
        user_is_head_of_division = config.get("leader_id") == uid
        user_is_head_of_subgroup = False
        for sg in div_subgroups:
            sg["members"] = [user_map[mid] for mid in sg.get("member_user_ids", []) if mid in user_map]
            sg["leader"] = user_map.get(sg.get("leader_id"))
            temp_end = sg.get("temp_leader_end")
            if temp_end and temp_end > now_str and sg.get("temp_leader_id"):
                sg["temp_leader"] = user_map.get(sg.get("temp_leader_id"))
                sg["temp_leader_active"] = True
            else:
                sg["temp_leader"] = None
                sg["temp_leader_active"] = False
            for mid in sg.get("member_user_ids", []):
                subgroup_member_ids.add(mid)
            if sg.get("leader_id") == uid:
                user_is_head_of_subgroup = True
        if not is_admin and not user_is_head_of_division and not user_is_head_of_subgroup:
            continue
        if not is_admin and not user_is_head_of_division and user_is_head_of_subgroup:
            div_subgroups = [sg for sg in div_subgroups if sg.get("leader_id") == uid]
            filtered_member_ids = set()
            for sg in div_subgroups:
                for mid in sg.get("member_user_ids", []):
                    filtered_member_ids.add(mid)
            main_members = []
            member_count = len(filtered_member_ids)
        else:
            main_members = [u for u in all_div_members if u["id"] not in subgroup_member_ids]
            member_count = len(all_div_members)
        groups.append({
            "division_id": div["id"],
            "division_name": div_name,
            "description": div.get("description", ""),
            "leader_id": config.get("leader_id"),
            "leader": user_map.get(config.get("leader_id")),
            "members": main_members,
            "member_count": member_count,
            "subgroups": div_subgroups,
        })

    groups.sort(key=lambda g: g["division_name"])
    return groups

@router.get("/division-groups/{division_name}")
async def get_division_group(division_name: str, current_user: dict = Depends(get_current_user)):
    division = await db.divisions.find_one({"name": division_name}, {"_id": 0})
    if not division:
        raise HTTPException(status_code=404, detail="Division not found")
    all_div_members = await db.users.find({"division": division_name}, {"_id": 0, "password_hash": 0}).to_list(200)
    config = await db.division_groups.find_one({"division_name": division_name}, {"_id": 0})
    leader_id = config.get("leader_id") if config else None
    all_users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    all_user_map = {u["id"]: u for u in all_users}
    subgroups = await db.subgroups.find({"division_name": division_name}, {"_id": 0}).to_list(100)
    subgroup_member_ids = set()
    now_str = datetime.now(timezone.utc).isoformat()
    for sg in subgroups:
        sg["members"] = [all_user_map[uid] for uid in sg.get("member_user_ids", []) if uid in all_user_map]
        sg["leader"] = all_user_map.get(sg.get("leader_id"))
        temp_end = sg.get("temp_leader_end")
        if temp_end and temp_end > now_str and sg.get("temp_leader_id"):
            sg["temp_leader"] = all_user_map.get(sg.get("temp_leader_id"))
            sg["temp_leader_active"] = True
        else:
            sg["temp_leader"] = None
            sg["temp_leader_active"] = False
        for uid in sg.get("member_user_ids", []):
            subgroup_member_ids.add(uid)
    main_members = [u for u in all_div_members if u["id"] not in subgroup_member_ids]
    return {
        "division_id": division["id"],
        "division_name": division_name,
        "description": division.get("description", ""),
        "leader_id": leader_id,
        "leader": all_user_map.get(leader_id),
        "members": main_members,
        "member_count": len(all_div_members),
        "subgroups": subgroups,
    }

@router.put("/division-groups/{division_name}/leader")
async def set_division_group_leader(division_name: str, body: dict, current_user: dict = Depends(get_current_user)):
    if not is_admin_user(current_user):
        raise HTTPException(status_code=403, detail="Only admins can set group leaders")
    division = await db.divisions.find_one({"name": division_name}, {"_id": 0})
    if not division:
        raise HTTPException(status_code=404, detail="Division not found")
    leader_id = body.get("leader_id")
    if leader_id:
        user = await db.users.find_one({"id": leader_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
    existing = await db.division_groups.find_one({"division_name": division_name})
    if existing:
        await db.division_groups.update_one(
            {"division_name": division_name},
            {"$set": {"leader_id": leader_id, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    else:
        await db.division_groups.insert_one({
            "id": generate_uuid(),
            "division_name": division_name,
            "leader_id": leader_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })
    return {"message": f"Leader set for {division_name}", "leader_id": leader_id}

@router.post("/division-groups/{division_name}/members/{user_id}")
async def add_member_to_division_group(division_name: str, user_id: str, current_user: dict = Depends(get_current_user)):
    if not is_admin_user(current_user):
        raise HTTPException(status_code=403, detail="Only admins can manage group members")
    division = await db.divisions.find_one({"name": division_name}, {"_id": 0})
    if not division:
        raise HTTPException(status_code=404, detail="Division not found")
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.users.update_one({"id": user_id}, {"$set": {"division": division_name, "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"message": f"User added to {division_name}"}

@router.delete("/division-groups/{division_name}/members/{user_id}")
async def remove_member_from_division_group(division_name: str, user_id: str, current_user: dict = Depends(get_current_user)):
    if not is_admin_user(current_user):
        raise HTTPException(status_code=403, detail="Only admins can manage group members")
    await db.users.update_one({"id": user_id}, {"$set": {"division": None, "updated_at": datetime.now(timezone.utc).isoformat()}})
    config = await db.division_groups.find_one({"division_name": division_name})
    if config and config.get("leader_id") == user_id:
        await db.division_groups.update_one(
            {"division_name": division_name},
            {"$set": {"leader_id": None, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    return {"message": f"User removed from {division_name}"}


# ============== SUBGROUPS ==============

def _check_admin_or_tech_support(current_user: dict):
    roles = current_user.get("roles", [])
    division = current_user.get("division", "")
    if "admin" in roles or "super_admin" in roles or division == "Technical Support":
        return True
    return False

@router.get("/division-groups/{division_name}/subgroups")
async def get_subgroups(division_name: str, current_user: dict = Depends(get_current_user)):
    subgroups = await db.subgroups.find({"division_name": division_name}, {"_id": 0}).to_list(100)
    all_users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    user_map = {u["id"]: u for u in all_users}
    now_str = datetime.now(timezone.utc).isoformat()
    for sg in subgroups:
        sg["members"] = [user_map[uid] for uid in sg.get("member_user_ids", []) if uid in user_map]
        sg["leader"] = user_map.get(sg.get("leader_id"))
        temp_end = sg.get("temp_leader_end")
        if temp_end and temp_end > now_str and sg.get("temp_leader_id"):
            sg["temp_leader"] = user_map.get(sg.get("temp_leader_id"))
            sg["temp_leader_active"] = True
        else:
            sg["temp_leader"] = None
            sg["temp_leader_active"] = False
    return subgroups

@router.post("/division-groups/{division_name}/subgroups")
async def create_subgroup(division_name: str, body: dict, current_user: dict = Depends(get_current_user)):
    if not _check_admin_or_tech_support(current_user):
        raise HTTPException(status_code=403, detail="Only admins or Technical Support can manage subgroups")
    division = await db.divisions.find_one({"name": division_name}, {"_id": 0})
    if not division:
        raise HTTPException(status_code=404, detail="Division not found")
    subgroup = {
        "id": generate_uuid(),
        "name": body.get("name", "New Subgroup"),
        "division_name": division_name,
        "leader_id": body.get("leader_id"),
        "member_user_ids": body.get("member_user_ids", []),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.subgroups.insert_one({**subgroup})
    return subgroup

@router.put("/subgroups/{subgroup_id}")
async def update_subgroup(subgroup_id: str, body: dict, current_user: dict = Depends(get_current_user)):
    if not _check_admin_or_tech_support(current_user):
        raise HTTPException(status_code=403, detail="Only admins or Technical Support can manage subgroups")
    sg = await db.subgroups.find_one({"id": subgroup_id}, {"_id": 0})
    if not sg:
        raise HTTPException(status_code=404, detail="Subgroup not found")
    update_dict = {}
    if "name" in body:
        update_dict["name"] = body["name"]
    if "leader_id" in body:
        update_dict["leader_id"] = body["leader_id"]
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.subgroups.update_one({"id": subgroup_id}, {"$set": update_dict})
    updated = await db.subgroups.find_one({"id": subgroup_id}, {"_id": 0})
    return updated

@router.post("/subgroups/{subgroup_id}/members/{user_id}")
async def add_subgroup_member(subgroup_id: str, user_id: str, current_user: dict = Depends(get_current_user)):
    if not _check_admin_or_tech_support(current_user):
        raise HTTPException(status_code=403, detail="Only admins or Technical Support can manage subgroups")
    sg = await db.subgroups.find_one({"id": subgroup_id}, {"_id": 0})
    if not sg:
        raise HTTPException(status_code=404, detail="Subgroup not found")
    member_ids = sg.get("member_user_ids", [])
    if user_id not in member_ids:
        member_ids.append(user_id)
        await db.subgroups.update_one({"id": subgroup_id}, {"$set": {"member_user_ids": member_ids, "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"message": "Member added to subgroup"}

@router.delete("/subgroups/{subgroup_id}/members/{user_id}")
async def remove_subgroup_member(subgroup_id: str, user_id: str, current_user: dict = Depends(get_current_user)):
    if not _check_admin_or_tech_support(current_user):
        raise HTTPException(status_code=403, detail="Only admins or Technical Support can manage subgroups")
    sg = await db.subgroups.find_one({"id": subgroup_id}, {"_id": 0})
    if not sg:
        raise HTTPException(status_code=404, detail="Subgroup not found")
    member_ids = sg.get("member_user_ids", [])
    if user_id in member_ids:
        member_ids.remove(user_id)
        await db.subgroups.update_one({"id": subgroup_id}, {"$set": {"member_user_ids": member_ids, "updated_at": datetime.now(timezone.utc).isoformat()}})
    if sg.get("leader_id") == user_id:
        await db.subgroups.update_one({"id": subgroup_id}, {"$set": {"leader_id": None}})
    return {"message": "Member removed from subgroup"}

@router.delete("/subgroups/{subgroup_id}")
async def delete_subgroup(subgroup_id: str, current_user: dict = Depends(get_current_user)):
    if not _check_admin_or_tech_support(current_user):
        raise HTTPException(status_code=403, detail="Only admins or Technical Support can manage subgroups")
    result = await db.subgroups.delete_one({"id": subgroup_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subgroup not found")
    return {"message": "Subgroup deleted"}


# ============== TEMPORARY LEADER ==============

def _can_assign_temp_leader(current_user: dict, subgroup: dict) -> bool:
    roles = current_user.get("roles", [])
    if "admin" in roles or "super_admin" in roles:
        return True
    if current_user.get("division") == "Technical Support":
        return True
    if subgroup.get("leader_id") == current_user.get("id"):
        return True
    return False

@router.post("/subgroups/{subgroup_id}/temp-leader")
async def assign_temp_leader(subgroup_id: str, body: dict, current_user: dict = Depends(get_current_user)):
    sg = await db.subgroups.find_one({"id": subgroup_id}, {"_id": 0})
    if not sg:
        raise HTTPException(status_code=404, detail="Subgroup not found")
    if not _can_assign_temp_leader(current_user, sg):
        raise HTTPException(status_code=403, detail="Only the current leader, admins, or super admins can assign a temporary leader")
    temp_leader_id = body.get("temp_leader_id")
    duration_hours = body.get("duration_hours")
    if not temp_leader_id or not duration_hours:
        raise HTTPException(status_code=400, detail="temp_leader_id and duration_hours are required")
    if duration_hours < 1:
        raise HTTPException(status_code=400, detail="Duration must be at least 1 hour")
    if temp_leader_id not in sg.get("member_user_ids", []):
        raise HTTPException(status_code=400, detail="Temporary leader must be a member of the subgroup")
    if temp_leader_id == sg.get("leader_id"):
        raise HTTPException(status_code=400, detail="Cannot assign the current leader as temporary leader")
    now = datetime.now(timezone.utc)
    end_time = now + timedelta(hours=duration_hours)
    await db.subgroups.update_one({"id": subgroup_id}, {"$set": {
        "temp_leader_id": temp_leader_id,
        "temp_leader_start": now.isoformat(),
        "temp_leader_end": end_time.isoformat(),
        "temp_leader_assigned_by": current_user.get("id"),
        "updated_at": now.isoformat(),
    }})
    return {
        "message": "Temporary leader assigned",
        "temp_leader_id": temp_leader_id,
        "temp_leader_start": now.isoformat(),
        "temp_leader_end": end_time.isoformat(),
        "duration_hours": duration_hours,
    }

@router.delete("/subgroups/{subgroup_id}/temp-leader")
async def revoke_temp_leader(subgroup_id: str, current_user: dict = Depends(get_current_user)):
    sg = await db.subgroups.find_one({"id": subgroup_id}, {"_id": 0})
    if not sg:
        raise HTTPException(status_code=404, detail="Subgroup not found")
    if not _can_assign_temp_leader(current_user, sg):
        raise HTTPException(status_code=403, detail="Only the current leader, admins, or super admins can revoke a temporary leader")
    await db.subgroups.update_one({"id": subgroup_id}, {"$set": {
        "temp_leader_id": None,
        "temp_leader_start": None,
        "temp_leader_end": None,
        "temp_leader_assigned_by": None,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }})
    return {"message": "Temporary leader revoked"}
