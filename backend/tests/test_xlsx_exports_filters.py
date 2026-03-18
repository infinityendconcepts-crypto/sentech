"""
Tests for iteration 19: XLSX exports and date range filters
- User import template now XLSX (not CSV)
- Expenses export/excel with filters
- Expenses list with date range filtering  
- Reports export endpoints with date filters
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestAuthentication:
    """Login to get auth token for subsequent tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "jane.smith@uct.ac.za",
            "password": "securepass123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        return data["access_token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}"}


class TestUserImportTemplate(TestAuthentication):
    """Test /api/users/import-template returns XLSX file"""
    
    def test_import_template_returns_xlsx(self, auth_headers):
        """Import template should return XLSX (not CSV)"""
        response = requests.get(
            f"{BASE_URL}/api/users/import-template",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Check content type is XLSX
        content_type = response.headers.get("content-type", "")
        assert "spreadsheetml" in content_type.lower() or "xlsx" in content_type.lower(), \
            f"Expected XLSX content type, got: {content_type}"
        
        # Check content disposition has xlsx filename
        content_disp = response.headers.get("content-disposition", "")
        assert ".xlsx" in content_disp, f"Expected .xlsx in filename, got: {content_disp}"
        
        # Check file starts with XLSX magic bytes (PK zip format)
        content = response.content
        assert len(content) > 100, "File too small to be valid XLSX"
        assert content[:4] == b'PK\x03\x04', "File does not have XLSX/ZIP magic bytes"
        
        print(f"PASS: Import template returns XLSX ({len(content)} bytes)")
    
    def test_import_template_requires_auth(self):
        """Import template should require authentication"""
        response = requests.get(f"{BASE_URL}/api/users/import-template")
        assert response.status_code in [401, 403], \
            f"Expected 401/403 without auth, got {response.status_code}"
        print("PASS: Import template requires auth")


class TestExpensesExportExcel(TestAuthentication):
    """Test /api/expenses/export/excel endpoint"""
    
    def test_expenses_export_xlsx_basic(self, auth_headers):
        """Basic expenses export should return XLSX"""
        response = requests.get(
            f"{BASE_URL}/api/expenses/export/excel",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        content_type = response.headers.get("content-type", "")
        assert "spreadsheetml" in content_type.lower() or "xlsx" in content_type.lower(), \
            f"Expected XLSX content type, got: {content_type}"
        
        content = response.content
        assert len(content) > 0, "Empty response"
        print(f"PASS: Expenses export returns XLSX ({len(content)} bytes)")
    
    def test_expenses_export_with_status_filter(self, auth_headers):
        """Expenses export with status filter"""
        response = requests.get(
            f"{BASE_URL}/api/expenses/export/excel",
            params={"status": "pending"},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert len(response.content) > 0
        print("PASS: Expenses export with status filter works")
    
    def test_expenses_export_with_category_filter(self, auth_headers):
        """Expenses export with category filter"""
        response = requests.get(
            f"{BASE_URL}/api/expenses/export/excel",
            params={"category": "travel"},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: Expenses export with category filter works")
    
    def test_expenses_export_with_date_range(self, auth_headers):
        """Expenses export with date_from and date_to filters"""
        response = requests.get(
            f"{BASE_URL}/api/expenses/export/excel",
            params={"date_from": "2024-01-01", "date_to": "2025-12-31"},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: Expenses export with date range works")
    
    def test_expenses_export_bursary_tab(self, auth_headers):
        """Expenses export for bursary application tab"""
        response = requests.get(
            f"{BASE_URL}/api/expenses/export/excel",
            params={"tab": "bursary"},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: Bursary expenses export works")
    
    def test_expenses_export_training_tab(self, auth_headers):
        """Expenses export for training application tab"""
        response = requests.get(
            f"{BASE_URL}/api/expenses/export/excel",
            params={"tab": "training"},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: Training expenses export works")


class TestExpensesDateFiltering(TestAuthentication):
    """Test /api/expenses with date_from and date_to params"""
    
    def test_expenses_list_with_date_from(self, auth_headers):
        """Expenses list should accept date_from parameter"""
        response = requests.get(
            f"{BASE_URL}/api/expenses",
            params={"date_from": "2024-01-01"},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Expected list response"
        print(f"PASS: Expenses list with date_from returns {len(data)} items")
    
    def test_expenses_list_with_date_to(self, auth_headers):
        """Expenses list should accept date_to parameter"""
        response = requests.get(
            f"{BASE_URL}/api/expenses",
            params={"date_to": "2025-12-31"},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Expected list response"
        print(f"PASS: Expenses list with date_to returns {len(data)} items")
    
    def test_expenses_list_with_date_range(self, auth_headers):
        """Expenses list should filter by date range"""
        response = requests.get(
            f"{BASE_URL}/api/expenses",
            params={"date_from": "2024-01-01", "date_to": "2025-12-31"},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Expected list response"
        print(f"PASS: Expenses list with date range returns {len(data)} items")


class TestReportsExportXLSX(TestAuthentication):
    """Test /api/reports/export endpoints with XLSX format and date filters"""
    
    def test_applications_export_xlsx(self, auth_headers):
        """Applications report should export as XLSX"""
        response = requests.get(
            f"{BASE_URL}/api/reports/export/applications",
            params={"format": "excel"},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        content_type = response.headers.get("content-type", "")
        assert "spreadsheetml" in content_type.lower() or "xlsx" in content_type.lower(), \
            f"Expected XLSX content type, got: {content_type}"
        print("PASS: Applications report exports as XLSX")
    
    def test_applications_export_with_date_filter(self, auth_headers):
        """Applications export with date filter"""
        response = requests.get(
            f"{BASE_URL}/api/reports/export/applications",
            params={"format": "excel", "date_from": "2024-01-01", "date_to": "2025-12-31"},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: Applications export with date filter works")
    
    def test_training_applications_export_xlsx(self, auth_headers):
        """Training applications should export as XLSX"""
        response = requests.get(
            f"{BASE_URL}/api/reports/export/training_applications",
            params={"format": "excel"},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: Training applications export as XLSX")
    
    def test_users_export_xlsx(self, auth_headers):
        """Users report should export as XLSX"""
        response = requests.get(
            f"{BASE_URL}/api/reports/export/users",
            params={"format": "excel"},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: Users report exports as XLSX")
    
    def test_expenses_export_xlsx(self, auth_headers):
        """Expenses report should export as XLSX"""
        response = requests.get(
            f"{BASE_URL}/api/reports/export/expenses",
            params={"format": "excel"},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: Expenses report exports as XLSX")
    
    def test_tickets_export_xlsx(self, auth_headers):
        """Tickets report should export as XLSX"""
        response = requests.get(
            f"{BASE_URL}/api/reports/export/tickets",
            params={"format": "excel"},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: Tickets report exports as XLSX")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
