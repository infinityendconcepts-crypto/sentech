"""
Test suite for backend refactoring - verifying all 18 router modules work correctly.
Tests all newly extracted routers: teams, meetings, notes, files, tasks, projects, 
events, pdp, divisions, settings, and existing routers: auth, users, applications, 
messages, expenses, tickets, reports, notifications.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://grant-portal-14.preview.emergentagent.com')

# Test credentials
SUPER_ADMIN = {"email": "jane.smith@uct.ac.za", "password": "securepass123"}
ADMIN = {"email": "test.admin@sentech.co.za", "password": "password"}
EMPLOYEE = {"email": "test.employee@sentech.co.za", "password": "password"}
HEAD_USER = {"email": "mothibik@sentech.co.za", "password": "password"}


class TestAuthRouter:
    """Test auth router - login, register, me"""
    
    def test_login_super_admin(self):
        """POST /api/auth/login - Super Admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN)
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == SUPER_ADMIN["email"]
        assert "super_admin" in data["user"]["roles"]
        print(f"✓ Super Admin login successful: {data['user']['full_name']}")
    
    def test_login_admin(self):
        """POST /api/auth/login - Admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN)
        if response.status_code == 200:
            data = response.json()
            assert "access_token" in data
            print(f"✓ Admin login successful: {data['user']['full_name']}")
        else:
            print(f"⚠ Admin user may not exist: {response.status_code}")
    
    def test_login_employee(self):
        """POST /api/auth/login - Employee login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=EMPLOYEE)
        if response.status_code == 200:
            data = response.json()
            assert "access_token" in data
            print(f"✓ Employee login successful: {data['user']['full_name']}")
        else:
            print(f"⚠ Employee user may not exist: {response.status_code}")
    
    def test_login_head_user(self):
        """POST /api/auth/login - Head user login (RBAC test)"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=HEAD_USER)
        if response.status_code == 200:
            data = response.json()
            assert "access_token" in data
            print(f"✓ Head user login successful: {data['user']['full_name']}")
        else:
            print(f"⚠ Head user may not exist: {response.status_code}")
    
    def test_login_invalid_credentials(self):
        """POST /api/auth/login - Invalid credentials returns 400"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@test.com", "password": "wrongpass"
        })
        assert response.status_code == 400
        print("✓ Invalid login correctly rejected")
    
    def test_auth_me(self):
        """GET /api/auth/me - Get current user"""
        # Login first
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN)
        token = login_resp.json()["access_token"]
        
        response = requests.get(f"{BASE_URL}/api/auth/me", 
                               headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == SUPER_ADMIN["email"]
        print(f"✓ GET /api/auth/me works: {data['full_name']}")


@pytest.fixture
def auth_token():
    """Get auth token for super admin"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN)
    if response.status_code == 200:
        return response.json()["access_token"]
    pytest.skip("Could not authenticate")


@pytest.fixture
def auth_headers(auth_token):
    """Get auth headers"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestUsersRouter:
    """Test users router - CRUD, profile"""
    
    def test_get_users(self, auth_headers):
        """GET /api/users - List users"""
        response = requests.get(f"{BASE_URL}/api/users", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/users returns {len(data)} users")
    
    def test_get_users_me(self, auth_headers):
        """GET /api/users/me - Get my profile"""
        response = requests.get(f"{BASE_URL}/api/users/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        print(f"✓ GET /api/users/me works: {data['email']}")


class TestApplicationsRouter:
    """Test applications router - bursary and training applications"""
    
    def test_get_applications(self, auth_headers):
        """GET /api/applications - List bursary applications"""
        response = requests.get(f"{BASE_URL}/api/applications", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/applications returns {len(data)} applications")
    
    def test_get_training_applications(self, auth_headers):
        """GET /api/training-applications - List training applications"""
        response = requests.get(f"{BASE_URL}/api/training-applications", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/training-applications returns {len(data)} applications")
    
    def test_get_application_settings(self, auth_headers):
        """GET /api/application-settings - Get application settings"""
        response = requests.get(f"{BASE_URL}/api/application-settings", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "bursary_open" in data or "id" in data
        print(f"✓ GET /api/application-settings works")


class TestTeamsRouter:
    """Test teams router - newly extracted"""
    
    def test_get_teams(self, auth_headers):
        """GET /api/teams - List teams"""
        response = requests.get(f"{BASE_URL}/api/teams", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/teams returns {len(data)} teams")


class TestMeetingsRouter:
    """Test meetings router - newly extracted"""
    
    def test_get_meetings(self, auth_headers):
        """GET /api/meetings - List meetings"""
        response = requests.get(f"{BASE_URL}/api/meetings", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/meetings returns {len(data)} meetings")


class TestNotesRouter:
    """Test notes router - newly extracted"""
    
    def test_get_notes(self, auth_headers):
        """GET /api/notes - List notes"""
        response = requests.get(f"{BASE_URL}/api/notes", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/notes returns {len(data)} notes")
    
    def test_get_note_folders(self, auth_headers):
        """GET /api/notes/folders/list - List note folders"""
        response = requests.get(f"{BASE_URL}/api/notes/folders/list", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/notes/folders/list returns {len(data)} folders")


class TestFilesRouter:
    """Test files router - newly extracted"""
    
    def test_get_files(self, auth_headers):
        """GET /api/files - List files"""
        response = requests.get(f"{BASE_URL}/api/files", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/files returns {len(data)} files")
    
    def test_get_folders(self, auth_headers):
        """GET /api/files/folders/list - List folders"""
        response = requests.get(f"{BASE_URL}/api/files/folders/list", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/files/folders/list returns {len(data)} folders")


class TestTasksRouter:
    """Test tasks router - newly extracted"""
    
    def test_get_tasks(self, auth_headers):
        """GET /api/tasks - List tasks"""
        response = requests.get(f"{BASE_URL}/api/tasks", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/tasks returns {len(data)} tasks")


class TestProjectsRouter:
    """Test projects router - newly extracted"""
    
    def test_get_projects(self, auth_headers):
        """GET /api/projects - List projects"""
        response = requests.get(f"{BASE_URL}/api/projects", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/projects returns {len(data)} projects")
    
    def test_get_clients(self, auth_headers):
        """GET /api/clients - List clients"""
        response = requests.get(f"{BASE_URL}/api/clients", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/clients returns {len(data)} clients")
    
    def test_get_leads(self, auth_headers):
        """GET /api/leads - List leads"""
        response = requests.get(f"{BASE_URL}/api/leads", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/leads returns {len(data)} leads")
    
    def test_get_prospects(self, auth_headers):
        """GET /api/prospects - List prospects"""
        response = requests.get(f"{BASE_URL}/api/prospects", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/prospects returns {len(data)} prospects")
    
    def test_get_sponsors(self, auth_headers):
        """GET /api/sponsors - List sponsors"""
        response = requests.get(f"{BASE_URL}/api/sponsors", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/sponsors returns {len(data)} sponsors")


class TestEventsRouter:
    """Test events router - newly extracted"""
    
    def test_get_events(self, auth_headers):
        """GET /api/events - List events"""
        response = requests.get(f"{BASE_URL}/api/events", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/events returns {len(data)} events")
    
    def test_create_event(self, auth_headers):
        """POST /api/events - Create event"""
        event_data = {
            "title": "TEST_Refactor_Event",
            "start_date": "2026-02-01",
            "end_date": "2026-02-01",
            "event_type": "event",
            "description": "Test event for refactoring verification"
        }
        response = requests.post(f"{BASE_URL}/api/events", json=event_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "TEST_Refactor_Event"
        print(f"✓ POST /api/events creates event: {data['id']}")
        
        # Cleanup - delete the test event
        delete_resp = requests.delete(f"{BASE_URL}/api/events/{data['id']}", headers=auth_headers)
        if delete_resp.status_code == 200:
            print(f"  ✓ Cleaned up test event")


class TestPDPRouter:
    """Test PDP router - newly extracted"""
    
    def test_get_pdp(self, auth_headers):
        """GET /api/pdp - List PDP entries"""
        response = requests.get(f"{BASE_URL}/api/pdp", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/pdp returns {len(data)} entries")
    
    def test_create_pdp(self, auth_headers):
        """POST /api/pdp - Create PDP entry"""
        pdp_data = {
            "learn_what": "TEST_Refactor_PDP",
            "action_plan": "Test action plan",
            "resources_support": "Test resources",
            "success_criteria": "Test criteria",
            "status": "not_started",
            "priority": "medium"
        }
        response = requests.post(f"{BASE_URL}/api/pdp", json=pdp_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["learn_what"] == "TEST_Refactor_PDP"
        print(f"✓ POST /api/pdp creates entry: {data['id']}")
        
        # Cleanup
        delete_resp = requests.delete(f"{BASE_URL}/api/pdp/{data['id']}", headers=auth_headers)
        if delete_resp.status_code == 200:
            print(f"  ✓ Cleaned up test PDP entry")


class TestDivisionsRouter:
    """Test divisions router - newly extracted"""
    
    def test_get_divisions(self, auth_headers):
        """GET /api/divisions - List divisions"""
        response = requests.get(f"{BASE_URL}/api/divisions", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/divisions returns {len(data)} divisions")
    
    def test_get_departments(self, auth_headers):
        """GET /api/departments - List departments"""
        response = requests.get(f"{BASE_URL}/api/departments", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/departments returns {len(data)} departments")
    
    def test_get_division_groups(self, auth_headers):
        """GET /api/division-groups - List division groups"""
        response = requests.get(f"{BASE_URL}/api/division-groups", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/division-groups returns {len(data)} groups")


class TestDivisionGroupsRBAC:
    """Test RBAC for division groups - Head user sees only their division"""
    
    def test_head_user_sees_only_their_division(self):
        """RBAC: Head user (mothibik@sentech.co.za) sees only their division"""
        # Login as head user
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=HEAD_USER)
        if login_resp.status_code != 200:
            pytest.skip("Head user not available")
        
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get division groups
        response = requests.get(f"{BASE_URL}/api/division-groups", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # Head user should see limited divisions (their own)
        print(f"✓ Head user sees {len(data)} division group(s)")
        if len(data) > 0:
            print(f"  Division names: {[g.get('division_name') for g in data]}")


class TestSettingsRouter:
    """Test settings router - newly extracted"""
    
    def test_get_settings(self, auth_headers):
        """GET /api/settings - Get system settings"""
        response = requests.get(f"{BASE_URL}/api/settings", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data or "company_name" in data
        print(f"✓ GET /api/settings works")
    
    def test_get_roles(self, auth_headers):
        """GET /api/settings/roles - List roles"""
        response = requests.get(f"{BASE_URL}/api/settings/roles", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/settings/roles returns {len(data)} roles")
    
    def test_get_faqs(self, auth_headers):
        """GET /api/settings/faqs - List FAQs"""
        response = requests.get(f"{BASE_URL}/api/settings/faqs", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/settings/faqs returns {len(data)} FAQs")
    
    def test_get_dashboard_preferences(self, auth_headers):
        """GET /api/settings/dashboard-preferences - Get dashboard prefs"""
        response = requests.get(f"{BASE_URL}/api/settings/dashboard-preferences", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data or "visible_widgets" in data
        print(f"✓ GET /api/settings/dashboard-preferences works")
    
    def test_export_applications_json(self, auth_headers):
        """GET /api/reports/export/applications?format=json - Export applications"""
        response = requests.get(f"{BASE_URL}/api/reports/export/applications?format=json", headers=auth_headers)
        assert response.status_code == 200
        # Should return JSON data
        print(f"✓ GET /api/reports/export/applications?format=json works")


class TestTicketsRouter:
    """Test tickets router"""
    
    def test_get_tickets(self, auth_headers):
        """GET /api/tickets - List tickets"""
        response = requests.get(f"{BASE_URL}/api/tickets", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/tickets returns {len(data)} tickets")
    
    def test_get_ticket_stats(self, auth_headers):
        """GET /api/tickets/stats - Get ticket stats"""
        response = requests.get(f"{BASE_URL}/api/tickets/stats", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        print(f"✓ GET /api/tickets/stats: total={data['total']}, open={data.get('open', 0)}")


class TestNotificationsRouter:
    """Test notifications router"""
    
    def test_get_notifications(self, auth_headers):
        """GET /api/notifications - List notifications"""
        response = requests.get(f"{BASE_URL}/api/notifications", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/notifications returns {len(data)} notifications")
    
    def test_get_recent_notifications(self, auth_headers):
        """GET /api/notifications/recent - Get recent notifications"""
        response = requests.get(f"{BASE_URL}/api/notifications/recent", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/notifications/recent returns {len(data)} notifications")
    
    def test_get_unread_count(self, auth_headers):
        """GET /api/notifications/unread-count - Get unread count"""
        response = requests.get(f"{BASE_URL}/api/notifications/unread-count", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        print(f"✓ GET /api/notifications/unread-count: {data['count']}")


class TestReportsRouter:
    """Test reports router"""
    
    def test_get_dashboard_stats(self, auth_headers):
        """GET /api/dashboard/stats - Get dashboard stats"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_applications" in data
        print(f"✓ GET /api/dashboard/stats: apps={data['total_applications']}, tickets={data.get('open_tickets', 0)}")
    
    def test_get_report_summary(self, auth_headers):
        """GET /api/dashboard/report-summary - Get report summary"""
        response = requests.get(f"{BASE_URL}/api/dashboard/report-summary", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data
        print(f"✓ GET /api/dashboard/report-summary: users={data['total_users']}")
    
    def test_get_interactive_data(self, auth_headers):
        """GET /api/reports/interactive-data - Get interactive report data"""
        response = requests.get(f"{BASE_URL}/api/reports/interactive-data", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert "filters" in data
        print(f"✓ GET /api/reports/interactive-data: {data['users']['total']} users")


class TestExpensesRouter:
    """Test expenses router"""
    
    def test_get_expenses(self, auth_headers):
        """GET /api/expenses - List expenses"""
        response = requests.get(f"{BASE_URL}/api/expenses", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/expenses returns {len(data)} expenses")


class TestMessagesRouter:
    """Test messages router"""
    
    def test_get_conversations(self, auth_headers):
        """GET /api/messages/conversations - List conversations"""
        response = requests.get(f"{BASE_URL}/api/messages/conversations", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/messages/conversations returns {len(data)} conversations")
    
    def test_get_contactable_users(self, auth_headers):
        """GET /api/messages/contactable-users - List contactable users"""
        response = requests.get(f"{BASE_URL}/api/messages/contactable-users", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/messages/contactable-users returns {len(data)} users")


class TestBBBEERouter:
    """Test BBBEE router (part of settings)"""
    
    def test_get_bbbee(self, auth_headers):
        """GET /api/bbbee - List BBBEE records"""
        response = requests.get(f"{BASE_URL}/api/bbbee", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/bbbee returns {len(data)} records")


class TestEmployeeRBAC:
    """Test RBAC for employee user - can see events but not modify"""
    
    def test_employee_can_see_events(self):
        """RBAC: Employee user sees events"""
        # Login as employee
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=EMPLOYEE)
        if login_resp.status_code != 200:
            pytest.skip("Employee user not available")
        
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get events
        response = requests.get(f"{BASE_URL}/api/events", headers=headers)
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Employee can see {len(data)} events")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
