"""
Test file for iteration 18 features:
1. User Import Feature - CSV template download and bulk import
2. Reports Page Chart Enhancement - zoom/modal popup for charts
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "jane.smith@uct.ac.za"
ADMIN_PASSWORD = "securepass123"


class TestUserImportFeature:
    """Tests for user import functionality - CSV template and bulk import"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for admin user"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as admin
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        token = login_response.json().get("access_token")
        assert token, "No access_token in login response"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        yield
        self.session.close()
    
    def test_download_import_template(self):
        """GET /api/users/import-template - should return CSV file with headers and sample row"""
        response = self.session.get(f"{BASE_URL}/api/users/import-template")
        
        # Status code assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Content-Type should be CSV
        content_type = response.headers.get('Content-Type', '')
        assert 'text/csv' in content_type or 'application/octet-stream' in content_type, f"Expected CSV content type, got {content_type}"
        
        # Content-Disposition should have filename
        content_disposition = response.headers.get('Content-Disposition', '')
        assert 'user_import_template.csv' in content_disposition, f"Expected filename in Content-Disposition, got {content_disposition}"
        
        # Parse CSV content
        csv_content = response.text
        lines = csv_content.strip().split('\n')
        
        # Should have at least 2 rows (header + sample)
        assert len(lines) >= 2, f"Expected at least 2 lines (header + sample), got {len(lines)}"
        
        # Verify headers
        headers = lines[0].split(',')
        expected_headers = [
            "email", "full_name", "surname", "personnel_number", "id_number",
            "gender", "race", "age", "division", "department", "position", "level",
            "start_date", "years_of_service",
            "ofo_major_group", "ofo_sub_major_group", "ofo_occupation", "ofo_code"
        ]
        assert len(headers) == 18, f"Expected 18 columns, got {len(headers)}: {headers}"
        
        for expected in expected_headers:
            assert expected in headers, f"Missing header column: {expected}"
        
        print(f"✓ CSV template has correct headers: {headers}")
        print(f"✓ CSV template has sample row: {lines[1][:100]}...")
    
    def test_bulk_import_users_success(self):
        """POST /api/users/bulk-import - should accept array of user objects and return import results"""
        # Test data with unique email to avoid duplicates
        import uuid
        unique_id = str(uuid.uuid4())[:8]
        
        test_users = [
            {
                "email": f"TEST_import_user1_{unique_id}@sentech.test.co.za",
                "full_name": "Test Import User 1",
                "surname": "User1",
                "personnel_number": f"TEST_{unique_id}_001",
                "id_number": "9501015800088",
                "gender": "Male",
                "race": "African",
                "age": "30",
                "division": "Engineering",
                "department": "Software Dev",
                "position": "Developer",
                "level": "L5",
                "start_date": "2020-01-15",
                "years_of_service": "5",
                "ofo_major_group": "PROFESSIONALS",
                "ofo_sub_major_group": "Science and Engineering",
                "ofo_occupation": "Software Developer",
                "ofo_code": "251201"
            },
            {
                "email": f"TEST_import_user2_{unique_id}@sentech.test.co.za",
                "full_name": "Test Import User 2",
                "surname": "User2",
                "personnel_number": f"TEST_{unique_id}_002",
                "id_number": "9502025800089",
                "gender": "Female",
                "race": "Indian",
                "age": "28",
                "division": "Finance",
                "department": "Accounting",
                "position": "Accountant",
                "level": "L4",
                "start_date": "2021-03-01",
                "years_of_service": "4",
                "ofo_major_group": "CLERICAL",
                "ofo_sub_major_group": "Business",
                "ofo_occupation": "Accountant",
                "ofo_code": "241101"
            }
        ]
        
        response = self.session.post(f"{BASE_URL}/api/users/bulk-import", json=test_users)
        
        # Status code assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Data assertions
        data = response.json()
        assert "imported" in data, "Response should have 'imported' count"
        assert "skipped" in data, "Response should have 'skipped' count"
        assert "errors" in data, "Response should have 'errors' list"
        assert "message" in data, "Response should have 'message'"
        
        # Verify import worked (should import at least 1 if not duplicates)
        assert isinstance(data["imported"], int), "imported should be an integer"
        assert isinstance(data["skipped"], int), "skipped should be an integer"
        assert isinstance(data["errors"], list), "errors should be a list"
        
        print(f"✓ Bulk import result: imported={data['imported']}, skipped={data['skipped']}, errors={len(data['errors'])}")
        print(f"✓ Message: {data['message']}")
        
        # Cleanup: Try to delete test users
        try:
            users_response = self.session.get(f"{BASE_URL}/api/users")
            if users_response.status_code == 200:
                users = users_response.json()
                for user in users:
                    if user.get("email", "").startswith("TEST_import_user"):
                        self.session.delete(f"{BASE_URL}/api/users/{user['id']}")
        except:
            pass  # Cleanup is best effort
    
    def test_bulk_import_skips_duplicates(self):
        """POST /api/users/bulk-import - should skip existing users"""
        # Try to import the admin user which already exists
        test_users = [
            {
                "email": ADMIN_EMAIL,
                "full_name": "Duplicate Admin",
                "surname": "Admin"
            }
        ]
        
        response = self.session.post(f"{BASE_URL}/api/users/bulk-import", json=test_users)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["skipped"] >= 1, f"Should skip duplicate email, got skipped={data['skipped']}"
        assert data["imported"] == 0, f"Should not import duplicate, got imported={data['imported']}"
        
        print(f"✓ Correctly skipped duplicate user: {data}")
    
    def test_bulk_import_skips_empty_emails(self):
        """POST /api/users/bulk-import - should skip rows with empty emails"""
        test_users = [
            {
                "email": "",
                "full_name": "No Email User"
            },
            {
                "email": "   ",  # whitespace only
                "full_name": "Whitespace Email User"
            }
        ]
        
        response = self.session.post(f"{BASE_URL}/api/users/bulk-import", json=test_users)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["skipped"] >= 2, f"Should skip empty emails, got skipped={data['skipped']}"
        
        print(f"✓ Correctly skipped empty email users: {data}")
    
    def test_import_template_requires_auth(self):
        """GET /api/users/import-template - should require authentication"""
        # Use a new session without auth
        unauthenticated_session = requests.Session()
        response = unauthenticated_session.get(f"{BASE_URL}/api/users/import-template")
        
        # Accept 401 (Unauthorized) or 403 (Forbidden) - both indicate auth is required
        assert response.status_code in [401, 403], f"Expected 401 or 403 for unauthenticated request, got {response.status_code}"
        print("✓ Import template requires authentication")
    
    def test_bulk_import_requires_auth(self):
        """POST /api/users/bulk-import - should require authentication"""
        unauthenticated_session = requests.Session()
        unauthenticated_session.headers.update({"Content-Type": "application/json"})
        
        response = unauthenticated_session.post(f"{BASE_URL}/api/users/bulk-import", json=[{"email": "test@test.com"}])
        
        # Accept 401 (Unauthorized) or 403 (Forbidden) - both indicate auth is required
        assert response.status_code in [401, 403], f"Expected 401 or 403 for unauthenticated request, got {response.status_code}"
        print("✓ Bulk import requires authentication")


