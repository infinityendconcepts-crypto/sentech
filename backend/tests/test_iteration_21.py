"""
Iteration 21 Backend Tests
Tests for:
- Login with different user types (super admin, test employee, test admin)
- GET /api/applications (admin sees all, employee sees only own)
- GET /api/training-applications (admin sees all, employee sees own)
- GET /api/application-settings (bursary_open/training_open fields)
- PUT /api/application-settings (admin only)
- DELETE /api/applications/{id} (admin only)
- POST /api/applications/batch-delete (admin only)
- DELETE /api/training-applications/{id} (admin only)
- POST /api/training-applications/batch-delete (admin only)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
SUPER_ADMIN = {"email": "jane.smith@uct.ac.za", "password": "securepass123"}
TEST_EMPLOYEE = {"email": "test.employee@sentech.co.za", "password": "password"}
TEST_ADMIN = {"email": "test.admin@sentech.co.za", "password": "password"}

class TestAuthLogin:
    """Test login with different user types"""
    
    def test_super_admin_login(self):
        """Test super admin login works"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN)
        assert response.status_code == 200, f"Super admin login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == SUPER_ADMIN["email"]
        # Check if roles exist
        roles = data["user"].get("roles", [])
        assert "super_admin" in roles or "admin" in roles, f"Expected admin role, got {roles}"
        print(f"✓ Super admin login successful: {data['user']['email']}")
    
    def test_test_employee_login(self):
        """Test employee login works"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_EMPLOYEE)
        assert response.status_code == 200, f"Employee login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_EMPLOYEE["email"]
        print(f"✓ Test employee login successful: {data['user']['email']}")
    
    def test_test_admin_login(self):
        """Test admin login works"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_ADMIN)
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_ADMIN["email"]
        print(f"✓ Test admin login successful: {data['user']['email']}")


class TestApplicationsAPI:
    """Test applications endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN)
        if response.status_code != 200:
            pytest.skip("Super admin login failed")
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def employee_token(self):
        """Get employee auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_EMPLOYEE)
        if response.status_code != 200:
            pytest.skip("Employee login failed")
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def employee_user_id(self):
        """Get employee user ID"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_EMPLOYEE)
        if response.status_code != 200:
            pytest.skip("Employee login failed")
        return response.json()["user"]["id"]
    
    def test_get_applications_as_admin(self, admin_token):
        """Admin can see all applications"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/applications", headers=headers)
        assert response.status_code == 200, f"GET applications failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin can GET applications (found {len(data)} applications)")
    
    def test_get_applications_as_employee(self, employee_token, employee_user_id):
        """Employee can only see their own applications"""
        headers = {"Authorization": f"Bearer {employee_token}"}
        response = requests.get(f"{BASE_URL}/api/applications", headers=headers)
        assert response.status_code == 200, f"GET applications failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        # Verify all returned applications belong to the employee
        for app in data:
            assert app.get("user_id") == employee_user_id, f"Employee can see other user's application: {app.get('user_id')}"
        print(f"✓ Employee GET applications works (found {len(data)} own applications)")
    
    def test_delete_application_admin_only(self, admin_token, employee_token):
        """Only admin can delete applications"""
        headers_admin = {"Authorization": f"Bearer {admin_token}"}
        headers_employee = {"Authorization": f"Bearer {employee_token}"}
        
        # Create a test application first as admin
        create_response = requests.post(
            f"{BASE_URL}/api/applications",
            headers=headers_admin,
            json={"status": "draft", "personal_info": {"name": "TEST_Delete_App"}}
        )
        assert create_response.status_code == 200, f"Create app failed: {create_response.text}"
        app_id = create_response.json()["id"]
        
        # Try to delete as employee - should fail
        delete_response = requests.delete(f"{BASE_URL}/api/applications/{app_id}", headers=headers_employee)
        assert delete_response.status_code == 403, f"Employee should not be able to delete: {delete_response.status_code}"
        
        # Delete as admin - should succeed
        delete_response_admin = requests.delete(f"{BASE_URL}/api/applications/{app_id}", headers=headers_admin)
        assert delete_response_admin.status_code == 200, f"Admin delete failed: {delete_response_admin.text}"
        print("✓ DELETE applications works correctly (admin only)")
    
    def test_batch_delete_applications_admin_only(self, admin_token, employee_token):
        """Only admin can batch delete applications"""
        headers_admin = {"Authorization": f"Bearer {admin_token}"}
        headers_employee = {"Authorization": f"Bearer {employee_token}"}
        
        # Create test applications
        app_ids = []
        for i in range(2):
            create_response = requests.post(
                f"{BASE_URL}/api/applications",
                headers=headers_admin,
                json={"status": "draft", "personal_info": {"name": f"TEST_Batch_{i}"}}
            )
            assert create_response.status_code == 200
            app_ids.append(create_response.json()["id"])
        
        # Employee cannot batch delete
        emp_response = requests.post(
            f"{BASE_URL}/api/applications/batch-delete",
            headers=headers_employee,
            json={"application_ids": app_ids}
        )
        assert emp_response.status_code == 403, f"Employee should not batch delete: {emp_response.status_code}"
        
        # Admin can batch delete
        admin_response = requests.post(
            f"{BASE_URL}/api/applications/batch-delete",
            headers=headers_admin,
            json={"application_ids": app_ids}
        )
        assert admin_response.status_code == 200, f"Admin batch delete failed: {admin_response.text}"
        assert admin_response.json()["count"] == 2
        print("✓ Batch delete applications works (admin only)")


