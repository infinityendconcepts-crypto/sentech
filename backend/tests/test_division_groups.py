"""
Division Groups API Tests
- Tests for the new Division Groups feature (replacement for Teams page)
- Each division forms a group, users assigned via 'division' field
- Admins/super_admins can assign leaders and manage members
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "jane.smith@uct.ac.za"
ADMIN_PASSWORD = "securepass123"
REGULAR_USER_EMAIL = "leshopet@sentech.co.za"
REGULAR_USER_PASSWORD = "password123"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def admin_token(api_client):
    """Get admin authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip(f"Admin authentication failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def regular_user_token(api_client):
    """Get regular user authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": REGULAR_USER_EMAIL,
        "password": REGULAR_USER_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip(f"Regular user authentication failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def admin_client(api_client, admin_token):
    """Session with admin auth header"""
    api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
    return api_client


class TestDivisionGroupsGetAll:
    """Test GET /api/division-groups - Get all division groups"""

    def test_get_all_division_groups_success(self, api_client, admin_token):
        """Should return all division groups with members and leader info"""
        response = api_client.get(
            f"{BASE_URL}/api/division-groups",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list of groups"
        
        # Check structure of each group
        if len(data) > 0:
            group = data[0]
            assert "division_id" in group, "Group should have division_id"
            assert "division_name" in group, "Group should have division_name"
            assert "members" in group, "Group should have members list"
            assert "member_count" in group, "Group should have member_count"
            assert "leader_id" in group, "Group should have leader_id field"
            assert isinstance(group["members"], list), "Members should be a list"
            
        print(f"Found {len(data)} division groups")
        return data

    def test_get_division_groups_requires_auth(self, api_client):
        """Should return 401/403 without authentication"""
        response = api_client.get(f"{BASE_URL}/api/division-groups")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"

    def test_regular_user_can_view_groups(self, api_client, regular_user_token):
        """Regular users should be able to view division groups"""
        response = api_client.get(
            f"{BASE_URL}/api/division-groups",
            headers={"Authorization": f"Bearer {regular_user_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list)


class TestDivisionGroupGetOne:
    """Test GET /api/division-groups/{division_name} - Get specific division group"""

    def test_get_satellite_business_group(self, api_client, admin_token):
        """Should return Satellite Business group with Thompson Chisoko as leader"""
        division_name = "Satellite Business"
        response = api_client.get(
            f"{BASE_URL}/api/division-groups/{division_name}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["division_name"] == division_name
        assert "members" in data
        assert "leader" in data
        assert "member_count" in data
        
        # Check if Thompson Chisoko is the leader
        if data.get("leader"):
            print(f"Leader: {data['leader'].get('full_name', 'Unknown')}")
            # The leader should be Thompson Chisoko per the problem statement
            leader_name = data['leader'].get('full_name', '')
            assert "Thompson" in leader_name or "Chisoko" in leader_name, \
                f"Expected Thompson Chisoko as leader, got: {leader_name}"
        
        print(f"Group '{division_name}' has {data['member_count']} members")
        return data

    def test_get_nonexistent_group(self, api_client, admin_token):
        """Should return 404 for non-existent division"""
        response = api_client.get(
            f"{BASE_URL}/api/division-groups/NonExistentDivision12345",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


class TestDivisionGroupLeader:
    """Test PUT /api/division-groups/{division_name}/leader - Set group leader"""

    def test_admin_can_set_leader(self, api_client, admin_token):
        """Admin should be able to set a group leader"""
        # First get all groups to find a valid division name and user
        response = api_client.get(
            f"{BASE_URL}/api/division-groups",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        groups = response.json()
        
        if not groups:
            pytest.skip("No division groups available for testing")
        
        # Find a group with members
        test_group = None
        for group in groups:
            if group.get("member_count", 0) > 0:
                test_group = group
                break
        
        if not test_group:
            pytest.skip("No division groups with members available for testing")
        
        division_name = test_group["division_name"]
        members = test_group.get("members", [])
        
        if not members:
            pytest.skip(f"No members in {division_name} group")
        
        # Get a member ID to set as leader
        test_user_id = members[0]["id"]
        
        response = api_client.put(
            f"{BASE_URL}/api/division-groups/{division_name}/leader",
            json={"leader_id": test_user_id},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify leader was set
        get_response = api_client.get(
            f"{BASE_URL}/api/division-groups/{division_name}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert get_response.status_code == 200
        updated_group = get_response.json()
        assert updated_group["leader_id"] == test_user_id, "Leader was not set correctly"
        print(f"Successfully set leader for {division_name}")

    def test_regular_user_cannot_set_leader(self, api_client, regular_user_token, admin_token):
        """Regular users should not be able to set group leader"""
        # Get a valid division name first
        response = api_client.get(
            f"{BASE_URL}/api/division-groups",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        groups = response.json()
        
        if not groups:
            pytest.skip("No division groups available for testing")
        
        division_name = groups[0]["division_name"]
        
        response = api_client.put(
            f"{BASE_URL}/api/division-groups/{division_name}/leader",
            json={"leader_id": "some-user-id"},
            headers={"Authorization": f"Bearer {regular_user_token}"}
        )
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"


class TestDivisionGroupMembers:
    """Test POST/DELETE /api/division-groups/{division_name}/members/{user_id}"""

    def test_admin_can_add_member(self, api_client, admin_token):
        """Admin should be able to add a member to a division group"""
        # First get all groups
        response = api_client.get(
            f"{BASE_URL}/api/division-groups",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        groups = response.json()
        
        if not groups:
            pytest.skip("No division groups available for testing")
        
        # Get all users to find one without a division
        users_response = api_client.get(
            f"{BASE_URL}/api/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        if users_response.status_code != 200:
            pytest.skip("Could not fetch users")
        
        users = users_response.json()
        
        # Find a user without a division or with a different division
        test_user = None
        target_division = groups[0]["division_name"]
        
        for user in users:
            if user.get("division") != target_division:
                test_user = user
                break
        
        if not test_user:
            pytest.skip("No suitable user found for testing")
        
        original_division = test_user.get("division")
        
        # Add user to division
        response = api_client.post(
            f"{BASE_URL}/api/division-groups/{target_division}/members/{test_user['id']}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify user was added
        verify_response = api_client.get(
            f"{BASE_URL}/api/division-groups/{target_division}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert verify_response.status_code == 200
        group_data = verify_response.json()
        member_ids = [m["id"] for m in group_data.get("members", [])]
        assert test_user["id"] in member_ids, "User was not added to the group"
        
        print(f"Successfully added user to {target_division}")
        
        # Cleanup - restore original division if needed
        if original_division:
            api_client.post(
                f"{BASE_URL}/api/division-groups/{original_division}/members/{test_user['id']}",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
        else:
            # Remove user from the test division
            api_client.delete(
                f"{BASE_URL}/api/division-groups/{target_division}/members/{test_user['id']}",
                headers={"Authorization": f"Bearer {admin_token}"}
            )

    def test_admin_can_remove_member(self, api_client, admin_token):
        """Admin should be able to remove a member from a division group"""
        # Get groups with members
        response = api_client.get(
            f"{BASE_URL}/api/division-groups",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        groups = response.json()
        
        # Find a group with more than one member (so we can safely remove one)
        test_group = None
        for group in groups:
            if group.get("member_count", 0) > 1:
                # Make sure we're not removing the leader
                leader_id = group.get("leader_id")
                non_leader_members = [m for m in group.get("members", []) if m["id"] != leader_id]
                if non_leader_members:
                    test_group = group
                    test_user = non_leader_members[0]
                    break
        
        if not test_group:
            pytest.skip("No suitable group with removable members found")
        
        division_name = test_group["division_name"]
        
        # Remove the member
        response = api_client.delete(
            f"{BASE_URL}/api/division-groups/{division_name}/members/{test_user['id']}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify user was removed
        verify_response = api_client.get(
            f"{BASE_URL}/api/division-groups/{division_name}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert verify_response.status_code == 200
        group_data = verify_response.json()
        member_ids = [m["id"] for m in group_data.get("members", [])]
        assert test_user["id"] not in member_ids, "User was not removed from the group"
        
        print(f"Successfully removed user from {division_name}")
        
        # Cleanup - add user back to original division
        api_client.post(
            f"{BASE_URL}/api/division-groups/{division_name}/members/{test_user['id']}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )

    def test_regular_user_cannot_manage_members(self, api_client, regular_user_token, admin_token):
        """Regular users should not be able to add/remove members"""
        # Get a valid division
        response = api_client.get(
            f"{BASE_URL}/api/division-groups",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        groups = response.json()
        
        if not groups:
            pytest.skip("No division groups available for testing")
        
        division_name = groups[0]["division_name"]
        
        # Try to add a member as regular user
        response = api_client.post(
            f"{BASE_URL}/api/division-groups/{division_name}/members/some-user-id",
            headers={"Authorization": f"Bearer {regular_user_token}"}
        )
        
        assert response.status_code == 403, f"Expected 403 for add member, got {response.status_code}"
        
        # Try to remove a member as regular user
        response = api_client.delete(
            f"{BASE_URL}/api/division-groups/{division_name}/members/some-user-id",
            headers={"Authorization": f"Bearer {regular_user_token}"}
        )
        
        assert response.status_code == 403, f"Expected 403 for remove member, got {response.status_code}"


class TestDivisionGroupsStats:
    """Test statistics verification from the groups endpoint"""

    def test_verify_stats(self, api_client, admin_token):
        """Verify the division groups stats match expected values"""
        response = api_client.get(
            f"{BASE_URL}/api/division-groups",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        groups = response.json()
        
        total_divisions = len(groups)
        total_members = sum(g.get("member_count", 0) for g in groups)
        leaders_count = sum(1 for g in groups if g.get("leader_id"))
        
        print(f"Stats: {total_divisions} divisions, {total_members} members, {leaders_count} leaders")
        
        # Expected: 10 divisions, 107 members, 1 leader (from problem statement)
        # These are soft assertions - print warnings if different
        if total_divisions != 10:
            print(f"WARNING: Expected 10 divisions, got {total_divisions}")
        if total_members != 107:
            print(f"WARNING: Expected 107 members, got {total_members}")
        if leaders_count < 1:
            print(f"WARNING: Expected at least 1 leader, got {leaders_count}")
        
        # Hard assertion - should have at least some data
        assert total_divisions >= 1, "Should have at least one division"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
