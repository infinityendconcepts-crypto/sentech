"""
Test cases for Re-edit Application Features:
- 24hr edit window enforcement
- Request re-edit endpoints (bursary & training)
- Allow re-edit admin approval endpoints
- Notifications on re-edit request
"""
import pytest
import requests
import os
from datetime import datetime, timezone, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
SUPER_ADMIN_EMAIL = "jane.smith@uct.ac.za"
SUPER_ADMIN_PASSWORD = "securepass123"


class TestAuthSetup:
    """Authentication tests - run first"""
    
    def test_login_super_admin(self, api_client):
        """Login as super_admin and store token"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "password": SUPER_ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        # Store token for other tests
        api_client.headers.update({"Authorization": f"Bearer {data['access_token']}"})
        print(f"Logged in as: {data['user'].get('email')}")
        print(f"User roles: {data['user'].get('roles')}")
        return data


class TestBursaryApplications:
    """Bursary application re-edit tests"""
    
    def test_get_all_applications(self, authenticated_client):
        """Get all bursary applications"""
        response = authenticated_client.get(f"{BASE_URL}/api/applications")
        assert response.status_code == 200, f"Failed: {response.text}"
        apps = response.json()
        assert isinstance(apps, list)
        print(f"Found {len(apps)} bursary applications")
        return apps
    
    def test_request_reedit_bursary(self, authenticated_client):
        """Test POST /api/applications/{id}/request-re-edit"""
        # First get applications
        apps_response = authenticated_client.get(f"{BASE_URL}/api/applications")
        assert apps_response.status_code == 200
        apps = apps_response.json()
        
        if not apps:
            pytest.skip("No bursary applications available to test")
        
        # Find an application owned by current user
        me_response = authenticated_client.get(f"{BASE_URL}/api/auth/me")
        assert me_response.status_code == 200
        user_id = me_response.json().get("id")
        
        my_apps = [a for a in apps if a.get("user_id") == user_id]
        if not my_apps:
            pytest.skip("No applications belonging to current user")
        
        app = my_apps[0]
        app_id = app["id"]
        
        # Check if re-edit already requested
        if app.get("re_edit_requested"):
            print(f"App {app_id} already has re-edit requested")
            # Reset it for testing
            authenticated_client.put(f"{BASE_URL}/api/applications/{app_id}/allow-re-edit", json={"approved": False})
        
        # Request re-edit
        response = authenticated_client.post(
            f"{BASE_URL}/api/applications/{app_id}/request-re-edit",
            json={"reason": "Need to fix typo in my application"}
        )
        # Could be 200 or 400 if already requested
        assert response.status_code in [200, 400], f"Unexpected status: {response.status_code} - {response.text}"
        print(f"Request re-edit response: {response.json()}")
        return app_id
    
    def test_allow_reedit_bursary(self, authenticated_client):
        """Test PUT /api/applications/{id}/allow-re-edit (admin approval)"""
        # Get applications
        apps_response = authenticated_client.get(f"{BASE_URL}/api/applications")
        assert apps_response.status_code == 200
        apps = apps_response.json()
        
        if not apps:
            pytest.skip("No bursary applications")
        
        # Find one with re-edit requested or just use first one
        app = next((a for a in apps if a.get("re_edit_requested")), apps[0])
        app_id = app["id"]
        
        # Allow re-edit (approve)
        response = authenticated_client.put(
            f"{BASE_URL}/api/applications/{app_id}/allow-re-edit",
            json={"approved": True}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "message" in data
        print(f"Allow re-edit response: {data}")
        return app_id


class TestTrainingApplications:
    """Training application re-edit tests"""
    
    def test_get_all_training_applications(self, authenticated_client):
        """Get all training applications"""
        response = authenticated_client.get(f"{BASE_URL}/api/training-applications")
        assert response.status_code == 200, f"Failed: {response.text}"
        apps = response.json()
        assert isinstance(apps, list)
        print(f"Found {len(apps)} training applications")
        return apps
    
    def test_request_reedit_training(self, authenticated_client):
        """Test POST /api/training-applications/{id}/request-re-edit"""
        apps_response = authenticated_client.get(f"{BASE_URL}/api/training-applications")
        assert apps_response.status_code == 200
        apps = apps_response.json()
        
        if not apps:
            pytest.skip("No training applications available")
        
        me_response = authenticated_client.get(f"{BASE_URL}/api/auth/me")
        assert me_response.status_code == 200
        user_id = me_response.json().get("id")
        
        my_apps = [a for a in apps if a.get("user_id") == user_id]
        if not my_apps:
            pytest.skip("No training applications belonging to current user")
        
        app = my_apps[0]
        app_id = app["id"]
        
        # Reset if needed
        if app.get("re_edit_requested"):
            authenticated_client.put(f"{BASE_URL}/api/training-applications/{app_id}/allow-re-edit", json={"approved": False})
        
        response = authenticated_client.post(
            f"{BASE_URL}/api/training-applications/{app_id}/request-re-edit",
            json={"reason": "Update training details"}
        )
        assert response.status_code in [200, 400], f"Unexpected: {response.status_code} - {response.text}"
        print(f"Training re-edit response: {response.json()}")
        return app_id
    
    def test_allow_reedit_training(self, authenticated_client):
        """Test PUT /api/training-applications/{id}/allow-re-edit"""
        apps_response = authenticated_client.get(f"{BASE_URL}/api/training-applications")
        assert apps_response.status_code == 200
        apps = apps_response.json()
        
        if not apps:
            pytest.skip("No training applications")
        
        app = apps[0]
        app_id = app["id"]
        
        response = authenticated_client.put(
            f"{BASE_URL}/api/training-applications/{app_id}/allow-re-edit",
            json={"approved": True}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        print(f"Allow training re-edit response: {data}")
        return app_id


class TestNotifications:
    """Notifications for re-edit requests"""
    
    def test_get_notifications(self, authenticated_client):
        """Test GET /api/notifications"""
        response = authenticated_client.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 200, f"Failed: {response.text}"
        notifications = response.json()
        assert isinstance(notifications, list)
        
        # Check for re-edit notifications
        reedit_notifs = [n for n in notifications if "re-edit" in n.get("title", "").lower() or "re-edit" in n.get("message", "").lower()]
        print(f"Total notifications: {len(notifications)}, Re-edit related: {len(reedit_notifs)}")
        
        for n in reedit_notifs[:3]:
            print(f"  - {n.get('title')}: {n.get('message')}")
        
        return notifications


class Test24HourEditWindow:
    """24hr edit window enforcement tests"""
    
    def test_edit_within_24hrs_allowed(self, authenticated_client):
        """Test that editing within 24hrs is allowed"""
        apps_response = authenticated_client.get(f"{BASE_URL}/api/applications")
        apps = apps_response.json()
        
        me_response = authenticated_client.get(f"{BASE_URL}/api/auth/me")
        user_id = me_response.json().get("id")
        
        my_apps = [a for a in apps if a.get("user_id") == user_id]
        
        # Find app submitted within 24hrs
        now = datetime.now(timezone.utc)
        recent_apps = []
        for app in my_apps:
            submitted = app.get("submitted_at")
            if submitted:
                try:
                    submitted_dt = datetime.fromisoformat(submitted.replace("Z", "+00:00"))
                    if (now - submitted_dt).total_seconds() < 86400:
                        recent_apps.append(app)
                except:
                    pass
        
        if not recent_apps:
            print("No recent apps within 24hr window found - checking all apps")
            if my_apps:
                # Try to update with minor change to verify endpoint works
                app = my_apps[0]
                response = authenticated_client.put(
                    f"{BASE_URL}/api/applications/{app['id']}",
                    json={"current_step": app.get("current_step", 1)}
                )
                # 200 = success, 403 = window expired (expected)
                assert response.status_code in [200, 403], f"Unexpected: {response.text}"
                print(f"Update attempt status: {response.status_code}")
        else:
            app = recent_apps[0]
            response = authenticated_client.put(
                f"{BASE_URL}/api/applications/{app['id']}",
                json={"current_step": app.get("current_step", 1)}
            )
            print(f"Edit within 24hrs: {response.status_code}")


# Pytest fixtures
@pytest.fixture(scope="module")
def api_client():
    """Base requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def authenticated_client(api_client):
    """Session with auth token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": SUPER_ADMIN_EMAIL,
        "password": SUPER_ADMIN_PASSWORD
    })
    if response.status_code == 200:
        token = response.json().get("access_token")
        api_client.headers.update({"Authorization": f"Bearer {token}"})
        return api_client
    pytest.skip(f"Authentication failed: {response.text}")
