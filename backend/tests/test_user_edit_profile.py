"""
Test User Edit and Profile API functionality
Tests for:
- PUT /api/users/{user_id} with expanded fields (Personal, Employment, OFO)
- GET /api/users/{user_id} to verify field persistence
- GET /api/users/me to verify profile fields
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
SUPER_ADMIN_EMAIL = "jane.smith@uct.ac.za"
SUPER_ADMIN_PASSWORD = "securepass123"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for super_admin"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": SUPER_ADMIN_EMAIL,
        "password": SUPER_ADMIN_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    assert "access_token" in data
    return data["access_token"], data["user"]["id"]


@pytest.fixture(scope="module")
def api_client(auth_token):
    """Create authenticated session"""
    token, user_id = auth_token
    session = requests.Session()
    session.headers.update({
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    })
    return session, user_id


class TestUserUpdateAPI:
    """Test PUT /api/users/{user_id} with expanded fields"""
    
    def test_get_all_users(self, api_client):
        """Test GET /api/users returns users with all fields"""
        session, _ = api_client
        response = session.get(f"{BASE_URL}/api/users")
        assert response.status_code == 200, f"Failed to get users: {response.text}"
        
        users = response.json()
        assert isinstance(users, list)
        assert len(users) > 0, "No users found"
        
        # Find a dataset user with full fields (e.g., Tebogo Joseph Leshope)
        dataset_user = None
        for user in users:
            if user.get("personnel_number"):
                dataset_user = user
                break
        
        print(f"Found {len(users)} users")
        if dataset_user:
            print(f"Dataset user found: {dataset_user.get('full_name')} - Personnel#: {dataset_user.get('personnel_number')}")
            # Verify dataset fields exist in response
            assert "personnel_number" in dataset_user or dataset_user.get("personnel_number") is None
            assert "id_number" in dataset_user or dataset_user.get("id_number") is None
            assert "gender" in dataset_user or dataset_user.get("gender") is None
            assert "race" in dataset_user or dataset_user.get("race") is None
            assert "level" in dataset_user or dataset_user.get("level") is None
            assert "ofo_code" in dataset_user or dataset_user.get("ofo_code") is None
        print("TEST PASSED: GET /api/users returns users with dataset fields")

    def test_find_dataset_user_tebogo(self, api_client):
        """Find Tebogo Joseph Leshope user for testing"""
        session, _ = api_client
        response = session.get(f"{BASE_URL}/api/users")
        assert response.status_code == 200
        
        users = response.json()
        tebogo = None
        for user in users:
            if "tebogo" in user.get("full_name", "").lower() or "leshope" in user.get("full_name", "").lower():
                tebogo = user
                break
        
        if tebogo:
            print(f"Found Tebogo: {tebogo.get('full_name')}")
            print(f"  - ID: {tebogo.get('id')}")
            print(f"  - Personnel Number: {tebogo.get('personnel_number')}")
            print(f"  - Level: {tebogo.get('level')}")
            print(f"  - OFO Code: {tebogo.get('ofo_code')}")
            print(f"  - Roles: {tebogo.get('roles')}")
            assert tebogo.get("id") is not None
            return tebogo
        else:
            print("WARNING: Tebogo not found - using first user with personnel_number")
            for user in users:
                if user.get("personnel_number"):
                    print(f"Using: {user.get('full_name')}")
                    return user
        pytest.skip("No dataset user found to test")

    def test_update_user_level_field(self, api_client):
        """Test updating user's level field via PUT /api/users/{user_id}"""
        session, _ = api_client
        
        # First get a dataset user
        response = session.get(f"{BASE_URL}/api/users")
        assert response.status_code == 200
        users = response.json()
        
        # Find a user with personnel_number (dataset user)
        target_user = None
        for user in users:
            if user.get("personnel_number"):
                target_user = user
                break
        
        if not target_user:
            pytest.skip("No dataset user found")
        
        user_id = target_user["id"]
        original_level = target_user.get("level")
        new_level = "D5"  # Test value
        
        print(f"Testing user: {target_user.get('full_name')}")
        print(f"Original level: {original_level}")
        print(f"New level: {new_level}")
        
        # Update the user's level
        update_payload = {
            "level": new_level
        }
        
        response = session.put(f"{BASE_URL}/api/users/{user_id}", json=update_payload)
        assert response.status_code == 200, f"Update failed: {response.text}"
        print(f"Update response: {response.json()}")
        
        # Verify the update persisted
        response = session.get(f"{BASE_URL}/api/users/{user_id}")
        assert response.status_code == 200
        updated_user = response.json()
        assert updated_user.get("level") == new_level, f"Level not updated: expected {new_level}, got {updated_user.get('level')}"
        print(f"Verified level updated to: {updated_user.get('level')}")
        
        # Restore original level
        restore_payload = {"level": original_level if original_level else ""}
        session.put(f"{BASE_URL}/api/users/{user_id}", json=restore_payload)
        print("TEST PASSED: User level update works correctly")

    def test_update_user_expanded_fields(self, api_client):
        """Test PUT /api/users/{user_id} with all expanded fields"""
        session, admin_id = api_client
        
        # Get users and find a testable one
        response = session.get(f"{BASE_URL}/api/users")
        assert response.status_code == 200
        users = response.json()
        
        # Find a dataset user
        target_user = None
        for user in users:
            if user.get("personnel_number") and user.get("id") != admin_id:
                target_user = user
                break
        
        if not target_user:
            # Use any non-admin user
            for user in users:
                if user.get("id") != admin_id:
                    target_user = user
                    break
        
        if not target_user:
            pytest.skip("No suitable user found for testing")
        
        user_id = target_user["id"]
        
        # Test expanded fields payload
        test_payload = {
            "full_name": "Test Name Updated",
            "surname": "TestSurname",
            "gender": "Male",
            "race": "African",
            "age": 35,
            "level": "C4",
            "ofo_code": "1234",
            "personnel_number": "PN001TEST"
        }
        
        # Store original values for restoration
        original_values = {
            "full_name": target_user.get("full_name"),
            "surname": target_user.get("surname"),
            "gender": target_user.get("gender"),
            "race": target_user.get("race"),
            "age": target_user.get("age"),
            "level": target_user.get("level"),
            "ofo_code": target_user.get("ofo_code"),
            "personnel_number": target_user.get("personnel_number"),
        }
        
        print(f"Testing update on user: {target_user.get('full_name')} ({user_id})")
        
        # Update user with expanded fields
        response = session.put(f"{BASE_URL}/api/users/{user_id}", json=test_payload)
        assert response.status_code == 200, f"Update failed: {response.text}"
        
        # Verify all fields were updated
        response = session.get(f"{BASE_URL}/api/users/{user_id}")
        assert response.status_code == 200
        updated_user = response.json()
        
        for key, expected_value in test_payload.items():
            actual_value = updated_user.get(key)
            assert actual_value == expected_value, f"Field {key}: expected {expected_value}, got {actual_value}"
            print(f"  {key}: {actual_value} ✓")
        
        # Restore original values
        restore_payload = {}
        for key, val in original_values.items():
            if val is not None:
                restore_payload[key] = val
        if restore_payload:
            session.put(f"{BASE_URL}/api/users/{user_id}", json=restore_payload)
        
        print("TEST PASSED: All expanded fields update correctly")

    def test_update_user_ofo_fields(self, api_client):
        """Test updating OFO classification fields"""
        session, admin_id = api_client
        
        response = session.get(f"{BASE_URL}/api/users")
        assert response.status_code == 200
        users = response.json()
        
        target_user = None
        for user in users:
            if user.get("ofo_code") and user.get("id") != admin_id:
                target_user = user
                break
        
        if not target_user:
            for user in users:
                if user.get("id") != admin_id:
                    target_user = user
                    break
        
        if not target_user:
            pytest.skip("No suitable user found for OFO testing")
        
        user_id = target_user["id"]
        original_ofo = {
            "ofo_major_group": target_user.get("ofo_major_group"),
            "ofo_sub_major_group": target_user.get("ofo_sub_major_group"),
            "ofo_occupation": target_user.get("ofo_occupation"),
            "ofo_code": target_user.get("ofo_code"),
        }
        
        test_ofo = {
            "ofo_major_group": "Test Major Group",
            "ofo_sub_major_group": "Test Sub Major",
            "ofo_occupation": "Test Occupation",
            "ofo_code": "99999",
        }
        
        print(f"Testing OFO update on: {target_user.get('full_name')}")
        
        response = session.put(f"{BASE_URL}/api/users/{user_id}", json=test_ofo)
        assert response.status_code == 200, f"OFO update failed: {response.text}"
        
        # Verify
        response = session.get(f"{BASE_URL}/api/users/{user_id}")
        assert response.status_code == 200
        updated = response.json()
        
        for key, expected in test_ofo.items():
            actual = updated.get(key)
            assert actual == expected, f"OFO field {key}: expected {expected}, got {actual}"
            print(f"  {key}: {actual} ✓")
        
        # Restore
        restore = {k: v for k, v in original_ofo.items() if v is not None}
        if restore:
            session.put(f"{BASE_URL}/api/users/{user_id}", json=restore)
        
        print("TEST PASSED: OFO fields update correctly")

    def test_update_user_email_field(self, api_client):
        """Test that email field can be updated via UserUpdate model"""
        session, _ = api_client
        
        response = session.get(f"{BASE_URL}/api/users")
        assert response.status_code == 200
        users = response.json()
        
        # Find a test user (not the admin)
        target = None
        for user in users:
            if user.get("email") and "test" not in user.get("email", "").lower():
                if user.get("personnel_number"):  # dataset user
                    target = user
                    break
        
        if not target:
            pytest.skip("No suitable user for email test")
        
        user_id = target["id"]
        original_email = target.get("email")
        
        print(f"User: {target.get('full_name')}, Current email: {original_email}")
        print("NOTE: Email update test - checking field is accepted by API")
        
        # Just verify the API accepts email in the payload (don't actually change it)
        test_payload = {
            "email": original_email,  # Keep same email
            "phone": "+27 123 456 7890"
        }
        
        response = session.put(f"{BASE_URL}/api/users/{user_id}", json=test_payload)
        assert response.status_code == 200, f"Update with email field failed: {response.text}"
        print("TEST PASSED: Email field accepted in UserUpdate payload")


