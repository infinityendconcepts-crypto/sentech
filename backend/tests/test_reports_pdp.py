"""Tests for gender filter (Unspecified) and PDP filters endpoints."""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://rbac-forms-dev.preview.emergentagent.com').rstrip('/')
ADMIN = {"email": "test.admin@sentech.co.za", "password": "password"}


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN, timeout=30)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    return r.json().get("token") or r.json().get("access_token")


@pytest.fixture(scope="module")
def headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# --- Reports gender filter ---
class TestGenderFilter:
    def test_reports_filters_include_unspecified(self, headers):
        r = requests.get(f"{BASE_URL}/api/reports/interactive-data", headers=headers, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        # /api/reports/filters may or may not exist; check interactive-data instead
        genders = data.get("filters", {}).get("genders", []) or data.get("genders", []) if r.status_code == 200 else []
        print("Genders returned:", genders)
        assert "Unspecified" in genders, f"'Unspecified' missing from genders: {genders}"

    def test_all_three_genders_returns_389(self, headers):
        r = requests.get(
            f"{BASE_URL}/api/reports/interactive-data",
            params={"genders": "Female,Male,Unspecified"},
            headers=headers, timeout=30,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        total = data.get("users", {}).get("total")
        print("Total (F+M+U):", total)
        assert total == 389, f"Expected 389 got {total}"

    def test_female_only(self, headers):
        r = requests.get(f"{BASE_URL}/api/reports/interactive-data",
                         params={"genders": "Female"}, headers=headers, timeout=30)
        assert r.status_code == 200
        total = r.json().get("users", {}).get("total")
        print("Total female:", total)
        assert total == 65, f"Expected 65 got {total}"

    def test_male_only(self, headers):
        r = requests.get(f"{BASE_URL}/api/reports/interactive-data",
                         params={"genders": "Male"}, headers=headers, timeout=30)
        assert r.status_code == 200
        total = r.json().get("users", {}).get("total")
        print("Total male:", total)
        assert total == 44, f"Expected 44 got {total}"

    def test_female_male_only(self, headers):
        r = requests.get(f"{BASE_URL}/api/reports/interactive-data",
                         params={"genders": "Female,Male"}, headers=headers, timeout=30)
        assert r.status_code == 200
        total = r.json().get("users", {}).get("total")
        print("Total F+M:", total)
        # Previously bug returned 106. Now should be 109 (65+44).
        assert total == 109, f"Expected 109 (65+44) got {total}"

    def test_unspecified_only(self, headers):
        r = requests.get(f"{BASE_URL}/api/reports/interactive-data",
                         params={"genders": "Unspecified"}, headers=headers, timeout=30)
        assert r.status_code == 200
        total = r.json().get("users", {}).get("total")
        print("Total Unspecified:", total)
        assert total == 280, f"Expected 280 got {total}"


# --- PDP filters ---
class TestPDPFilters:
    def test_pdp_filters_endpoint(self, headers):
        r = requests.get(f"{BASE_URL}/api/pdp/filters", headers=headers, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        print("PDP filters:", data)
        assert "divisions" in data
        assert "departments" in data
        assert isinstance(data["divisions"], list)
        assert isinstance(data["departments"], list)
        assert len(data["divisions"]) > 0, "Divisions list is empty"

    def test_pdp_list_with_filters(self, headers):
        # Get filter options
        r = requests.get(f"{BASE_URL}/api/pdp/filters", headers=headers, timeout=30)
        assert r.status_code == 200
        divisions = r.json().get("divisions", [])
        if not divisions:
            pytest.skip("No divisions to test with")
        div = divisions[0]
        r2 = requests.get(f"{BASE_URL}/api/pdp", params={"division": div}, headers=headers, timeout=30)
        assert r2.status_code == 200, r2.text
        print(f"PDP filtered by division={div}: {len(r2.json())} entries")
