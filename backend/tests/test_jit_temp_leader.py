"""
JIT (Just-in-Time) Temporary Leader Feature Tests
Tests for POST /api/subgroups/{id}/temp-leader (assign) and DELETE /api/subgroups/{id}/temp-leader (revoke)
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data - Finance subgroup 'Reporting to Finance Manager'
SUBGROUP_ID = "d607d218-290a-4d87-97b4-fe471cf78bcf"
SUBGROUP_LEADER_ID = "483ae80b-a824-4b3b-9874-3763b6b1f124"  # Nolusapho Mxokozeli
NON_LEADER_MEMBER_ID = "973549ca-ccf3-45cf-b5fc-f6d995bc00f1"  # Leah Masemene

# Admin credentials
ADMIN_EMAIL = "jane.smith@uct.ac.za"
ADMIN_PASSWORD = "securepass123"


@pytest.fixture(scope="module")
def api_client():
    """Create requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def auth_token(api_client):
    """Get admin authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json().get("access_token")


@pytest.fixture(scope="module")
def authenticated_client(api_client, auth_token):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


@pytest.fixture(scope="function")
def clean_subgroup(authenticated_client):
    """Ensure subgroup has no temp leader before test"""
    # Revoke any existing temp leader
    authenticated_client.delete(f"{BASE_URL}/api/subgroups/{SUBGROUP_ID}/temp-leader")
    yield
    # Cleanup after test - revoke temp leader
    authenticated_client.delete(f"{BASE_URL}/api/subgroups/{SUBGROUP_ID}/temp-leader")


class TestAssignTempLeader:
    """POST /api/subgroups/{id}/temp-leader - Assign temp leader"""
    
    def test_assign_temp_leader_success(self, authenticated_client, clean_subgroup):
        """Successfully assign a temp leader with valid duration"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/subgroups/{SUBGROUP_ID}/temp-leader",
            json={
                "temp_leader_id": NON_LEADER_MEMBER_ID,
                "duration_hours": 2
            }
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["message"] == "Temporary leader assigned"
        assert data["temp_leader_id"] == NON_LEADER_MEMBER_ID
        assert data["duration_hours"] == 2
        assert "temp_leader_start" in data
        assert "temp_leader_end" in data
        
        # Verify end time is approximately 2 hours from now
        start_time = datetime.fromisoformat(data["temp_leader_start"].replace("Z", "+00:00"))
        end_time = datetime.fromisoformat(data["temp_leader_end"].replace("Z", "+00:00"))
        duration = end_time - start_time
        assert 1.9 <= duration.total_seconds() / 3600 <= 2.1, "Duration should be approximately 2 hours"
    
    def test_assign_temp_leader_min_duration_1hr(self, authenticated_client, clean_subgroup):
        """Assign with minimum duration of 1 hour"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/subgroups/{SUBGROUP_ID}/temp-leader",
            json={
                "temp_leader_id": NON_LEADER_MEMBER_ID,
                "duration_hours": 1
            }
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["duration_hours"] == 1
    
    def test_assign_temp_leader_max_duration_2weeks(self, authenticated_client, clean_subgroup):
        """Assign with maximum duration of 2 weeks (336 hours)"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/subgroups/{SUBGROUP_ID}/temp-leader",
            json={
                "temp_leader_id": NON_LEADER_MEMBER_ID,
                "duration_hours": 336
            }
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["duration_hours"] == 336
    
    def test_assign_temp_leader_reject_duration_less_than_1hr(self, authenticated_client, clean_subgroup):
        """Reject duration less than 1 hour"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/subgroups/{SUBGROUP_ID}/temp-leader",
            json={
                "temp_leader_id": NON_LEADER_MEMBER_ID,
                "duration_hours": 0.5
            }
        )
        assert response.status_code == 400
        data = response.json()
        assert "at least 1 hour" in data["detail"].lower()
    
    def test_assign_temp_leader_reject_zero_duration(self, authenticated_client, clean_subgroup):
        """Reject zero duration"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/subgroups/{SUBGROUP_ID}/temp-leader",
            json={
                "temp_leader_id": NON_LEADER_MEMBER_ID,
                "duration_hours": 0
            }
        )
        assert response.status_code == 400
    
    def test_assign_temp_leader_reject_non_member(self, authenticated_client, clean_subgroup):
        """Reject non-member as temp leader"""
        # Use a random UUID that's not a member of the subgroup
        non_member_id = "00000000-0000-0000-0000-000000000000"
        response = authenticated_client.post(
            f"{BASE_URL}/api/subgroups/{SUBGROUP_ID}/temp-leader",
            json={
                "temp_leader_id": non_member_id,
                "duration_hours": 2
            }
        )
        assert response.status_code == 400
        data = response.json()
        assert "member of the subgroup" in data["detail"].lower()
    
    def test_assign_temp_leader_reject_current_leader(self, authenticated_client, clean_subgroup):
        """Reject assigning current leader as temp leader"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/subgroups/{SUBGROUP_ID}/temp-leader",
            json={
                "temp_leader_id": SUBGROUP_LEADER_ID,
                "duration_hours": 2
            }
        )
        assert response.status_code == 400
        data = response.json()
        assert "current leader" in data["detail"].lower()
    
    def test_assign_temp_leader_missing_temp_leader_id(self, authenticated_client, clean_subgroup):
        """Reject missing temp_leader_id"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/subgroups/{SUBGROUP_ID}/temp-leader",
            json={
                "duration_hours": 2
            }
        )
        assert response.status_code == 400
        data = response.json()
        assert "required" in data["detail"].lower()
    
    def test_assign_temp_leader_missing_duration(self, authenticated_client, clean_subgroup):
        """Reject missing duration_hours"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/subgroups/{SUBGROUP_ID}/temp-leader",
            json={
                "temp_leader_id": NON_LEADER_MEMBER_ID
            }
        )
        assert response.status_code == 400
        data = response.json()
        assert "required" in data["detail"].lower()
    
    def test_assign_temp_leader_nonexistent_subgroup(self, authenticated_client):
        """Return 404 for nonexistent subgroup"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/subgroups/nonexistent-subgroup-id/temp-leader",
            json={
                "temp_leader_id": NON_LEADER_MEMBER_ID,
                "duration_hours": 2
            }
        )
        assert response.status_code == 404
    
    def test_assign_temp_leader_without_auth(self, api_client):
        """Return 401/403 without authentication"""
        # Create a new session without auth
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        response = session.post(
            f"{BASE_URL}/api/subgroups/{SUBGROUP_ID}/temp-leader",
            json={
                "temp_leader_id": NON_LEADER_MEMBER_ID,
                "duration_hours": 2
            }
        )
        assert response.status_code in [401, 403]


