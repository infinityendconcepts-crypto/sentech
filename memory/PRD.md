# Sentech Bursary Management System - PRD

## Original Problem Statement
Build a comprehensive bursary management system named "Sentech" using React, FastAPI, and MongoDB. The system features modules for managing applications, users, divisions, projects, meetings, tickets, and interactive reports, governed by a strict and granular Role-Based Access Control (RBAC) system.

## Architecture
- **Frontend**: React + Tailwind + Shadcn UI
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **Auth**: JWT-based with RBAC (super_admin, admin, head, student/employee)

### Backend Structure
```
/app/backend/
  server.py          # App init, CORS, router registration
  schemas.py         # All Pydantic models
  routers/           # 18 modular router files
```

## Implemented Features
- Full user management with CSV bulk import
- Bursary & Training application workflows with multi-step forms
- Application lock/unlock system for admins/heads
- Period settings enforcement
- Notification system with clickable navigation
- Interactive reports with demographic filters
- Division Groups with subgroups, leaders, temp leaders
- RBAC: Heads see only their division/subgroup data
- Events, Meetings, Notes, Files, Tasks, Projects, PDP modules
- Ticket system with comments and assignments
- Real-time messaging system
- Settings management (SMTP, company info, roles)

## Completed in Current Session (April 2026)
- **Backend Refactoring**: server.py 3248→71 lines, 18 modular routers (49/49 tests passed)
- **Auto-populate by SA ID**: Enter 13-digit ID on Bursary/Training forms → auto-fills name, surname, division, dept, race, gender
- **Document viewing fixed**: Documents stored as base64 JSON with downloadable links in application summaries
- **PDP Approval Workflow**: Employee submits → Manager approves/rejects → L&D admin tracks → Completed

## PDP Workflow
1. Employee creates PDP entry (status: not_started)
2. Employee works on it (status: in_progress)
3. Employee clicks **Submit** (status: pending_approval)
4. Line Manager clicks **Approve** or **Reject**
5. Admin (L&D) clicks **L&D Track** to monitor progress
6. Admin marks **Completed** when done

## P2 Backlog
1. Refactor file uploads to chunked multipart
2. Audit log for admin actions
3. Scheduled auto-export weekly XLSX reports
4. Microsoft SSO (requires Azure AD app registration)

## Test Credentials
- Super Admin: jane.smith@uct.ac.za / securepass123
- Admin: test.admin@sentech.co.za / password
- Employee: test.employee@sentech.co.za / password
- Head (MIB): mothibik@sentech.co.za / password
- Test ID for lookup: 7503235923089

## Mocked Services
- Email delivery (SMTP) is simulated
