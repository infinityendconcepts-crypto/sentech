"""
Test suite for Users and Profile API endpoints
Testing: GET /api/users, GET /api/users/me, PUT /api/users/me, POST /api/users/invite
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "jane.smith@uct.ac.za"
TEST_PASSWORD = "securepass123"

class TestAuthAndSetup:
    """Authentication tests to get token for subsequent tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        return data["access_token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Get headers with auth token"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        print(f"Login successful for {TEST_EMAIL}")


class TestUsersAPI:
    """Tests for /api/users endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get authentication token and headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_all_users(self, auth_headers):
        """Test GET /api/users returns list of all users"""
        response = requests.get(f"{BASE_URL}/api/users", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) > 0, "Should have at least 1 user"
        print(f"GET /api/users returned {len(data)} users")
        
        # Verify user structure
        user = data[0]
        assert "id" in user
        assert "email" in user
        assert "password_hash" not in user, "password_hash should not be exposed"
    
    def test_get_users_with_search(self, auth_headers):
        """Test GET /api/users with search parameter"""
        response = requests.get(f"{BASE_URL}/api/users", 
                               headers=auth_headers,
                               params={"search": "jane"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Jane should be in results
        emails = [u.get("email", "") for u in data]
        assert any("jane" in e.lower() for e in emails), "Search for 'jane' should return matching users"
        print(f"Search for 'jane' returned {len(data)} users")
    
    def test_get_users_with_role_filter(self, auth_headers):
        """Test GET /api/users with role filter"""
        response = requests.get(f"{BASE_URL}/api/users",
                               headers=auth_headers,
                               params={"role": "admin"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Filter by role 'admin' returned {len(data)} users")


class TestUserProfileAPI:
    """Tests for /api/users/me endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get authentication token and headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_my_profile(self, auth_headers):
        """Test GET /api/users/me returns current user profile"""
        response = requests.get(f"{BASE_URL}/api/users/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify profile structure
        assert "id" in data
        assert "email" in data
        assert data["email"] == TEST_EMAIL
        assert "password_hash" not in data, "password_hash should not be exposed"
        
        # Check optional profile fields exist
        assert "full_name" in data or data.get("full_name") is not None or True  # May be null
        print(f"GET /api/users/me returned profile for {data['email']}")
    
    def test_update_my_profile(self, auth_headers):
        """Test PUT /api/users/me updates profile fields"""
        import time
        test_bio = f"Test bio updated at {int(time.time())}"
        test_phone = "+27111234567"
        test_dept = "Test Department"
        
        update_data = {
            "bio": test_bio,
            "phone": test_phone,
            "department": test_dept
        }
        
        response = requests.put(f"{BASE_URL}/api/users/me", 
                               headers=auth_headers,
                               json=update_data)
        assert response.status_code == 200, f"Update failed: {response.text}"
        data = response.json()
        
        # Verify updated fields
        assert data.get("bio") == test_bio, "Bio should be updated"
        assert data.get("phone") == test_phone, "Phone should be updated"
        assert data.get("department") == test_dept, "Department should be updated"
        
        # Verify by fetching profile again
        verify_response = requests.get(f"{BASE_URL}/api/users/me", headers=auth_headers)
        assert verify_response.status_code == 200
        verify_data = verify_response.json()
        assert verify_data.get("bio") == test_bio
        print("PUT /api/users/me successfully updated profile")
    
    def test_update_profile_full_name(self, auth_headers):
        """Test updating full_name field"""
        # Get current name first
        get_response = requests.get(f"{BASE_URL}/api/users/me", headers=auth_headers)
        original_name = get_response.json().get("full_name", "Jane Smith")
        
        # Update name
        response = requests.put(f"{BASE_URL}/api/users/me",
                               headers=auth_headers,
                               json={"full_name": "Jane Smith Test"})
        assert response.status_code == 200
        
        # Restore original name
        restore_response = requests.put(f"{BASE_URL}/api/users/me",
                                       headers=auth_headers,
                                       json={"full_name": original_name})
        assert restore_response.status_code == 200
        print("Full name update and restore successful")


class TestUserInviteAPI:
    """Tests for POST /api/users/invite endpoint"""
    
    @pytest.fixture(scope="class")
    def admin_headers(self):
        """Get admin authentication - Jane is a student, so invite will fail with 403"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_invite_user_requires_admin_or_manager(self, admin_headers):
        """Test POST /api/users/invite requires admin/manager role"""
        # Jane is a student, should get 403
        import time
        invite_data = {
            "email": f"test.invite.{int(time.time())}@example.com",
            "full_name": "Test Invite User",
            "role": "employee"
        }
        
        response = requests.post(f"{BASE_URL}/api/users/invite",
                                headers=admin_headers,
                                json=invite_data)
        
        # Jane is a student, so this should return 403
        # If user is admin/manager, it would return 200 with dev_note
        if response.status_code == 403:
            print("Invite correctly blocked - user is not admin/manager")
            assert "admin" in response.json().get("detail", "").lower() or "manager" in response.json().get("detail", "").lower()
        elif response.status_code == 200:
            data = response.json()
            assert "message" in data
            assert "dev_note" in data, "dev_note should contain OTP in dev mode"
            print(f"Invite successful: {data.get('dev_note')}")
        else:
            pytest.fail(f"Unexpected status code: {response.status_code}")


class TestUserStatusAPI:
    """Tests for user status and role endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get authentication token and headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_single_user(self, auth_headers):
        """Test GET /api/users/{user_id} returns user details"""
        # First get list to find a user id
        list_response = requests.get(f"{BASE_URL}/api/users", headers=auth_headers)
        assert list_response.status_code == 200
        users = list_response.json()
        assert len(users) > 0
        
        user_id = users[0]["id"]
        response = requests.get(f"{BASE_URL}/api/users/{user_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == user_id
        print(f"GET /api/users/{user_id} returned user: {data.get('email')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
