# Sentech Bursary Management System - PRD

## Original Problem Statement
Build a comprehensive bursary management system named "Sentech" using React, FastAPI, and MongoDB with modules for applications, users, divisions, projects, meetings, and role-based access control.

## Core Requirements
- **Technology Stack:** React, FastAPI, MongoDB
- **Branding:** "Sentech" with blue (#0056B3) and gray scheme
- **Authentication:** Microsoft Entra ID SSO, email/password, First-time Password Setup

## Core Modules
Dashboard, Bursary Applications, Training Applications, BBBEE, Training Track, Meetings, Events, Messages, Division Groups, Tickets, Expenses, Reports, MICTSETA Documents, Help & Support, Settings, Users, User Profile, PDP, Notifications, Notes

## Hidden/Removed Pages
- Leads, Notes, Prospects (hidden from nav)
- Projects (removed from sidebar and Quick Add per user request)

## What's Been Implemented

### Session 1-2 (Previous)
- Full auth system (JWT + Microsoft SSO + OTP)
- RBAC (super_admin/admin/employee)
- Full bursary + training application workflows
- Training Track (Kanban, List, Gantt views)
- PDP with Excel import
- MICTSETA Documents, Division Groups, Notifications, Messaging, Notes
- Application re-edit system with 24hr time lock
- User management with all HR dataset fields
- Post-submission expenses (Flights, Accommodation, Car Hire, Catering)

### Session 3 (Current - Feb 2026)

**Dashboard Overhaul (DONE)**
- 6 stat cards: Total/Pending/Approved Applications, Training Apps, Open Tickets, Unread Notifications
- Real Recent Activity feed from backend
- Notifications widget with unread badge
- Report Summary card (admin only)
- Quick Actions: New Application, Training Apps, BBBEE, Reports
- Removed Projects and Sponsors from dashboard
- Backend: GET /api/dashboard/stats, /recent-activity, /report-summary

**Training Track User Assignment (DONE)**
- Admins/division heads assign users to training modules
- Searchable dialog with checkbox selection
- Unassign capability + notifications to assigned users
- Backend: POST /api/tasks/{id}/assign, DELETE /api/tasks/{id}/assign/{user_id}

**User Import Feature (DONE)**
- XLSX template download (18 columns with formatted headers)
- CSV import with results display
- Template + Import buttons in UsersPage header
- Backend: GET /api/users/import-template (XLSX), POST /api/users/bulk-import

**Reports Chart Enhancement (DONE)**
- Zoom/expand button on chart cards
- Full-screen modal dialog for enlarged charts
- Date range filter for exports (From/To)
- Expanded XLSX export: Bursary Applications, Training Applications, Expenses, Users, Tickets
- CSV and JSON export options
- Backend: /api/reports/export/{type} with date_from, date_to params

**Expenses Page Enhancement (DONE)**
- XLSX export button with tab-aware export (Additional/Bursary/Training)
- Date range filters (From/To)
- Active filter badges with individual clear buttons + Clear All
- Backend: GET /api/expenses/export/excel, GET /api/expenses with date_from/date_to

**Quick Add Cleanup (DONE)**
- Removed "New Lead" and "New Project" from header Quick Add menu
- 6 items remain: Task, Note, Meeting, Ticket, Expense, Message

## Pending/Future Tasks

### P1 - Upcoming
- ProspectsPage DnD fix: Migrate react-beautiful-dnd to @dnd-kit

### P2 - Future
- Dynamic Page Configuration: Settings UI for PDP/Bursary/Training field customization
- Frontend RBAC Enforcement: Hide/disable UI by role permissions
- Refactor server.py (5100+ lines) into separate routers
- Refactor file uploads to chunked multipart

## Key API Endpoints
- Dashboard: GET /api/dashboard/stats, /recent-activity, /report-summary
- Tasks: POST /api/tasks/{id}/assign, DELETE /api/tasks/{id}/assign/{user_id}
- Users: GET /api/users/import-template (XLSX), POST /api/users/bulk-import
- Expenses: GET /api/expenses (date_from/date_to), GET /api/expenses/export/excel
- Reports: GET /api/reports/export/{type}?format=excel&date_from=X&date_to=Y
- Applications: Full CRUD + expenses + re-edit
- Settings: GET/PUT /api/settings, roles CRUD

## Credentials
- Super Admin: jane.smith@uct.ac.za / securepass123
