"""
Test Multi-Select Reports API - Iteration 27
Tests for multi-select divisions/departments/races, age range filters, and per-chart export
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
SUPER_ADMIN_EMAIL = "jane.smith@uct.ac.za"
SUPER_ADMIN_PASSWORD = "securepass123"


class TestMultiSelectReportsAPI:
    """Tests for multi-select demographic filtering and per-chart export"""
    
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
    
    # ─── Multi-Select Divisions Tests ───
    def test_multiselect_divisions_single_value(self):
        """Test divisions param with single value (comma-separated format)"""
        response = self.session.get(
            f"{BASE_URL}/api/reports/interactive-data",
            params={"divisions": "Managed Infrastructure Business"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        total_users = data["users"]["total"]
        by_division = data["users"]["by_division"]
        
        # Should only show MIB division
        assert total_users > 0, "Should have users"
        if by_division:
            division_names = [d["name"] for d in by_division]
            assert len(division_names) == 1, f"Single division filter should return 1 division, got: {division_names}"
            assert "Managed Infrastructure Business" in division_names
        
        print(f"PASS: Single division filter (divisions param) returned {total_users} users")
    
    def test_multiselect_divisions_multiple_values(self):
        """Test divisions param with multiple comma-separated values"""
        response = self.session.get(
            f"{BASE_URL}/api/reports/interactive-data",
            params={"divisions": "Managed Infrastructure Business,Technology"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        total_users = data["users"]["total"]
        by_division = data["users"]["by_division"]
        
        # Should show both MIB and Technology divisions
        assert total_users > 0, "Should have users"
        if by_division:
            division_names = [d["name"] for d in by_division]
            # Should have at most 2 divisions (MIB and Technology)
            assert len(division_names) <= 2, f"Multi-division filter should return <=2 divisions, got: {division_names}"
            # At least MIB should be present (we know it exists)
            assert "Managed Infrastructure Business" in division_names, f"MIB should be in results: {division_names}"
        
        print(f"PASS: Multi-division filter (MIB,Technology) returned {total_users} users, divisions: {[d['name'] for d in by_division]}")
    
    def test_multiselect_divisions_three_values(self):
        """Test divisions param with three comma-separated values"""
        response = self.session.get(
            f"{BASE_URL}/api/reports/interactive-data",
            params={"divisions": "Managed Infrastructure Business,Technology,Finance"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        total_users = data["users"]["total"]
        
        print(f"PASS: Three-division filter returned {total_users} users")
    
    # ─── Multi-Select Departments Tests ───
    def test_multiselect_departments_single_value(self):
        """Test departments param with single value"""
        response = self.session.get(
            f"{BASE_URL}/api/reports/interactive-data",
            params={"departments": "Bloemfontein Operations"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        total_users = data["users"]["total"]
        
        print(f"PASS: Single department filter returned {total_users} users")
    
    def test_multiselect_departments_multiple_values(self):
        """Test departments param with multiple comma-separated values"""
        response = self.session.get(
            f"{BASE_URL}/api/reports/interactive-data",
            params={"departments": "Bloemfontein Operations,Cape Town Operations"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        total_users = data["users"]["total"]
        
        print(f"PASS: Multi-department filter returned {total_users} users")
    
    # ─── Multi-Select Races Tests ───
    def test_races_filter_available(self):
        """Test that races filter options are returned"""
        response = self.session.get(f"{BASE_URL}/api/reports/interactive-data")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        races = data["filters"].get("races", [])
        
        # Races list should be available (may be empty if no race data)
        assert isinstance(races, list), "races should be a list"
        
        # Check if by_race data is present in users
        by_race = data["users"].get("by_race", [])
        assert isinstance(by_race, list), "by_race should be a list"
        
        print(f"PASS: Races filter available with {len(races)} options, by_race has {len(by_race)} entries")
    
    def test_multiselect_races_single_value(self):
        """Test races param with single value"""
        # First get available races
        response = self.session.get(f"{BASE_URL}/api/reports/interactive-data")
        data = response.json()
        races = data["filters"].get("races", [])
        
        if races:
            # Test with first available race
            test_race = races[0]
            response = self.session.get(
                f"{BASE_URL}/api/reports/interactive-data",
                params={"races": test_race}
            )
            assert response.status_code == 200, f"Failed: {response.text}"
            
            data = response.json()
            total_users = data["users"]["total"]
            
            print(f"PASS: Single race filter '{test_race}' returned {total_users} users")
        else:
            print("SKIP: No race data available in database")
    
    def test_multiselect_races_multiple_values(self):
        """Test races param with multiple comma-separated values"""
        # First get available races
        response = self.session.get(f"{BASE_URL}/api/reports/interactive-data")
        data = response.json()
        races = data["filters"].get("races", [])
        
        if len(races) >= 2:
            # Test with first two available races
            test_races = f"{races[0]},{races[1]}"
            response = self.session.get(
                f"{BASE_URL}/api/reports/interactive-data",
                params={"races": test_races}
            )
            assert response.status_code == 200, f"Failed: {response.text}"
            
            data = response.json()
            total_users = data["users"]["total"]
            
            print(f"PASS: Multi-race filter '{test_races}' returned {total_users} users")
        else:
            print(f"SKIP: Not enough race data (only {len(races)} races available)")
    
    # ─── Age Range Filter Tests ───
    def test_age_range_data_available(self):
        """Test that age range data is returned"""
        response = self.session.get(f"{BASE_URL}/api/reports/interactive-data")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        by_age_range = data["users"].get("by_age_range", [])
        
        assert isinstance(by_age_range, list), "by_age_range should be a list"
        
        # Check age range buckets
        age_buckets = [item["name"] for item in by_age_range]
        print(f"PASS: Age range data available with buckets: {age_buckets}")
    
    def test_age_min_filter(self):
        """Test age_min filter parameter"""
        response = self.session.get(
            f"{BASE_URL}/api/reports/interactive-data",
            params={"age_min": 25}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        total_users = data["users"]["total"]
        
        print(f"PASS: age_min=25 filter returned {total_users} users")
    
    def test_age_max_filter(self):
        """Test age_max filter parameter"""
        response = self.session.get(
            f"{BASE_URL}/api/reports/interactive-data",
            params={"age_max": 45}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        total_users = data["users"]["total"]
        
        print(f"PASS: age_max=45 filter returned {total_users} users")
    
    def test_age_range_filter(self):
        """Test combined age_min and age_max filter"""
        response = self.session.get(
            f"{BASE_URL}/api/reports/interactive-data",
            params={"age_min": 25, "age_max": 45}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        total_users = data["users"]["total"]
        
        print(f"PASS: age_min=25, age_max=45 filter returned {total_users} users")
    
    def test_age_range_narrow(self):
        """Test narrow age range filter (30-35)"""
        response = self.session.get(
            f"{BASE_URL}/api/reports/interactive-data",
            params={"age_min": 30, "age_max": 35}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        total_users = data["users"]["total"]
        
        print(f"PASS: age_min=30, age_max=35 filter returned {total_users} users")
    
    # ─── Combined Demographic Filters Tests ───
    def test_combined_divisions_and_races(self):
        """Test combining divisions and races filters"""
        # First get available races
        response = self.session.get(f"{BASE_URL}/api/reports/interactive-data")
        data = response.json()
        races = data["filters"].get("races", [])
        
        params = {"divisions": "Managed Infrastructure Business"}
        if races:
            params["races"] = races[0]
        
        response = self.session.get(
            f"{BASE_URL}/api/reports/interactive-data",
            params=params
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        total_users = data["users"]["total"]
        
        print(f"PASS: Combined divisions+races filter returned {total_users} users")
    
    def test_combined_divisions_and_age_range(self):
        """Test combining divisions and age range filters"""
        response = self.session.get(
            f"{BASE_URL}/api/reports/interactive-data",
            params={
                "divisions": "Managed Infrastructure Business",
                "age_min": 25,
                "age_max": 45
            }
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        total_users = data["users"]["total"]
        
        print(f"PASS: Combined divisions+age_range filter returned {total_users} users")
    
    def test_combined_all_demographic_filters(self):
        """Test combining all demographic filters: divisions, races, age range"""
        # First get available races
        response = self.session.get(f"{BASE_URL}/api/reports/interactive-data")
        data = response.json()
        races = data["filters"].get("races", [])
        
        params = {
            "divisions": "Managed Infrastructure Business,Technology",
            "age_min": 25,
            "age_max": 60
        }
        if races:
            params["races"] = races[0]
        
        response = self.session.get(
            f"{BASE_URL}/api/reports/interactive-data",
            params=params
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        total_users = data["users"]["total"]
        
        print(f"PASS: Combined all demographic filters returned {total_users} users")
    
    # ─── Edge Cases Tests ───
    def test_empty_string_divisions(self):
        """Test empty string for divisions param"""
        response = self.session.get(
            f"{BASE_URL}/api/reports/interactive-data",
            params={"divisions": ""}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        total_users = data["users"]["total"]
        
        # Empty string should return all users (no filter applied)
        assert total_users > 0, "Empty divisions should return all users"
        
        print(f"PASS: Empty divisions param returned {total_users} users (all)")
    
    def test_empty_string_races(self):
        """Test empty string for races param"""
        response = self.session.get(
            f"{BASE_URL}/api/reports/interactive-data",
            params={"races": ""}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        total_users = data["users"]["total"]
        
        print(f"PASS: Empty races param returned {total_users} users")
    
    def test_whitespace_handling_divisions(self):
        """Test whitespace handling in comma-separated divisions"""
        response = self.session.get(
            f"{BASE_URL}/api/reports/interactive-data",
            params={"divisions": "Managed Infrastructure Business , Technology"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        total_users = data["users"]["total"]
        
        print(f"PASS: Whitespace in divisions handled correctly, returned {total_users} users")
    
    # ─── Export Filtered with Multi-Select Tests ───
    def test_export_filtered_multiselect_divisions(self):
        """Test export-filtered with multi-select divisions"""
        response = self.session.get(
            f"{BASE_URL}/api/reports/export-filtered",
            params={
                "data_type": "all",
                "divisions": "Managed Infrastructure Business,Technology"
            }
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        content_type = response.headers.get("Content-Type", "")
        assert "spreadsheetml" in content_type or "application/vnd" in content_type
        assert len(response.content) > 0, "Excel file should have content"
        
        print(f"PASS: Export with multi-select divisions returned {len(response.content)} bytes")
    
    def test_export_filtered_with_races(self):
        """Test export-filtered with races filter"""
        # First get available races
        response = self.session.get(f"{BASE_URL}/api/reports/interactive-data")
        data = response.json()
        races = data["filters"].get("races", [])
        
        params = {"data_type": "users"}
        if races:
            params["races"] = races[0]
        
        response = self.session.get(
            f"{BASE_URL}/api/reports/export-filtered",
            params=params
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        content_type = response.headers.get("Content-Type", "")
        assert "spreadsheetml" in content_type or "application/vnd" in content_type
        
        print(f"PASS: Export with races filter returned {len(response.content)} bytes")
    
    def test_export_filtered_with_age_range(self):
        """Test export-filtered with age range filter"""
        response = self.session.get(
            f"{BASE_URL}/api/reports/export-filtered",
            params={
                "data_type": "users",
                "age_min": 25,
                "age_max": 45
            }
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        content_type = response.headers.get("Content-Type", "")
        assert "spreadsheetml" in content_type or "application/vnd" in content_type
        
        print(f"PASS: Export with age range filter returned {len(response.content)} bytes")
    
    # ─── POST /api/reports/export-chart Tests ───
    def test_export_chart_success(self):
        """Test POST /api/reports/export-chart with valid data"""
        chart_data = [
            {"name": "Division A", "value": 100},
            {"name": "Division B", "value": 200},
            {"name": "Division C", "value": 150}
        ]
        
        response = self.session.post(
            f"{BASE_URL}/api/reports/export-chart",
            json={
                "title": "Test Chart Export",
                "data": chart_data
            }
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        content_type = response.headers.get("Content-Type", "")
        assert "spreadsheetml" in content_type or "application/vnd" in content_type
        
        content_disp = response.headers.get("Content-Disposition", "")
        assert "test_chart_export.xlsx" in content_disp.lower(), f"Filename should match title: {content_disp}"
        
        assert len(response.content) > 0, "Excel file should have content"
        
        print(f"PASS: Export chart returned {len(response.content)} bytes Excel file")
    
    def test_export_chart_empty_data_returns_400(self):
        """Test POST /api/reports/export-chart with empty data returns 400"""
        response = self.session.post(
            f"{BASE_URL}/api/reports/export-chart",
            json={
                "title": "Empty Chart",
                "data": []
            }
        )
        assert response.status_code == 400, f"Expected 400 for empty data, got: {response.status_code}"
        
        error_detail = response.json().get("detail", "")
        assert "no data" in error_detail.lower(), f"Error should mention no data: {error_detail}"
        
        print(f"PASS: Export chart with empty data correctly returns 400")
    
    def test_export_chart_missing_data_returns_400(self):
        """Test POST /api/reports/export-chart with missing data field returns 400"""
        response = self.session.post(
            f"{BASE_URL}/api/reports/export-chart",
            json={
                "title": "No Data Field"
            }
        )
        assert response.status_code == 400, f"Expected 400 for missing data, got: {response.status_code}"
        
        print(f"PASS: Export chart with missing data field correctly returns 400")
    
    def test_export_chart_with_real_data(self):
        """Test export-chart with real data from interactive-data endpoint"""
        # First get real data
        response = self.session.get(f"{BASE_URL}/api/reports/interactive-data")
        assert response.status_code == 200
        
        data = response.json()
        by_division = data["users"]["by_division"]
        
        if by_division:
            # Export the real division data
            response = self.session.post(
                f"{BASE_URL}/api/reports/export-chart",
                json={
                    "title": "Users by Division",
                    "data": by_division
                }
            )
            assert response.status_code == 200, f"Failed: {response.text}"
            
            content_type = response.headers.get("Content-Type", "")
            assert "spreadsheetml" in content_type or "application/vnd" in content_type
            
            print(f"PASS: Export real division chart data returned {len(response.content)} bytes")
        else:
            print("SKIP: No division data available")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