class TestRevokeTempLeader:
    """DELETE /api/subgroups/{id}/temp-leader - Revoke temp leader"""
    
    def test_revoke_temp_leader_success(self, authenticated_client, clean_subgroup):
        """Successfully revoke an active temp leader"""
        # First assign a temp leader
        assign_response = authenticated_client.post(
            f"{BASE_URL}/api/subgroups/{SUBGROUP_ID}/temp-leader",
            json={
                "temp_leader_id": NON_LEADER_MEMBER_ID,
                "duration_hours": 2
            }
        )
        assert assign_response.status_code == 200
        
        # Then revoke
        response = authenticated_client.delete(
            f"{BASE_URL}/api/subgroups/{SUBGROUP_ID}/temp-leader"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Temporary leader revoked"
    
    def test_revoke_temp_leader_when_none_assigned(self, authenticated_client, clean_subgroup):
        """Revoking when no temp leader is assigned should still succeed"""
        response = authenticated_client.delete(
            f"{BASE_URL}/api/subgroups/{SUBGROUP_ID}/temp-leader"
        )
        # Should succeed even if no temp leader is assigned
        assert response.status_code == 200
    
    def test_revoke_temp_leader_nonexistent_subgroup(self, authenticated_client):
        """Return 404 for nonexistent subgroup"""
        response = authenticated_client.delete(
            f"{BASE_URL}/api/subgroups/nonexistent-subgroup-id/temp-leader"
        )
        assert response.status_code == 404
    
    def test_revoke_temp_leader_without_auth(self):
        """Return 401/403 without authentication"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        response = session.delete(
            f"{BASE_URL}/api/subgroups/{SUBGROUP_ID}/temp-leader"
        )
        assert response.status_code in [401, 403]


class TestTempLeaderInDivisionGroups:
    """GET /api/division-groups - Verify temp leader data is returned"""
    
    def test_temp_leader_active_when_assigned(self, authenticated_client, clean_subgroup):
        """Verify temp_leader_active=true and temp_leader data when assigned"""
        # Assign temp leader
        assign_response = authenticated_client.post(
            f"{BASE_URL}/api/subgroups/{SUBGROUP_ID}/temp-leader",
            json={
                "temp_leader_id": NON_LEADER_MEMBER_ID,
                "duration_hours": 2
            }
        )
        assert assign_response.status_code == 200
        
        # Get division groups
        response = authenticated_client.get(f"{BASE_URL}/api/division-groups")
        assert response.status_code == 200
        groups = response.json()
        
        # Find the Finance division and the subgroup
        finance_group = None
        for g in groups:
            if g["division_name"] == "Finance":
                finance_group = g
                break
        
        assert finance_group is not None, "Finance division not found"
        
        # Find the specific subgroup
        target_subgroup = None
        for sg in finance_group.get("subgroups", []):
            if sg["id"] == SUBGROUP_ID:
                target_subgroup = sg
                break
        
        assert target_subgroup is not None, f"Subgroup {SUBGROUP_ID} not found in Finance"
        
        # Verify temp leader data
        assert target_subgroup.get("temp_leader_active") is True, "temp_leader_active should be True"
        assert target_subgroup.get("temp_leader_id") == NON_LEADER_MEMBER_ID
        assert target_subgroup.get("temp_leader") is not None, "temp_leader object should be populated"
        assert target_subgroup["temp_leader"].get("id") == NON_LEADER_MEMBER_ID
        assert "full_name" in target_subgroup["temp_leader"]
        assert target_subgroup.get("temp_leader_end") is not None
    
    def test_temp_leader_inactive_when_not_set(self, authenticated_client, clean_subgroup):
        """Verify temp_leader_active=false when no temp leader is set"""
        # Ensure no temp leader
        authenticated_client.delete(f"{BASE_URL}/api/subgroups/{SUBGROUP_ID}/temp-leader")
        
        # Get division groups
        response = authenticated_client.get(f"{BASE_URL}/api/division-groups")
        assert response.status_code == 200
        groups = response.json()
        
        # Find the Finance division and the subgroup
        finance_group = None
        for g in groups:
            if g["division_name"] == "Finance":
                finance_group = g
                break
        
        assert finance_group is not None, "Finance division not found"
        
        # Find the specific subgroup
        target_subgroup = None
        for sg in finance_group.get("subgroups", []):
            if sg["id"] == SUBGROUP_ID:
                target_subgroup = sg
                break
        
        assert target_subgroup is not None, f"Subgroup {SUBGROUP_ID} not found in Finance"
        
        # Verify no active temp leader
        assert target_subgroup.get("temp_leader_active") is False, "temp_leader_active should be False"
        assert target_subgroup.get("temp_leader") is None, "temp_leader should be None"
    
    def test_temp_leader_inactive_after_revoke(self, authenticated_client, clean_subgroup):
        """Verify temp_leader_active=false after revocation"""
        # Assign temp leader
        assign_response = authenticated_client.post(
            f"{BASE_URL}/api/subgroups/{SUBGROUP_ID}/temp-leader",
            json={
                "temp_leader_id": NON_LEADER_MEMBER_ID,
                "duration_hours": 2
            }
        )
        assert assign_response.status_code == 200
        
        # Revoke
        revoke_response = authenticated_client.delete(
            f"{BASE_URL}/api/subgroups/{SUBGROUP_ID}/temp-leader"
        )
        assert revoke_response.status_code == 200
        
        # Get division groups
        response = authenticated_client.get(f"{BASE_URL}/api/division-groups")
        assert response.status_code == 200
        groups = response.json()
        
        # Find the Finance division and the subgroup
        finance_group = None
        for g in groups:
            if g["division_name"] == "Finance":
                finance_group = g
                break
        
        assert finance_group is not None, "Finance division not found"
        
        # Find the specific subgroup
        target_subgroup = None
        for sg in finance_group.get("subgroups", []):
            if sg["id"] == SUBGROUP_ID:
                target_subgroup = sg
                break
        
        assert target_subgroup is not None, f"Subgroup {SUBGROUP_ID} not found in Finance"
        
        # Verify no active temp leader
        assert target_subgroup.get("temp_leader_active") is False, "temp_leader_active should be False after revoke"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
