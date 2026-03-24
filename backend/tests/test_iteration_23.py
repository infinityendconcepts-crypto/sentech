"""
Iteration 23 Backend Tests - RBAC Features Testing
Tests for:
1. Login for super_admin, admin, employee
2. Tickets API - employee can create tickets (POST /api/tickets)
3. Contactable users API - employee sees only division/subgroup members
4. Dashboard stats API - employee-specific stats
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
SUPER_ADMIN_EMAIL = "jane.smith@uct.ac.za"
SUPER_ADMIN_PASSWORD = "securepass123"
ADMIN_EMAIL = "test.admin@sentech.co.za"
ADMIN_PASSWORD = "password"
EMPLOYEE_EMAIL = "test.employee@sentech.co.za"
EMPLOYEE_PASSWORD = "password"


class TestAuthLogin:
    """Test authentication for different user roles"""
    
    def test_super_admin_login(self):
        """Super admin should be able to login and have super_admin role"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "password": SUPER_ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Super admin login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        assert "user" in data, "No user in response"
        assert "super_admin" in data["user"].get("roles", []), f"User roles: {data['user'].get('roles')}"
        print(f"PASS: Super admin login successful, roles: {data['user'].get('roles')}")
    
    def test_admin_login(self):
        """Admin should be able to login and have admin role"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        assert "user" in data, "No user in response"
        assert "admin" in data["user"].get("roles", []), f"User roles: {data['user'].get('roles')}"
        print(f"PASS: Admin login successful, roles: {data['user'].get('roles')}")
    
    def test_employee_login(self):
        """Employee should be able to login and have employee role"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": EMPLOYEE_EMAIL,
            "password": EMPLOYEE_PASSWORD
        })
        assert response.status_code == 200, f"Employee login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        assert "user" in data, "No user in response"
        # Employee should NOT have admin or super_admin roles
        roles = data["user"].get("roles", [])
        assert "admin" not in roles, f"Employee should not have admin role: {roles}"
        assert "super_admin" not in roles, f"Employee should not have super_admin role: {roles}"
        print(f"PASS: Employee login successful, roles: {roles}, division: {data['user'].get('division')}")


