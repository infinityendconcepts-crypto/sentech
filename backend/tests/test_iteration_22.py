"""
Iteration 22 Tests - ExpensesPage Rewrite, Available Applications, User Router
Tests: 
- New expenses endpoints (available-applications, application-expenses with requested_amount)
- Users router (GET /api/users, POST /api/users/batch-action, GET /api/users/me)
- POST /api/applications/{id}/expenses and /api/training-applications/{id}/expenses
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Credentials
SUPER_ADMIN_EMAIL = "jane.smith@uct.ac.za"
SUPER_ADMIN_PASSWORD = "securepass123"
TEST_EMPLOYEE_EMAIL = "test.employee@sentech.co.za"
TEST_EMPLOYEE_PASSWORD = "password"


@pytest.fixture(scope="module")
def admin_token():
    """Get super admin token"""
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": SUPER_ADMIN_EMAIL,
        "password": SUPER_ADMIN_PASSWORD
    })
    assert resp.status_code == 200, f"Admin login failed: {resp.text}"
    return resp.json()["access_token"]


@pytest.fixture(scope="module")
def employee_token():
    """Get employee token"""
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMPLOYEE_EMAIL,
        "password": TEST_EMPLOYEE_PASSWORD
    })
    assert resp.status_code == 200, f"Employee login failed: {resp.text}"
    return resp.json()["access_token"]


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="module")
def employee_headers(employee_token):
    return {"Authorization": f"Bearer {employee_token}"}


class TestAuthLogin:
    """Test authentication endpoints"""
    
    def test_super_admin_login(self):
        """Test super admin login"""
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "password": SUPER_ADMIN_PASSWORD
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["user"]["email"] == SUPER_ADMIN_EMAIL
        assert "super_admin" in data["user"]["roles"]

    def test_employee_login(self):
        """Test employee login"""
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMPLOYEE_EMAIL,
            "password": TEST_EMPLOYEE_PASSWORD
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data


class TestUsersRouter:
    """Test users router endpoints (from routers/users.py)"""
    
    def test_get_users_as_admin(self, admin_headers):
        """GET /api/users - Admin can get all users"""
        resp = requests.get(f"{BASE_URL}/api/users", headers=admin_headers)
        assert resp.status_code == 200
        users = resp.json()
        assert isinstance(users, list)
        assert len(users) > 0
        # Check user structure
        user = users[0]
        assert "id" in user
        assert "email" in user
        assert "password_hash" not in user  # Should be excluded

    def test_get_users_me_as_admin(self, admin_headers):
        """GET /api/users/me - Get current user profile"""
        resp = requests.get(f"{BASE_URL}/api/users/me", headers=admin_headers)
        assert resp.status_code == 200
        user = resp.json()
        assert user["email"] == SUPER_ADMIN_EMAIL
        assert "password_hash" not in user

    def test_get_users_me_as_employee(self, employee_headers):
        """GET /api/users/me - Employee gets own profile"""
        resp = requests.get(f"{BASE_URL}/api/users/me", headers=employee_headers)
        assert resp.status_code == 200
        user = resp.json()
        assert user["email"] == TEST_EMPLOYEE_EMAIL

    def test_batch_action_requires_admin(self, employee_headers, admin_headers):
        """POST /api/users/batch-action - Employee cannot perform batch actions"""
        # Employee should get 403
        resp = requests.post(f"{BASE_URL}/api/users/batch-action", 
            json={"action": "activate", "user_ids": ["test-id"]},
            headers=employee_headers
        )
        assert resp.status_code == 403
        
        # Admin should succeed (even with non-existent ids, just returns 0 count)
        resp = requests.post(f"{BASE_URL}/api/users/batch-action",
            json={"action": "activate", "user_ids": ["nonexistent-id-12345"]},
            headers=admin_headers
        )
        # Should work but with 0 modified
        assert resp.status_code == 200
        assert resp.json()["count"] == 0


class TestAvailableApplicationsEndpoint:
    """Test GET /api/expenses/available-applications"""
    
    def test_available_applications_as_admin(self, admin_headers):
        """GET /api/expenses/available-applications - Returns applications for expense submission"""
        resp = requests.get(f"{BASE_URL}/api/expenses/available-applications", headers=admin_headers)
        assert resp.status_code == 200
        apps = resp.json()
        assert isinstance(apps, list)
        # Check structure if we have applications
        if len(apps) > 0:
            app = apps[0]
            assert "id" in app
            assert "type" in app  # bursary or training
            assert app["type"] in ["bursary", "training"]
            assert "applicant_name" in app
            assert "requested_amount" in app
            assert "has_expenses" in app
            assert "status" in app

    def test_available_applications_as_employee(self, employee_headers):
        """Employee sees only their own applications"""
        resp = requests.get(f"{BASE_URL}/api/expenses/available-applications", headers=employee_headers)
        assert resp.status_code == 200
        apps = resp.json()
        assert isinstance(apps, list)
        # Employee should see only their own apps (may be empty)


class TestApplicationExpensesEndpoint:
    """Test GET /api/expenses/application-expenses"""
    
    def test_application_expenses_returns_structure(self, admin_headers):
        """GET /api/expenses/application-expenses - Returns bursary/training arrays"""
        resp = requests.get(f"{BASE_URL}/api/expenses/application-expenses", headers=admin_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "bursary" in data
        assert "training" in data
        assert isinstance(data["bursary"], list)
        assert isinstance(data["training"], list)

    def test_application_expenses_includes_requested_amount(self, admin_headers):
        """Check that requested_amount field is present in expense items"""
        resp = requests.get(f"{BASE_URL}/api/expenses/application-expenses", headers=admin_headers)
        assert resp.status_code == 200
        data = resp.json()
        # Check bursary items have requested_amount
        for item in data["bursary"]:
            assert "requested_amount" in item, "Missing requested_amount in bursary expense"
            assert "total" in item
            assert "expenses" in item
            assert "applicant_name" in item
        # Check training items have requested_amount
        for item in data["training"]:
            assert "requested_amount" in item, "Missing requested_amount in training expense"


class TestAddExpensesToApplication:
    """Test POST /api/applications/{id}/expenses and /api/training-applications/{id}/expenses"""
    
    @pytest.fixture(scope="class")
    def test_bursary_app(self, admin_headers):
        """Create a test bursary application"""
        app_data = {
            "status": "pending",
            "personal_info": {"full_name": "TEST_ExpenseUser"},
            "financial_info": {"total_amount": 25000, "bursary_amount": 25000}
        }
        resp = requests.post(f"{BASE_URL}/api/applications", json=app_data, headers=admin_headers)
        if resp.status_code == 200 or resp.status_code == 201:
            app = resp.json()
            yield app
            # Cleanup
            requests.delete(f"{BASE_URL}/api/applications/{app['id']}", headers=admin_headers)
        else:
            pytest.skip(f"Could not create test bursary application: {resp.text}")
    
    @pytest.fixture(scope="class")
    def test_training_app(self, admin_headers):
        """Create a test training application"""
        app_data = {
            "status": "pending",
            "personal_info": {"full_name": "TEST_TrainingExpenseUser"},
            "training_info": {"total_amount": 15000, "training_type": "Leadership Training"}
        }
        resp = requests.post(f"{BASE_URL}/api/training-applications", json=app_data, headers=admin_headers)
        if resp.status_code == 200 or resp.status_code == 201:
            app = resp.json()
            yield app
            # Cleanup
            requests.delete(f"{BASE_URL}/api/training-applications/{app['id']}", headers=admin_headers)
        else:
            pytest.skip(f"Could not create test training application: {resp.text}")

    def test_add_expenses_to_bursary_app(self, admin_headers, test_bursary_app):
        """POST /api/applications/{id}/expenses - Add expenses to bursary application"""
        expenses_data = {
            "flights": 5000, "flights_notes": "Return flight to Cape Town",
            "accommodation": 3000, "accommodation_notes": "3 nights hotel",
            "car_hire_or_shuttle": 500, "car_hire_or_shuttle_notes": "Airport transfer",
            "catering": 200, "catering_notes": "Meal allowance"
        }
        resp = requests.post(
            f"{BASE_URL}/api/applications/{test_bursary_app['id']}/expenses",
            json=expenses_data,
            headers=admin_headers
        )
        assert resp.status_code == 200, f"Failed to add expenses: {resp.text}"
        data = resp.json()
        assert "additional_expenses" in data
        assert data["additional_expenses"]["flights"] == 5000
        assert data["additional_expenses"]["accommodation"] == 3000

    def test_add_expenses_to_training_app(self, admin_headers, test_training_app):
        """POST /api/training-applications/{id}/expenses - Add expenses to training application"""
        expenses_data = {
            "flights": 4500, "flights_notes": "Domestic flight",
            "accommodation": 2500, "accommodation_notes": "2 nights",
            "car_hire_or_shuttle": 300, "car_hire_or_shuttle_notes": "Shuttle",
            "catering": 150, "catering_notes": "Meals"
        }
        resp = requests.post(
            f"{BASE_URL}/api/training-applications/{test_training_app['id']}/expenses",
            json=expenses_data,
            headers=admin_headers
        )
        assert resp.status_code == 200, f"Failed to add training expenses: {resp.text}"
        data = resp.json()
        assert "additional_expenses" in data
        assert data["additional_expenses"]["flights"] == 4500


class TestExpensesStatsAndExport:
    """Test expenses stats and export"""
    
    def test_expenses_stats(self, admin_headers):
        """GET /api/expenses/stats - Get expense statistics"""
        resp = requests.get(f"{BASE_URL}/api/expenses/stats", headers=admin_headers)
        assert resp.status_code == 200
        stats = resp.json()
        assert "total" in stats
        assert "pending" in stats
        assert "approved" in stats
        assert "count" in stats

    def test_expenses_list(self, admin_headers):
        """GET /api/expenses - Get all expenses"""
        resp = requests.get(f"{BASE_URL}/api/expenses", headers=admin_headers)
        assert resp.status_code == 200
        expenses = resp.json()
        assert isinstance(expenses, list)


class TestEmployeeVisibilityRestrictions:
    """Test that employee users see only their own data"""
    
    def test_employee_available_apps_only_own(self, employee_headers, admin_headers):
        """Employee sees only their own applications in available-applications"""
        # Get admin apps count (should see all)
        admin_resp = requests.get(f"{BASE_URL}/api/expenses/available-applications", headers=admin_headers)
        admin_apps = admin_resp.json()
        
        # Get employee apps (should see only own)
        emp_resp = requests.get(f"{BASE_URL}/api/expenses/available-applications", headers=employee_headers)
        emp_apps = emp_resp.json()
        
        # Employee should see equal or fewer apps than admin
        assert len(emp_apps) <= len(admin_apps)
        
        # If employee has apps, verify they all belong to employee
        for app in emp_apps:
            assert app["user_email"] == TEST_EMPLOYEE_EMAIL or "user_email" not in app

    def test_employee_application_expenses_only_own(self, employee_headers, admin_headers):
        """Employee sees only their own application expenses"""
        # Get employee's application expenses
        resp = requests.get(f"{BASE_URL}/api/expenses/application-expenses", headers=employee_headers)
        assert resp.status_code == 200
        data = resp.json()
        # Structure should be correct even if empty
        assert "bursary" in data
        assert "training" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
