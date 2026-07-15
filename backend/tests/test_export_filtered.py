"""Tests for /api/reports/export-filtered - verify row counts."""
import os
import io
import pytest
import requests
from openpyxl import load_workbook

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://rbac-forms-dev.preview.emergentagent.com").rstrip("/")
EMAIL = "jane.smith@uct.ac.za"
PASSWORD = "securepass123"


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": EMAIL, "password": PASSWORD}, timeout=30)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    return r.json().get("access_token") or r.json().get("token")


@pytest.fixture(scope="module")
def headers(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def total_users(headers):
    # Count all users to compare
    r = requests.get(f"{BASE_URL}/api/users?limit=10000", headers=headers, timeout=60)
    if r.status_code != 200:
        # try /api/admin/users
        r = requests.get(f"{BASE_URL}/api/admin/users?limit=10000", headers=headers, timeout=60)
    assert r.status_code == 200, f"users list failed {r.status_code} {r.text[:200]}"
    data = r.json()
    if isinstance(data, dict):
        users = data.get("users") or data.get("data") or data.get("items") or []
    else:
        users = data
    return len(users)


def _download(headers, params=None):
    r = requests.get(f"{BASE_URL}/api/reports/export-filtered", headers=headers, params=params or {}, timeout=120)
    assert r.status_code == 200, f"export failed: {r.status_code} {r.text[:400]}"
    wb = load_workbook(io.BytesIO(r.content))
    return wb


def _sd_row_count(wb):
    ws = wb["Skills Development"]
    # header row is row 2; data rows start row 3
    count = 0
    for row in ws.iter_rows(min_row=3, values_only=True):
        if any(v not in (None, "", 0) for v in row):
            count += 1
    return count


def test_sheets_present(headers):
    wb = _download(headers)
    assert "Skills Development" in wb.sheetnames
    assert "Overhead Costs" in wb.sheetnames


def test_unfiltered_returns_all_users(headers, total_users):
    wb = _download(headers)
    n = _sd_row_count(wb)
    print(f"Total users in DB: {total_users}, SD rows unfiltered: {n}")
    # Should be at least total_users (some may have multiple app rows)
    assert n >= total_users, f"Expected >= {total_users} rows, got {n}"
    # Must be significantly more than the old 7
    assert n >= 380, f"Expected roughly 389+ rows, got {n}"


def test_filter_gender_female(headers):
    wb = _download(headers, {"gender": "Female"})
    n = _sd_row_count(wb)
    print(f"Female rows: {n}")
    assert n == 65, f"Expected 65 female rows, got {n}"


def test_filter_gender_male(headers):
    wb = _download(headers, {"gender": "Male"})
    n = _sd_row_count(wb)
    print(f"Male rows: {n}")
    assert n == 44, f"Expected 44 male rows, got {n}"


def test_filter_app_type_training(headers, total_users):
    wb = _download(headers, {"app_type": "training"})
    n = _sd_row_count(wb)
    print(f"Training app_type rows: {n}")
    # All users included but only training data populated
    assert n >= total_users, f"Expected >= {total_users} rows, got {n}"
    # Ensure no bursary rows (col 2 "Digital / non digital" == "Bursary")
    ws = wb["Skills Development"]
    bursary_rows = 0
    for row in ws.iter_rows(min_row=3, values_only=True):
        if row[1] == "Bursary":
            bursary_rows += 1
    assert bursary_rows == 0, f"Found {bursary_rows} bursary rows when app_type=training"
