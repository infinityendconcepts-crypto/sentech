"""Sentech Bursary Management System - Main Application Entry Point"""
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
import sys

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')
sys.path.insert(0, str(ROOT_DIR))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Sentech Bursary Management System")

# Import all routers
from routers.auth import router as auth_router
from routers.users import router as users_router
from routers.applications import router as applications_router
from routers.messages import router as messages_router
from routers.expenses import router as expenses_router
from routers.tickets import router as tickets_router
from routers.reports import router as reports_router
from routers.notifications import router as notifications_router
from routers.teams import router as teams_router
from routers.meetings import router as meetings_router
from routers.notes import router as notes_router
from routers.files import router as files_router
from routers.tasks import router as tasks_router
from routers.projects import router as projects_router
from routers.events import router as events_router
from routers.pdp import router as pdp_router
from routers.divisions import router as divisions_router
from routers.settings import router as settings_router

# Register all routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(applications_router)
app.include_router(messages_router)
app.include_router(expenses_router)
app.include_router(tickets_router)
app.include_router(reports_router)
app.include_router(notifications_router)
app.include_router(teams_router)
app.include_router(meetings_router)
app.include_router(notes_router)
app.include_router(files_router)
app.include_router(tasks_router)
app.include_router(projects_router)
app.include_router(events_router)
app.include_router(pdp_router)
app.include_router(divisions_router)
app.include_router(settings_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import client as db_client

@app.on_event("shutdown")
async def shutdown_db_client():
    db_client.close()
