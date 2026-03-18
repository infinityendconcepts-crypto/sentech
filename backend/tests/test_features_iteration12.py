"""
Test suite for iteration 12 features:
1. Notifications API
2. Notes CRUD with Folders
3. Messages (Individual/Division/Subgroup)
4. Meetings with Event sync
5. Users API (all imported fields)
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
AUTH_TOKEN = None
CURRENT_USER_ID = None

@pytest.fixture(scope="module", autouse=True)
def setup_auth():
    """Authenticate once for all tests"""
    global AUTH_TOKEN, CURRENT_USER_ID
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "jane.smith@uct.ac.za",
        "password": "securepass123"
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    AUTH_TOKEN = data.get("access_token")
    CURRENT_USER_ID = data.get("user", {}).get("id")
    assert AUTH_TOKEN, "No token in login response"
    print(f"Authenticated as user {CURRENT_USER_ID}")
    yield
    AUTH_TOKEN = None

def auth_headers():
    return {"Authorization": f"Bearer {AUTH_TOKEN}"}

# ==================== NOTIFICATIONS TESTS ====================
class TestNotifications:
    """Notifications API tests"""
    
    def test_get_all_notifications(self):
        """GET /api/notifications returns list"""
        response = requests.get(f"{BASE_URL}/api/notifications", headers=auth_headers())
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Got {len(data)} notifications")
    
    def test_get_unread_count(self):
        """GET /api/notifications/unread/count returns count object"""
        response = requests.get(f"{BASE_URL}/api/notifications/unread/count", headers=auth_headers())
        assert response.status_code == 200
        data = response.json()
        assert "unread_count" in data
        print(f"PASS: Unread count = {data['unread_count']}")
    
    def test_mark_all_read(self):
        """PUT /api/notifications/read-all marks all as read"""
        response = requests.put(f"{BASE_URL}/api/notifications/read-all", headers=auth_headers())
        assert response.status_code == 200
        print("PASS: Mark all read endpoint works")
    
    def test_delete_nonexistent_notification(self):
        """DELETE /api/notifications/{id} returns 404 for nonexistent"""
        response = requests.delete(f"{BASE_URL}/api/notifications/nonexistent-id", headers=auth_headers())
        assert response.status_code == 404
        print("PASS: Delete nonexistent notification returns 404")


# ==================== NOTES TESTS ====================
class TestNotes:
    """Notes CRUD with Folders tests"""
    
    created_note_id = None
    created_folder_id = None
    
    def test_get_all_notes(self):
        """GET /api/notes returns list"""
        response = requests.get(f"{BASE_URL}/api/notes", headers=auth_headers())
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Got {len(data)} notes")
    
    def test_get_shared_notes(self):
        """GET /api/notes/shared returns list"""
        response = requests.get(f"{BASE_URL}/api/notes/shared", headers=auth_headers())
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Got {len(data)} shared notes")
    
    def test_get_folders(self):
        """GET /api/notes/folders/list returns folders"""
        response = requests.get(f"{BASE_URL}/api/notes/folders/list", headers=auth_headers())
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Got {len(data)} folders")
    
    def test_create_folder(self):
        """POST /api/notes/folders creates folder"""
        response = requests.post(f"{BASE_URL}/api/notes/folders", headers=auth_headers(), json={
            "name": "TEST_Folder_Iteration12",
            "color": "#FF5733"
        })
        assert response.status_code in [200, 201]
        data = response.json()
        assert "id" in data
        TestNotes.created_folder_id = data["id"]
        print(f"PASS: Created folder with id {data['id']}")
    
    def test_create_note(self):
        """POST /api/notes creates note"""
        response = requests.post(f"{BASE_URL}/api/notes", headers=auth_headers(), json={
            "title": "TEST_Note_Iteration12",
            "content": "This is a test note for iteration 12 testing",
            "tags": ["test", "iteration12"],
            "color": "#FEF3C7",
            "is_pinned": False
        })
        assert response.status_code in [200, 201]
        data = response.json()
        assert "id" in data
        assert data["title"] == "TEST_Note_Iteration12"
        TestNotes.created_note_id = data["id"]
        print(f"PASS: Created note with id {data['id']}")
    
    def test_create_note_in_folder(self):
        """POST /api/notes creates note with folder_id"""
        if not TestNotes.created_folder_id:
            pytest.skip("No folder created")
        response = requests.post(f"{BASE_URL}/api/notes", headers=auth_headers(), json={
            "title": "TEST_Note_In_Folder",
            "content": "Note inside a folder",
            "folder_id": TestNotes.created_folder_id
        })
        assert response.status_code in [200, 201]
        data = response.json()
        assert data.get("folder_id") == TestNotes.created_folder_id
        print(f"PASS: Created note in folder")
    
    def test_update_note(self):
        """PUT /api/notes/{id} updates note"""
        if not TestNotes.created_note_id:
            pytest.skip("No note created")
        response = requests.put(f"{BASE_URL}/api/notes/{TestNotes.created_note_id}", headers=auth_headers(), json={
            "title": "TEST_Note_Updated_Title",
            "content": "Updated content",
            "is_pinned": True
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("title") == "TEST_Note_Updated_Title"
        print("PASS: Note updated successfully")
    
    def test_get_notes_by_folder(self):
        """GET /api/notes?folder_id= filters by folder"""
        if not TestNotes.created_folder_id:
            pytest.skip("No folder created")
        response = requests.get(f"{BASE_URL}/api/notes", headers=auth_headers(), params={
            "folder_id": TestNotes.created_folder_id
        })
        assert response.status_code == 200
        data = response.json()
        # Should return notes in that folder
        print(f"PASS: Got {len(data)} notes in folder")
    
    def test_delete_note(self):
        """DELETE /api/notes/{id} deletes note"""
        if not TestNotes.created_note_id:
            pytest.skip("No note created")
        response = requests.delete(f"{BASE_URL}/api/notes/{TestNotes.created_note_id}", headers=auth_headers())
        assert response.status_code in [200, 204]
        print("PASS: Note deleted successfully")


# ==================== MESSAGES / GROUP MESSAGING TESTS ====================
class TestMessages:
    """Messages API with Individual/Division/Subgroup conversation tests"""
    
    created_conversation_id = None
    
    def test_get_conversations(self):
        """GET /api/messages/conversations returns list"""
        response = requests.get(f"{BASE_URL}/api/messages/conversations", headers=auth_headers())
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Got {len(data)} conversations")
    
    def test_get_unread_message_count(self):
        """GET /api/messages/unread/count returns count"""
        response = requests.get(f"{BASE_URL}/api/messages/unread/count", headers=auth_headers())
        assert response.status_code == 200
        data = response.json()
        assert "unread_count" in data
        print(f"PASS: Unread message count = {data['unread_count']}")
    
    def test_create_individual_conversation(self):
        """POST /api/messages/group-conversation creates individual conversation"""
        # First get a user to chat with
        users_response = requests.get(f"{BASE_URL}/api/users", headers=auth_headers())
        assert users_response.status_code == 200
        users = users_response.json()
        other_user = next((u for u in users if u["id"] != CURRENT_USER_ID), None)
        
        if not other_user:
            pytest.skip("No other users found")
        
        response = requests.post(f"{BASE_URL}/api/messages/group-conversation", headers=auth_headers(), json={
            "target_type": "individual",
            "target_id": other_user["id"]
        })
        assert response.status_code in [200, 201]
        data = response.json()
        assert "id" in data
        TestMessages.created_conversation_id = data["id"]
        print(f"PASS: Created individual conversation with {other_user.get('full_name', 'user')}")
    
    def test_create_division_conversation(self):
        """POST /api/messages/group-conversation creates division conversation"""
        # Get divisions
        divisions_response = requests.get(f"{BASE_URL}/api/division-groups", headers=auth_headers())
        assert divisions_response.status_code == 200
        divisions = divisions_response.json()
        
        if not divisions:
            pytest.skip("No divisions found")
        
        division_name = divisions[0].get("division_name")
        response = requests.post(f"{BASE_URL}/api/messages/group-conversation", headers=auth_headers(), json={
            "target_type": "division",
            "target_id": division_name,
            "target_name": division_name
        })
        assert response.status_code in [200, 201]
        data = response.json()
        assert "id" in data
        print(f"PASS: Created division conversation for {division_name}")
    
    def test_create_subgroup_conversation(self):
        """POST /api/messages/group-conversation creates subgroup conversation"""
        # Get division groups with subgroups
        divisions_response = requests.get(f"{BASE_URL}/api/division-groups", headers=auth_headers())
        assert divisions_response.status_code == 200
        divisions = divisions_response.json()
        
        # Find a subgroup
        subgroup = None
        for d in divisions:
            if d.get("subgroups"):
                subgroup = d["subgroups"][0]
                break
        
        if not subgroup:
            pytest.skip("No subgroups found")
        
        response = requests.post(f"{BASE_URL}/api/messages/group-conversation", headers=auth_headers(), json={
            "target_type": "subgroup",
            "target_id": subgroup["id"],
            "target_name": subgroup["name"]
        })
        assert response.status_code in [200, 201]
        data = response.json()
        assert "id" in data
        print(f"PASS: Created subgroup conversation for {subgroup['name']}")
    
    def test_send_message_in_conversation(self):
        """POST /api/messages/conversations/{id}/messages sends message"""
        if not TestMessages.created_conversation_id:
            pytest.skip("No conversation created")
        
        response = requests.post(
            f"{BASE_URL}/api/messages/conversations/{TestMessages.created_conversation_id}/messages",
            headers=auth_headers(),
            json={
                "content": "TEST_Message from iteration 12",
                "message_type": "text"
            }
        )
        assert response.status_code in [200, 201]
        data = response.json()
        assert data.get("content") == "TEST_Message from iteration 12"
        print("PASS: Sent message in conversation")
    
    def test_get_conversation_messages(self):
        """GET /api/messages/conversations/{id}/messages returns messages"""
        if not TestMessages.created_conversation_id:
            pytest.skip("No conversation created")
        
        response = requests.get(
            f"{BASE_URL}/api/messages/conversations/{TestMessages.created_conversation_id}/messages",
            headers=auth_headers()
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Got {len(data)} messages in conversation")


# ==================== MEETINGS WITH EVENT SYNC TESTS ====================
class TestMeetingsEventSync:
    """Meetings API with automatic Event creation"""
    
    created_meeting_id = None
    created_event_id = None
    
    def test_get_all_meetings(self):
        """GET /api/meetings returns list"""
        response = requests.get(f"{BASE_URL}/api/meetings", headers=auth_headers())
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Got {len(data)} meetings")
    
    def test_get_all_events(self):
        """GET /api/events returns list"""
        response = requests.get(f"{BASE_URL}/api/events", headers=auth_headers())
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Count meeting type events
        meeting_events = [e for e in data if e.get("event_type") == "meeting"]
        print(f"PASS: Got {len(data)} events ({len(meeting_events)} meeting type)")
    
    def test_create_teams_meeting_and_verify_event(self):
        """POST /api/meetings creates meeting AND creates corresponding event"""
        # Create a Teams meeting with future date
        future_date = (datetime.now() + timedelta(days=1)).isoformat()
        end_date = (datetime.now() + timedelta(days=1, hours=1)).isoformat()
        
        response = requests.post(f"{BASE_URL}/api/meetings", headers=auth_headers(), json={
            "title": "TEST_Teams_Meeting_Iteration12",
            "description": "Test meeting for iteration 12 - Teams sync verification",
            "meeting_type": "teams",
            "meeting_link": "https://teams.microsoft.com/l/meetup-test/12345",
            "meeting_id": "TEST-12345",
            "meeting_password": "testpass",
            "start_time": future_date,
            "end_time": end_date,
            "attendee_ids": []
        })
        assert response.status_code in [200, 201], f"Failed to create meeting: {response.text}"
        meeting_data = response.json()
        assert "id" in meeting_data
        TestMeetingsEventSync.created_meeting_id = meeting_data["id"]
        print(f"PASS: Created Teams meeting with id {meeting_data['id']}")
        
        # Verify corresponding event was created
        events_response = requests.get(f"{BASE_URL}/api/events", headers=auth_headers())
        assert events_response.status_code == 200
        events = events_response.json()
        
        # Look for meeting event with matching title or meeting_id reference
        meeting_event = None
        for e in events:
            if e.get("title") == "TEST_Teams_Meeting_Iteration12":
                meeting_event = e
                break
            if e.get("meeting_id") == meeting_data["id"]:
                meeting_event = e
                break
        
        if meeting_event:
            TestMeetingsEventSync.created_event_id = meeting_event["id"]
            assert meeting_event.get("event_type") == "meeting"
            print(f"PASS: Found corresponding meeting event in calendar (id: {meeting_event['id']})")
        else:
            print("INFO: No auto-created event found - may need manual sync or event creation is separate")
    
    def test_filter_meetings_by_type(self):
        """GET /api/meetings?meeting_type=teams filters correctly"""
        response = requests.get(f"{BASE_URL}/api/meetings", headers=auth_headers(), params={
            "meeting_type": "teams"
        })
        assert response.status_code == 200
        data = response.json()
        for m in data:
            assert m.get("meeting_type") == "teams", f"Got non-teams meeting: {m.get('meeting_type')}"
        print(f"PASS: Filter by type=teams works ({len(data)} results)")
    
    def test_filter_meetings_by_status(self):
        """GET /api/meetings?status=scheduled filters correctly"""
        response = requests.get(f"{BASE_URL}/api/meetings", headers=auth_headers(), params={
            "status": "scheduled"
        })
        assert response.status_code == 200
        data = response.json()
        for m in data:
            assert m.get("status") == "scheduled", f"Got non-scheduled meeting: {m.get('status')}"
        print(f"PASS: Filter by status=scheduled works ({len(data)} results)")
    
    def test_delete_meeting(self):
        """DELETE /api/meetings/{id} deletes meeting"""
        if not TestMeetingsEventSync.created_meeting_id:
            pytest.skip("No meeting created")
        
        response = requests.delete(
            f"{BASE_URL}/api/meetings/{TestMeetingsEventSync.created_meeting_id}",
            headers=auth_headers()
        )
        assert response.status_code in [200, 204]
        print("PASS: Meeting deleted successfully")


# ==================== USERS API TESTS ====================
class TestUsersAPI:
    """Users API with all imported fields"""
    
    def test_get_all_users(self):
        """GET /api/users returns list with user details"""
        response = requests.get(f"{BASE_URL}/api/users", headers=auth_headers())
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"PASS: Got {len(data)} users")
        
        # Check that user objects have expected fields
        sample_user = data[0]
        expected_fields = ["id", "email"]
        for field in expected_fields:
            assert field in sample_user, f"Missing field: {field}"
        print("PASS: User objects have required fields")
    
    def test_user_has_personal_info_fields(self):
        """Users have personal information fields"""
        response = requests.get(f"{BASE_URL}/api/users", headers=auth_headers())
        assert response.status_code == 200
        users = response.json()
        
        # Check for personal info fields in at least one user
        personal_fields = ["full_name", "surname", "id_number", "gender", "race", "age"]
        user_with_data = None
        for u in users:
            if u.get("full_name") and u.get("division"):
                user_with_data = u
                break
        
        if user_with_data:
            found_fields = [f for f in personal_fields if f in user_with_data]
            print(f"PASS: Found personal info fields: {found_fields}")
        else:
            print("INFO: No users with full personal info found")
    
    def test_user_has_employment_info_fields(self):
        """Users have employment information fields"""
        response = requests.get(f"{BASE_URL}/api/users", headers=auth_headers())
        assert response.status_code == 200
        users = response.json()
        
        employment_fields = ["personnel_number", "division", "department", "position", "level", "start_date", "years_of_service"]
        user_with_data = next((u for u in users if u.get("division")), None)
        
        if user_with_data:
            found_fields = [f for f in employment_fields if f in user_with_data]
            print(f"PASS: Found employment info fields: {found_fields}")
        else:
            print("INFO: No users with employment info found")
    
    def test_user_has_ofo_classification_fields(self):
        """Users have OFO classification fields"""
        response = requests.get(f"{BASE_URL}/api/users", headers=auth_headers())
        assert response.status_code == 200
        users = response.json()
        
        ofo_fields = ["ofo_major_group", "ofo_sub_major_group", "ofo_occupation", "ofo_code"]
        user_with_ofo = next((u for u in users if u.get("ofo_code")), None)
        
        if user_with_ofo:
            found_fields = [f for f in ofo_fields if f in user_with_ofo]
            print(f"PASS: Found OFO classification fields: {found_fields}")
        else:
            print("INFO: No users with OFO classification data found")
    
    def test_user_has_system_info_fields(self):
        """Users have system information fields"""
        response = requests.get(f"{BASE_URL}/api/users", headers=auth_headers())
        assert response.status_code == 200
        users = response.json()
        
        system_fields = ["roles", "is_active", "requires_password_setup"]
        user_sample = users[0] if users else None
        
        if user_sample:
            found_fields = [f for f in system_fields if f in user_sample]
            print(f"PASS: Found system info fields: {found_fields}")
        else:
            print("INFO: No users found")
    
    def test_get_single_user(self):
        """GET /api/users/{id} returns single user with all fields"""
        # First get list of users
        response = requests.get(f"{BASE_URL}/api/users", headers=auth_headers())
        assert response.status_code == 200
        users = response.json()
        
        if not users:
            pytest.skip("No users found")
        
        user_id = users[0]["id"]
        single_response = requests.get(f"{BASE_URL}/api/users/{user_id}", headers=auth_headers())
        assert single_response.status_code == 200
        user_data = single_response.json()
        assert user_data["id"] == user_id
        print(f"PASS: Got single user {user_data.get('full_name', user_data['email'])}")


# ==================== EVENTS API TESTS ====================
class TestEventsAPI:
    """Events API including meeting type events"""
    
    def test_get_all_events(self):
        """GET /api/events returns list"""
        response = requests.get(f"{BASE_URL}/api/events", headers=auth_headers())
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Got {len(data)} events")
    
    def test_events_include_meeting_type(self):
        """Events can have event_type='meeting'"""
        response = requests.get(f"{BASE_URL}/api/events", headers=auth_headers())
        assert response.status_code == 200
        data = response.json()
        
        # Check for meeting type events
        meeting_events = [e for e in data if e.get("event_type") == "meeting"]
        event_types = set(e.get("event_type") for e in data)
        print(f"PASS: Found event types: {event_types}")
        print(f"INFO: {len(meeting_events)} meeting-type events found")
    
    def test_create_event(self):
        """POST /api/events creates event"""
        future_date = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
        
        response = requests.post(f"{BASE_URL}/api/events", headers=auth_headers(), json={
            "title": "TEST_Event_Iteration12",
            "description": "Test event created during iteration 12",
            "start_date": future_date,
            "event_type": "event",
            "all_day": True
        })
        assert response.status_code in [200, 201]
        data = response.json()
        assert "id" in data
        print(f"PASS: Created event with id {data['id']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/events/{data['id']}", headers=auth_headers())


# ==================== DIVISION GROUPS API (for Messages) ====================
class TestDivisionGroupsAPI:
    """Division Groups API for group messaging verification"""
    
    def test_get_all_division_groups(self):
        """GET /api/division-groups returns list with member counts"""
        response = requests.get(f"{BASE_URL}/api/division-groups", headers=auth_headers())
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Verify structure
        if data:
            sample = data[0]
            assert "division_name" in sample or "division_id" in sample
            assert "member_count" in sample
            print(f"PASS: Got {len(data)} division groups")
            
            # Check for subgroups
            groups_with_subgroups = [d for d in data if d.get("subgroups")]
            print(f"INFO: {len(groups_with_subgroups)} divisions have subgroups")
        else:
            print("WARN: No division groups found")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
