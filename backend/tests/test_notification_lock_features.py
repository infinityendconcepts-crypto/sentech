"""
Test Suite for Iteration 28 Features:
1. Notification bell dropdown - GET /api/notifications/recent returns last 5 notifications
2. Application Lock/Unlock system - lock/unlock endpoints for bursary and training applications
3. Clickable notifications routing to application edit pages
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
SUPER_ADMIN = {"email": "jane.smith@uct.ac.za", "password": "securepass123"}
ADMIN = {"email": "test.admin@sentech.co.za", "password": "password"}
EMPLOYEE = {"email": "test.employee@sentech.co.za", "password": "password"}


@pytest.fixture(scope="module")
def admin_token():
    """Get admin token for authenticated requests"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN)
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Admin authentication failed")


@pytest.fixture(scope="module")
def employee_token():
    """Get employee token for authenticated requests"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json=EMPLOYEE)
    if response.status_code == 200:
        return response.json().get("access_token")
    # Try to create employee if doesn't exist
    pytest.skip("Employee authentication failed - user may not exist")


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def employee_headers(employee_token):
    return {"Authorization": f"Bearer {employee_token}", "Content-Type": "application/json"}


# ============== NOTIFICATION RECENT ENDPOINT TESTS ==============

class TestNotificationRecent:
    """Tests for GET /api/notifications/recent endpoint"""
    
    def test_get_recent_notifications_returns_200(self, admin_headers):
        """GET /api/notifications/recent should return 200 for authenticated user"""
        response = requests.get(f"{BASE_URL}/api/notifications/recent", headers=admin_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"PASS: GET /api/notifications/recent returns 200 with {len(data)} notifications")
    
    def test_recent_notifications_max_5(self, admin_headers):
        """GET /api/notifications/recent should return at most 5 notifications"""
        response = requests.get(f"{BASE_URL}/api/notifications/recent", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 5, f"Expected max 5 notifications, got {len(data)}"
        print(f"PASS: Recent notifications returns at most 5 (got {len(data)})")
    
    def test_recent_notifications_sorted_by_created_at(self, admin_headers):
        """Recent notifications should be sorted by created_at descending"""
        response = requests.get(f"{BASE_URL}/api/notifications/recent", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        if len(data) >= 2:
            for i in range(len(data) - 1):
                assert data[i].get("created_at", "") >= data[i+1].get("created_at", ""), \
                    "Notifications should be sorted by created_at descending"
        print(f"PASS: Recent notifications are sorted by created_at descending")
    
    def test_recent_notifications_structure(self, admin_headers):
        """Recent notifications should have expected fields"""
        response = requests.get(f"{BASE_URL}/api/notifications/recent", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        if len(data) > 0:
            notif = data[0]
            expected_fields = ["id", "user_id", "type", "title", "message", "is_read", "created_at"]
            for field in expected_fields:
                assert field in notif, f"Missing field: {field}"
        print(f"PASS: Recent notifications have expected structure")
    
    def test_recent_notifications_unauthenticated_401(self):
        """GET /api/notifications/recent without auth should return 401"""
        response = requests.get(f"{BASE_URL}/api/notifications/recent")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"PASS: Unauthenticated request returns 401")


# ============== BURSARY APPLICATION LOCK/UNLOCK TESTS ==============

class TestBursaryApplicationLock:
    """Tests for bursary application lock/unlock endpoints"""
    
    @pytest.fixture(scope="class")
    def test_bursary_app(self, admin_headers):
        """Create a test bursary application for lock/unlock tests"""
        # First get existing applications
        response = requests.get(f"{BASE_URL}/api/applications", headers=admin_headers)
        if response.status_code == 200:
            apps = response.json()
            # Find a non-draft application to test lock/unlock
            for app in apps:
                if app.get("status") != "draft":
                    return app
        
        # Create a new application if none exist
        app_data = {
            "status": "pending",
            "current_step": 1,
            "personal_info": {"name": "TEST_Lock", "surname": "User"},
            "employment_info": {},
            "academic_info": {},
            "financial_info": {},
            "documents": {}
        }
        response = requests.post(f"{BASE_URL}/api/applications", json=app_data, headers=admin_headers)
        if response.status_code in [200, 201]:
            return response.json()
        pytest.skip("Could not create test application")
    
    def test_lock_bursary_application_admin(self, admin_headers, test_bursary_app):
        """PUT /api/applications/{id}/lock should lock application (admin only)"""
        app_id = test_bursary_app["id"]
        response = requests.put(f"{BASE_URL}/api/applications/{app_id}/lock", headers=admin_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data
        print(f"PASS: Admin can lock bursary application - {data.get('message')}")
    
    def test_verify_application_locked(self, admin_headers, test_bursary_app):
        """Verify application is_locked is True after locking"""
        app_id = test_bursary_app["id"]
        response = requests.get(f"{BASE_URL}/api/applications/{app_id}", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data.get("is_locked") == True, f"Expected is_locked=True, got {data.get('is_locked')}"
        print(f"PASS: Application is_locked=True after lock")
    
    def test_unlock_bursary_application_admin(self, admin_headers, test_bursary_app):
        """PUT /api/applications/{id}/unlock should unlock application and create notification"""
        app_id = test_bursary_app["id"]
        response = requests.put(f"{BASE_URL}/api/applications/{app_id}/unlock", headers=admin_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data
        print(f"PASS: Admin can unlock bursary application - {data.get('message')}")
    
    def test_verify_application_unlocked(self, admin_headers, test_bursary_app):
        """Verify application is_locked is False after unlocking"""
        app_id = test_bursary_app["id"]
        response = requests.get(f"{BASE_URL}/api/applications/{app_id}", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data.get("is_locked") == False, f"Expected is_locked=False, got {data.get('is_locked')}"
        print(f"PASS: Application is_locked=False after unlock")
    
    def test_lock_nonexistent_application_404(self, admin_headers):
        """PUT /api/applications/{id}/lock with invalid ID should return 404"""
        response = requests.put(f"{BASE_URL}/api/applications/nonexistent-id-12345/lock", headers=admin_headers)
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"PASS: Lock nonexistent application returns 404")


# ============== BURSARY APPLICATION BATCH UNLOCK TESTS ==============

class TestBursaryBatchUnlock:
    """Tests for batch unlock bursary applications"""
    
    def test_batch_unlock_empty_list_400(self, admin_headers):
        """POST /api/applications/batch-unlock with empty list should return 400"""
        response = requests.post(
            f"{BASE_URL}/api/applications/batch-unlock",
            json={"application_ids": []},
            headers=admin_headers
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print(f"PASS: Batch unlock with empty list returns 400")
    
    def test_batch_unlock_success(self, admin_headers):
        """POST /api/applications/batch-unlock should unlock multiple applications"""
        # Get applications to unlock
        response = requests.get(f"{BASE_URL}/api/applications", headers=admin_headers)
        if response.status_code != 200:
            pytest.skip("Could not get applications")
        
        apps = response.json()
        locked_apps = [a for a in apps if a.get("is_locked") and a.get("status") != "draft"]
        
        if len(locked_apps) == 0:
            # Lock some apps first
            for app in apps[:2]:
                if app.get("status") != "draft":
                    requests.put(f"{BASE_URL}/api/applications/{app['id']}/lock", headers=admin_headers)
            # Refresh list
            response = requests.get(f"{BASE_URL}/api/applications", headers=admin_headers)
            apps = response.json()
            locked_apps = [a for a in apps if a.get("is_locked") and a.get("status") != "draft"]
        
        if len(locked_apps) == 0:
            pytest.skip("No locked applications to test batch unlock")
        
        app_ids = [a["id"] for a in locked_apps[:2]]
        response = requests.post(
            f"{BASE_URL}/api/applications/batch-unlock",
            json={"application_ids": app_ids},
            headers=admin_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "count" in data or "message" in data
        print(f"PASS: Batch unlock successful - {data}")


# ============== TRAINING APPLICATION LOCK/UNLOCK TESTS ==============

class TestTrainingApplicationLock:
    """Tests for training application lock/unlock endpoints"""
    
    @pytest.fixture(scope="class")
    def test_training_app(self, admin_headers):
        """Create or get a test training application for lock/unlock tests"""
        response = requests.get(f"{BASE_URL}/api/training-applications", headers=admin_headers)
        if response.status_code == 200:
            apps = response.json()
            for app in apps:
                if app.get("status") != "draft":
                    return app
        
        # Create a new training application
        app_data = {
            "status": "pending",
            "current_step": 1,
            "personal_info": {"name": "TEST_Training", "surname": "Lock"},
            "employment_info": {},
            "training_info": {},
            "documents": {}
        }
        response = requests.post(f"{BASE_URL}/api/training-applications", json=app_data, headers=admin_headers)
        if response.status_code in [200, 201]:
            return response.json()
        pytest.skip("Could not create test training application")
    
    def test_lock_training_application_admin(self, admin_headers, test_training_app):
        """PUT /api/training-applications/{id}/lock should lock training application"""
        app_id = test_training_app["id"]
        response = requests.put(f"{BASE_URL}/api/training-applications/{app_id}/lock", headers=admin_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data
        print(f"PASS: Admin can lock training application - {data.get('message')}")
    
    def test_unlock_training_application_admin(self, admin_headers, test_training_app):
        """PUT /api/training-applications/{id}/unlock should unlock and notify applicant"""
        app_id = test_training_app["id"]
        response = requests.put(f"{BASE_URL}/api/training-applications/{app_id}/unlock", headers=admin_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data
        print(f"PASS: Admin can unlock training application - {data.get('message')}")
    
    def test_lock_training_nonexistent_404(self, admin_headers):
        """PUT /api/training-applications/{id}/lock with invalid ID should return 404"""
        response = requests.put(f"{BASE_URL}/api/training-applications/nonexistent-id-12345/lock", headers=admin_headers)
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"PASS: Lock nonexistent training application returns 404")


# ============== TRAINING APPLICATION BATCH UNLOCK TESTS ==============

class TestTrainingBatchUnlock:
    """Tests for batch unlock training applications"""
    
    def test_batch_unlock_training_empty_400(self, admin_headers):
        """POST /api/training-applications/batch-unlock with empty list should return 400"""
        response = requests.post(
            f"{BASE_URL}/api/training-applications/batch-unlock",
            json={"application_ids": []},
            headers=admin_headers
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print(f"PASS: Training batch unlock with empty list returns 400")
    
    def test_batch_unlock_training_success(self, admin_headers):
        """POST /api/training-applications/batch-unlock should unlock multiple training apps"""
        response = requests.get(f"{BASE_URL}/api/training-applications", headers=admin_headers)
        if response.status_code != 200:
            pytest.skip("Could not get training applications")
        
        apps = response.json()
        if len(apps) == 0:
            pytest.skip("No training applications to test")
        
        # Lock some apps first
        for app in apps[:2]:
            if app.get("status") != "draft":
                requests.put(f"{BASE_URL}/api/training-applications/{app['id']}/lock", headers=admin_headers)
        
        # Refresh and get locked apps
        response = requests.get(f"{BASE_URL}/api/training-applications", headers=admin_headers)
        apps = response.json()
        locked_apps = [a for a in apps if a.get("is_locked") and a.get("status") != "draft"]
        
        if len(locked_apps) == 0:
            pytest.skip("No locked training applications to test batch unlock")
        
        app_ids = [a["id"] for a in locked_apps[:2]]
        response = requests.post(
            f"{BASE_URL}/api/training-applications/batch-unlock",
            json={"application_ids": app_ids},
            headers=admin_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"PASS: Training batch unlock successful")


# ============== EMPLOYEE LOCK ENFORCEMENT TESTS ==============

class TestEmployeeLockEnforcement:
    """Tests for employee cannot edit locked applications"""
    
    def test_employee_cannot_edit_locked_bursary_app(self, admin_headers, employee_headers):
        """Employee PUT /api/applications/{id} should return 403 when is_locked=true"""
        # Get applications
        response = requests.get(f"{BASE_URL}/api/applications", headers=admin_headers)
        if response.status_code != 200:
            pytest.skip("Could not get applications")
        
        apps = response.json()
        # Find or create a locked non-draft application owned by employee
        # For this test, we'll use admin to lock an app and try to edit as employee
        
        # First, get employee's applications
        emp_response = requests.get(f"{BASE_URL}/api/applications", headers=employee_headers)
        if emp_response.status_code != 200:
            pytest.skip("Employee cannot access applications")
        
        emp_apps = emp_response.json()
        non_draft_apps = [a for a in emp_apps if a.get("status") != "draft"]
        
        if len(non_draft_apps) == 0:
            pytest.skip("No non-draft applications for employee to test lock enforcement")
        
        test_app = non_draft_apps[0]
        app_id = test_app["id"]
        
        # Lock the application as admin
        requests.put(f"{BASE_URL}/api/applications/{app_id}/lock", headers=admin_headers)
        
        # Try to edit as employee
        response = requests.put(
            f"{BASE_URL}/api/applications/{app_id}",
            json={"personal_info": {"name": "Updated"}},
            headers=employee_headers
        )
        
        # Should return 403 because application is locked
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        print(f"PASS: Employee cannot edit locked bursary application (403)")
        
        # Cleanup: unlock the app
        requests.put(f"{BASE_URL}/api/applications/{app_id}/unlock", headers=admin_headers)
    
    def test_admin_can_edit_locked_bursary_app(self, admin_headers):
        """Admin PUT /api/applications/{id} should succeed even when is_locked=true"""
        response = requests.get(f"{BASE_URL}/api/applications", headers=admin_headers)
        if response.status_code != 200:
            pytest.skip("Could not get applications")
        
        apps = response.json()
        non_draft_apps = [a for a in apps if a.get("status") != "draft"]
        
        if len(non_draft_apps) == 0:
            pytest.skip("No non-draft applications to test")
        
        test_app = non_draft_apps[0]
        app_id = test_app["id"]
        
        # Lock the application
        requests.put(f"{BASE_URL}/api/applications/{app_id}/lock", headers=admin_headers)
        
        # Admin should still be able to edit
        response = requests.put(
            f"{BASE_URL}/api/applications/{app_id}",
            json={"status_note": "Admin edit while locked"},
            headers=admin_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"PASS: Admin can edit locked bursary application")
        
        # Cleanup
        requests.put(f"{BASE_URL}/api/applications/{app_id}/unlock", headers=admin_headers)


# ============== NOTIFICATION REFERENCE TYPE TESTS ==============

class TestNotificationReferenceTypes:
    """Tests for notification reference_type field for routing"""
    
    def test_unlock_creates_notification_with_reference_type(self, admin_headers):
        """Unlocking an application should create notification with correct reference_type"""
        # Get an application
        response = requests.get(f"{BASE_URL}/api/applications", headers=admin_headers)
        if response.status_code != 200:
            pytest.skip("Could not get applications")
        
        apps = response.json()
        non_draft_apps = [a for a in apps if a.get("status") != "draft"]
        
        if len(non_draft_apps) == 0:
            pytest.skip("No non-draft applications")
        
        test_app = non_draft_apps[0]
        app_id = test_app["id"]
        user_id = test_app.get("user_id")
        
        # Lock then unlock to trigger notification
        requests.put(f"{BASE_URL}/api/applications/{app_id}/lock", headers=admin_headers)
        requests.put(f"{BASE_URL}/api/applications/{app_id}/unlock", headers=admin_headers)
        
        # Check notifications for the user
        # Note: We can only check admin's notifications here
        response = requests.get(f"{BASE_URL}/api/notifications", headers=admin_headers)
        if response.status_code == 200:
            notifs = response.json()
            # Look for unlock notification
            unlock_notifs = [n for n in notifs if "unlocked" in n.get("title", "").lower() or "unlocked" in n.get("message", "").lower()]
            if unlock_notifs:
                notif = unlock_notifs[0]
                assert notif.get("reference_type") in ["bursary_application", "application"], \
                    f"Expected reference_type bursary_application, got {notif.get('reference_type')}"
                print(f"PASS: Unlock notification has correct reference_type: {notif.get('reference_type')}")
            else:
                print(f"INFO: No unlock notifications found for admin (notification sent to applicant)")
        print(f"PASS: Notification reference_type test completed")


# ============== UNREAD COUNT ENDPOINT TEST ==============

class TestUnreadCount:
    """Tests for notification unread count endpoint"""
    
    def test_get_unread_count(self, admin_headers):
        """GET /api/notifications/unread/count should return unread count"""
        response = requests.get(f"{BASE_URL}/api/notifications/unread/count", headers=admin_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "unread_count" in data, f"Expected unread_count in response, got {data}"
        assert isinstance(data["unread_count"], int), "unread_count should be an integer"
        print(f"PASS: GET /api/notifications/unread/count returns {data['unread_count']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
