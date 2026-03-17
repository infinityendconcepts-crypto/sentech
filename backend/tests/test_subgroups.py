"""
Subgroups Feature - Backend API Tests
Tests for CRUD operations on subgroups within division groups

Existing Subgroup: 'Reporting to the CEO' (id: 280a896e-31e2-4ad0-a1ed-10e7598c1f62)
  - Division: Exec_and_Head
  - Leader: Leshope (id: db132c6b-33ef-4f26-85ee-c7df0f316897)
  - 10 members
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test Data
ADMIN_EMAIL = "jane.smith@uct.ac.za"
ADMIN_PASSWORD = "securepass123"
EXISTING_SUBGROUP_ID = "280a896e-31e2-4ad0-a1ed-10e7598c1f62"
EXISTING_SUBGROUP_NAME = "Reporting to the CEO"
EXISTING_DIVISION = "Exec_and_Head"
EXISTING_LEADER_ID = "db132c6b-33ef-4f26-85ee-c7df0f316897"
TEST_SUBGROUP_PREFIX = "TEST_SG_"


class TestSubgroupsAPI:
    """Test subgroup CRUD operations"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return response.json().get("access_token")
    
    @pytest.fixture(scope="class")
    def admin_client(self, auth_token):
        """Create authenticated session"""
        session = requests.Session()
        session.headers.update({
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        })
        return session
    
    @pytest.fixture(scope="class", autouse=True)
    def cleanup_test_subgroups(self, admin_client):
        """Cleanup any test subgroups after tests complete"""
        yield
        # Cleanup: Delete all test subgroups created during testing
        try:
            response = admin_client.get(f"{BASE_URL}/api/division-groups")
            if response.status_code == 200:
                groups = response.json()
                for group in groups:
                    for sg in group.get("subgroups", []):
                        if sg.get("name", "").startswith(TEST_SUBGROUP_PREFIX):
                            admin_client.delete(f"{BASE_URL}/api/subgroups/{sg['id']}")
        except Exception as e:
            print(f"Cleanup warning: {e}")
    
    # ========== GET /api/division-groups - Verify subgroups included ==========
    
    def test_get_division_groups_includes_subgroups(self, admin_client):
        """GET /api/division-groups returns groups with subgroups data"""
        response = admin_client.get(f"{BASE_URL}/api/division-groups")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        groups = response.json()
        assert isinstance(groups, list), "Response should be a list"
        
        # Find Exec_and_Head division
        exec_head = next((g for g in groups if g["division_name"] == EXISTING_DIVISION), None)
        assert exec_head is not None, f"Division {EXISTING_DIVISION} not found"
        
        # Verify subgroups array exists
        assert "subgroups" in exec_head, "subgroups key should be in group response"
        subgroups = exec_head["subgroups"]
        assert isinstance(subgroups, list), "subgroups should be a list"
        
        # Find the existing subgroup
        reporting_subgroup = next((sg for sg in subgroups if sg["id"] == EXISTING_SUBGROUP_ID), None)
        assert reporting_subgroup is not None, f"Subgroup {EXISTING_SUBGROUP_NAME} not found"
        
        # Verify subgroup structure
        assert reporting_subgroup["name"] == EXISTING_SUBGROUP_NAME
        assert reporting_subgroup["division_name"] == EXISTING_DIVISION
        assert "members" in reporting_subgroup, "members key should be in subgroup"
        assert "leader" in reporting_subgroup, "leader key should be in subgroup"
        
        print(f"PASS: Division groups include subgroups. {EXISTING_DIVISION} has {len(subgroups)} subgroup(s)")
    
    def test_subgroup_has_leader_info(self, admin_client):
        """Verify 'Reporting to the CEO' subgroup has Leshope as leader"""
        response = admin_client.get(f"{BASE_URL}/api/division-groups")
        assert response.status_code == 200
        
        groups = response.json()
        exec_head = next((g for g in groups if g["division_name"] == EXISTING_DIVISION), None)
        reporting_subgroup = next((sg for sg in exec_head.get("subgroups", []) if sg["id"] == EXISTING_SUBGROUP_ID), None)
        
        assert reporting_subgroup is not None
        assert reporting_subgroup.get("leader_id") == EXISTING_LEADER_ID, f"Expected leader_id {EXISTING_LEADER_ID}"
        assert reporting_subgroup.get("leader") is not None, "Leader object should be populated"
        
        leader = reporting_subgroup["leader"]
        assert "full_name" in leader, "Leader should have full_name"
        # Leshope should be in the leader name
        print(f"PASS: Subgroup leader: {leader.get('full_name')}")
    
    def test_subgroup_has_members(self, admin_client):
        """Verify 'Reporting to the CEO' has 10 members"""
        response = admin_client.get(f"{BASE_URL}/api/division-groups")
        assert response.status_code == 200
        
        groups = response.json()
        exec_head = next((g for g in groups if g["division_name"] == EXISTING_DIVISION), None)
        reporting_subgroup = next((sg for sg in exec_head.get("subgroups", []) if sg["id"] == EXISTING_SUBGROUP_ID), None)
        
        members = reporting_subgroup.get("members", [])
        member_count = len(members)
        
        # Should have 10 members as per seed data
        assert member_count == 10, f"Expected 10 members, got {member_count}"
        
        # Verify member structure
        if members:
            first_member = members[0]
            assert "id" in first_member, "Member should have id"
            assert "full_name" in first_member, "Member should have full_name"
            assert "email" in first_member, "Member should have email"
        
        print(f"PASS: Subgroup has {member_count} members")
    
    # ========== POST /api/division-groups/{division_name}/subgroups - Create ==========
    
    def test_create_subgroup(self, admin_client):
        """POST creates a new subgroup"""
        new_name = f"{TEST_SUBGROUP_PREFIX}New_Subgroup_{os.urandom(4).hex()}"
        
        response = admin_client.post(
            f"{BASE_URL}/api/division-groups/{EXISTING_DIVISION}/subgroups",
            json={"name": new_name}
        )
        assert response.status_code == 200, f"Create failed: {response.text}"
        
        data = response.json()
        assert "id" in data, "Response should have id"
        assert data["name"] == new_name, f"Name mismatch: {data['name']}"
        assert data["division_name"] == EXISTING_DIVISION
        
        # Verify it persists
        subgroup_id = data["id"]
        verify_response = admin_client.get(f"{BASE_URL}/api/division-groups/{EXISTING_DIVISION}")
        assert verify_response.status_code == 200
        
        group_data = verify_response.json()
        found_sg = next((sg for sg in group_data.get("subgroups", []) if sg["id"] == subgroup_id), None)
        assert found_sg is not None, "Created subgroup not found in division"
        assert found_sg["name"] == new_name
        
        # Cleanup
        admin_client.delete(f"{BASE_URL}/api/subgroups/{subgroup_id}")
        print(f"PASS: Created subgroup '{new_name}'")
    
    def test_create_subgroup_nonexistent_division(self, admin_client):
        """POST to nonexistent division returns 404"""
        response = admin_client.post(
            f"{BASE_URL}/api/division-groups/NonExistent_Division_XYZ/subgroups",
            json={"name": "Test"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Create subgroup in nonexistent division returns 404")
    
    # ========== PUT /api/subgroups/{subgroup_id} - Update/Rename ==========
    
    def test_rename_subgroup(self, admin_client):
        """PUT renames a subgroup"""
        # Create a test subgroup first
        create_name = f"{TEST_SUBGROUP_PREFIX}ToRename_{os.urandom(4).hex()}"
        create_resp = admin_client.post(
            f"{BASE_URL}/api/division-groups/{EXISTING_DIVISION}/subgroups",
            json={"name": create_name}
        )
        assert create_resp.status_code == 200
        subgroup_id = create_resp.json()["id"]
        
        # Rename it
        new_name = f"{TEST_SUBGROUP_PREFIX}Renamed_{os.urandom(4).hex()}"
        response = admin_client.put(
            f"{BASE_URL}/api/subgroups/{subgroup_id}",
            json={"name": new_name}
        )
        assert response.status_code == 200, f"Rename failed: {response.text}"
        
        data = response.json()
        assert data["name"] == new_name, f"Name not updated: {data}"
        
        # Verify persistence
        verify_resp = admin_client.get(f"{BASE_URL}/api/division-groups/{EXISTING_DIVISION}")
        group_data = verify_resp.json()
        found_sg = next((sg for sg in group_data.get("subgroups", []) if sg["id"] == subgroup_id), None)
        assert found_sg is not None
        assert found_sg["name"] == new_name
        
        # Cleanup
        admin_client.delete(f"{BASE_URL}/api/subgroups/{subgroup_id}")
        print(f"PASS: Renamed subgroup to '{new_name}'")
    
    def test_update_subgroup_leader(self, admin_client):
        """PUT updates subgroup leader"""
        # Create test subgroup
        create_name = f"{TEST_SUBGROUP_PREFIX}LeaderTest_{os.urandom(4).hex()}"
        create_resp = admin_client.post(
            f"{BASE_URL}/api/division-groups/{EXISTING_DIVISION}/subgroups",
            json={"name": create_name}
        )
        assert create_resp.status_code == 200
        subgroup_id = create_resp.json()["id"]
        
        # Get a user to set as leader
        users_resp = admin_client.get(f"{BASE_URL}/api/users")
        users = users_resp.json()
        test_leader = users[0] if users else None
        
        if test_leader:
            # First add as member
            admin_client.post(f"{BASE_URL}/api/subgroups/{subgroup_id}/members/{test_leader['id']}")
            
            # Set as leader
            response = admin_client.put(
                f"{BASE_URL}/api/subgroups/{subgroup_id}",
                json={"leader_id": test_leader["id"]}
            )
            assert response.status_code == 200, f"Set leader failed: {response.text}"
            
            data = response.json()
            assert data.get("leader_id") == test_leader["id"]
            print(f"PASS: Set subgroup leader to {test_leader.get('full_name')}")
        
        # Cleanup
        admin_client.delete(f"{BASE_URL}/api/subgroups/{subgroup_id}")
    
    def test_update_nonexistent_subgroup(self, admin_client):
        """PUT to nonexistent subgroup returns 404"""
        response = admin_client.put(
            f"{BASE_URL}/api/subgroups/nonexistent-id-12345",
            json={"name": "Test"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Update nonexistent subgroup returns 404")
    
    # ========== POST /api/subgroups/{id}/members/{user_id} - Add Member ==========
    
    def test_add_member_to_subgroup(self, admin_client):
        """POST adds member to subgroup"""
        # Create test subgroup
        create_name = f"{TEST_SUBGROUP_PREFIX}MemberTest_{os.urandom(4).hex()}"
        create_resp = admin_client.post(
            f"{BASE_URL}/api/division-groups/{EXISTING_DIVISION}/subgroups",
            json={"name": create_name}
        )
        assert create_resp.status_code == 200
        subgroup_id = create_resp.json()["id"]
        
        # Get a user to add
        users_resp = admin_client.get(f"{BASE_URL}/api/users")
        users = users_resp.json()
        test_user = users[0] if users else None
        
        if test_user:
            response = admin_client.post(
                f"{BASE_URL}/api/subgroups/{subgroup_id}/members/{test_user['id']}"
            )
            assert response.status_code == 200, f"Add member failed: {response.text}"
            
            # Verify member was added
            verify_resp = admin_client.get(f"{BASE_URL}/api/division-groups/{EXISTING_DIVISION}")
            group_data = verify_resp.json()
            found_sg = next((sg for sg in group_data.get("subgroups", []) if sg["id"] == subgroup_id), None)
            
            member_ids = [m["id"] for m in found_sg.get("members", [])]
            assert test_user["id"] in member_ids, "Member not found in subgroup"
            print(f"PASS: Added {test_user.get('full_name')} to subgroup")
        
        # Cleanup
        admin_client.delete(f"{BASE_URL}/api/subgroups/{subgroup_id}")
    
    def test_add_member_to_nonexistent_subgroup(self, admin_client):
        """POST to nonexistent subgroup returns 404"""
        users_resp = admin_client.get(f"{BASE_URL}/api/users")
        users = users_resp.json()
        test_user = users[0] if users else None
        
        if test_user:
            response = admin_client.post(
                f"{BASE_URL}/api/subgroups/nonexistent-id-12345/members/{test_user['id']}"
            )
            assert response.status_code == 404, f"Expected 404, got {response.status_code}"
            print("PASS: Add member to nonexistent subgroup returns 404")
    
    # ========== DELETE /api/subgroups/{id}/members/{user_id} - Remove Member ==========
    
    def test_remove_member_from_subgroup(self, admin_client):
        """DELETE removes member from subgroup"""
        # Create test subgroup with a member
        create_name = f"{TEST_SUBGROUP_PREFIX}RemoveTest_{os.urandom(4).hex()}"
        create_resp = admin_client.post(
            f"{BASE_URL}/api/division-groups/{EXISTING_DIVISION}/subgroups",
            json={"name": create_name}
        )
        assert create_resp.status_code == 200
        subgroup_id = create_resp.json()["id"]
        
        # Get a user to add then remove
        users_resp = admin_client.get(f"{BASE_URL}/api/users")
        users = users_resp.json()
        test_user = users[0] if users else None
        
        if test_user:
            # Add member
            admin_client.post(f"{BASE_URL}/api/subgroups/{subgroup_id}/members/{test_user['id']}")
            
            # Remove member
            response = admin_client.delete(
                f"{BASE_URL}/api/subgroups/{subgroup_id}/members/{test_user['id']}"
            )
            assert response.status_code == 200, f"Remove member failed: {response.text}"
            
            # Verify member was removed
            verify_resp = admin_client.get(f"{BASE_URL}/api/division-groups/{EXISTING_DIVISION}")
            group_data = verify_resp.json()
            found_sg = next((sg for sg in group_data.get("subgroups", []) if sg["id"] == subgroup_id), None)
            
            member_ids = [m["id"] for m in found_sg.get("members", [])]
            assert test_user["id"] not in member_ids, "Member still in subgroup after removal"
            print(f"PASS: Removed {test_user.get('full_name')} from subgroup")
        
        # Cleanup
        admin_client.delete(f"{BASE_URL}/api/subgroups/{subgroup_id}")
    
    # ========== DELETE /api/subgroups/{subgroup_id} - Delete ==========
    
    def test_delete_subgroup(self, admin_client):
        """DELETE removes a subgroup"""
        # Create test subgroup to delete
        create_name = f"{TEST_SUBGROUP_PREFIX}ToDelete_{os.urandom(4).hex()}"
        create_resp = admin_client.post(
            f"{BASE_URL}/api/division-groups/{EXISTING_DIVISION}/subgroups",
            json={"name": create_name}
        )
        assert create_resp.status_code == 200
        subgroup_id = create_resp.json()["id"]
        
        # Delete it
        response = admin_client.delete(f"{BASE_URL}/api/subgroups/{subgroup_id}")
        assert response.status_code == 200, f"Delete failed: {response.text}"
        
        # Verify deletion
        verify_resp = admin_client.get(f"{BASE_URL}/api/division-groups/{EXISTING_DIVISION}")
        group_data = verify_resp.json()
        found_sg = next((sg for sg in group_data.get("subgroups", []) if sg["id"] == subgroup_id), None)
        assert found_sg is None, "Subgroup still exists after deletion"
        
        print(f"PASS: Deleted subgroup '{create_name}'")
    
    def test_delete_nonexistent_subgroup(self, admin_client):
        """DELETE nonexistent subgroup returns 404"""
        response = admin_client.delete(f"{BASE_URL}/api/subgroups/nonexistent-id-12345")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Delete nonexistent subgroup returns 404")
    
    # ========== Access Control Tests ==========
    
    def test_create_subgroup_without_auth(self):
        """Create subgroup without auth returns 401/403"""
        response = requests.post(
            f"{BASE_URL}/api/division-groups/{EXISTING_DIVISION}/subgroups",
            json={"name": "Unauthorized Test"}
        )
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("PASS: Create subgroup without auth denied")
    
    def test_update_subgroup_without_auth(self):
        """Update subgroup without auth returns 401/403"""
        response = requests.put(
            f"{BASE_URL}/api/subgroups/{EXISTING_SUBGROUP_ID}",
            json={"name": "Unauthorized Rename"}
        )
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("PASS: Update subgroup without auth denied")
    
    def test_delete_subgroup_without_auth(self):
        """Delete subgroup without auth returns 401/403"""
        response = requests.delete(f"{BASE_URL}/api/subgroups/{EXISTING_SUBGROUP_ID}")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("PASS: Delete subgroup without auth denied")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
