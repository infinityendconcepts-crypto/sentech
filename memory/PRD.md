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
- XLSX user import template, batch actions (activate/deactivate/delete)
- RBAC-based sidebar navigation

### Application Lifecycle (Bursary & Training)
- Full CRUD for both bursary and training applications
- Batch delete, admin "Add Application" button
- Period settings (open/closed, deadline, close-days-before)
- Status banner, submission deadline enforcement
- Re-edit request/approval flow with email + internal notifications
- Employee sees only own applications

### Expenses Page (Rewritten)
- 3 tabs: Bursary Application, Training Application, Standalone Expenses
- Submit expense flow: select an available application, then add flights/accommodation/car hire/catering
- Shows requested amount from the application
- Comprehensive filters: search, status, date from/to, amount min/max
- Grand total row, stats cards (Requested Amount, Total Expenses, Count)
- XLSX export per tab

### Settings
- Role management with granular RBAC
- Dynamic page/form field configuration
- Dashboard preferences

### Reports & Expenses
- Zoomable charts, XLSX export with date-range filters

### Backend Architecture (Refactored)
```
/app/backend/
├── server.py              (~3911 lines, down from ~5100)
├── routers/
│   ├── __init__.py        (Shared: db, auth, helpers, email)
│   ├── auth.py            (Registration, Login, SSO, OTP)
│   ├── applications.py    (Bursary + Training + Settings + Expenses)
│   ├── users.py           (CRUD, Documents, Batch, Import)
│   ├── reports.py         (Dashboard charts)
│   └── notifications.py   (Notification CRUD)
└── requirements.txt
```

### Other Modules
- Training Track (Kanban with @dnd-kit, user assignment)
- Meetings, Events, Messages, Notes, Tickets
- MICTSETA Docs, Files, Division Groups
- Prospects (Kanban - needs DND migration)
- BBBEE management, Help & Support (FAQs)

## Key API Endpoints
- `POST /api/auth/login` — JWT login
- `GET/POST/PUT/DELETE /api/applications` — Bursary CRUD
- `GET/POST/PUT/DELETE /api/training-applications` — Training CRUD
- `GET/PUT /api/application-settings` — Period management
- `GET /api/expenses/available-applications` — Apps for expense submission
- `GET /api/expenses/application-expenses` — All app expenses with requested_amount
- `POST /api/users/batch-action` — Batch user operations

## Pending Tasks

### P1: Continue server.py Refactoring
- Extract Expenses routes into routers/expenses.py
- Extract Messages, Notes, Tickets into separate routers
- Extract BBBEE, Settings, Events, Meetings routes

### P2: Future Tasks
- Replace base64 uploads with chunked multipart endpoint
- Audit Log feature for admin actions
- Scheduled auto-export weekly XLSX reports
- ProspectsPage DND migration (react-beautiful-dnd -> @dnd-kit)

## Mocked/Partial
- **Email:** SMTP not configured — logs to console (intended behavior)
