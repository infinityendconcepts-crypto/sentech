# Sentech Bursary Management System - PRD

## Original Problem Statement
Build a comprehensive bursary management system named "Sentech" using React, FastAPI, and MongoDB with modules for applications, users, divisions, projects, meetings, and role-based access control.

## Technology Stack
- **Frontend:** React, Shadcn UI, Recharts, @dnd-kit
- **Backend:** FastAPI, Pydantic, Motor (MongoDB async)
- **Database:** MongoDB
- **Auth:** JWT + Microsoft Entra ID SSO + OTP

## Core Modules
Dashboard, Bursary Applications, Training Applications, BBBEE, Training Track, Meetings, Events, Messages, Division Groups, Tickets, Expenses, Reports, MICTSETA Documents, Help & Support, Settings, Users, User Profile, PDP, Notifications, Notes

## Hidden/Removed Pages
- Leads, Notes, Prospects (hidden from nav)
- Projects (removed from sidebar + Quick Add + dashboard)

## What's Been Implemented

### Foundation (Sessions 1-2)
- Full auth (JWT + Microsoft SSO + OTP + first-time password setup)
- RBAC (super_admin/admin/employee + granular permissions)
- Bursary + Training application workflows
- Training Track (Kanban/List/Gantt), PDP w/ Excel import
- MICTSETA Documents, Division Groups, Notifications, Messaging, Notes
- Application re-edit system, Post-submission expenses
- Settings & RBAC permission matrix

### Session 3 - Feb 2026

**Dashboard Overhaul (DONE)**
- 6 stat cards, real Recent Activity feed, Notifications widget, Report Summary (admin), Quick Actions

**Training Track User Assignment (DONE)**
- Admins/division heads assign users via searchable dialog

**User Import Feature (DONE)**
- XLSX template download, CSV import with results

**Reports Chart Enhancement (DONE)**
- Zoom/expand charts, date range filters, XLSX export for all report types

**Expenses Enhancement (DONE)**
- XLSX export, date range filters, active filter badges

**Quick Add Cleanup (DONE)**
- Removed "New Lead" and "New Project" from header

**Users Page Batch Operations (DONE)**
- Pagination: 10/25/50/100 per page selector
- Batch selection: checkboxes per row + select all
- Batch actions bar: Activate / Deactivate / Delete selected users
- Backend: POST /api/users/batch-action

**Dynamic Page Configuration (DONE)**
- Settings > Page Settings: Module visibility toggles
- Field config for Bursary, Training, PDP pages
- Each field: editable label, required toggle, visibility toggle
- PageFieldConfig reusable component

**Frontend RBAC Enforcement (DONE)**
- Sidebar nav items filtered by role_permissions
- Login response enriched with aggregated role_permissions from user's roles
- hasModuleAccess() check for each nav item

**Server.py Refactoring (DONE)**
- Extracted to routers/reports.py: Dashboard stats, recent activity, report summary, dashboard charts
- Extracted to routers/notifications.py: CRUD notifications, unread count, mark read/all
- Shared deps in routers/__init__.py: db, auth, helpers
- server.py reduced from 5286 to 4970 lines

**File Upload Refactoring (DONE)**
- New POST /api/files/upload endpoint accepts multipart form data
- Supports files up to 20MB
- Frontend filesAPI.upload() method added

## Architecture
```
/app/backend/
├── server.py          (4970 lines - main routes)
├── routers/
│   ├── __init__.py    (shared deps: db, auth, helpers)
│   ├── reports.py     (dashboard + reports endpoints)
│   └── notifications.py (notification CRUD)
/app/frontend/src/
├── pages/             (all page components)
├── components/
│   ├── Layout/        (Header, Layout with RBAC nav)
│   └── ui/            (Shadcn components)
├── services/api.js    (all API endpoints)
└── contexts/          (AuthContext)
```

## Key API Endpoints
- Auth: POST /api/auth/login (returns role_permissions)
- Dashboard: GET /api/dashboard/stats, /recent-activity, /report-summary
- Notifications: GET/PUT/DELETE /api/notifications (in routers/notifications.py)
- Reports: GET /api/reports/dashboard, /export/{type}
- Users: POST /api/users/batch-action, GET /api/users/import-template
- Tasks: POST /api/tasks/{id}/assign
- Files: POST /api/files/upload (multipart)
- Expenses: GET /api/expenses/export/excel

## Pending/Future Tasks
- ProspectsPage DnD fix (deferred by user)
- Further server.py decomposition (more routers for users, tasks, applications)
- WebSocket for real-time messaging
- Microsoft Teams API integration

## Credentials
- Super Admin: jane.smith@uct.ac.za / securepass123
