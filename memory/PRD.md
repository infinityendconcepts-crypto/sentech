# Sentech Bursary Management System - PRD

## Original Problem Statement
Create a comprehensive bursary management system named "Sentech" with React, FastAPI, and MongoDB.

## Core Requirements
- **Technology Stack:** React, FastAPI, MongoDB
- **Branding:** "Sentech" with blue (#0056B3) and gray color scheme
- **Authentication:** Microsoft Entra ID SSO, standard email/password

## Core Modules (Pages)
- Dashboard
- Applications
- Sponsors
- BBBEE
- Projects
- Training Track (formerly Tasks)
- Meetings
- Events
- Messages
- Team
- Tickets
- Expenses
- Reports
- MICTSETA Documents (formerly Files)
- Help and Support
- Settings
- Users
- User Profile
- Personal Development Plan (PDP)

## Hidden Pages (Per User Request)
- Leads (hidden from navigation)
- Notes (hidden from navigation)
- Prospects (hidden from navigation)

## User Personas
- **Admin:** Full access to all modules, can manage users, edit training modules, assign PDP goals
- **Student:** Can view and manage their own applications, view training modules, manage personal PDP

## What's Been Implemented (December 2025)

### Core Features
- User authentication with JWT and Microsoft SSO
- Role-based access control (admin/student)
- Dashboard with stats and quick actions
- Full application management workflow

### Application Flow
- Multi-step application form with validation
- Conditional fields (disability description for disabled applicants)
- Academic transcript upload for Re-apply applicants
- "Quotation Amount Requested" file upload in documents section
- Status management: draft, pending, under review, approved, rejected
- Student can edit draft/pending applications
- Admin can change application status

### Training Track Module
- Kanban board with drag-and-drop (using @dnd-kit)
- List, Kanban, and Gantt views
- Comments functionality on modules
- Image upload functionality
- Due dates for modules
- Admin-only edit/delete
- Export to Excel/PDF
- **Attendance feature removed per user request**

### Personal Development Plan (PDP)
- Goal creation with "Skills gap" (renamed from "What to learn")
- Admin can assign goals to specific users
- User filtering for admin view
- Status tracking (not started, in progress, completed, overdue)
- Priority levels (low, medium, high)
- Category tags

### UI/UX Refinements
- Simplified login page (Email/Password and Microsoft SSO only - OTP removed)
- "Tasks" renamed to "Training Track"
- "Files" renamed to "MICTSETA Documents"
- "CONTINUATION APPLICANT" renamed to "RE-APPLY"
- Navigation hides Leads, Notes, Prospects pages
- Collapsible sidebar
- Responsive design

## Pending/Future Tasks

### P1 - Backend Implementation
- Projects module CRUD
- Sponsors module CRUD
- Meetings module CRUD
- Notes module CRUD (page hidden but may be needed later)
- Messages module CRUD
- Expenses module CRUD
- Tickets module CRUD
- Bursary module CRUD

### P1 - Frontend Integration
- Connect placeholder pages to backend APIs
- MeetingsPage, NotesPage, MessagesPage, ExpensesPage, TicketsPage, HelpAndSupportPage

### P2 - Integrations
- Zoom/Microsoft Teams meeting integration
- SMTP email notifications (partially implemented)

### P2 - Advanced Features
- Advanced RBAC management UI on Settings page
- Real-time messaging
- Note sharing
- Chunked file uploads (refactor from base64)

### P2 - UI Consistency
- Update ProspectsPage to use @dnd-kit (currently uses react-beautiful-dnd)

## Known Technical Debt
- ProspectsPage uses outdated drag-and-drop library (react-beautiful-dnd)
- File uploads use base64 encoding (should be chunked multipart)
- Several modules are frontend-only placeholders

## Test Credentials
- **Admin:** jane.smith@uct.ac.za / securepass123
- **Student:** test.student@example.com / password123

## Architecture
```
/app/
├── backend/
│   ├── models/
│   │   ├── pdp.py
│   │   └── ...
│   ├── server.py
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── components/
│       │   └── Layout/
│       │       └── Layout.jsx
│       ├── contexts/
│       │   └── AuthContext.jsx
│       ├── pages/
│       │   ├── ApplicationsPage.jsx
│       │   ├── FilesPage.jsx (MICTSETA Documents)
│       │   ├── LoginPage.jsx
│       │   ├── NewApplicationPage.jsx
│       │   ├── PDPPage.jsx
│       │   └── TrainingTrackPage.jsx
│       ├── services/
│       │   └── api.js
│       └── App.js
```

## Key API Endpoints
- `PUT /api/applications/{app_id}/status` - Update application status
- `GET /api/applications/{app_id}` - Get single application
- `PUT /api/tasks/{task_id}` - Update training module (comments, images, due date)
- `PUT /api/pdp/{pdp_id}` - Update PDP entry (assigned_to, skills gap)
- `POST /api/users` - Create user (admin only)
