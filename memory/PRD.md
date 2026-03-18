# Sentech Bursary Management System - PRD

## Original Problem Statement
Create a comprehensive bursary management system named "Sentech" with React, FastAPI, and MongoDB.

## Core Requirements
- **Technology Stack:** React, FastAPI, MongoDB
- **Branding:** "Sentech" with blue (#0056B3) and gray color scheme
- **Authentication:** Microsoft Entra ID SSO, standard email/password, First-time Password Setup

## Core Modules (Pages)
- Dashboard, Bursary Applications, Training Applications, BBBEE
- Training Track (formerly Tasks), Meetings, Events, Messages, Division Groups
- Tickets, Expenses, Reports, MICTSETA Documents, Help and Support
- Settings, Users, User Profile, Personal Development Plan (PDP), Notifications, Notes

## Hidden Pages (Per User Request)
- Leads, Notes, Prospects (hidden from navigation)
- Projects (removed from sidebar per user request)

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

### Notification System
- NotificationsPage with filter tabs (All, Unread, Messages, Meetings, Status, Tickets)
- Bell icon in header with unread count badge and sound
- Polling every 15 seconds for new notifications
- Mark read/unread, mark all read, delete notifications

### Enhanced Messaging System
- New Chat dialog with 3 tabs: Individual, Division, Subgroup
- Real-time message display with read receipts

### Notes Page (Complete)
- Full CRUD with folders, tags, color coding, pin/unpin, shared notes

### Application Re-edit System
- 24-hour edit window, Request Re-edit flow, admin approval/denial

### User Management Enhancements
- Admin Edit User dialog with 20 editable fields
- All imported HR dataset fields displayed

### Application Expenses System
- Post-submission expenses (Flights, Accommodation, Car Hire, Catering)
- Expenses Page with 3 tabs for expense types

### Settings & RBAC Overhaul
- Vertical tab navigation, RBAC permission matrix
- 13 modules x 4 permissions (CRUD)

### Dashboard Overhaul (Feb 2026) - NEW
- 6 stat cards: Total Applications, Pending, Approved, Training Applications, Open Tickets, Unread Notifications
- Real "Recent Activity" feed from backend (notifications, applications, tickets)
- "Notifications" summary widget with unread badge
- "Report Summary" card for admins (Users, Bursary, Training, Tickets)
- Quick Actions (New Application, Training Apps, BBBEE, Reports)
- Removed Projects and Sponsors from dashboard
- Backend: GET /api/dashboard/stats, GET /api/dashboard/recent-activity, GET /api/dashboard/report-summary

### Training Track User Assignment (Feb 2026) - NEW
- Admins/division heads can assign users to training modules
- Assign Users dialog with searchable user list and checkbox selection
- "Assign" button in list view and dropdown menu
- Assigned users section with unassign capability
- Notifications sent to assigned users
- Backend: POST /api/tasks/{id}/assign, DELETE /api/tasks/{id}/assign/{user_id}

### User Import Feature (Feb 2026) - NEW
- Downloadable CSV template (18 columns)
- Import Users dialog with file upload and results display
- Template and Import buttons in UsersPage header for admins
- Backend: GET /api/users/import-template, POST /api/users/bulk-import

### Reports Chart Enhancement (Feb 2026) - NEW
- Zoom/expand button on each chart card (appears on hover)
- Full-screen modal dialog for enlarged chart viewing
- All charts: Users by Division pie, Active/Inactive donut, Expenses by Type bar, Applications Overview bar

## Pending/Future Tasks

### P2 - Upcoming
- Dynamic Page Configuration: UI in Settings to configure fields/actions for PDP, Bursary, Training pages
- Frontend RBAC Enforcement: Hide/disable UI elements based on role permissions
- Fix ProspectsPage drag-and-drop (migrate react-beautiful-dnd to @dnd-kit)

### P2 - Future
- Refactor server.py monolith into separate routers
- Refactor file uploads to chunked multipart
- Microsoft Teams API integration for meeting scheduling
- Real-time messaging (WebSocket)

## Key API Endpoints
- Dashboard: GET /api/dashboard/stats, /recent-activity, /report-summary
- Notifications: GET/PUT/DELETE /api/notifications
- Messages: POST /api/messages/group-conversation
- Tasks: POST /api/tasks/{id}/assign, DELETE /api/tasks/{id}/assign/{user_id}
- Users: GET /api/users/import-template, POST /api/users/bulk-import
- Applications: Full CRUD + expenses + re-edit
- Settings: GET/PUT /api/settings, roles CRUD, dashboard preferences
- Reports: GET /api/reports/dashboard, export

## Key Credentials
- Super Admin: jane.smith@uct.ac.za / securepass123