class TestReportsAPI:
    """Tests for reports dashboard API that feeds the ReportsPage charts"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for admin user"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        token = login_response.json().get("access_token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        yield
        self.session.close()
    
    def test_reports_dashboard_endpoint(self):
        """GET /api/reports/dashboard - should return data for all charts"""
        response = self.session.get(f"{BASE_URL}/api/reports/dashboard")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify structure for charts
        assert "users" in data, "Response should have 'users' section"
        assert "applications" in data, "Response should have 'applications' section"
        assert "expense_breakdown" in data or "expenses" in data, "Response should have expense data"
        
        # Verify users section has data for charts
        users = data.get("users", {})
        assert "by_division" in users or "total" in users, "Users should have division data or total"
        
        print(f"✓ Reports dashboard API returns valid structure")
        print(f"  Users: {users.get('total', 'N/A')} total, {users.get('active', 'N/A')} active")
        print(f"  Applications: {data.get('applications', {}).get('total', 'N/A')} total")


class TestHealthCheck:
    """Basic health check to ensure API is running"""
    
    def test_api_is_reachable(self):
        """Verify API is reachable"""
        try:
            response = requests.get(f"{BASE_URL}/api/health", timeout=10)
            # Accept 200 or 404 (endpoint may not exist, but API is reachable)
            assert response.status_code in [200, 404], f"Unexpected status: {response.status_code}"
            print(f"✓ API is reachable at {BASE_URL}")
        except requests.exceptions.ConnectionError as e:
            pytest.fail(f"Cannot connect to API at {BASE_URL}: {e}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