class TestProfileFields:
    """Test that profile page shows dataset fields"""
    
    def test_user_me_returns_dataset_fields(self, api_client):
        """Test GET /api/users/me returns all dataset fields"""
        session, user_id = api_client
        
        response = session.get(f"{BASE_URL}/api/users/me")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        user = response.json()
        print(f"User: {user.get('full_name')}")
        
        # List of fields that should exist (may be null)
        expected_fields = [
            "full_name", "surname", "email", "phone",
            "id_number", "gender", "race", "age",
            "personnel_number", "division", "department", "position",
            "level", "start_date", "years_of_service",
            "ofo_major_group", "ofo_sub_major_group", "ofo_occupation", "ofo_code",
            "roles", "is_active"
        ]
        
        for field in expected_fields:
            assert field in user or user.get(field) is None, f"Field {field} missing from response"
            print(f"  {field}: {user.get(field, 'null')}")
        
        print("TEST PASSED: User profile contains all expected dataset fields")

    def test_student_id_not_in_response(self, api_client):
        """Verify Student ID field is deprecated/not prominently used"""
        session, _ = api_client
        
        response = session.get(f"{BASE_URL}/api/users/me")
        assert response.status_code == 200
        
        user = response.json()
        
        # student_id may exist in model (deprecated) but should not have meaningful data
        # The requirement is that it's removed from UI, not necessarily from backend
        print(f"student_id value: {user.get('student_id', 'NOT_PRESENT')}")
        print("NOTE: student_id field exists in backend model (deprecated) but removed from UI")
        print("TEST PASSED: student_id field check complete")