class TestTrainingApplicationsAPI:
    """Test training applications endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN)
        if response.status_code != 200:
            pytest.skip("Super admin login failed")
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def employee_token(self):
        """Get employee auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_EMPLOYEE)
        if response.status_code != 200:
            pytest.skip("Employee login failed")
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def employee_user_id(self):
        """Get employee user ID"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_EMPLOYEE)
        if response.status_code != 200:
            pytest.skip("Employee login failed")
        return response.json()["user"]["id"]
    
    def test_get_training_applications_as_admin(self, admin_token):
        """Admin can see all training applications"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/training-applications", headers=headers)
        assert response.status_code == 200, f"GET training apps failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin can GET training applications (found {len(data)} applications)")
    
    def test_get_training_applications_as_employee(self, employee_token, employee_user_id):
        """Employee can only see their own training applications"""
        headers = {"Authorization": f"Bearer {employee_token}"}
        response = requests.get(f"{BASE_URL}/api/training-applications", headers=headers)
        assert response.status_code == 200, f"GET training apps failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        for app in data:
            assert app.get("user_id") == employee_user_id, f"Employee can see other user's training app"
        print(f"✓ Employee GET training applications works (found {len(data)} own applications)")
    
    def test_delete_training_application_admin(self, admin_token):
        """Admin can delete training applications"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Create a test training application
        create_response = requests.post(
            f"{BASE_URL}/api/training-applications",
            headers=headers,
            json={"status": "draft", "training_info": {"training_type": "TEST_Delete_Training"}}
        )
        assert create_response.status_code == 200, f"Create training app failed: {create_response.text}"
        app_id = create_response.json()["id"]
        
        # Admin deletes the training application
        delete_response = requests.delete(f"{BASE_URL}/api/training-applications/{app_id}", headers=headers)
        assert delete_response.status_code == 200, f"Admin delete training failed: {delete_response.text}"
        print("✓ DELETE training applications works for admin")
    
    def test_batch_delete_training_applications_admin(self, admin_token, employee_token):
        """Only admin can batch delete training applications"""
        headers_admin = {"Authorization": f"Bearer {admin_token}"}
        headers_employee = {"Authorization": f"Bearer {employee_token}"}
        
        # Create test training applications
        app_ids = []
        for i in range(2):
            create_response = requests.post(
                f"{BASE_URL}/api/training-applications",
                headers=headers_admin,
                json={"status": "draft", "training_info": {"training_type": f"TEST_Batch_Training_{i}"}}
            )
            assert create_response.status_code == 200
            app_ids.append(create_response.json()["id"])
        
        # Employee cannot batch delete
        emp_response = requests.post(
            f"{BASE_URL}/api/training-applications/batch-delete",
            headers=headers_employee,
            json={"application_ids": app_ids}
        )
        assert emp_response.status_code == 403, f"Employee should not batch delete training apps: {emp_response.status_code}"
        
        # Admin can batch delete
        admin_response = requests.post(
            f"{BASE_URL}/api/training-applications/batch-delete",
            headers=headers_admin,
            json={"application_ids": app_ids}
        )
        assert admin_response.status_code == 200, f"Admin batch delete training failed: {admin_response.text}"
        assert admin_response.json()["count"] == 2
        print("✓ Batch delete training applications works (admin only)")


class TestApplicationSettings:
    """Test application settings endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN)
        if response.status_code != 200:
            pytest.skip("Super admin login failed")
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def employee_token(self):
        """Get employee auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_EMPLOYEE)
        if response.status_code != 200:
            pytest.skip("Employee login failed")
        return response.json()["access_token"]
    
    def test_get_application_settings(self, admin_token):
        """GET /api/application-settings returns settings with bursary_open and training_open"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/application-settings", headers=headers)
        assert response.status_code == 200, f"GET settings failed: {response.text}"
        data = response.json()
        
        # Verify required fields exist
        assert "bursary_open" in data, "Missing bursary_open field"
        assert "training_open" in data, "Missing training_open field"
        assert isinstance(data["bursary_open"], bool), f"bursary_open should be boolean, got {type(data['bursary_open'])}"
        assert isinstance(data["training_open"], bool), f"training_open should be boolean, got {type(data['training_open'])}"
        
        print(f"✓ GET application-settings returns correct structure: bursary_open={data['bursary_open']}, training_open={data['training_open']}")
    
    def test_update_application_settings_admin_only(self, admin_token, employee_token):
        """PUT /api/application-settings only works for admin"""
        headers_admin = {"Authorization": f"Bearer {admin_token}"}
        headers_employee = {"Authorization": f"Bearer {employee_token}"}
        
        # Get current settings
        get_response = requests.get(f"{BASE_URL}/api/application-settings", headers=headers_admin)
        original_settings = get_response.json()
        
        # Employee cannot update settings
        emp_response = requests.put(
            f"{BASE_URL}/api/application-settings",
            headers=headers_employee,
            json={"bursary_open": True}
        )
        assert emp_response.status_code == 403, f"Employee should not update settings: {emp_response.status_code}"
        
        # Admin can update settings
        admin_response = requests.put(
            f"{BASE_URL}/api/application-settings",
            headers=headers_admin,
            json={"bursary_open": True, "training_open": True}
        )
        assert admin_response.status_code == 200, f"Admin update settings failed: {admin_response.text}"
        data = admin_response.json()
        assert data["bursary_open"] == True
        assert data["training_open"] == True
        
        print("✓ PUT application-settings works correctly (admin only)")
    
    def test_application_settings_deadline_fields(self, admin_token):
        """Application settings includes deadline fields"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Update with deadline fields
        update_response = requests.put(
            f"{BASE_URL}/api/application-settings",
            headers=headers,
            json={
                "bursary_open": True,
                "training_open": True,
                "bursary_deadline": "2026-12-31",
                "training_deadline": "2026-12-31",
                "bursary_close_days_before": 8,
                "training_close_days_before": 8
            }
        )
        assert update_response.status_code == 200, f"Update settings failed: {update_response.text}"
        data = update_response.json()
        
        # Verify deadline fields are stored correctly
        assert "bursary_deadline" in data or data.get("bursary_deadline") is not None
        assert "training_deadline" in data or data.get("training_deadline") is not None
        
        print("✓ Application settings supports deadline fields")


class TestEmployeeVisibilityRestrictions:
    """Test that employees cannot see other users' applications"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN)
        if response.status_code != 200:
            pytest.skip("Super admin login failed")
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def employee_token(self):
        """Get employee auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_EMPLOYEE)
        if response.status_code != 200:
            pytest.skip("Employee login failed")
        return response.json()["access_token"]
    
    def test_employee_cannot_see_admin_applications(self, admin_token, employee_token):
        """Employee cannot see applications created by admin"""
        headers_admin = {"Authorization": f"Bearer {admin_token}"}
        headers_employee = {"Authorization": f"Bearer {employee_token}"}
        
        # Admin creates an application
        create_response = requests.post(
            f"{BASE_URL}/api/applications",
            headers=headers_admin,
            json={"status": "draft", "personal_info": {"name": "TEST_Admin_App_Visibility"}}
        )
        assert create_response.status_code == 200
        admin_app_id = create_response.json()["id"]
        
        # Employee gets their applications
        emp_apps_response = requests.get(f"{BASE_URL}/api/applications", headers=headers_employee)
        assert emp_apps_response.status_code == 200
        emp_apps = emp_apps_response.json()
        
        # Admin's application should not be in employee's list
        emp_app_ids = [app["id"] for app in emp_apps]
        assert admin_app_id not in emp_app_ids, "Employee can see admin's application!"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/applications/{admin_app_id}", headers=headers_admin)
        
        print("✓ Employee cannot see other users' applications")
    
    def test_employee_cannot_access_other_application_directly(self, admin_token, employee_token):
        """Employee cannot access another user's application by ID"""
        headers_admin = {"Authorization": f"Bearer {admin_token}"}
        headers_employee = {"Authorization": f"Bearer {employee_token}"}
        
        # Admin creates an application
        create_response = requests.post(
            f"{BASE_URL}/api/applications",
            headers=headers_admin,
            json={"status": "draft", "personal_info": {"name": "TEST_Direct_Access"}}
        )
        assert create_response.status_code == 200
        admin_app_id = create_response.json()["id"]
        
        # Employee tries to access admin's app directly
        emp_direct_response = requests.get(
            f"{BASE_URL}/api/applications/{admin_app_id}",
            headers=headers_employee
        )
        assert emp_direct_response.status_code == 403, f"Employee accessed admin's app: {emp_direct_response.status_code}"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/applications/{admin_app_id}", headers=headers_admin)
        
        print("✓ Employee cannot access other users' applications directly by ID")


# Ensure tests can run standalone
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
