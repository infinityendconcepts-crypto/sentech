# Test Credentials

## Admin Accounts
- **Super Admin**: t-karooz@hotmail.com / password
- **Admin & Head**: rorim@moonlightergroup.co.za / password
- **Admin**: test.admin@sentech.co.za / password

## Employee Accounts
- **Employee**: test.employee@sentech.co.za / password

## Manager Accounts
- **Manager (Exec_and_Head)**: leshopet@sentech.co.za / password

## HR Admin (Final Approver)
- **HR Admin (Sandisiwe)**: jingisas@sentech.co.za / password
- Role: `hr_admin` — can give final approval on training applications

## Training Application Approval Flow
1. User submits → status = "pending"
2. Any manager approves → status = "manager_approved" (user still sees "Pending")
3. Any user with `hr_admin` role (e.g., Sandisiwe) or system admin approves → status = "approved"

## Important Notes
- On hosting: Set `APP_URL` in backend/.env to your domain for correct email links
- To assign hr_admin to more users: update their `roles` array in MongoDB to include `"hr_admin"`
