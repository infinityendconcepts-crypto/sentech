# Test Credentials

## Admin Accounts
- **Super Admin**: t-karooz@hotmail.com / password
- **Admin & Head**: rorim@moonlightergroup.co.za / password
- **Admin**: test.admin@sentech.co.za / password

## Employee Accounts
- **Employee**: test.employee@sentech.co.za / password

## Manager Accounts
- **Manager (Exec_and_Head)**: leshopet@sentech.co.za / password
- **Final Approver (Sandisiwe)**: jingisas@sentech.co.za / password

## Training Application Approval Flow
1. User submits → status = "pending"
2. Any manager approves → status = "manager_approved" (user still sees "Pending")
3. Sandisiwe (jingisas@sentech.co.za) approves → status = "approved"

## Important Notes
- On hosting: Set `APP_URL` in backend/.env to your domain (e.g., `APP_URL=https://yourdomain.com`) for correct email notification links
