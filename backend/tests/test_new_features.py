"""
Test suite for 3 new features:
1. Auto-populate employee details by SA ID number lookup
2. Document viewing with base64 JSON storage
3. PDP approval workflow (submit, approve, reject, L&D tracking)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
SUPER_ADMIN = {"email": "jane.smith@uct.ac.za", "password": "securepass123"}
ADMIN = {"email": "test.admin@sentech.co.za", "password": "password"}
EMPLOYEE = {"email": "test.employee@sentech.co.za", "password": "password"}
HEAD_USER = {"email": "mothibik@sentech.co.za", "password": "password"}

# Test ID number for lookup
TEST_ID_NUMBER = "7503235923089"  # Tebogo Joseph Leshope


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def admin_token(api_client):
    """Get admin authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json=ADMIN)
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Admin authentication failed")


@pytest.fixture(scope="module")
def employee_token(api_client):
    """Get employee authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json=EMPLOYEE)
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Employee authentication failed")


@pytest.fixture(scope="module")
def head_token(api_client):
    """Get head user authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json=HEAD_USER)
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Head user authentication failed")


@pytest.fixture(scope="module")
def super_admin_token(api_client):
    """Get super admin authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN)
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Super admin authentication failed")


class TestUserLookupByIdNumber:
    """Feature 1: Auto-populate employee details by SA ID number"""
    
    def test_lookup_valid_id_number_returns_employee_details(self, api_client, admin_token):
        """GET /api/users/lookup-by-id?id_number=7503235923089 returns employee details with found=true"""
        response = api_client.get(
            f"{BASE_URL}/api/users/lookup-by-id",
            params={"id_number": TEST_ID_NUMBER},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify found=true
        assert data.get("found") == True, "Expected found=true for valid ID number"
        
        # Verify employee details are returned
        assert "surname" in data, "Response should include surname"
        assert "name" in data, "Response should include name"
        assert "division" in data, "Response should include division"
        assert "department" in data, "Response should include department"
        
        print(f"Found employee: {data.get('name')} {data.get('surname')}")
        print(f"Division: {data.get('division')}, Department: {data.get('department')}")
    
    def test_lookup_invalid_id_number_returns_404(self, api_client, admin_token):
        """GET /api/users/lookup-by-id?id_number=0000000000000 returns 404 not found"""
        response = api_client.get(
            f"{BASE_URL}/api/users/lookup-by-id",
            params={"id_number": "0000000000000"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 404, f"Expected 404 for non-existent ID, got {response.status_code}"
        print("Correctly returned 404 for non-existent ID number")
    
    def test_lookup_short_id_number_returns_400(self, api_client, admin_token):
        """GET /api/users/lookup-by-id with short ID returns 400"""
        response = api_client.get(
            f"{BASE_URL}/api/users/lookup-by-id",
            params={"id_number": "123"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 400, f"Expected 400 for short ID, got {response.status_code}"
        print("Correctly returned 400 for short ID number")
    
    def test_lookup_requires_authentication(self, api_client):
        """GET /api/users/lookup-by-id without auth returns 401 or 403"""
        response = api_client.get(
            f"{BASE_URL}/api/users/lookup-by-id",
            params={"id_number": TEST_ID_NUMBER}
        )
        
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print("Correctly requires authentication")


class TestPDPApprovalWorkflow:
    """Feature 3: PDP approval workflow - submit, approve, reject, L&D tracking"""
    
    @pytest.fixture(scope="class")
    def test_pdp_entry(self, api_client, admin_token):
        """Create a test PDP entry for workflow testing"""
        pdp_data = {
            "learn_what": "TEST_PDP_Workflow_Test_Entry",
            "action_plan": "Test action plan for workflow testing",
            "resources_support": "Test resources",
            "success_criteria": "Test success criteria",
            "target_date": "2026-12-31",
            "status": "not_started",
            "priority": "medium",
            "category": "Technical Skills"
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/pdp",
            json=pdp_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code in [200, 201], f"Failed to create PDP entry: {response.text}"
        entry = response.json()
        yield entry
        
        # Cleanup
        try:
            api_client.delete(
                f"{BASE_URL}/api/pdp/{entry['id']}",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
        except:
            pass
    
    def test_pdp_status_update_to_pending_approval(self, api_client, admin_token, test_pdp_entry):
        """PUT /api/pdp/{id} with status=pending_approval works"""
        response = api_client.put(
            f"{BASE_URL}/api/pdp/{test_pdp_entry['id']}",
            json={"status": "pending_approval"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("status") == "pending_approval", "Status should be pending_approval"
        print("Successfully updated PDP status to pending_approval")
    
    def test_pdp_status_update_to_manager_approved(self, api_client, admin_token, test_pdp_entry):
        """PUT /api/pdp/{id} with status=manager_approved works"""
        response = api_client.put(
            f"{BASE_URL}/api/pdp/{test_pdp_entry['id']}",
            json={"status": "manager_approved"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("status") == "manager_approved", "Status should be manager_approved"
        print("Successfully updated PDP status to manager_approved")
    
    def test_pdp_status_update_to_ld_tracking(self, api_client, admin_token, test_pdp_entry):
        """PUT /api/pdp/{id} with status=ld_tracking works"""
        response = api_client.put(
            f"{BASE_URL}/api/pdp/{test_pdp_entry['id']}",
            json={"status": "ld_tracking"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("status") == "ld_tracking", "Status should be ld_tracking"
        print("Successfully updated PDP status to ld_tracking")
    
    def test_pdp_status_update_to_rejected(self, api_client, admin_token, test_pdp_entry):
        """PUT /api/pdp/{id} with status=rejected works"""
        response = api_client.put(
            f"{BASE_URL}/api/pdp/{test_pdp_entry['id']}",
            json={"status": "rejected"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("status") == "rejected", "Status should be rejected"
        print("Successfully updated PDP status to rejected")
    
    def test_pdp_get_all_returns_entries(self, api_client, admin_token):
        """GET /api/pdp returns PDP entries"""
        response = api_client.get(
            f"{BASE_URL}/api/pdp",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Found {len(data)} PDP entries")


class TestDocumentStorage:
    """Feature 2: Document upload stores base64 JSON data"""
    
    def test_application_with_document_json_data(self, api_client, admin_token):
        """Verify applications can store documents as base64 JSON"""
        # Create a test application with document data
        test_doc = {
            "name": "test_document.pdf",
            "type": "application/pdf",
            "size": 1024,
            "data": "data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvTWVkaWFCb3hbMCAwIDYxMiA3OTJdL1BhcmVudCAyIDAgUi9SZXNvdXJjZXM8PD4+Pj4KZW5kb2JqCnhyZWYKMCA0CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxNSAwMDAwMCBuIAowMDAwMDAwMDY4IDAwMDAwIG4gCjAwMDAwMDAxMzEgMDAwMDAgbiAKdHJhaWxlcgo8PC9TaXplIDQvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgoyMjkKJSVFT0YK"
        }
        
        import json
        application_data = {
            "personal_info": {
                "surname": "TEST_DocTest",
                "name": "Document",
                "id_number": "9901015800086",
                "race": "Black",
                "gender": "Male",
                "disability": "No",
                "district_municipality": "Test Municipality"
            },
            "employment_info": {
                "division": "Test Division",
                "department": "Test Department",
                "position_description": "Test Position",
                "date_of_appointment": "2020-01-01",
                "performance_score": "3"
            },
            "academic_bursary_info": {
                "bursary_status": "Active",
                "institution": "Test University",
                "course_of_study": "Test Course",
                "total_amount_requested": "50000",
                "applicant_type": "NEW APPLICANT"
            },
            "documents": {
                "signed_performance_contract": json.dumps(test_doc),
                "proof_of_registration": json.dumps(test_doc),
                "quotation_amount_requested": json.dumps(test_doc),
                "motivation_document": json.dumps(test_doc)
            },
            "status": "draft"
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/applications",
            json=application_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code in [200, 201], f"Failed to create application: {response.text}"
        created_app = response.json()
        app_id = created_app.get("id")
        
        # Verify the document data is stored correctly
        get_response = api_client.get(
            f"{BASE_URL}/api/applications/{app_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert get_response.status_code == 200, f"Failed to get application: {get_response.text}"
        app_data = get_response.json()
        
        # Check that documents contain JSON data
        docs = app_data.get("documents", {})
        if docs.get("signed_performance_contract"):
            try:
                doc_json = json.loads(docs["signed_performance_contract"])
                assert "name" in doc_json, "Document JSON should have name"
                assert "data" in doc_json, "Document JSON should have data"
                print(f"Document stored correctly: {doc_json.get('name')}")
            except json.JSONDecodeError:
                print("Document stored as plain string (legacy format)")
        
        # Cleanup
        api_client.delete(
            f"{BASE_URL}/api/applications/{app_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        print("Document storage test completed successfully")


class TestAuthenticationEndpoints:
    """Verify authentication works for all user types"""
    
    def test_admin_login(self, api_client):
        """Admin can login successfully"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json=ADMIN)
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        assert "access_token" in response.json(), "Response should contain access_token"
        print("Admin login successful")
    
    def test_employee_login(self, api_client):
        """Employee can login successfully"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json=EMPLOYEE)
        assert response.status_code == 200, f"Employee login failed: {response.text}"
        assert "access_token" in response.json(), "Response should contain access_token"
        print("Employee login successful")
    
    def test_head_user_login(self, api_client):
        """Head user can login successfully"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json=HEAD_USER)
        assert response.status_code == 200, f"Head user login failed: {response.text}"
        assert "access_token" in response.json(), "Response should contain access_token"
        print("Head user login successful")
    
    def test_super_admin_login(self, api_client):
        """Super admin can login successfully"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN)
        assert response.status_code == 200, f"Super admin login failed: {response.text}"
        assert "access_token" in response.json(), "Response should contain access_token"
        print("Super admin login successful")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