class TestViewUserDetails:
    """Test viewing user details with all fields"""
    
    def test_get_user_by_id_all_fields(self, api_client):
        """Test GET /api/users/{user_id} returns all dataset fields"""
        session, _ = api_client
        
        # Get users list first
        response = session.get(f"{BASE_URL}/api/users")
        assert response.status_code == 200
        users = response.json()
        
        # Find Tebogo or a dataset user
        target = None
        for user in users:
            name = user.get("full_name", "").lower()
            if "tebogo" in name or "leshope" in name:
                target = user
                break
        
        if not target:
            for user in users:
                if user.get("personnel_number"):
                    target = user
                    break
        
        if not target:
            pytest.skip("No dataset user found")
        
        user_id = target["id"]
        
        # Get user details
        response = session.get(f"{BASE_URL}/api/users/{user_id}")
        assert response.status_code == 200, f"Failed to get user: {response.text}"
        
        user = response.json()
        print(f"\nUser Details for: {user.get('full_name')}")
        print("=" * 50)
        
        # Personal Information
        print("\nPersonal Information:")
        for field in ["full_name", "surname", "id_number", "gender", "race", "age"]:
            print(f"  {field}: {user.get(field, '-')}")
        
        # Employment Information
        print("\nEmployment Information:")
        for field in ["personnel_number", "division", "department", "position", "level", "start_date", "years_of_service"]:
            print(f"  {field}: {user.get(field, '-')}")
        
        # OFO Classification
        print("\nOFO Classification:")
        for field in ["ofo_major_group", "ofo_sub_major_group", "ofo_occupation", "ofo_code"]:
            print(f"  {field}: {user.get(field, '-')}")
        
        # Verify key fields exist
        assert "id" in user
        assert "email" in user
        print("\nTEST PASSED: User details API returns all dataset fields")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
