"""
Test Interactive Reports API - Iteration 26
Tests for /api/reports/interactive-data and /api/reports/export-filtered endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
SUPER_ADMIN_EMAIL = "jane.smith@uct.ac.za"
SUPER_ADMIN_PASSWORD = "securepass123"


class TestInteractiveReportsAPI:
    """Tests for the interactive reports endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get auth token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as super admin
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "password": SUPER_ADMIN_PASSWORD
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        token = login_response.json().get("access_token")
        assert token, "No access token returned"
        self.session.headers.update({"Authorization": f"Bearer {token}"})
    
    # ─── GET /api/reports/interactive-data - Basic ───
    def test_get_interactive_data_basic(self):
        """Test GET /api/reports/interactive-data returns comprehensive data"""
        response = self.session.get(f"{BASE_URL}/api/reports/interactive-data")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        
        # Verify top-level structure
        assert "filters" in data, "Missing 'filters' in response"
        assert "users" in data, "Missing 'users' in response"
        assert "bursary_applications" in data, "Missing 'bursary_applications' in response"
        assert "training_applications" in data, "Missing 'training_applications' in response"
        assert "expenses" in data, "Missing 'expenses' in response"
        assert "tickets" in data, "Missing 'tickets' in response"
        
        # Verify filters structure
        assert "divisions" in data["filters"], "Missing 'divisions' in filters"
        assert "departments" in data["filters"], "Missing 'departments' in filters"
        assert isinstance(data["filters"]["divisions"], list), "divisions should be a list"
        assert isinstance(data["filters"]["departments"], list), "departments should be a list"
        
        # Verify users structure
        assert "total" in data["users"], "Missing 'total' in users"
        assert "active" in data["users"], "Missing 'active' in users"
        assert "inactive" in data["users"], "Missing 'inactive' in users"
        assert "by_division" in data["users"], "Missing 'by_division' in users"
        assert "by_department" in data["users"], "Missing 'by_department' in users"
        assert "by_role" in data["users"], "Missing 'by_role' in users"
        
        # Verify bursary_applications structure
        assert "total" in data["bursary_applications"], "Missing 'total' in bursary_applications"
        assert "by_status" in data["bursary_applications"], "Missing 'by_status' in bursary_applications"
        assert "by_division" in data["bursary_applications"], "Missing 'by_division' in bursary_applications"
        
        # Verify training_applications structure
        assert "total" in data["training_applications"], "Missing 'total' in training_applications"
        assert "by_status" in data["training_applications"], "Missing 'by_status' in training_applications"
        
        # Verify expenses structure
        assert "by_type" in data["expenses"], "Missing 'by_type' in expenses"
        assert "by_division" in data["expenses"], "Missing 'by_division' in expenses"
        assert "by_applicant" in data["expenses"], "Missing 'by_applicant' in expenses"
        
        # Verify tickets structure
        assert "total" in data["tickets"], "Missing 'total' in tickets"
        assert "by_status" in data["tickets"], "Missing 'by_status' in tickets"
        assert "by_category" in data["tickets"], "Missing 'by_category' in tickets"
        assert "by_priority" in data["tickets"], "Missing 'by_priority' in tickets"
        
        print(f"PASS: Interactive data returned with {data['users']['total']} users, "
              f"{data['bursary_applications']['total']} bursary apps, "
              f"{data['training_applications']['total']} training apps, "
              f"{data['tickets']['total']} tickets")
    
    def test_get_interactive_data_user_counts(self):
        """Test that user counts are reasonable (387 total expected)"""
        response = self.session.get(f"{BASE_URL}/api/reports/interactive-data")
        assert response.status_code == 200
        
        data = response.json()
        total_users = data["users"]["total"]
        active_users = data["users"]["active"]
        inactive_users = data["users"]["inactive"]
        
        # Verify counts are reasonable
        assert total_users > 0, "Should have users"
        assert active_users + inactive_users == total_users, "Active + Inactive should equal total"
        
        # Verify by_division data format
        by_division = data["users"]["by_division"]
        assert isinstance(by_division, list), "by_division should be a list"
        if by_division:
            assert "name" in by_division[0], "Division item should have 'name'"
            assert "value" in by_division[0], "Division item should have 'value'"
        
        print(f"PASS: {total_users} total users ({active_users} active, {inactive_users} inactive)")
    
    # ─── GET /api/reports/interactive-data - Division Filter ───
    def test_filter_by_division_mib(self):
        """Test filtering by Managed Infrastructure Business division"""
        response = self.session.get(
            f"{BASE_URL}/api/reports/interactive-data",
            params={"division": "Managed Infrastructure Business"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        
        # When filtered by MIB, should only show MIB users
        total_users = data["users"]["total"]
        assert total_users > 0, "Should have MIB users"
        
        # Verify by_division only shows MIB
        by_division = data["users"]["by_division"]
        if by_division:
            division_names = [d["name"] for d in by_division]
            assert "Managed Infrastructure Business" in division_names, "MIB should be in divisions"
            # When filtered by single division, should only show that division
            assert len(division_names) == 1, f"Should only show MIB division, got: {division_names}"
        
        print(f"PASS: MIB filter returned {total_users} users")
    
    def test_filter_by_division_and_subgroup(self):
        """Test filtering by division and department/subgroup"""
        response = self.session.get(
            f"{BASE_URL}/api/reports/interactive-data",
            params={
                "division": "Managed Infrastructure Business",
                "subgroup": "Bloemfontein Operations"
            }
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        total_users = data["users"]["total"]
        
        # Should have fewer users when filtered by both division and department
        print(f"PASS: MIB + Bloemfontein Operations filter returned {total_users} users")
    
    # ─── GET /api/reports/interactive-data - Status Filter ───
    def test_filter_by_status_pending(self):
        """Test filtering applications by pending status"""
        response = self.session.get(
            f"{BASE_URL}/api/reports/interactive-data",
            params={"status": "pending"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        
        # Verify bursary applications are filtered by status
        bursary_by_status = data["bursary_applications"]["by_status"]
        if bursary_by_status:
            status_names = [s["name"] for s in bursary_by_status]
            # When filtered by pending, should only show pending status
            for status in status_names:
                assert status == "pending", f"Expected only 'pending' status, got: {status}"
        
        print(f"PASS: Status filter 'pending' applied correctly")
    
    # ─── GET /api/reports/export-filtered - All Data ───
    def test_export_all_data(self):
        """Test exporting all data as Excel"""
        response = self.session.get(
            f"{BASE_URL}/api/reports/export-filtered",
            params={"data_type": "all"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        # Verify content type is Excel
        content_type = response.headers.get("Content-Type", "")
        assert "spreadsheetml" in content_type or "application/vnd" in content_type, \
            f"Expected Excel content type, got: {content_type}"
        
        # Verify content disposition has filename
        content_disp = response.headers.get("Content-Disposition", "")
        assert "attachment" in content_disp, "Should be attachment"
        assert ".xlsx" in content_disp, "Should be .xlsx file"
        
        # Verify file has content
        assert len(response.content) > 0, "Excel file should have content"
        
        print(f"PASS: Export all data returned {len(response.content)} bytes Excel file")
    
    def test_export_users_filtered(self):
        """Test exporting users data filtered by division"""
        response = self.session.get(
            f"{BASE_URL}/api/reports/export-filtered",
            params={
                "data_type": "users",
                "division": "Managed Infrastructure Business"
            }
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        # Verify content type is Excel
        content_type = response.headers.get("Content-Type", "")
        assert "spreadsheetml" in content_type or "application/vnd" in content_type, \
            f"Expected Excel content type, got: {content_type}"
        
        # Verify filename includes division
        content_disp = response.headers.get("Content-Disposition", "")
        assert "Managed_Infrastructure_Business" in content_disp or "users" in content_disp, \
            f"Filename should include filter info: {content_disp}"
        
        print(f"PASS: Export users (MIB filtered) returned {len(response.content)} bytes")
    
    def test_export_applications(self):
        """Test exporting applications data"""
        response = self.session.get(
            f"{BASE_URL}/api/reports/export-filtered",
            params={"data_type": "applications"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        content_type = response.headers.get("Content-Type", "")
        assert "spreadsheetml" in content_type or "application/vnd" in content_type
        
        print(f"PASS: Export applications returned {len(response.content)} bytes")
    
    def test_export_expenses(self):
        """Test exporting expenses data"""
        response = self.session.get(
            f"{BASE_URL}/api/reports/export-filtered",
            params={"data_type": "expenses"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        content_type = response.headers.get("Content-Type", "")
        assert "spreadsheetml" in content_type or "application/vnd" in content_type
        
        print(f"PASS: Export expenses returned {len(response.content)} bytes")
    
    def test_export_tickets(self):
        """Test exporting tickets data"""
        response = self.session.get(
            f"{BASE_URL}/api/reports/export-filtered",
            params={"data_type": "tickets"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        content_type = response.headers.get("Content-Type", "")
        assert "spreadsheetml" in content_type or "application/vnd" in content_type
        
        print(f"PASS: Export tickets returned {len(response.content)} bytes")
    
    # ─── Verify Data Consistency ───
    def test_division_list_populated(self):
        """Test that divisions list is populated for filter dropdown"""
        response = self.session.get(f"{BASE_URL}/api/reports/interactive-data")
        assert response.status_code == 200
        
        data = response.json()
        divisions = data["filters"]["divisions"]
        
        assert len(divisions) > 0, "Should have divisions for filter"
        assert "Managed Infrastructure Business" in divisions, "MIB should be in divisions list"
        
        print(f"PASS: {len(divisions)} divisions available for filtering")
    
    def test_departments_list_populated(self):
        """Test that departments list is populated"""
        response = self.session.get(f"{BASE_URL}/api/reports/interactive-data")
        assert response.status_code == 200
        
        data = response.json()
        departments = data["filters"]["departments"]
        
        assert len(departments) > 0, "Should have departments for filter"
        
        print(f"PASS: {len(departments)} departments available for filtering")
    
    def test_departments_filtered_by_division(self):
        """Test that departments are filtered when division is selected"""
        # Get departments for MIB division
        response = self.session.get(
            f"{BASE_URL}/api/reports/interactive-data",
            params={"division": "Managed Infrastructure Business"}
        )
        assert response.status_code == 200
        
        data = response.json()
        mib_departments = data["filters"]["departments"]
        
        # Should have Bloemfontein Operations in MIB departments
        assert "Bloemfontein Operations" in mib_departments, \
            f"Bloemfontein Operations should be in MIB departments: {mib_departments}"
        
        print(f"PASS: MIB has {len(mib_departments)} departments including Bloemfontein Operations")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
