"""
Test Events, Leads, and User Documents APIs - Iteration 4
Tests CRUD operations for Events, Leads, and Documents management
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from iteration 3
TEST_EMAIL = "jane.smith@uct.ac.za"
TEST_PASSWORD = "securepass123"


class TestAuth:
    """Get auth token for subsequent tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        return data["access_token"], data.get("user", {})
    
    def test_login(self, auth_token):
        """Verify login works with test credentials"""
        token, user = auth_token
        assert token is not None
        print(f"✓ Logged in as: {user.get('email')}")


class TestEventsAPI:
    """Test Events CRUD operations"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_get_events_empty_or_list(self, auth_headers):
        """GET /api/events - should return list (empty or with events)"""
        response = requests.get(f"{BASE_URL}/api/events", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/events - {len(data)} events found")
    
    def test_create_event(self, auth_headers):
        """POST /api/events - create a new event"""
        event_data = {
            "title": "TEST_Event_Meeting",
            "description": "Testing event creation",
            "start_date": "2026-01-20",
            "end_date": "2026-01-20",
            "event_type": "meeting",
            "location": "Conference Room A",
            "color": "#7C3AED",
            "all_day": True
        }
        response = requests.post(f"{BASE_URL}/api/events", json=event_data, headers=auth_headers)
        assert response.status_code == 200 or response.status_code == 201, f"Create event failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["title"] == "TEST_Event_Meeting"
        assert data["event_type"] == "meeting"
        print(f"✓ POST /api/events - Created event: {data['id']}")
        return data["id"]
    
    def test_create_and_get_event(self, auth_headers):
        """Create event then GET to verify persistence"""
        # Create
        event_data = {
            "title": "TEST_Deadline_Event",
            "start_date": "2026-02-15",
            "event_type": "deadline",
            "color": "#DC2626"
        }
        create_response = requests.post(f"{BASE_URL}/api/events", json=event_data, headers=auth_headers)
        assert create_response.status_code in [200, 201]
        created = create_response.json()
        event_id = created["id"]
        
        # GET to verify
        get_response = requests.get(f"{BASE_URL}/api/events/{event_id}", headers=auth_headers)
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["title"] == "TEST_Deadline_Event"
        assert fetched["event_type"] == "deadline"
        print(f"✓ Event created and verified: {event_id}")
    
    def test_update_event(self, auth_headers):
        """PUT /api/events/{id} - update event"""
        # Create first
        event_data = {"title": "TEST_Update_Event", "start_date": "2026-03-01", "event_type": "event"}
        create_resp = requests.post(f"{BASE_URL}/api/events", json=event_data, headers=auth_headers)
        event_id = create_resp.json()["id"]
        
        # Update
        update_data = {"title": "TEST_Updated_Event_Title", "location": "Virtual"}
        update_resp = requests.put(f"{BASE_URL}/api/events/{event_id}", json=update_data, headers=auth_headers)
        assert update_resp.status_code == 200
        updated = update_resp.json()
        assert updated["title"] == "TEST_Updated_Event_Title"
        print(f"✓ PUT /api/events/{event_id} - Event updated")
    
    def test_delete_event(self, auth_headers):
        """DELETE /api/events/{id} - delete event"""
        # Create first
        event_data = {"title": "TEST_Delete_Event", "start_date": "2026-04-01", "event_type": "reminder"}
        create_resp = requests.post(f"{BASE_URL}/api/events", json=event_data, headers=auth_headers)
        event_id = create_resp.json()["id"]
        
        # Delete
        delete_resp = requests.delete(f"{BASE_URL}/api/events/{event_id}", headers=auth_headers)
        assert delete_resp.status_code == 200
        
        # Verify deleted
        get_resp = requests.get(f"{BASE_URL}/api/events/{event_id}", headers=auth_headers)
        assert get_resp.status_code == 404
        print(f"✓ DELETE /api/events/{event_id} - Event deleted and verified")


class TestLeadsAPI:
    """Test Leads CRUD operations - verify no mock data, backend integration"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_get_leads_returns_list(self, auth_headers):
        """GET /api/leads - should return empty list or leads from DB (no mock data)"""
        response = requests.get(f"{BASE_URL}/api/leads", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/leads - {len(data)} leads found (from backend, no mock)")
    
    def test_create_lead(self, auth_headers):
        """POST /api/leads - create new lead"""
        lead_data = {
            "name": "TEST_John_Doe",
            "email": "test.john@example.com",
            "phone": "+27 82 123 4567",
            "company": "Test Corp",
            "status": "new",
            "source": "website"
        }
        response = requests.post(f"{BASE_URL}/api/leads", json=lead_data, headers=auth_headers)
        assert response.status_code in [200, 201], f"Create lead failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["name"] == "TEST_John_Doe"
        assert data["status"] == "new"
        print(f"✓ POST /api/leads - Created lead: {data['id']}")
        return data["id"]
    
    def test_create_and_get_lead(self, auth_headers):
        """Create lead and GET to verify persistence"""
        # Create
        lead_data = {
            "name": "TEST_Jane_Lead",
            "email": "test.jane@corp.com",
            "phone": "+27 83 456 7890",
            "company": "Jane Corp",
            "status": "qualified",
            "source": "referral"
        }
        create_resp = requests.post(f"{BASE_URL}/api/leads", json=lead_data, headers=auth_headers)
        assert create_resp.status_code in [200, 201]
        lead_id = create_resp.json()["id"]
        
        # GET to verify
        get_resp = requests.get(f"{BASE_URL}/api/leads/{lead_id}", headers=auth_headers)
        assert get_resp.status_code == 200
        fetched = get_resp.json()
        assert fetched["name"] == "TEST_Jane_Lead"
        assert fetched["company"] == "Jane Corp"
        print(f"✓ Lead created and verified: {lead_id}")
    
    def test_update_lead_status(self, auth_headers):
        """PUT /api/leads/{id} - update lead status"""
        # Create
        lead_data = {"name": "TEST_Update_Lead", "email": "update@test.com", "status": "new", "source": "linkedin"}
        create_resp = requests.post(f"{BASE_URL}/api/leads", json=lead_data, headers=auth_headers)
        lead_id = create_resp.json()["id"]
        
        # Update status
        update_data = {"status": "discussion"}
        update_resp = requests.put(f"{BASE_URL}/api/leads/{lead_id}", json=update_data, headers=auth_headers)
        assert update_resp.status_code == 200
        
        # Verify
        get_resp = requests.get(f"{BASE_URL}/api/leads/{lead_id}", headers=auth_headers)
        assert get_resp.json()["status"] == "discussion"
        print(f"✓ PUT /api/leads/{lead_id} - Status updated to discussion")
    
    def test_delete_lead(self, auth_headers):
        """DELETE /api/leads/{id} - delete lead"""
        # Create
        lead_data = {"name": "TEST_Delete_Lead", "email": "delete@test.com", "status": "lost", "source": "cold_call"}
        create_resp = requests.post(f"{BASE_URL}/api/leads", json=lead_data, headers=auth_headers)
        lead_id = create_resp.json()["id"]
        
        # Delete
        delete_resp = requests.delete(f"{BASE_URL}/api/leads/{lead_id}", headers=auth_headers)
        assert delete_resp.status_code == 200
        
        # Verify
        get_resp = requests.get(f"{BASE_URL}/api/leads/{lead_id}", headers=auth_headers)
        assert get_resp.status_code == 404
        print(f"✓ DELETE /api/leads/{lead_id} - Lead deleted")


class TestUserDocumentsAPI:
    """Test User Documents upload/delete/list"""
    
    @pytest.fixture(scope="class")
    def auth_data(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        return data["access_token"], data["user"]["id"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_data):
        token, _ = auth_data
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture(scope="class")
    def user_id(self, auth_data):
        _, uid = auth_data
        return uid
    
    def test_get_documents_empty_or_list(self, auth_headers, user_id):
        """GET /api/users/{id}/documents - should return list"""
        response = requests.get(f"{BASE_URL}/api/users/{user_id}/documents", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/users/{user_id}/documents - {len(data)} documents found")
    
    def test_upload_document(self, auth_headers, user_id):
        """POST /api/users/{id}/documents - upload document"""
        doc_data = {
            "name": "TEST_ID_Document",
            "file_name": "test_id.pdf",
            "file_data": "data:application/pdf;base64,JVBERi0xLjQK",  # minimal PDF base64
            "document_type": "id"
        }
        response = requests.post(f"{BASE_URL}/api/users/{user_id}/documents", json=doc_data, headers=auth_headers)
        assert response.status_code in [200, 201], f"Upload failed: {response.text}"
        data = response.json()
        assert "id" in data
        print(f"✓ POST /api/users/{user_id}/documents - Uploaded doc: {data['id']}")
        return data["id"]
    
    def test_upload_and_list_document(self, auth_headers, user_id):
        """Upload document then list to verify"""
        # Upload
        doc_data = {
            "name": "TEST_Academic_Transcript",
            "file_name": "transcript.pdf",
            "file_data": "data:application/pdf;base64,JVBERi0xLjQK",
            "document_type": "academic"
        }
        upload_resp = requests.post(f"{BASE_URL}/api/users/{user_id}/documents", json=doc_data, headers=auth_headers)
        assert upload_resp.status_code in [200, 201]
        doc_id = upload_resp.json()["id"]
        
        # List to verify
        list_resp = requests.get(f"{BASE_URL}/api/users/{user_id}/documents", headers=auth_headers)
        assert list_resp.status_code == 200
        docs = list_resp.json()
        doc_ids = [d["id"] for d in docs]
        assert doc_id in doc_ids
        print(f"✓ Document uploaded and found in list: {doc_id}")
    
    def test_delete_document(self, auth_headers, user_id):
        """DELETE /api/users/{id}/documents/{doc_id} - delete document"""
        # Upload first
        doc_data = {
            "name": "TEST_Delete_Document",
            "file_name": "delete_me.pdf",
            "file_data": "data:application/pdf;base64,JVBERi0xLjQK",
            "document_type": "general"
        }
        upload_resp = requests.post(f"{BASE_URL}/api/users/{user_id}/documents", json=doc_data, headers=auth_headers)
        doc_id = upload_resp.json()["id"]
        
        # Delete
        delete_resp = requests.delete(f"{BASE_URL}/api/users/{user_id}/documents/{doc_id}", headers=auth_headers)
        assert delete_resp.status_code == 200
        
        # Verify deleted
        list_resp = requests.get(f"{BASE_URL}/api/users/{user_id}/documents", headers=auth_headers)
        docs = list_resp.json()
        doc_ids = [d["id"] for d in docs]
        assert doc_id not in doc_ids
        print(f"✓ DELETE /api/users/{user_id}/documents/{doc_id} - Document deleted")


class TestCleanup:
    """Clean up test data"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return {"Authorization": f"Bearer {response.json()['access_token']}"}
    
    def test_cleanup_test_events(self, auth_headers):
        """Delete TEST_ prefixed events"""
        response = requests.get(f"{BASE_URL}/api/events", headers=auth_headers)
        events = response.json()
        deleted = 0
        for event in events:
            if event.get("title", "").startswith("TEST_"):
                requests.delete(f"{BASE_URL}/api/events/{event['id']}", headers=auth_headers)
                deleted += 1
        print(f"✓ Cleaned up {deleted} test events")
    
    def test_cleanup_test_leads(self, auth_headers):
        """Delete TEST_ prefixed leads"""
        response = requests.get(f"{BASE_URL}/api/leads", headers=auth_headers)
        leads = response.json()
        deleted = 0
        for lead in leads:
            if lead.get("name", "").startswith("TEST_"):
                requests.delete(f"{BASE_URL}/api/leads/{lead['id']}", headers=auth_headers)
                deleted += 1
        print(f"✓ Cleaned up {deleted} test leads")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
