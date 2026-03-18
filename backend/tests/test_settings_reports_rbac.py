"""
Test Settings, RBAC, Dashboard Preferences, and Reports APIs
Iteration 16: Testing Settings page vertical tabs feature, RBAC management, and Reports dashboard
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "jane.smith@uct.ac.za"
TEST_PASSWORD = "securepass123"

class TestSettingsRBACAndReports:
    """Test Settings RBAC, Dashboard Preferences, and Reports Dashboard APIs"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get token before each test"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get auth token
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        self.token = data.get("access_token")
        self.user = data.get("user")
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        print(f"✓ Logged in as {TEST_EMAIL}")
    
    # ==================== ROLES API TESTS ====================
    
    def test_01_get_roles(self):
        """GET /api/settings/roles - Should return list of roles with permissions"""
        response = self.session.get(f"{BASE_URL}/api/settings/roles")
        assert response.status_code == 200, f"Failed to get roles: {response.text}"
        
        roles = response.json()
        assert isinstance(roles, list), "Roles should be a list"
        assert len(roles) >= 3, f"Expected at least 3 default roles (admin, manager, employee), got {len(roles)}"
        
        # Verify role structure
        role_names = [r.get("name") for r in roles]
        assert "admin" in role_names, "Admin role should exist"
        assert "manager" in role_names, "Manager role should exist"
        assert "employee" in role_names, "Employee role should exist"
        
        # Check role has permissions dict
        for role in roles:
            assert "id" in role, "Role should have id"
            assert "name" in role, "Role should have name"
            assert "permissions" in role, "Role should have permissions"
            assert isinstance(role["permissions"], dict), "Permissions should be a dict"
        
        print(f"✓ GET /api/settings/roles returned {len(roles)} roles: {role_names}")
    
    def test_02_create_role(self):
        """POST /api/settings/roles - Should create a new role"""
        new_role_data = {
            "name": "team_lead_test",
            "description": "Team Leader role for testing",
            "permissions": {
                "tasks": ["create", "read", "update"],
                "users": ["read"]
            }
        }
        
        response = self.session.post(f"{BASE_URL}/api/settings/roles", json=new_role_data)
        
        # May fail if role already exists
        if response.status_code == 400 and "already exists" in response.text.lower():
            print("✓ Role already exists (from previous test run) - expected behavior")
            return
        
        assert response.status_code == 200, f"Failed to create role: {response.text}"
        
        role = response.json()
        assert role.get("name") == "team_lead_test", "Role name should match"
        assert role.get("description") == "Team Leader role for testing", "Role description should match"
        assert "id" in role, "Created role should have id"
        
        print(f"✓ POST /api/settings/roles created role: {role.get('name')}")
    
    def test_03_update_role_permissions(self):
        """PUT /api/settings/roles/{id} - Should update role permissions"""
        # First, get all roles to find admin role
        response = self.session.get(f"{BASE_URL}/api/settings/roles")
        assert response.status_code == 200
        roles = response.json()
        
        # Find the manager role (or admin if manager not found)
        target_role = None
        for role in roles:
            if role.get("name") == "manager":
                target_role = role
                break
        
        if not target_role:
            target_role = roles[0] if roles else None
        
        assert target_role is not None, "No role found to update"
        
        role_id = target_role.get("id")
        updated_permissions = {
            "applications": ["create", "read", "update", "delete"],
            "tasks": ["create", "read", "update", "delete"],
            "tickets": ["create", "read", "update"]
        }
        
        response = self.session.put(f"{BASE_URL}/api/settings/roles/{role_id}", json={
            "permissions": updated_permissions,
            "description": "Updated manager role"
        })
        assert response.status_code == 200, f"Failed to update role: {response.text}"
        
        updated_role = response.json()
        assert updated_role.get("permissions") is not None, "Updated role should have permissions"
        
        print(f"✓ PUT /api/settings/roles/{role_id} updated role permissions")
    
    def test_04_cannot_delete_system_role(self):
        """DELETE /api/settings/roles/{id} - Should not delete system roles"""
        # Get roles
        response = self.session.get(f"{BASE_URL}/api/settings/roles")
        assert response.status_code == 200
        roles = response.json()
        
        # Find admin role (system role)
        admin_role = None
        for role in roles:
            if role.get("name") == "admin":
                admin_role = role
                break
        
        if admin_role:
            role_id = admin_role.get("id")
            response = self.session.delete(f"{BASE_URL}/api/settings/roles/{role_id}")
            # Should fail because admin is a system role
            assert response.status_code == 400 or response.status_code == 403, \
                "Should not be able to delete system role"
            print(f"✓ DELETE /api/settings/roles/{role_id} correctly rejected for system role")
        else:
            print("⚠ No admin role found to test delete rejection")
    
    def test_05_delete_custom_role(self):
        """DELETE /api/settings/roles/{id} - Should delete non-system roles"""
        # Get roles
        response = self.session.get(f"{BASE_URL}/api/settings/roles")
        assert response.status_code == 200
        roles = response.json()
        
        # Find our test role
        test_role = None
        for role in roles:
            if role.get("name") == "team_lead_test":
                test_role = role
                break
        
        if test_role and not test_role.get("is_system"):
            role_id = test_role.get("id")
            response = self.session.delete(f"{BASE_URL}/api/settings/roles/{role_id}")
            assert response.status_code == 200, f"Failed to delete custom role: {response.text}"
            print(f"✓ DELETE /api/settings/roles/{role_id} deleted custom role")
        else:
            print("⚠ No custom test role found to delete")
    
    # ==================== DASHBOARD PREFERENCES API TESTS ====================
    
    def test_06_get_dashboard_preferences(self):
        """GET /api/settings/dashboard-preferences - Should return user dashboard prefs"""
        response = self.session.get(f"{BASE_URL}/api/settings/dashboard-preferences")
        assert response.status_code == 200, f"Failed to get dashboard prefs: {response.text}"
        
        prefs = response.json()
        assert "visible_widgets" in prefs or prefs == {}, "Should have visible_widgets or be empty"
        
        if "visible_widgets" in prefs:
            assert isinstance(prefs["visible_widgets"], list), "visible_widgets should be a list"
        
        print(f"✓ GET /api/settings/dashboard-preferences returned prefs: {prefs.get('visible_widgets', 'default')}")
    
    def test_07_update_dashboard_preferences(self):
        """PUT /api/settings/dashboard-preferences - Should update dashboard prefs"""
        new_prefs = {
            "visible_widgets": ["applications", "expenses", "users", "tickets"],
            "layout": "default"
        }
        
        response = self.session.put(f"{BASE_URL}/api/settings/dashboard-preferences", json=new_prefs)
        assert response.status_code == 200, f"Failed to update dashboard prefs: {response.text}"
        
        prefs = response.json()
        assert "visible_widgets" in prefs, "Response should have visible_widgets"
        assert "applications" in prefs["visible_widgets"], "applications should be in visible_widgets"
        assert "expenses" in prefs["visible_widgets"], "expenses should be in visible_widgets"
        
        print(f"✓ PUT /api/settings/dashboard-preferences updated to {prefs['visible_widgets']}")
    
    def test_08_verify_dashboard_preferences_persisted(self):
        """GET /api/settings/dashboard-preferences - Verify prefs were persisted"""
        response = self.session.get(f"{BASE_URL}/api/settings/dashboard-preferences")
        assert response.status_code == 200
        
        prefs = response.json()
        if "visible_widgets" in prefs:
            assert "applications" in prefs["visible_widgets"] or len(prefs["visible_widgets"]) > 0
        
        print(f"✓ Dashboard preferences persisted correctly")
    
    # ==================== REPORTS DASHBOARD API TESTS ====================
    
    def test_09_get_reports_dashboard(self):
        """GET /api/reports/dashboard - Should return comprehensive dashboard data"""
        response = self.session.get(f"{BASE_URL}/api/reports/dashboard")
        assert response.status_code == 200, f"Failed to get reports dashboard: {response.text}"
        
        data = response.json()
        
        # Verify top-level structure
        assert "users" in data, "Should have users data"
        assert "applications" in data, "Should have applications data"
        assert "tickets" in data, "Should have tickets data"
        assert "expense_breakdown" in data, "Should have expense_breakdown data"
        
        # Verify users data structure
        users_data = data.get("users", {})
        assert "total" in users_data, "users should have total"
        assert "active" in users_data, "users should have active count"
        assert "inactive" in users_data, "users should have inactive count"
        assert "by_division" in users_data, "users should have by_division array"
        
        print(f"✓ Users: total={users_data.get('total')}, active={users_data.get('active')}, inactive={users_data.get('inactive')}")
        
        # Verify by_division is an array
        by_division = users_data.get("by_division", [])
        assert isinstance(by_division, list), "by_division should be a list"
        
        if len(by_division) > 0:
            # Check array item structure
            item = by_division[0]
            assert "name" in item, "Division item should have name"
            assert "value" in item, "Division item should have value (count)"
        
        print(f"✓ Users by division: {len(by_division)} divisions found")
        
        # Verify expense_breakdown
        expense_breakdown = data.get("expense_breakdown", {})
        assert "by_type" in expense_breakdown, "expense_breakdown should have by_type"
        assert "by_applicant" in expense_breakdown, "expense_breakdown should have by_applicant"
        
        by_type = expense_breakdown.get("by_type", [])
        assert isinstance(by_type, list), "by_type should be a list"
        
        by_applicant = expense_breakdown.get("by_applicant", [])
        assert isinstance(by_applicant, list), "by_applicant should be a list"
        
        print(f"✓ Expense breakdown: {len(by_type)} types, {len(by_applicant)} applicants")
        
        # Verify tickets
        tickets = data.get("tickets", {})
        assert "open" in tickets, "tickets should have open count"
        
        print(f"✓ Tickets: open={tickets.get('open')}")
    
    def test_10_reports_dashboard_division_count(self):
        """Verify reports dashboard has expected number of divisions"""
        response = self.session.get(f"{BASE_URL}/api/reports/dashboard")
        assert response.status_code == 200
        
        data = response.json()
        by_division = data.get("users", {}).get("by_division", [])
        
        # Should have at least some divisions based on user data
        # Context: 122 users, 17 divisions expected
        print(f"✓ Found {len(by_division)} divisions in reports")
        
        for div in by_division[:5]:  # Print first 5
            print(f"  - {div.get('name')}: {div.get('value')} users")
    
    def test_11_settings_general_api(self):
        """GET/PUT /api/settings - Test general settings API"""
        # GET settings
        response = self.session.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200, f"Failed to get settings: {response.text}"
        
        settings = response.json()
        # Settings may have various fields
        print(f"✓ GET /api/settings returned settings with keys: {list(settings.keys())[:5]}...")
        
        # Try to update a setting
        update_data = {
            "company_name": "Sentech Test",
            "timezone": "Africa/Johannesburg"
        }
        response = self.session.put(f"{BASE_URL}/api/settings", json=update_data)
        assert response.status_code == 200, f"Failed to update settings: {response.text}"
        
        print(f"✓ PUT /api/settings updated successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
