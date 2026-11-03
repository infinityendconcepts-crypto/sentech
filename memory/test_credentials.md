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
- Role: `hr_admin` — can give final approval on training applications + reset any user's password

## Training Application Approval Flow
1. User submits → status = "pending"
2. Head of Department / Manager approves → status = "under_review"
3. HR Admin (hr_admin role) or Super Admin approves → status = "approved"

## Password Reset
- **Self reset**: Users can change their own password from Profile page
- **Forgot password**: Login page → "Forgot Password?" → email OTP → reset
- **Admin/HR Admin reset**: Users page → user dropdown → "Reset Password" (can reset any user)
- **Manager reset**: Can only reset passwords for users in their own division

## Important Notes
- Set `APP_URL=https://yourdomain.com` in backend/.env for correct email notification links
- To assign hr_admin to more users: change their role in Users page to "hr_admin"
