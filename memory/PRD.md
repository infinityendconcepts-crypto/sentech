# Sentech Bursary Management System - PRD

## Original Problem Statement
Build a comprehensive bursary management system named "Sentech" using React, FastAPI, and MongoDB with modules for managing applications, users, divisions, projects, meetings, and more, with RBAC.

## Core Architecture
- **Frontend:** React + Shadcn/UI + Tailwind CSS
- **Backend:** FastAPI + Motor (async MongoDB)
- **Database:** MongoDB
- **Auth:** JWT + Microsoft SSO + Email OTP

## Test Users
| Role | Email | Password |
|------|-------|----------|
| Super Admin | jane.smith@uct.ac.za | securepass123 |
| Admin | test.admin@sentech.co.za | password |
| Employee | test.employee@sentech.co.za | password |

## Completed Features

### Dashboard
- Dynamic widgets: Total/Pending/Approved applications, Training Apps, Open Tickets, Notifications
- Recent Activity feed, Quick Actions

### User Management
- Search, filter, pagination ("show X per page")
- XLSX user import template
- Batch actions: activate/deactivate/delete via checkboxes
- RBAC-based sidebar navigation

### Application Lifecycle (Bursary & Training)
- Full CRUD for both bursary and training applications
- Batch delete for admins
- Application period settings (open/closed, deadline, close-days-before)
- Status banner showing open/closed + deadline
- Submission disabled when deadline passed (non-admin)
- Re-edit request/approval flow with email + internal notifications
- Admin can add, edit, delete applications on behalf of users
- Employee sees only their own applications
- Edit button on UserProfilePage navigates to correct edit page
- Additional expenses management (flights, accommodation, car hire, catering)

### Settings
- Role management with granular RBAC permissions
- Dynamic page/form field configuration
- Dashboard preferences

### Reports & Expenses
- Zoomable charts (recharts)
- XLSX export with date-range filters

### Backend Architecture (Refactored)
```
/app/backend/
├── server.py              (~4240 lines, down from ~5100)
├── routers/
│   ├── __init__.py        (Shared: db, auth, helpers)
│   ├── auth.py            (Registration, Login, SSO, OTP)
│   ├── applications.py    (Bursary + Training + Settings + Expenses)
│   ├── reports.py         (Dashboard charts)
│   └── notifications.py   (Notification CRUD)
└── requirements.txt
```

### Other Modules
- Training Track (Kanban with @dnd-kit, user assignment)
- Meetings, Events, Messages, Notes, Tickets
- MICTSETA Docs, Files, Division Groups
- Prospects (Kanban with react-beautiful-dnd - needs migration)
- BBBEE management
- Help & Support (FAQs)

## Key API Endpoints (Router-based)
- `POST /api/auth/login` — JWT login
- `POST /api/auth/register` — Registration
- `GET/POST/PUT/DELETE /api/applications` — Bursary applications CRUD
- `POST /api/applications/batch-delete` — Batch delete bursary apps
- `GET/POST/PUT/DELETE /api/training-applications` — Training apps CRUD
- `POST /api/training-applications/batch-delete` — Batch delete training apps
- `GET/PUT /api/application-settings` — Period management
- `POST /api/applications/{id}/request-re-edit` — Re-edit request
- `POST /api/users/batch-action` — Batch user operations
- `POST /api/files/upload` — Chunked file upload

## Pending Tasks

### P1: Continue server.py Refactoring
- Extract Users routes into routers/users.py
- Extract Messages, Notes, Tickets into separate routers
- Extract BBBEE, Settings, Events, Meetings routes

### P2: Future Tasks
- Replace base64 uploads with chunked multipart endpoint
- Audit Log feature for admin actions
- Scheduled auto-export weekly XLSX reports
- ProspectsPage DND migration (react-beautiful-dnd → @dnd-kit)

## Mocked/Partial
- **Email:** SMTP not configured — logs to console (intended behavior)
