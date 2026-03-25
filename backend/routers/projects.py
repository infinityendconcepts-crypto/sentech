"""Projects + Clients + Leads + Prospects + Sponsors routes"""
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from typing import Optional
from . import db, get_current_user, generate_uuid
from schemas import (Project, ProjectCreate, ProjectUpdate, Client, ClientCreate,
                     Lead, LeadCreate, LeadUpdate, Prospect, ProspectCreate, ProspectUpdate,
                     Sponsor, SponsorCreate, SponsorUpdate, SponsorContact, SponsorContactCreate)

router = APIRouter(prefix="/api", tags=["projects"])

# ── Projects ──

@router.get("/projects")
async def get_projects(status: Optional[str] = None, project_type: Optional[str] = None,
                       client_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if status: query["status"] = status
    if project_type: query["project_type"] = project_type
    if client_id: query["client_id"] = client_id
    return await db.projects.find(query, {"_id": 0}).to_list(1000)

@router.get("/projects/{project_id}")
async def get_project(project_id: str, current_user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project: raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.post("/projects")
async def create_project(project_data: ProjectCreate, current_user: dict = Depends(get_current_user)):
    project = Project(**project_data.model_dump(), created_by=current_user["id"])
    if project.client_id:
        client = await db.clients.find_one({"id": project.client_id}, {"_id": 0, "name": 1})
        if client: project.client_name = client.get("name")
    project_dict = project.model_dump()
    project_dict['created_at'] = project_dict['created_at'].isoformat()
    project_dict['updated_at'] = project_dict['updated_at'].isoformat()
    for field in ['start_date', 'end_date', 'deadline']:
        if project_dict.get(field): project_dict[field] = project_dict[field].isoformat()
    await db.projects.insert_one({**project_dict})
    return project

@router.put("/projects/{project_id}")
async def update_project(project_id: str, update_data: ProjectUpdate, current_user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project: raise HTTPException(status_code=404, detail="Project not found")
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    for field in ['start_date', 'end_date', 'deadline']:
        if field in update_dict and isinstance(update_dict[field], datetime):
            update_dict[field] = update_dict[field].isoformat()
    await db.projects.update_one({"id": project_id}, {"$set": update_dict})
    return {"message": "Project updated successfully"}

@router.delete("/projects/{project_id}")
async def delete_project(project_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.projects.delete_one({"id": project_id})
    if result.deleted_count == 0: raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted successfully"}

# ── Clients ──

@router.get("/clients")
async def get_clients(current_user: dict = Depends(get_current_user)):
    return await db.clients.find({}, {"_id": 0}).to_list(1000)

@router.post("/clients")
async def create_client(client_data: ClientCreate, current_user: dict = Depends(get_current_user)):
    client = Client(**client_data.model_dump(), created_by=current_user["id"])
    client_dict = client.model_dump()
    client_dict['created_at'] = client_dict['created_at'].isoformat()
    client_dict['updated_at'] = client_dict['updated_at'].isoformat()
    await db.clients.insert_one({**client_dict})
    return client

# ── Leads ──

@router.get("/leads")
async def get_leads(status: Optional[str] = None, source: Optional[str] = None,
                    assigned_to: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if status: query["status"] = status
    if source: query["source"] = source
    if assigned_to: query["assigned_to"] = assigned_to
    return await db.leads.find(query, {"_id": 0}).to_list(1000)

@router.get("/leads/{lead_id}")
async def get_lead(lead_id: str, current_user: dict = Depends(get_current_user)):
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead: raise HTTPException(status_code=404, detail="Lead not found")
    return lead

@router.post("/leads")
async def create_lead(lead_data: LeadCreate, current_user: dict = Depends(get_current_user)):
    lead = Lead(**lead_data.model_dump(), created_by=current_user["id"])
    if lead.assigned_to:
        assignee = await db.users.find_one({"id": lead.assigned_to}, {"_id": 0, "full_name": 1})
        if assignee: lead.assignee_name = assignee.get("full_name")
    lead_dict = lead.model_dump()
    lead_dict['created_at'] = lead_dict['created_at'].isoformat()
    lead_dict['updated_at'] = lead_dict['updated_at'].isoformat()
    for field in ['last_contact_date', 'next_follow_up']:
        if lead_dict.get(field): lead_dict[field] = lead_dict[field].isoformat()
    await db.leads.insert_one({**lead_dict})
    return lead

@router.put("/leads/{lead_id}")
async def update_lead(lead_id: str, update_data: LeadUpdate, current_user: dict = Depends(get_current_user)):
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead: raise HTTPException(status_code=404, detail="Lead not found")
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    if update_data.assigned_to:
        assignee = await db.users.find_one({"id": update_data.assigned_to}, {"_id": 0, "full_name": 1})
        if assignee: update_dict["assignee_name"] = assignee.get("full_name")
    await db.leads.update_one({"id": lead_id}, {"$set": update_dict})
    return await db.leads.find_one({"id": lead_id}, {"_id": 0})

@router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.leads.delete_one({"id": lead_id})
    if result.deleted_count == 0: raise HTTPException(status_code=404, detail="Lead not found")
    return {"message": "Lead deleted successfully"}

# ── Prospects ──

@router.get("/prospects")
async def get_prospects(status: Optional[str] = None, interest_level: Optional[str] = None,
                        current_user: dict = Depends(get_current_user)):
    query = {}
    if status: query["status"] = status
    if interest_level: query["interest_level"] = interest_level
    return await db.prospects.find(query, {"_id": 0}).to_list(1000)

@router.post("/prospects")
async def create_prospect(prospect_data: ProspectCreate, current_user: dict = Depends(get_current_user)):
    prospect = Prospect(**prospect_data.model_dump(), created_by=current_user["id"])
    prospect_dict = prospect.model_dump()
    prospect_dict['created_at'] = prospect_dict['created_at'].isoformat()
    prospect_dict['updated_at'] = prospect_dict['updated_at'].isoformat()
    if prospect_dict.get('next_action_date'): prospect_dict['next_action_date'] = prospect_dict['next_action_date'].isoformat()
    await db.prospects.insert_one({**prospect_dict})
    return prospect

@router.put("/prospects/{prospect_id}")
async def update_prospect(prospect_id: str, update_data: ProspectUpdate, current_user: dict = Depends(get_current_user)):
    prospect = await db.prospects.find_one({"id": prospect_id}, {"_id": 0})
    if not prospect: raise HTTPException(status_code=404, detail="Prospect not found")
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    if 'next_action_date' in update_dict and isinstance(update_dict['next_action_date'], datetime):
        update_dict['next_action_date'] = update_dict['next_action_date'].isoformat()
    await db.prospects.update_one({"id": prospect_id}, {"$set": update_dict})
    return {"message": "Prospect updated successfully"}

@router.delete("/prospects/{prospect_id}")
async def delete_prospect(prospect_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.prospects.delete_one({"id": prospect_id})
    if result.deleted_count == 0: raise HTTPException(status_code=404, detail="Prospect not found")
    return {"message": "Prospect deleted successfully"}

# ── Sponsors ──

@router.get("/sponsors")
async def get_sponsors(status: Optional[str] = None, type: Optional[str] = None,
                       current_user: dict = Depends(get_current_user)):
    query = {}
    if status: query["status"] = status
    if type: query["type"] = type
    return await db.sponsors.find(query, {"_id": 0}).to_list(1000)

@router.get("/sponsors/{sponsor_id}")
async def get_sponsor(sponsor_id: str, current_user: dict = Depends(get_current_user)):
    sponsor = await db.sponsors.find_one({"id": sponsor_id}, {"_id": 0})
    if not sponsor: raise HTTPException(status_code=404, detail="Sponsor not found")
    return sponsor

@router.post("/sponsors")
async def create_sponsor(sponsor_data: SponsorCreate, current_user: dict = Depends(get_current_user)):
    sponsor = Sponsor(**sponsor_data.model_dump(), created_by=current_user["id"])
    sponsor_dict = sponsor.model_dump()
    sponsor_dict['created_at'] = sponsor_dict['created_at'].isoformat()
    sponsor_dict['updated_at'] = sponsor_dict['updated_at'].isoformat()
    await db.sponsors.insert_one({**sponsor_dict})
    return sponsor

@router.put("/sponsors/{sponsor_id}")
async def update_sponsor(sponsor_id: str, update_data: SponsorUpdate, current_user: dict = Depends(get_current_user)):
    sponsor = await db.sponsors.find_one({"id": sponsor_id}, {"_id": 0})
    if not sponsor: raise HTTPException(status_code=404, detail="Sponsor not found")
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.sponsors.update_one({"id": sponsor_id}, {"$set": update_dict})
    return {"message": "Sponsor updated successfully"}

@router.delete("/sponsors/{sponsor_id}")
async def delete_sponsor(sponsor_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.sponsors.delete_one({"id": sponsor_id})
    if result.deleted_count == 0: raise HTTPException(status_code=404, detail="Sponsor not found")
    return {"message": "Sponsor deleted successfully"}

@router.get("/sponsors/{sponsor_id}/contacts")
async def get_sponsor_contacts(sponsor_id: str, current_user: dict = Depends(get_current_user)):
    return await db.sponsor_contacts.find({"sponsor_id": sponsor_id}, {"_id": 0}).to_list(100)

@router.post("/sponsors/contacts")
async def create_sponsor_contact(contact_data: SponsorContactCreate, current_user: dict = Depends(get_current_user)):
    contact = SponsorContact(**contact_data.model_dump(), created_by=current_user["id"])
    contact_dict = contact.model_dump()
    contact_dict['created_at'] = contact_dict['created_at'].isoformat()
    contact_dict['updated_at'] = contact_dict['updated_at'].isoformat()
    await db.sponsor_contacts.insert_one({**contact_dict})
    return contact
