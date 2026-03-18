"""
Test Suite for Application Expenses Feature
Tests:
1. Add expenses to bursary applications (POST /api/applications/{id}/expenses)
2. Add expenses to training applications (POST /api/training-applications/{id}/expenses)
3. Get aggregated application expenses (GET /api/expenses/application-expenses)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestApplicationExpenses:
    """Test application expenses feature"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup authentication"""
        # Login as super admin
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "jane.smith@uct.ac.za",
            "password": "securepass123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        self.token = data["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
    def test_01_get_bursary_applications(self):
        """Test GET /api/applications - list bursary applications"""
        response = requests.get(f"{BASE_URL}/api/applications", headers=self.headers)
        print(f"GET /api/applications status: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        apps = response.json()
        assert isinstance(apps, list), "Response should be a list"
        print(f"Found {len(apps)} bursary applications")
        
        # Check if any app has additional_expenses
        apps_with_expenses = [a for a in apps if a.get("additional_expenses")]
        print(f"Applications with expenses: {len(apps_with_expenses)}")
        
    def test_02_get_training_applications(self):
        """Test GET /api/training-applications - list training applications"""
        response = requests.get(f"{BASE_URL}/api/training-applications", headers=self.headers)
        print(f"GET /api/training-applications status: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        apps = response.json()
        assert isinstance(apps, list), "Response should be a list"
        print(f"Found {len(apps)} training applications")
        
        # Check if any app has additional_expenses
        apps_with_expenses = [a for a in apps if a.get("additional_expenses")]
        print(f"Training applications with expenses: {len(apps_with_expenses)}")

    def test_03_add_expenses_to_bursary_app(self):
        """Test POST /api/applications/{id}/expenses - add expenses to bursary application"""
        # First, get an existing non-draft application
        response = requests.get(f"{BASE_URL}/api/applications", headers=self.headers)
        assert response.status_code == 200
        apps = response.json()
        
        # Find a non-draft application
        non_draft = [a for a in apps if a.get("status") != "draft"]
        if not non_draft:
            pytest.skip("No non-draft bursary applications available")
            
        app_id = non_draft[0]["id"]
        print(f"Testing with bursary application: {app_id}")
        
        # Add expenses
        expenses_payload = {
            "flights": 3000,
            "flights_notes": "Round trip to Cape Town",
            "accommodation": 2000,
            "accommodation_notes": "3 nights hotel",
            "car_hire_or_shuttle": 500,
            "car_hire_or_shuttle_notes": "Airport shuttle",
            "catering": 300,
            "catering_notes": "Meals during training"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/applications/{app_id}/expenses",
            json=expenses_payload,
            headers=self.headers
        )
        print(f"POST expenses status: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
        assert response.status_code == 200, f"Failed to add expenses: {response.text}"
        data = response.json()
        assert "additional_expenses" in data or "message" in data
        
        # Verify expenses were saved - GET the application
        response = requests.get(f"{BASE_URL}/api/applications/{app_id}", headers=self.headers)
        assert response.status_code == 200
        app = response.json()
        assert "additional_expenses" in app, "Application should have additional_expenses"
        exp = app["additional_expenses"]
        assert exp.get("flights") == 3000
        assert exp.get("accommodation") == 2000
        print("Bursary application expenses saved and verified!")

    def test_04_add_expenses_to_training_app(self):
        """Test POST /api/training-applications/{id}/expenses - add expenses to training application"""
        # First, get an existing non-draft training application
        response = requests.get(f"{BASE_URL}/api/training-applications", headers=self.headers)
        assert response.status_code == 200
        apps = response.json()
        
        # Find a non-draft application
        non_draft = [a for a in apps if a.get("status") != "draft"]
        if not non_draft:
            pytest.skip("No non-draft training applications available")
            
        app_id = non_draft[0]["id"]
        print(f"Testing with training application: {app_id}")
        
        # Add expenses
        expenses_payload = {
            "flights": 1500,
            "flights_notes": "Domestic flight",
            "accommodation": 2500,
            "accommodation_notes": "5 nights accommodation",
            "car_hire_or_shuttle": 300,
            "car_hire_or_shuttle_notes": "Shuttle service",
            "catering": 200,
            "catering_notes": "Lunch allowance"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/training-applications/{app_id}/expenses",
            json=expenses_payload,
            headers=self.headers
        )
        print(f"POST training expenses status: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
        assert response.status_code == 200, f"Failed to add expenses: {response.text}"
        
        # Verify expenses were saved
        response = requests.get(f"{BASE_URL}/api/training-applications/{app_id}", headers=self.headers)
        assert response.status_code == 200
        app = response.json()
        assert "additional_expenses" in app, "Training application should have additional_expenses"
        exp = app["additional_expenses"]
        assert exp.get("flights") == 1500
        print("Training application expenses saved and verified!")

    def test_05_get_application_expenses_aggregation(self):
        """Test GET /api/expenses/application-expenses - aggregated expenses from all applications"""
        response = requests.get(f"{BASE_URL}/api/expenses/application-expenses", headers=self.headers)
        print(f"GET /api/expenses/application-expenses status: {response.status_code}")
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "bursary" in data, "Response should have 'bursary' key"
        assert "training" in data, "Response should have 'training' key"
        assert isinstance(data["bursary"], list), "Bursary should be a list"
        assert isinstance(data["training"], list), "Training should be a list"
        
        print(f"Bursary applications with expenses: {len(data['bursary'])}")
        print(f"Training applications with expenses: {len(data['training'])}")
        
        # Verify structure of expense entries
        if data["bursary"]:
            entry = data["bursary"][0]
            assert "application_id" in entry, "Entry should have application_id"
            assert "applicant_name" in entry, "Entry should have applicant_name"
            assert "expenses" in entry, "Entry should have expenses"
            assert "total" in entry, "Entry should have total"
            print(f"Sample bursary entry: {entry}")
            
        if data["training"]:
            entry = data["training"][0]
            assert "application_id" in entry, "Entry should have application_id"
            assert "applicant_name" in entry, "Entry should have applicant_name"
            assert "expenses" in entry, "Entry should have expenses"
            assert "total" in entry, "Entry should have total"
            print(f"Sample training entry: {entry}")

    def test_06_edit_existing_expenses(self):
        """Test editing/updating expenses on an application"""
        # Get an application with existing expenses
        response = requests.get(f"{BASE_URL}/api/applications", headers=self.headers)
        assert response.status_code == 200
        apps = response.json()
        
        apps_with_expenses = [a for a in apps if a.get("additional_expenses")]
        if not apps_with_expenses:
            pytest.skip("No applications with existing expenses")
            
        app = apps_with_expenses[0]
        app_id = app["id"]
        print(f"Editing expenses for application: {app_id}")
        
        # Update expenses with new values
        updated_expenses = {
            "flights": 5000,
            "flights_notes": "Updated: Long-haul flight",
            "accommodation": 3500,
            "accommodation_notes": "Updated: 5-star hotel",
            "car_hire_or_shuttle": 800,
            "car_hire_or_shuttle_notes": "Updated: Car rental",
            "catering": 600,
            "catering_notes": "Updated: Full board"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/applications/{app_id}/expenses",
            json=updated_expenses,
            headers=self.headers
        )
        assert response.status_code == 200
        
        # Verify update
        response = requests.get(f"{BASE_URL}/api/applications/{app_id}", headers=self.headers)
        assert response.status_code == 200
        app = response.json()
        exp = app.get("additional_expenses", {})
        assert exp.get("flights") == 5000, "Flights amount should be updated to 5000"
        assert exp.get("accommodation") == 3500, "Accommodation should be updated to 3500"
        print("Expenses updated successfully!")
        
    def test_07_expense_totals_calculation(self):
        """Test that expense totals are calculated correctly"""
        response = requests.get(f"{BASE_URL}/api/expenses/application-expenses", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify total calculation for each entry
        for entry in data.get("bursary", []):
            expenses = entry.get("expenses", {})
            calculated_total = (
                (expenses.get("flights") or 0) +
                (expenses.get("accommodation") or 0) +
                (expenses.get("car_hire_or_shuttle") or 0) +
                (expenses.get("catering") or 0)
            )
            assert entry["total"] == calculated_total, f"Total mismatch: expected {calculated_total}, got {entry['total']}"
            print(f"Bursary entry total verified: {entry['total']}")
            
        for entry in data.get("training", []):
            expenses = entry.get("expenses", {})
            calculated_total = (
                (expenses.get("flights") or 0) +
                (expenses.get("accommodation") or 0) +
                (expenses.get("car_hire_or_shuttle") or 0) +
                (expenses.get("catering") or 0)
            )
            assert entry["total"] == calculated_total, f"Total mismatch: expected {calculated_total}, got {entry['total']}"
            print(f"Training entry total verified: {entry['total']}")
        
        print("All expense totals verified!")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
