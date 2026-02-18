"""
PDP (Personal Development Plan) API Tests
Tests all CRUD operations for the 5-field development plan feature:
1. What do I need to learn?
2. What will I do to achieve this?
3. What resources or support will I need?
4. What will my success criteria be?
5. Target dates for review and completion
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPDPAPI:
    """Personal Development Plan CRUD Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token before each test"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "jane.smith@uct.ac.za", "password": "securepass123"}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        self.token = login_response.json()["access_token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        self.created_entry_id = None
        yield
        # Cleanup - delete TEST_ prefixed entries
        if self.created_entry_id:
            requests.delete(
                f"{BASE_URL}/api/pdp/{self.created_entry_id}",
                headers=self.headers
            )

    def test_get_pdp_entries(self):
        """Test GET /api/pdp - fetch all PDP entries for user"""
        response = requests.get(f"{BASE_URL}/api/pdp", headers=self.headers)
        assert response.status_code == 200
        entries = response.json()
        assert isinstance(entries, list)
        print(f"✓ GET /api/pdp returned {len(entries)} entries")
    
    def test_create_pdp_entry_with_all_5_fields(self):
        """Test POST /api/pdp - create entry with all 5 required fields"""
        payload = {
            "learn_what": "TEST_Advanced Python Programming",
            "action_plan": "Complete online course and build 2 projects",
            "resources_support": "Coursera subscription and senior developer mentor",
            "success_criteria": "Pass certification and complete 3 projects",
            "target_date": "2026-06-30",
            "review_date": "2026-04-15",
            "status": "not_started",
            "priority": "high",
            "category": "Technical Skills"
        }
        
        response = requests.post(f"{BASE_URL}/api/pdp", headers=self.headers, json=payload)
        assert response.status_code == 200
        
        entry = response.json()
        self.created_entry_id = entry.get("id")
        
        # Validate all 5 PDP fields
        assert entry["learn_what"] == payload["learn_what"], "learn_what mismatch"
        assert entry["action_plan"] == payload["action_plan"], "action_plan mismatch"
        assert entry["resources_support"] == payload["resources_support"], "resources_support mismatch"
        assert entry["success_criteria"] == payload["success_criteria"], "success_criteria mismatch"
        assert entry["target_date"] == payload["target_date"], "target_date mismatch"
        assert entry["review_date"] == payload["review_date"], "review_date mismatch"
        
        # Validate meta fields
        assert entry["status"] == "not_started"
        assert entry["priority"] == "high"
        assert entry["category"] == "Technical Skills"
        assert "id" in entry
        assert "user_id" in entry
        assert "created_at" in entry
        
        print(f"✓ Created PDP entry with id: {entry['id']}")
    
    def test_create_and_get_pdp_entry_persistence(self):
        """Test Create → GET flow to verify data persists in database"""
        # Create entry
        payload = {
            "learn_what": "TEST_Data Science Fundamentals",
            "action_plan": "Study statistics, complete ML courses",
            "resources_support": "DataCamp subscription, team lead support",
            "success_criteria": "Build 2 ML models, present findings",
            "target_date": "2026-09-30",
            "priority": "medium",
            "category": "Technical Skills"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/pdp", headers=self.headers, json=payload)
        assert create_response.status_code == 200
        created_entry = create_response.json()
        entry_id = created_entry["id"]
        self.created_entry_id = entry_id
        
        # GET to verify persistence
        get_response = requests.get(f"{BASE_URL}/api/pdp/{entry_id}", headers=self.headers)
        assert get_response.status_code == 200
        
        fetched_entry = get_response.json()
        assert fetched_entry["learn_what"] == payload["learn_what"]
        assert fetched_entry["action_plan"] == payload["action_plan"]
        assert fetched_entry["resources_support"] == payload["resources_support"]
        assert fetched_entry["success_criteria"] == payload["success_criteria"]
        
        print(f"✓ Create → GET persistence verified for entry: {entry_id}")
    
    def test_update_pdp_entry_status(self):
        """Test PUT /api/pdp/{id} - update status field"""
        # First create an entry
        create_payload = {
            "learn_what": "TEST_Leadership Skills",
            "action_plan": "Take leadership training",
            "resources_support": "HR training budget",
            "success_criteria": "Lead one project successfully",
            "status": "not_started",
            "priority": "medium"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/pdp", headers=self.headers, json=create_payload)
        assert create_response.status_code == 200
        entry_id = create_response.json()["id"]
        self.created_entry_id = entry_id
        
        # Update status to in_progress
        update_response = requests.put(
            f"{BASE_URL}/api/pdp/{entry_id}",
            headers=self.headers,
            json={"status": "in_progress"}
        )
        assert update_response.status_code == 200
        
        updated_entry = update_response.json()
        assert updated_entry["status"] == "in_progress"
        
        # GET to verify update persisted
        get_response = requests.get(f"{BASE_URL}/api/pdp/{entry_id}", headers=self.headers)
        assert get_response.status_code == 200
        assert get_response.json()["status"] == "in_progress"
        
        print(f"✓ Status update verified: not_started → in_progress")
    
    def test_update_pdp_entry_all_fields(self):
        """Test PUT /api/pdp/{id} - update all 5 core fields"""
        # Create
        create_payload = {
            "learn_what": "TEST_Original Learning Goal",
            "action_plan": "Original action",
            "resources_support": "Original resources",
            "success_criteria": "Original criteria",
            "target_date": "2026-03-01",
            "priority": "low"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/pdp", headers=self.headers, json=create_payload)
        entry_id = create_response.json()["id"]
        self.created_entry_id = entry_id
        
        # Update all fields
        update_payload = {
            "learn_what": "TEST_Updated Learning Goal",
            "action_plan": "Updated action plan with more detail",
            "resources_support": "Updated resources and mentor",
            "success_criteria": "Updated criteria with metrics",
            "target_date": "2026-08-01",
            "review_date": "2026-06-01",
            "priority": "high",
            "category": "Personal Growth"
        }
        
        update_response = requests.put(
            f"{BASE_URL}/api/pdp/{entry_id}",
            headers=self.headers,
            json=update_payload
        )
        assert update_response.status_code == 200
        
        # Verify all updates
        get_response = requests.get(f"{BASE_URL}/api/pdp/{entry_id}", headers=self.headers)
        entry = get_response.json()
        
        assert entry["learn_what"] == update_payload["learn_what"]
        assert entry["action_plan"] == update_payload["action_plan"]
        assert entry["resources_support"] == update_payload["resources_support"]
        assert entry["success_criteria"] == update_payload["success_criteria"]
        assert entry["target_date"] == update_payload["target_date"]
        assert entry["priority"] == update_payload["priority"]
        
        print(f"✓ All 5 fields updated and verified")
    
    def test_delete_pdp_entry(self):
        """Test DELETE /api/pdp/{id} and verify removal"""
        # Create entry to delete
        create_payload = {
            "learn_what": "TEST_To Be Deleted",
            "action_plan": "Will be deleted",
            "resources_support": "N/A",
            "success_criteria": "N/A",
            "priority": "low"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/pdp", headers=self.headers, json=create_payload)
        entry_id = create_response.json()["id"]
        
        # Delete
        delete_response = requests.delete(f"{BASE_URL}/api/pdp/{entry_id}", headers=self.headers)
        assert delete_response.status_code == 200
        assert "deleted" in delete_response.json().get("message", "").lower()
        
        # Verify 404 on GET
        get_response = requests.get(f"{BASE_URL}/api/pdp/{entry_id}", headers=self.headers)
        assert get_response.status_code == 404
        
        # Clear created_entry_id since already deleted
        self.created_entry_id = None
        
        print(f"✓ Delete → GET 404 verified for entry: {entry_id}")
    
    def test_get_nonexistent_pdp_entry(self):
        """Test GET /api/pdp/{id} returns 404 for non-existent ID"""
        response = requests.get(
            f"{BASE_URL}/api/pdp/nonexistent-uuid-12345",
            headers=self.headers
        )
        assert response.status_code == 404
        print("✓ 404 returned for non-existent entry")
    
    def test_update_nonexistent_pdp_entry(self):
        """Test PUT /api/pdp/{id} returns 404 for non-existent ID"""
        response = requests.put(
            f"{BASE_URL}/api/pdp/nonexistent-uuid-12345",
            headers=self.headers,
            json={"status": "completed"}
        )
        assert response.status_code == 404
        print("✓ 404 returned for updating non-existent entry")
    
    def test_delete_nonexistent_pdp_entry(self):
        """Test DELETE /api/pdp/{id} returns 404 for non-existent ID"""
        response = requests.delete(
            f"{BASE_URL}/api/pdp/nonexistent-uuid-12345",
            headers=self.headers
        )
        assert response.status_code == 404
        print("✓ 404 returned for deleting non-existent entry")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
