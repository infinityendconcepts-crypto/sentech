# Sentech Bursary Management System - PRD

## Original Problem Statement
Create a comprehensive bursary management system named "Sentech" with React, FastAPI, and MongoDB.

## Core Requirements
- **Technology Stack:** React, FastAPI, MongoDB
- **Branding:** "Sentech" with blue (#0056B3) and gray color scheme
- **Authentication:** Microsoft Entra ID SSO, standard email/password, First-time Password Setup

## Core Modules (Pages)
- Dashboard, Bursary Applications, Training Applications, Sponsors, BBBEE, Projects
- Training Track (formerly Tasks), Meetings, Events, Messages, Division Groups
- Tickets, Expenses, Reports, MICTSETA Documents, Help and Support
- Settings, Users, User Profile, Personal Development Plan (PDP), Notifications, Notes

## Hidden Pages (Per User Request)
- Leads, Notes, Prospects (hidden from navigation)

## User Personas & Roles
- **Super Admin:** Highest access level
- **Admin:** Full access to all modules
- **Manager, Professional, Technician, Clerical, Employee**

## What's Been Implemented

### Core Features (Complete)
- User authentication (JWT + Microsoft SSO + OTP)
- Role-based access control (super_admin/admin/employee)
- Dashboard with stats and quick actions
- Full bursary application management workflow
- Training application module with conditional logic
- Training Track (Kanban, List, Gantt views)
- Personal Development Plan (PDP) with Excel import
- MICTSETA Documents with category-based structure
- Division Groups with subgroups and leaders
- JIT Temporary Leader feature

### Notification System (NEW - Feb 2026) ✅
- NotificationsPage with filter tabs (All, Unread, Messages, Meetings, Status, Tickets)
- Bell icon in header with unread count badge and sound
- Polling every 15 seconds for new notifications
- Notifications triggered by: new messages, meeting invites, ticket status changes, ticket comments, application status changes (bursary + training)
- Mark read/unread, mark all read, delete notifications
- Click notification to navigate to relevant page

### Enhanced Messaging System (NEW - Feb 2026) ✅
- New Chat dialog with 3 tabs: Individual, Division, Subgroup
- Individual: search users and start direct conversations
- Division: select a division to message all members
- Subgroup: select a subgroup to message its members
- Real-time message display with read receipts
- Unread count tracking per conversation

### Notes Page (Complete - Feb 2026) ✅
- Full CRUD: create, read, update, delete notes
- Folders with color coding
- Tags support
- Color-coded notes
- Pin/unpin notes
- Shared notes tab
- Search across notes and tags

### Users Page (Complete - Feb 2026) ✅
- Table view with: Employee, Division, Department, Position, Role, Status
- View Details dialog with 4 sections:
  - Personal Info (Full Name, Surname, ID Number, Gender, Race, Age)
  - Employment Info (Personnel Number, Division, Department, Position, Level, Start Date, Years of Service)
  - OFO Classification (Major Group, Sub Major Group, Occupation, OFO Code)
  - System Info (Roles, Status, Password Setup)
- Edit user (Division, Department, Position, Role)
- Activate/deactivate, delete users

### Meeting → Event Sync (Complete - Feb 2026) ✅
- Creating a meeting auto-creates an event on the Events calendar
- Events page shows meetings as "meeting" type with purple color
- Calendar and list views for events

### Application Re-edit System (NEW - Feb 2026) ✅
- User Profile page "My Applications" tab shows all bursary and training applications with status badges
- 24-hour edit window: applications can be edited within 24hrs of submission
- After 24hrs, "Edit" button is replaced with "Request Re-edit" button
- Request Re-edit dialog with reason field, sends notification to all admins
- Admin approval/denial via API endpoints, notifies the applicant
- Once re-edit is approved, user can edit again (flags auto-cleared after edit)
- Backend enforcement: PUT application endpoints return 403 if edit window expired and no re-edit approval

### User Management Enhancements (Feb 2026) ✅
- Removed Student ID from user model and all pages
- User Profile shows all HR dataset fields: Personal Details (surname, ID number, gender, race, age), Employment Info (personnel number, division, department, position, level, start date, years of service), OFO Classification
- Admin Edit User dialog expanded to 20 editable fields across 3 sections: Personal Info, Employment Info, OFO Classification
- Backend UserUpdate model supports all fields including email, bio

### Application Expenses System (NEW - Feb 2026) ✅
- Post-submission expense adding: Flights, Accommodation, Car Hire/Shuttle, Catering
- "Add Expenses" / "Edit Expenses" button on each non-draft bursary and training application card
- Right-click context menu also provides Add/Edit Expenses option
- Expense dialog with amount + notes fields per category, running total
- Expenses Page has 3 tabs: "Additional Expenses" (standalone), "Bursary Application", "Training Application"
- Bursary/Training tabs show: applicant, status, per-category amounts, totals, grand total row
- Backend: POST /api/applications/{id}/expenses, POST /api/training-applications/{id}/expenses, GET /api/expenses/application-expenses

## Pending/Future Tasks

### P1 - Upcoming
- Backend CRUD for: Projects, Sponsors, Expenses (partial), Tickets (partial), Bursary
- Connect frontend placeholder pages to backend APIs
- Fix ProspectsPage drag-and-drop (migrate react-beautiful-dnd → @dnd-kit)

### P2 - Future
- Microsoft Teams API integration (Graph API) for meeting scheduling
- Advanced RBAC management UI on Settings page
- Refactor file uploads to chunked multipart
- Refactor server.py monolith into separate routers
- Real-time messaging (WebSocket)

## Key API Endpoints
- Notifications: GET/PUT/DELETE /api/notifications, GET /api/notifications/unread/count
- Messages: POST /api/messages/group-conversation (individual/division/subgroup)
- Notes: Full CRUD at /api/notes, /api/notes/folders
- Events: Auto-created from meetings, full CRUD at /api/events
- All existing endpoints for applications, users, teams, division-groups, etc.

## Key Credentials
- Super Admin: jane.smith@uct.ac.za / securepass123
