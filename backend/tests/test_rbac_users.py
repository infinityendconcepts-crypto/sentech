"""
RBAC User Management Tests - Tests for admin-only user create/delete functionality
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://sentech-groups.preview.emergentagent.com')

class TestRBACUserManagement:
    """Tests for admin-only user management (create/delete)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - login as admin and student"""
        # Admin login
        admin_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "jane.smith@uct.ac.za",
            "password": "securepass123"
        })
        assert admin_resp.status_code == 200, f"Admin login failed: {admin_resp.text}"
        admin_data = admin_resp.json()
        self.admin_token = admin_data["access_token"]
        self.admin_user = admin_data["user"]
        
        # Verify admin has admin role
        assert "admin" in self.admin_user.get("roles", []), "Jane Smith should be admin"
        
        # Student login
        student_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test.student@uct.ac.za",
            "password": "password123"
        })
        assert student_resp.status_code == 200, f"Student login failed: {student_resp.text}"
        student_data = student_resp.json()
        self.student_token = student_data["access_token"]
        self.student_user = student_data["user"]
        
        # Verify student does NOT have admin role
        assert "admin" not in self.student_user.get("roles", []), "Test Student should NOT be admin"
        
    def admin_headers(self):
        return {"Authorization": f"Bearer {self.admin_token}"}
        
    def student_headers(self):
        return {"Authorization": f"Bearer {self.student_token}"}
    
    # ============ Admin Create User Tests ============
    
    def test_admin_can_create_user(self):
        """Admin should be able to create new user"""
        test_email = f"TEST_rbac_user_{uuid.uuid4().hex[:8]}@uct.ac.za"
        resp = requests.post(f"{BASE_URL}/api/users", 
            headers=self.admin_headers(),
            json={
                "email": test_email,
                "full_name": "TEST RBAC User",
                "role": "student",
                "password": "TestPass123"
            }
        )
        assert resp.status_code in [200, 201], f"Admin should create user. Got: {resp.status_code} - {resp.text}"
        
        user_data = resp.json()
        assert user_data.get("email") == test_email
        assert "student" in user_data.get("roles", [])
        
        # Cleanup - delete the test user
        self.created_user_id = user_data.get("id")
        if self.created_user_id:
            requests.delete(f"{BASE_URL}/api/users/{self.created_user_id}", headers=self.admin_headers())
        
    def test_student_cannot_create_user(self):
        """Student should NOT be able to create users - returns 403"""
        test_email = f"TEST_fail_user_{uuid.uuid4().hex[:8]}@uct.ac.za"
        resp = requests.post(f"{BASE_URL}/api/users", 
            headers=self.student_headers(),
            json={
                "email": test_email,
                "full_name": "Should Fail User",
                "role": "student",
                "password": "TestPass123"
            }
        )
        assert resp.status_code == 403, f"Student should get 403 Forbidden. Got: {resp.status_code} - {resp.text}"
        
    def test_admin_create_user_with_admin_role(self):
        """Admin can create another admin user"""
        test_email = f"TEST_admin_user_{uuid.uuid4().hex[:8]}@uct.ac.za"
        resp = requests.post(f"{BASE_URL}/api/users", 
            headers=self.admin_headers(),
            json={
                "email": test_email,
                "full_name": "TEST Admin User",
                "role": "admin",
                "password": "TestPass123"
            }
        )
        assert resp.status_code in [200, 201], f"Admin should create admin user. Got: {resp.status_code} - {resp.text}"
        
        user_data = resp.json()
        assert "admin" in user_data.get("roles", [])
        
        # Cleanup
        user_id = user_data.get("id")
        if user_id:
            requests.delete(f"{BASE_URL}/api/users/{user_id}", headers=self.admin_headers())
    
    def test_create_user_invalid_role_rejected(self):
        """Creating user with invalid role should fail or default to student"""
        test_email = f"TEST_invalid_role_{uuid.uuid4().hex[:8]}@uct.ac.za"
        resp = requests.post(f"{BASE_URL}/api/users", 
            headers=self.admin_headers(),
            json={
                "email": test_email,
                "full_name": "TEST Invalid Role",
                "role": "superadmin",  # Invalid role - only admin/student allowed
                "password": "TestPass123"
            }
        )
        # Should either reject (400) or ignore invalid role
        if resp.status_code in [200, 201]:
            user_data = resp.json()
            # If accepted, role should NOT be 'superadmin'
            assert "superadmin" not in user_data.get("roles", [])
            # Cleanup
            user_id = user_data.get("id")
            if user_id:
                requests.delete(f"{BASE_URL}/api/users/{user_id}", headers=self.admin_headers())
        else:
            # Either 400 Bad Request or other error
            assert resp.status_code == 400, f"Expected 400 for invalid role, got {resp.status_code}"
    
    # ============ Admin Delete User Tests ============
    
    def test_admin_can_delete_user(self):
        """Admin should be able to delete users"""
        # First create a test user
        test_email = f"TEST_delete_user_{uuid.uuid4().hex[:8]}@uct.ac.za"
        create_resp = requests.post(f"{BASE_URL}/api/users", 
            headers=self.admin_headers(),
            json={
                "email": test_email,
                "full_name": "TEST Delete User",
                "role": "student",
                "password": "TestPass123"
            }
        )
        assert create_resp.status_code in [200, 201]
        user_id = create_resp.json().get("id")
        
        # Now delete the user
        delete_resp = requests.delete(f"{BASE_URL}/api/users/{user_id}", headers=self.admin_headers())
        assert delete_resp.status_code in [200, 204], f"Admin should delete user. Got: {delete_resp.status_code}"
        
        # Verify user no longer exists
        get_resp = requests.get(f"{BASE_URL}/api/users/{user_id}", headers=self.admin_headers())
        assert get_resp.status_code == 404, "Deleted user should not be found"
        
    def test_student_cannot_delete_user(self):
        """Student should NOT be able to delete users"""
        # First create a test user as admin
        test_email = f"TEST_nodelete_user_{uuid.uuid4().hex[:8]}@uct.ac.za"
        create_resp = requests.post(f"{BASE_URL}/api/users", 
            headers=self.admin_headers(),
            json={
                "email": test_email,
                "full_name": "TEST No Delete User",
                "role": "student",
                "password": "TestPass123"
            }
        )
        assert create_resp.status_code in [200, 201]
        user_id = create_resp.json().get("id")
        
        # Try to delete as student - should fail with 403
        delete_resp = requests.delete(f"{BASE_URL}/api/users/{user_id}", headers=self.student_headers())
        assert delete_resp.status_code == 403, f"Student should get 403. Got: {delete_resp.status_code}"
        
        # Cleanup as admin
        requests.delete(f"{BASE_URL}/api/users/{user_id}", headers=self.admin_headers())
        
    def test_admin_cannot_delete_self(self):
        """Admin should not be able to delete their own account"""
        delete_resp = requests.delete(
            f"{BASE_URL}/api/users/{self.admin_user['id']}", 
            headers=self.admin_headers()
        )
        assert delete_resp.status_code == 400, f"Should not delete self. Got: {delete_resp.status_code}"
    
    # ============ Admin Change Role Tests ============
    
    def test_admin_can_change_user_role(self):
        """Admin can change user role from student to admin and back"""
        # Create test user
        test_email = f"TEST_role_change_{uuid.uuid4().hex[:8]}@uct.ac.za"
        create_resp = requests.post(f"{BASE_URL}/api/users", 
            headers=self.admin_headers(),
            json={
                "email": test_email,
                "full_name": "TEST Role Change",
                "role": "student",
                "password": "TestPass123"
            }
        )
        assert create_resp.status_code in [200, 201]
        user_id = create_resp.json().get("id")
        
        # Change role to admin
        role_resp = requests.put(
            f"{BASE_URL}/api/users/{user_id}/role", 
            headers=self.admin_headers(),
            json={"roles": ["admin"]}
        )
        assert role_resp.status_code == 200, f"Should change role. Got: {role_resp.status_code}"
        
        # Verify role changed
        get_resp = requests.get(f"{BASE_URL}/api/users/{user_id}", headers=self.admin_headers())
        assert "admin" in get_resp.json().get("roles", [])
        
        # Change back to student
        role_resp2 = requests.put(
            f"{BASE_URL}/api/users/{user_id}/role", 
            headers=self.admin_headers(),
            json={"roles": ["student"]}
        )
        assert role_resp2.status_code == 200
        
        # Verify
        get_resp2 = requests.get(f"{BASE_URL}/api/users/{user_id}", headers=self.admin_headers())
        user_roles = get_resp2.json().get("roles", [])
        assert "student" in user_roles
        assert "admin" not in user_roles
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/users/{user_id}", headers=self.admin_headers())
        
    def test_student_cannot_change_role(self):
        """Student cannot change roles"""
        # Get any other user (admin user)
        resp = requests.put(
            f"{BASE_URL}/api/users/{self.admin_user['id']}/role", 
            headers=self.student_headers(),
            json={"roles": ["student"]}
        )
        assert resp.status_code == 403, f"Student should get 403. Got: {resp.status_code}"
        
    # ============ Get Users List Tests ============
    
    def test_admin_can_get_users_list(self):
        """Admin can list all users"""
        resp = requests.get(f"{BASE_URL}/api/users", headers=self.admin_headers())
        assert resp.status_code == 200
        users = resp.json()
        assert isinstance(users, list)
        assert len(users) > 0
        
    def test_student_can_get_users_list(self):
        """Student can also get users list (for team/messaging features)"""
        resp = requests.get(f"{BASE_URL}/api/users", headers=self.student_headers())
        assert resp.status_code == 200
        users = resp.json()
        assert isinstance(users, list)


class TestRBACAccessControl:
    """Tests for role-based route access control"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - login as admin and student"""
        # Admin login
        admin_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "jane.smith@uct.ac.za",
            "password": "securepass123"
        })
        self.admin_token = admin_resp.json()["access_token"]
        
        # Student login
        student_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test.student@uct.ac.za",
            "password": "password123"
        })
        self.student_token = student_resp.json()["access_token"]
        
    def admin_headers(self):
        return {"Authorization": f"Bearer {self.admin_token}"}
        
    def student_headers(self):
        return {"Authorization": f"Bearer {self.student_token}"}
    
    # ============ Admin-only API Access Tests ============
    
    def test_admin_can_access_settings(self):
        """Admin can access settings API"""
        resp = requests.get(f"{BASE_URL}/api/settings", headers=self.admin_headers())
        # Settings should be accessible (even if empty)
        assert resp.status_code in [200, 404], f"Admin settings access: {resp.status_code}"
        
    def test_admin_can_access_reports(self):
        """Admin can access reports dashboard"""
        resp = requests.get(f"{BASE_URL}/api/reports/dashboard", headers=self.admin_headers())
        assert resp.status_code in [200, 404], f"Admin reports access: {resp.status_code}"
        
    def test_admin_can_access_leads(self):
        """Admin can access leads"""
        resp = requests.get(f"{BASE_URL}/api/leads", headers=self.admin_headers())
        assert resp.status_code == 200, f"Admin leads access: {resp.status_code}"
        
    def test_admin_can_access_sponsors(self):
        """Admin can access sponsors"""
        resp = requests.get(f"{BASE_URL}/api/sponsors", headers=self.admin_headers())
        assert resp.status_code == 200, f"Admin sponsors access: {resp.status_code}"
        
    def test_admin_can_access_expenses(self):
        """Admin can access expenses"""
        resp = requests.get(f"{BASE_URL}/api/expenses", headers=self.admin_headers())
        assert resp.status_code == 200, f"Admin expenses access: {resp.status_code}"
        
    def test_admin_can_access_prospects(self):
        """Admin can access prospects"""
        resp = requests.get(f"{BASE_URL}/api/prospects", headers=self.admin_headers())
        assert resp.status_code == 200, f"Admin prospects access: {resp.status_code}"
        
    def test_admin_can_access_projects(self):
        """Admin can access projects"""
        resp = requests.get(f"{BASE_URL}/api/projects", headers=self.admin_headers())
        assert resp.status_code == 200, f"Admin projects access: {resp.status_code}"
        
    def test_admin_can_access_bbbee(self):
        """Admin can access BBBEE"""
        resp = requests.get(f"{BASE_URL}/api/bbbee", headers=self.admin_headers())
        assert resp.status_code == 200, f"Admin BBBEE access: {resp.status_code}"

    # ============ Student-accessible API Tests ============
    
    def test_student_can_access_dashboard(self):
        """Student can access dashboard stats"""
        resp = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=self.student_headers())
        assert resp.status_code == 200, f"Student dashboard: {resp.status_code}"
        
    def test_student_can_access_tasks(self):
        """Student can access tasks"""
        resp = requests.get(f"{BASE_URL}/api/tasks", headers=self.student_headers())
        assert resp.status_code == 200, f"Student tasks: {resp.status_code}"
        
    def test_student_can_access_meetings(self):
        """Student can access meetings"""
        resp = requests.get(f"{BASE_URL}/api/meetings", headers=self.student_headers())
        assert resp.status_code == 200, f"Student meetings: {resp.status_code}"
        
    def test_student_can_access_notes(self):
        """Student can access notes"""
        resp = requests.get(f"{BASE_URL}/api/notes", headers=self.student_headers())
        assert resp.status_code == 200, f"Student notes: {resp.status_code}"
        
    def test_student_can_access_messages(self):
        """Student can access messages"""
        resp = requests.get(f"{BASE_URL}/api/messages/conversations", headers=self.student_headers())
        assert resp.status_code == 200, f"Student messages: {resp.status_code}"
        
    def test_student_can_access_files(self):
        """Student can access files"""
        resp = requests.get(f"{BASE_URL}/api/files", headers=self.student_headers())
        assert resp.status_code == 200, f"Student files: {resp.status_code}"
        
    def test_student_can_access_tickets(self):
        """Student can access tickets"""
        resp = requests.get(f"{BASE_URL}/api/tickets", headers=self.student_headers())
        assert resp.status_code == 200, f"Student tickets: {resp.status_code}"
        
    def test_student_can_access_events(self):
        """Student can access events"""
        resp = requests.get(f"{BASE_URL}/api/events", headers=self.student_headers())
        assert resp.status_code == 200, f"Student events: {resp.status_code}"
        
    def test_student_can_access_teams(self):
        """Student can access teams"""
        resp = requests.get(f"{BASE_URL}/api/teams", headers=self.student_headers())
        assert resp.status_code == 200, f"Student teams: {resp.status_code}"
        
    def test_student_can_access_applications(self):
        """Student can access applications"""
        resp = requests.get(f"{BASE_URL}/api/applications", headers=self.student_headers())
        assert resp.status_code == 200, f"Student applications: {resp.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
