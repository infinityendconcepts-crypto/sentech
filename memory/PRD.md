# Sentech Bursary Management System - PRD

## Original Problem Statement
Build a comprehensive bursary management system named "Sentech" using React, FastAPI, and MongoDB with modules for managing applications, users, divisions, projects, meetings, and more, with a role-based access control (RBAC) system.

## Architecture
- **Frontend:** React + Shadcn UI + Tailwind CSS + Recharts
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
2. **Training Applications** — Training-specific fields
3. **Expenses** — Tabbed interface (Bursary, Training, Standalone)
4. **Training Track** — Kanban board with employee RBAC
5. **Tickets** — Auto-routing & escalation system
6. **Messages** — Conversations, group messaging, contactable-user restrictions
7. **Notes** — Personal notes with folder organization
8. **PDP** — Employee-only feature
9. **Division Groups** — Division/subgroup management
10. **Users** — Admin user management with assignment filter
11. **Settings** — Super admin only
12. **Reports & Analytics** — Interactive charts with demographic filtering

## Ticket Routing & Escalation System
| Category | Routed To | Assigned To |
|---|---|---|
| Training Application | Subgroup/Division Head | Specific head user |
| Bursary Application | Subgroup/Division Head | Specific head user |
| HR Query | Admin pool | None (all admins see it) |
| Technical Support | Admin pool | None (all admins/super_admins see it) |

Heads can escalate Training/Bursary tickets to HR Query or Technical Support.

## Interactive Reports System (NEW)
- **Filters**: Division, Department/Subgroup, Application Status, Date From, Date To
- **Chart Types**: Pie, Bar, Horizontal Bar, Line, Area, Donut (switchable per chart)
- **Tabs**: Demographics, Applications, Expenses, Tickets
- **Export**: Filtered Excel with multi-sheet output (Users, Bursary, Training, Expenses, Tickets)
- **Zoom**: Click to enlarge any chart in a modal
- **Udemy Link**: External link to udemy.com

## Backend Router Architecture
```
/app/backend/
├── server.py            (~3226 lines)
├── routers/
│   ├── __init__.py      (shared deps, auth, helpers, generate_excel)
│   ├── applications.py  (bursary & training CRUD, approval workflow)
│   ├── auth.py          (login, register, JWT, Microsoft SSO)
│   ├── users.py         (user CRUD, division assignment)
│   ├── messages.py      (conversations, messages, contactable-users)
│   ├── expenses.py      (expenses CRUD, export, stats)
│   ├── tickets.py       (tickets CRUD, comments, auto-routing, escalation)
│   ├── reports.py       (interactive data, filtered export, dashboard stats)
│   └── notifications.py (notifications CRUD)
```

## What's Been Implemented (All Verified & Tested)
- Full application lifecycle (bursary + training)
- RBAC: super_admin/admin/employee differentiation
- Employee-specific dashboard, messaging restrictions, ticket access
- Application approval by division/subgroup heads
- Ticket routing (auto-assign to heads or admin pool) + escalation
- Expenses page with tabbed interface
- Data import: 261 users, 29 subgroups in MIB division
- Backend refactoring Parts 1-3 (8 router files extracted)
- ProspectsPage DnD migration to @dnd-kit
- Interactive Reports: 5 filters, 6 chart types, 4 tabs, filtered Excel export, Udemy link

### Test Credentials
- **Super Admin:** jane.smith@uct.ac.za / securepass123
- **Admin:** test.admin@sentech.co.za / password
- **Employee (Technology):** test.employee@sentech.co.za / password
- **Employee (MIB):** mokoenam@sentech.co.za / password
- **Subgroup Head (MIB):** mothibik@sentech.co.za / password

## Prioritized Backlog
### P1
- Continue server.py refactoring: Extract notes, settings, events, files, tasks, projects, leads, BBBEE, PDP, divisions routes
### P2
- Refactor file uploads to chunked multipart
- Audit log for admin actions
- Scheduled auto-export weekly XLSX reports
