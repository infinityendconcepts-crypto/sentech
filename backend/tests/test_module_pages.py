"""
Backend API Tests for Module Pages: Meetings, Notes, Messages, Expenses, Tickets, Files, Settings, Help
"""
import pytest
import requests
import os
import time
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "jane.smith@uct.ac.za"
TEST_PASSWORD = "securepass123"

# Track created data for cleanup
created_ids = {
    "meetings": [],
    "notes": [],
    "folders": [],
    "expenses": [],
    "tickets": [],
    "files": [],
    "note_folders": [],
}


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip(f"Authentication failed: {response.text}")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Get headers with auth token"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }


# ==================== MEETINGS TESTS ====================

class TestMeetingsAPI:
    """Tests for Meetings module"""
    
    def test_get_meetings(self, auth_headers):
        """GET /api/meetings - List meetings"""
        response = requests.get(f"{BASE_URL}/api/meetings", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: GET meetings returned {len(data)} items")
    
    def test_create_meeting(self, auth_headers):
        """POST /api/meetings - Create meeting"""
        now = datetime.now()
        start_time = (now + timedelta(days=1)).isoformat()
        end_time = (now + timedelta(days=1, hours=1)).isoformat()
        
        payload = {
            "title": "TEST_Module_Testing_Meeting",
            "description": "Testing meeting creation",
            "meeting_type": "general",
            "start_time": start_time,
            "end_time": end_time,
            "attendee_ids": []
        }
        response = requests.post(f"{BASE_URL}/api/meetings", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Failed to create meeting: {response.text}"
        
        data = response.json()
        assert data.get("title") == payload["title"]
        assert data.get("meeting_type") == "general"
        meeting_id = data.get("id")
        created_ids["meetings"].append(meeting_id)
        print(f"PASS: Created meeting with ID: {meeting_id}")
    
    def test_get_meeting_by_id(self, auth_headers):
        """GET /api/meetings/:id - Get single meeting"""
        if not created_ids["meetings"]:
            pytest.skip("No meeting created to test")
        
        meeting_id = created_ids["meetings"][-1]
        response = requests.get(f"{BASE_URL}/api/meetings/{meeting_id}", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data.get("id") == meeting_id
        print(f"PASS: GET meeting by ID returned correct data")
    
    def test_delete_meeting(self, auth_headers):
        """DELETE /api/meetings/:id - Delete meeting"""
        if not created_ids["meetings"]:
            pytest.skip("No meeting created to delete")
        
        meeting_id = created_ids["meetings"].pop()
        response = requests.delete(f"{BASE_URL}/api/meetings/{meeting_id}", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        print(f"PASS: Deleted meeting {meeting_id}")


# ==================== NOTES TESTS ====================

class TestNotesAPI:
    """Tests for Notes module"""
    
    def test_get_notes(self, auth_headers):
        """GET /api/notes - List notes"""
        response = requests.get(f"{BASE_URL}/api/notes", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: GET notes returned {len(data)} items")
    
    def test_create_note(self, auth_headers):
        """POST /api/notes - Create note"""
        payload = {
            "title": "TEST_Note_Title",
            "content": "This is test note content for module testing",
            "tags": ["test", "module"],
            "is_pinned": False
        }
        response = requests.post(f"{BASE_URL}/api/notes", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Failed to create note: {response.text}"
        
        data = response.json()
        assert data.get("title") == payload["title"]
        assert data.get("content") == payload["content"]
        note_id = data.get("id")
        created_ids["notes"].append(note_id)
        print(f"PASS: Created note with ID: {note_id}")
    
    def test_get_note_by_id(self, auth_headers):
        """GET /api/notes/:id - Get single note"""
        if not created_ids["notes"]:
            pytest.skip("No note created to test")
        
        note_id = created_ids["notes"][-1]
        response = requests.get(f"{BASE_URL}/api/notes/{note_id}", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data.get("id") == note_id
        print(f"PASS: GET note by ID returned correct data")
    
    def test_create_note_folder(self, auth_headers):
        """POST /api/notes/folders - Create note folder"""
        payload = {
            "name": "TEST_Note_Folder",
            "color": "#0056B3"
        }
        response = requests.post(f"{BASE_URL}/api/notes/folders", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Failed to create folder: {response.text}"
        
        data = response.json()
        assert data.get("name") == payload["name"]
        folder_id = data.get("id")
        created_ids["note_folders"].append(folder_id)
        print(f"PASS: Created note folder with ID: {folder_id}")
    
    def test_get_note_folders(self, auth_headers):
        """GET /api/notes/folders/list - List note folders"""
        response = requests.get(f"{BASE_URL}/api/notes/folders/list", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: GET note folders returned {len(data)} items")
    
    def test_delete_note(self, auth_headers):
        """DELETE /api/notes/:id - Delete note"""
        if not created_ids["notes"]:
            pytest.skip("No note created to delete")
        
        note_id = created_ids["notes"].pop()
        response = requests.delete(f"{BASE_URL}/api/notes/{note_id}", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        print(f"PASS: Deleted note {note_id}")


# ==================== MESSAGES TESTS ====================

class TestMessagesAPI:
    """Tests for Messages module"""
    
    def test_get_conversations(self, auth_headers):
        """GET /api/messages/conversations - List conversations"""
        response = requests.get(f"{BASE_URL}/api/messages/conversations", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: GET conversations returned {len(data)} items")


# ==================== EXPENSES TESTS ====================

class TestExpensesAPI:
    """Tests for Expenses module"""
    
    def test_get_expenses(self, auth_headers):
        """GET /api/expenses - List expenses"""
        response = requests.get(f"{BASE_URL}/api/expenses", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: GET expenses returned {len(data)} items")
    
    def test_get_expenses_stats(self, auth_headers):
        """GET /api/expenses/stats - Get expense stats"""
        response = requests.get(f"{BASE_URL}/api/expenses/stats", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "total" in data or "count" in data or data == {}
        print(f"PASS: GET expenses stats returned data")
    
    def test_create_expense(self, auth_headers):
        """POST /api/expenses - Create expense"""
        payload = {
            "title": "TEST_Expense_Item",
            "description": "Test expense for module testing",
            "amount": 500.00,
            "category": "travel",
            "date": datetime.now().isoformat(),
            "vendor": "Test Vendor"
        }
        response = requests.post(f"{BASE_URL}/api/expenses", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Failed to create expense: {response.text}"
        
        data = response.json()
        assert data.get("title") == payload["title"]
        assert data.get("amount") == payload["amount"]
        assert data.get("status") == "pending"  # New expenses should be pending
        expense_id = data.get("id")
        created_ids["expenses"].append(expense_id)
        print(f"PASS: Created expense with ID: {expense_id}")
    
    def test_verify_expense_created(self, auth_headers):
        """GET /api/expenses - Verify expense appears in list"""
        if not created_ids["expenses"]:
            pytest.skip("No expense created to verify")
        
        response = requests.get(f"{BASE_URL}/api/expenses", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        expense_ids = [e.get("id") for e in data]
        assert created_ids["expenses"][-1] in expense_ids, "Created expense not found in list"
        print("PASS: Verified expense appears in list")
    
    def test_delete_expense(self, auth_headers):
        """DELETE /api/expenses/:id - Delete expense"""
        if not created_ids["expenses"]:
            pytest.skip("No expense created to delete")
        
        expense_id = created_ids["expenses"].pop()
        response = requests.delete(f"{BASE_URL}/api/expenses/{expense_id}", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        print(f"PASS: Deleted expense {expense_id}")


# ==================== TICKETS TESTS ====================

class TestTicketsAPI:
    """Tests for Tickets module"""
    
    def test_get_tickets(self, auth_headers):
        """GET /api/tickets - List tickets"""
        response = requests.get(f"{BASE_URL}/api/tickets", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: GET tickets returned {len(data)} items")
    
    def test_get_tickets_stats(self, auth_headers):
        """GET /api/tickets/stats - Get ticket stats"""
        response = requests.get(f"{BASE_URL}/api/tickets/stats", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        print(f"PASS: GET tickets stats returned data")
    
    def test_create_ticket(self, auth_headers):
        """POST /api/tickets - Create ticket"""
        payload = {
            "title": "TEST_Ticket_Bug_Report",
            "description": "Test ticket description for module testing",
            "category": "technical",
            "priority": "high"
        }
        response = requests.post(f"{BASE_URL}/api/tickets", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Failed to create ticket: {response.text}"
        
        data = response.json()
        assert data.get("title") == payload["title"]
        assert data.get("category") == payload["category"]
        assert data.get("priority") == payload["priority"]
        assert data.get("status") == "open"  # New tickets should be open
        ticket_id = data.get("id")
        created_ids["tickets"].append(ticket_id)
        print(f"PASS: Created ticket with ID: {ticket_id}")
    
    def test_verify_ticket_created(self, auth_headers):
        """GET /api/tickets - Verify ticket appears in list"""
        if not created_ids["tickets"]:
            pytest.skip("No ticket created to verify")
        
        response = requests.get(f"{BASE_URL}/api/tickets", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        ticket_ids = [t.get("id") for t in data]
        assert created_ids["tickets"][-1] in ticket_ids, "Created ticket not found in list"
        print("PASS: Verified ticket appears in list")
    
    def test_delete_ticket(self, auth_headers):
        """DELETE /api/tickets/:id - Delete ticket"""
        if not created_ids["tickets"]:
            pytest.skip("No ticket created to delete")
        
        ticket_id = created_ids["tickets"].pop()
        response = requests.delete(f"{BASE_URL}/api/tickets/{ticket_id}", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        print(f"PASS: Deleted ticket {ticket_id}")


# ==================== FILES TESTS ====================

class TestFilesAPI:
    """Tests for Files module"""
    
    def test_get_files(self, auth_headers):
        """GET /api/files - List files"""
        response = requests.get(f"{BASE_URL}/api/files", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: GET files returned {len(data)} items")
    
    def test_get_folders(self, auth_headers):
        """GET /api/folders - List folders"""
        response = requests.get(f"{BASE_URL}/api/folders", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: GET folders returned {len(data)} items")
    
    def test_create_folder(self, auth_headers):
        """POST /api/folders - Create folder"""
        payload = {
            "name": "TEST_Module_Folder",
            "color": "#0056B3"
        }
        response = requests.post(f"{BASE_URL}/api/folders", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Failed to create folder: {response.text}"
        
        data = response.json()
        assert data.get("name") == payload["name"]
        folder_id = data.get("id")
        created_ids["folders"].append(folder_id)
        print(f"PASS: Created folder with ID: {folder_id}")
    
    def test_create_file(self, auth_headers):
        """POST /api/files - Create file (metadata only)"""
        payload = {
            "name": "TEST_File.txt",
            "original_name": "TEST_File.txt",
            "file_type": "document",
            "mime_type": "text/plain",
            "size": 1024,
            "url": "data:text/plain;base64,VGVzdCBmaWxlIGNvbnRlbnQ="  # "Test file content"
        }
        response = requests.post(f"{BASE_URL}/api/files", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Failed to create file: {response.text}"
        
        data = response.json()
        assert data.get("name") == payload["name"]
        file_id = data.get("id")
        created_ids["files"].append(file_id)
        print(f"PASS: Created file with ID: {file_id}")
    
    def test_delete_file(self, auth_headers):
        """DELETE /api/files/:id - Delete file"""
        if not created_ids["files"]:
            pytest.skip("No file created to delete")
        
        file_id = created_ids["files"].pop()
        response = requests.delete(f"{BASE_URL}/api/files/{file_id}", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        print(f"PASS: Deleted file {file_id}")
    
    def test_delete_folder(self, auth_headers):
        """DELETE /api/folders/:id - Delete folder"""
        if not created_ids["folders"]:
            pytest.skip("No folder created to delete")
        
        folder_id = created_ids["folders"].pop()
        response = requests.delete(f"{BASE_URL}/api/folders/{folder_id}", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        print(f"PASS: Deleted folder {folder_id}")


# ==================== SETTINGS TESTS ====================

class TestSettingsAPI:
    """Tests for Settings module"""
    
    def test_get_settings(self, auth_headers):
        """GET /api/settings - Get system settings"""
        response = requests.get(f"{BASE_URL}/api/settings", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        # Settings should have at least some fields
        assert "company_name" in data or "smtp_host" in data or data == {}
        print(f"PASS: GET settings returned data")
    
    def test_get_roles(self, auth_headers):
        """GET /api/settings/roles - Get roles"""
        response = requests.get(f"{BASE_URL}/api/settings/roles", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: GET roles returned {len(data)} items")
    
    def test_update_settings(self, auth_headers):
        """PUT /api/settings - Update settings (SMTP config)"""
        payload = {
            "smtp_host": "smtp.gmail.com",
            "smtp_port": 587
        }
        response = requests.put(f"{BASE_URL}/api/settings", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Failed to update settings: {response.text}"
        print("PASS: Updated settings successfully")


# ==================== HELP/FAQ TESTS ====================

class TestHelpAPI:
    """Tests for Help/FAQ module"""
    
    def test_get_faqs(self, auth_headers):
        """GET /api/faqs - Get FAQs"""
        response = requests.get(f"{BASE_URL}/api/faqs", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: GET FAQs returned {len(data)} items")


# ==================== PROSPECTS TESTS ====================

class TestProspectsAPI:
    """Tests for Prospects module"""
    
    def test_get_prospects(self, auth_headers):
        """GET /api/prospects - List prospects"""
        response = requests.get(f"{BASE_URL}/api/prospects", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: GET prospects returned {len(data)} items")


# ==================== CLEANUP ====================

class TestCleanup:
    """Clean up any remaining test data"""
    
    def test_cleanup_remaining_data(self, auth_headers):
        """Cleanup any TEST_ prefixed data that wasn't deleted"""
        cleanup_count = 0
        
        # Clean meetings
        for meeting_id in list(created_ids["meetings"]):
            try:
                requests.delete(f"{BASE_URL}/api/meetings/{meeting_id}", headers=auth_headers)
                cleanup_count += 1
            except:
                pass
        
        # Clean notes
        for note_id in list(created_ids["notes"]):
            try:
                requests.delete(f"{BASE_URL}/api/notes/{note_id}", headers=auth_headers)
                cleanup_count += 1
            except:
                pass
        
        # Clean expenses
        for expense_id in list(created_ids["expenses"]):
            try:
                requests.delete(f"{BASE_URL}/api/expenses/{expense_id}", headers=auth_headers)
                cleanup_count += 1
            except:
                pass
        
        # Clean tickets
        for ticket_id in list(created_ids["tickets"]):
            try:
                requests.delete(f"{BASE_URL}/api/tickets/{ticket_id}", headers=auth_headers)
                cleanup_count += 1
            except:
                pass
        
        # Clean files
        for file_id in list(created_ids["files"]):
            try:
                requests.delete(f"{BASE_URL}/api/files/{file_id}", headers=auth_headers)
                cleanup_count += 1
            except:
                pass
        
        # Clean folders
        for folder_id in list(created_ids["folders"]):
            try:
                requests.delete(f"{BASE_URL}/api/folders/{folder_id}", headers=auth_headers)
                cleanup_count += 1
            except:
                pass
        
        print(f"PASS: Cleanup completed - removed {cleanup_count} items")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
