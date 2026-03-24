# Sentech Bursary Management System - PRD

## Original Problem Statement
Build a comprehensive bursary management system named "Sentech" using React, FastAPI, and MongoDB with modules for managing applications, users, divisions, projects, meetings, and more, with a role-based access control (RBAC) system.

## Architecture
- **Frontend:** React + Shadcn UI + Tailwind CSS
- **Backend:** FastAPI (Python)
- **Database:** MongoDB (via Motor async driver)
- **Auth:** JWT-based with Microsoft SSO support (MSAL)
- **DnD:** @dnd-kit/core (standardized across all kanban boards)

## User Roles
- `super_admin` — Full access, including Settings page
- `admin` — Most management features, excluding Settings
- `employee` — Personal dashboard, applications, training, tickets, notes, messages (restricted to division)
- `support` — Ticket management access

## Key Modules
1. **Bursary Applications** — Full lifecycle management
2. **Training Applications** — Similar to bursary, with training-specific fields
3. **Expenses** — Tabbed interface (Bursary, Training, Standalone)
4. **Training Track** — Kanban board with employee RBAC
5. **Tickets** — Full CRUD, available to employees
6. **Messages** — Conversations, group messaging, contactable-user restrictions
7. **Notes** — Personal notes with folder organization
8. **PDP (Personal Dev Plan)** — Employee-only feature
9. **Division Groups** — Division/subgroup management
10. **Users** — Admin user management with assignment filter
11. **Settings** — Super admin only

## Backend Router Architecture
```
/app/backend/
├── server.py            (~3226 lines, further extraction planned)
├── routers/
│   ├── __init__.py      (shared deps, auth, helpers, generate_excel)
│   ├── applications.py  (bursary & training CRUD, approval workflow)
│   ├── auth.py          (login, register, JWT, Microsoft SSO)
│   ├── users.py         (user CRUD, division assignment)
│   ├── messages.py      (conversations, messages, contactable-users) ← NEW
│   ├── expenses.py      (expenses CRUD, export, stats, application expenses) ← NEW
│   ├── tickets.py       (tickets CRUD, comments) ← NEW
│   ├── reports.py       (dashboard stats, report summary)
│   └── notifications.py (notifications CRUD)
```

## What's Been Implemented

### Completed (All Verified & Tested)
- ✅ Full application lifecycle (bursary + training)
- ✅ RBAC: super_admin/admin/employee role differentiation
- ✅ Sidebar visibility rules (superAdminOnly, adminOnly, employeeOnly, rbacModule)
- ✅ Employee-specific dashboard with personalized stat cards and quick actions
- ✅ Employee messaging restricted to division/subgroup contacts
- ✅ Employee ticket creation and access
- ✅ Application approval by division/subgroup heads
- ✅ Unassigned user highlighting + filter on Users page
- ✅ Expenses page rewrite with tabbed interface
- ✅ Data import: 261 users, 29 subgroups in MIB division
- ✅ Backend refactoring Parts 1-3 (auth, applications, users, messages, expenses, tickets extracted)
- ✅ ProspectsPage DnD migration from react-beautiful-dnd to @dnd-kit

### Test Credentials
- **Super Admin:** jane.smith@uct.ac.za / securepass123
- **Admin:** test.admin@sentech.co.za / password
- **Employee:** test.employee@sentech.co.za / password

## Prioritized Backlog

### P1 (Next Up)
- Continue server.py refactoring: Extract notes, settings, events, files, tasks, projects, leads, sponsors, BBBEE, PDP, divisions routes
- Target: server.py < 500 lines (just models + app setup)

### P2 (Future)
- Refactor file uploads to chunked multipart endpoint
- Audit log feature for admin actions
- Scheduled auto-export weekly XLSX reports to admins
- ProspectsPage drag-and-drop: verify drag between columns works smoothly

## 3rd Party Integrations
- **recharts** — Charts/graphing
- **@dnd-kit/core** — Drag and drop (standardized)
- **openpyxl** — Excel export/import
- **howler** — Notification sounds
- **msal-react** — Microsoft authentication

## Key API Endpoints
- `PUT /api/applications/{id}/update-status` — Division/subgroup head approval
- `GET /api/messages/contactable-users` — Employee-restricted contact list
- `POST /api/tasks/{task_id}/assign` — Training module assignment
- `GET /api/expenses/application-expenses` — Linked application expenses
- `POST /api/tickets` — Employee ticket creation (no admin restriction)
