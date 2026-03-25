# Sentech Bursary Management System - PRD

## Original Problem Statement
Build a comprehensive bursary management system named "Sentech" using React, FastAPI, and MongoDB. The system features modules for managing applications, users, divisions, projects, meetings, tickets, and interactive reports, governed by a strict and granular Role-Based Access Control (RBAC) system involving super_admins, admins, division/subgroup heads, and standard employees.

## Architecture
- **Frontend**: React + Tailwind + Shadcn UI
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **Auth**: JWT-based with RBAC (super_admin, admin, head, student/employee)

### Backend Structure (Post-Refactoring - March 2026)
```
/app/backend/
  server.py          # 71 lines - App init, CORS, router registration, shutdown
  schemas.py         # 1093 lines - All Pydantic models
  routers/
    __init__.py      # Shared deps: db, auth, helpers (generate_excel/pdf, send_email)
    auth.py          # Login, register, password setup
    users.py         # Users CRUD, CSV import, profile
    applications.py  # Bursary & training apps, settings, period settings, lock/unlock
    messages.py      # Conversations, DMs
    expenses.py      # Expense tracking
    tickets.py       # Support tickets
    reports.py       # Dashboard stats, interactive reports, chart export
    notifications.py # Notifications CRUD
    teams.py         # Teams CRUD + members
    meetings.py      # Meetings CRUD + calendar events
    notes.py         # Notes + folders + sharing
    files.py         # Files + folders + upload
    tasks.py         # Tasks CRUD + assign + export (Excel/PDF)
    projects.py      # Projects + Clients + Leads + Prospects + Sponsors
    events.py        # Events CRUD
    pdp.py           # Personal Development Plans
    divisions.py     # Divisions, Departments, Division Groups, Subgroups, Temp Leaders
    settings.py      # System Settings, Roles, Dashboard Prefs, FAQs, BBBEE, Report Export
```

## Implemented Features
- Full user management with CSV bulk import
- Bursary & Training application workflows with multi-step forms
- Application lock/unlock system for admins/heads
- Period settings enforcement (disabling new apps when closed)
- Notification system with clickable navigation to specific items
- Interactive reports with demographic filters, multi-select, and chart export
- Division Groups with subgroups, leaders, temp leaders
- RBAC: Heads see only their division/subgroup data
- Events, Meetings, Notes, Files, Tasks, Projects, PDP modules
- Ticket system with comments and assignments
- Real-time messaging system
- Settings management (SMTP, company info, roles)

## Completed in This Session (March 25, 2026)
- **Backend Refactoring Complete**: server.py reduced from 3248 lines to 71 lines
- All routes extracted into 18 modular router files
- All Pydantic models moved to schemas.py
- 49/49 backend tests passed (100% success rate)

## P2 Backlog
1. **Refactor File Uploads**: Replace base64 submissions with chunked multipart
2. **Audit Log Feature**: Track all admin/super_admin actions
3. **Scheduled Auto-Export**: Background job for weekly XLSX summary reports

## Test Credentials
- Super Admin: jane.smith@uct.ac.za / securepass123
- Admin: test.admin@sentech.co.za / password
- Employee: test.employee@sentech.co.za / password
- Head (MIB): mothibik@sentech.co.za / password

## Mocked Services
- Email delivery (SMTP) is simulated, not actually sent
