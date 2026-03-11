# Sentech Bursary Management System - PRD

## Original Problem Statement
Create a comprehensive bursary management system named "Sentech" with React, FastAPI, and MongoDB.

## Core Requirements
- **Technology Stack:** React, FastAPI, MongoDB
- **Branding:** "Sentech" with blue (#0056B3) and gray color scheme
- **Authentication:** Microsoft Entra ID SSO, standard email/password, First-time Password Setup

## Core Modules (Pages)
- Dashboard
- Bursary Applications
- Training Applications
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

## User Personas & Roles
- **Super Admin:** Highest access level
- **Admin:** Full access to all modules, can manage users, edit training modules, assign PDP goals
- **Manager:** OFO Major Group: Managers
- **Professional:** OFO Major Group: Professionals
- **Technician:** OFO Major Group: Technicians
- **Clerical:** OFO Major Group: Clerical Support Workers
- **Employee:** Default role

## Organizational Structure (Imported March 2026)

### Divisions (10 total)
1. Chief Executive Officer (Exec_and_Head)
2. Finance
3. Internal Audit
4. Satellite Business Unit
5. Research and Innovation
6. Supply Chain Management
7. Human Resources
8. Company Secretariat
9. Legal
10. Enterprise Risk and Compliance

### User Fields (from spreadsheet import)
- Personal: Full Name, Surname, Email, ID Number, Race, Gender, Age
- Employment: Division, Department, Position, Personnel Number, Start Date, Years of Service, Level
- OFO Classification: Major Group, Sub Major Group, Occupation, OFO Code

### First-Time Password Setup
- Imported users have `requires_password_setup: true`
- On first login attempt, they're redirected to password setup screen
- After setting password, they're automatically logged in
- 120 users imported from organizational spreadsheet

## What's Been Implemented (March 2026)

### Core Features
- User authentication with JWT and Microsoft SSO
- Role-based access control (admin/student)
- Dashboard with stats and quick actions
- Full application management workflow

### Bursary Application Flow
- Multi-step application form with validation
- **District Municipality dropdown** with 14 specific municipalities
- Conditional fields (disability description for disabled applicants)
- **Medical Certificate upload** (required when disability = Yes)
- **Performance Score dropdown (1-5)** - numbers only
- Academic transcript upload for Continuation applicants
- **Signed Performance Contract** upload
- **Proof of Registration / Acceptance Letter** upload
- "Quotation Amount Requested" file upload
- **Motivation Document** upload
- Status management: draft, pending, under review, approved, rejected
- Student can edit draft/pending applications
- Admin can change application status
- **Invoice and Bursary Agreement upload** for approved applications
- Large detailed view popup showing all application information
- **"Re-apply" renamed to "Continuation"**

### Training Application Module (NEW - Feb 2026)
- Multi-step application form (4 steps)
- Step 1: Personal Information with district municipality dropdown
- Step 2: Employment Details with performance score (1-5)
- Step 3: Training Information
  - Training Status (New Training, Continuation, Upgrade/Advanced)
  - Service Provider (renamed from Institution)
  - Training Type (renamed from Course of Study)
  - Total Amount (R) for cost
  - Supplier Type: Preferred Supplier or RFQ Required
- Step 4: Documents with conditional logic
  - **If training < R15,000:** Signed Performance Contract, Quotation, SBD 4 Form, Consent Form, CSD Report, BBBEE Certificate
  - **If training > R15,000:** Same + Motivation document
  - **If RFQ route selected:** Only Scope of Work upload (all other documents disabled)
- Full CRUD backend endpoints
- List view with search, status management, and view modal
- Admin status change functionality

### District Municipalities List (Updated Feb 2026)
Both Bursary and Training Applications use this specific list:
- 1724 RADIOKOP, ROODEPOORT - City of Johannesburg Metropolitan Municipality
- 7500 PLATTEKLOOF EXT 3, PAROW - City of Cape Town Metropolitan Municipality
- 9301 NAVAL VIEW, BLOEMFONTEIN - Mangaung Metropolitan Municipality
- 4051 BROADWAY, DURBAN NORTH - eThekwini Metropolitan Municipality
- 2351 ERMELO, ERMELO - Gert Sibande District Municipality
- 5247 VINCENT, EAST LONDON - Buffalo City Metropolitan Municipality
- 6529 LOERIE PARK, GEORGE - Garden Route District Municipality
- 0699 POLOKWANE, POLOKWANE - Capricorn District Municipality
- 6001 GLENDINNINGVALE, PORT ELIZABETH - Nelson Mandela Bay Metropolitan Municipality
- 3100 VRYHEID, VRYHEID - Amajuba District Municipality
- 8601 VRYBURG, VRYBURG - Dr Ruth Segomotsi Mompati District Municipality
- 5900 MIDROS, MIDDELBURG - Chris Hani District Municipality
- 8801 RAND, UPINGTON - Namakwa District Municipality
- 8160 VREDENDAL, VREDENDAL - City of Cape Town Metropolitan Municipality

### Training Track Module
- Kanban board with drag-and-drop (using @dnd-kit)
- List, Kanban, and Gantt views
- Comments functionality on modules
- Image upload functionality
- Due dates for modules
- Admin-only edit/delete
- Export to Excel/PDF
- Attendance feature removed per user request

### Personal Development Plan (PDP)
- Goal creation with "Skills gap" (renamed from "What to learn")
- Admin can assign goals to specific users
- User filtering for admin view
- Status tracking (not started, in progress, completed, overdue)
- Priority levels (low, medium, high)
- Category tags
- **Excel Import feature** with downloadable sample template
- Import preview with ability to remove entries before importing

### MICTSETA Documents (Renamed from Files)
- **New category-based structure:**
  - Main Categories: 2025-26 FY, 2026-27 FY
  - Sub Categories: Internships, University Placements
- Folder creation within categories
- File upload with drag-and-drop
- File download and deletion

### Tickets Module
- Categories updated to: Technical Support, HR Query, Bursary Query, Other

### UI/UX Refinements
- "Applications" renamed to "Bursary Applications"
- "Team" renamed to "Teams"
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

## Key API Endpoints
- `GET /api/applications` - List bursary applications
- `POST /api/applications` - Create bursary application
- `PUT /api/applications/{app_id}` - Update bursary application
- `PUT /api/applications/{app_id}/status` - Update application status
- `GET /api/training-applications` - List training applications
- `POST /api/training-applications` - Create training application
- `PUT /api/training-applications/{app_id}` - Update training application
- `PUT /api/training-applications/{app_id}/status` - Update training status (admin only)
- `DELETE /api/training-applications/{app_id}` - Delete training application
- `PUT /api/tasks/{task_id}` - Update training module (comments, images, due date)
- `PUT /api/pdp/{pdp_id}` - Update PDP entry (assigned_to, skills gap)
- `POST /api/users` - Create user (admin only)