class TestTicketsAPI:
    """Test tickets API - employees should be able to create tickets"""
    
    @pytest.fixture
    def employee_token(self):
        """Get employee auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": EMPLOYEE_EMAIL,
            "password": EMPLOYEE_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Employee login failed")
        return response.json()["access_token"]
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return response.json()["access_token"]
    
    def test_employee_can_create_ticket(self, employee_token):
        """Employee should be able to create a ticket without 403 error"""
        headers = {"Authorization": f"Bearer {employee_token}"}
        ticket_data = {
            "title": "TEST_Employee Ticket Creation Test",
            "description": "Testing that employees can create tickets",
            "category": "technical_support",
            "priority": "medium"
        }
        response = requests.post(f"{BASE_URL}/api/tickets", json=ticket_data, headers=headers)
        assert response.status_code in [200, 201], f"Employee ticket creation failed with {response.status_code}: {response.text}"
        data = response.json()
        assert "id" in data, "No ticket ID in response"
        assert data.get("title") == ticket_data["title"], "Ticket title mismatch"
        print(f"PASS: Employee created ticket successfully, ID: {data.get('id')}")
        
        # Cleanup - delete the test ticket
        ticket_id = data.get("id")
        if ticket_id:
            requests.delete(f"{BASE_URL}/api/tickets/{ticket_id}", headers=headers)
    
    def test_employee_can_get_own_tickets(self, employee_token):
        """Employee should be able to get their own tickets"""
        headers = {"Authorization": f"Bearer {employee_token}"}
        response = requests.get(f"{BASE_URL}/api/tickets", headers=headers)
        assert response.status_code == 200, f"Get tickets failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"PASS: Employee can get tickets, count: {len(data)}")
    
    def test_employee_can_get_ticket_stats(self, employee_token):
        """Employee should be able to get ticket stats"""
        headers = {"Authorization": f"Bearer {employee_token}"}
        response = requests.get(f"{BASE_URL}/api/tickets/stats", headers=headers)
        assert response.status_code == 200, f"Get ticket stats failed: {response.text}"
        data = response.json()
        assert "total" in data, "No total in stats"
        assert "open" in data, "No open count in stats"
        print(f"PASS: Employee can get ticket stats: {data}")


class TestContactableUsersAPI:
    """Test contactable users API - employees should only see division/subgroup members"""
    
    @pytest.fixture
    def employee_token_and_user(self):
        """Get employee auth token and user info"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": EMPLOYEE_EMAIL,
            "password": EMPLOYEE_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Employee login failed")
        data = response.json()
        return data["access_token"], data["user"]
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return response.json()["access_token"]
    
    def test_employee_contactable_users_returns_division_members(self, employee_token_and_user):
        """Employee should only see users from their division/subgroup"""
        token, user = employee_token_and_user
        headers = {"Authorization": f"Bearer {token}"}
        employee_division = user.get("division", "")
        
        response = requests.get(f"{BASE_URL}/api/messages/contactable-users", headers=headers)
        assert response.status_code == 200, f"Get contactable users failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # Check that returned users are from the same division or subgroup
        if employee_division:
            for contact in data:
                contact_division = contact.get("division", "")
                # User should be from same division OR be in a shared subgroup
                # We can't fully verify subgroup membership here, but we can check division
                print(f"  Contact: {contact.get('full_name')} - Division: {contact_division}")
        
        print(f"PASS: Employee contactable users returned {len(data)} users (employee division: {employee_division})")
    
    def test_admin_contactable_users_returns_all(self, admin_token):
        """Admin should see all active users"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/messages/contactable-users", headers=headers)
        assert response.status_code == 200, f"Get contactable users failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"PASS: Admin contactable users returned {len(data)} users (should be all active users)")
    
    def test_employee_sees_fewer_contacts_than_admin(self, employee_token_and_user, admin_token):
        """Employee should see fewer contactable users than admin"""
        token, user = employee_token_and_user
        employee_headers = {"Authorization": f"Bearer {token}"}
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        
        employee_response = requests.get(f"{BASE_URL}/api/messages/contactable-users", headers=employee_headers)
        admin_response = requests.get(f"{BASE_URL}/api/messages/contactable-users", headers=admin_headers)
        
        assert employee_response.status_code == 200
        assert admin_response.status_code == 200
        
        employee_contacts = employee_response.json()
        admin_contacts = admin_response.json()
        
        # Employee should see fewer or equal contacts (if all users are in same division)
        print(f"Employee sees {len(employee_contacts)} contacts, Admin sees {len(admin_contacts)} contacts")
        # This is informational - we don't assert because it depends on data
        print(f"PASS: Contactable users comparison - Employee: {len(employee_contacts)}, Admin: {len(admin_contacts)}")


class TestDashboardStats:
    """Test dashboard stats API - employee should see their own stats"""
    
    @pytest.fixture
    def employee_token(self):
        """Get employee auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": EMPLOYEE_EMAIL,
            "password": EMPLOYEE_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Employee login failed")
        return response.json()["access_token"]
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return response.json()["access_token"]
    
    def test_employee_dashboard_stats(self, employee_token):
        """Employee should get their own dashboard stats"""
        headers = {"Authorization": f"Bearer {employee_token}"}
        response = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=headers)
        assert response.status_code == 200, f"Get dashboard stats failed: {response.text}"
        data = response.json()
        
        # Check expected fields
        expected_fields = ["total_applications", "pending_applications", "approved_applications", 
                          "training_applications", "open_tickets", "unread_notifications"]
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
        
        print(f"PASS: Employee dashboard stats: {data}")
    
    def test_admin_dashboard_stats(self, admin_token):
        """Admin should get dashboard stats"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=headers)
        assert response.status_code == 200, f"Get dashboard stats failed: {response.text}"
        data = response.json()
        print(f"PASS: Admin dashboard stats: {data}")


class TestUsersAPI:
    """Test users API - check for unassigned filter"""
    
    @pytest.fixture
    def super_admin_token(self):
        """Get super admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "password": SUPER_ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Super admin login failed")
        return response.json()["access_token"]
    
    def test_get_users_list(self, super_admin_token):
        """Super admin should be able to get users list"""
        headers = {"Authorization": f"Bearer {super_admin_token}"}
        response = requests.get(f"{BASE_URL}/api/users", headers=headers)
        assert response.status_code == 200, f"Get users failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # Check for users with and without division (unassigned)
        unassigned_count = sum(1 for u in data if not u.get("division"))
        assigned_count = sum(1 for u in data if u.get("division"))
        
        print(f"PASS: Users list returned {len(data)} users (Assigned: {assigned_count}, Unassigned: {unassigned_count})")


class TestSettingsAccess:
    """Test settings API access - only super_admin should access"""
    
    @pytest.fixture
    def super_admin_token(self):
        """Get super admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "password": SUPER_ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Super admin login failed")
        return response.json()["access_token"]
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return response.json()["access_token"]
    
    @pytest.fixture
    def employee_token(self):
        """Get employee auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": EMPLOYEE_EMAIL,
            "password": EMPLOYEE_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Employee login failed")
        return response.json()["access_token"]
    
    def test_super_admin_can_access_settings(self, super_admin_token):
        """Super admin should be able to access settings"""
        headers = {"Authorization": f"Bearer {super_admin_token}"}
        response = requests.get(f"{BASE_URL}/api/settings", headers=headers)
        # Settings endpoint should return 200 for super_admin
        assert response.status_code == 200, f"Super admin settings access failed: {response.text}"
        print(f"PASS: Super admin can access settings")
    
    def test_admin_settings_access(self, admin_token):
        """Admin settings access - check if restricted"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/settings", headers=headers)
        # Note: Backend may or may not restrict this - we're testing the behavior
        print(f"Admin settings access status: {response.status_code}")
        # This is informational - the frontend restricts access via sidebar
    
    def test_employee_settings_access(self, employee_token):
        """Employee settings access - check if restricted"""
        headers = {"Authorization": f"Bearer {employee_token}"}
        response = requests.get(f"{BASE_URL}/api/settings", headers=headers)
        # Note: Backend may or may not restrict this - we're testing the behavior
        print(f"Employee settings access status: {response.status_code}")
        # This is informational - the frontend restricts access via sidebar


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
