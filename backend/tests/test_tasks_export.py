"""
Test suite for TasksPage new features:
- GET /api/tasks/export/excel - Export tasks to Excel
- GET /api/tasks/export/pdf - Export tasks to PDF
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "jane.smith@uct.ac.za"
TEST_PASSWORD = "securepass123"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for tests"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    if response.status_code != 200:
        pytest.skip(f"Authentication failed: {response.text}")
    return response.json().get("access_token")


@pytest.fixture
def authenticated_session(auth_token):
    """Session with auth header"""
    session = requests.Session()
    session.headers.update({
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    })
    return session


class TestTasksExportExcel:
    """Tests for Export to Excel endpoint"""

    def test_export_excel_returns_200(self, authenticated_session):
        """GET /api/tasks/export/excel should return 200"""
        response = authenticated_session.get(f"{BASE_URL}/api/tasks/export/excel")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"Excel export returned status {response.status_code}")

    def test_export_excel_content_type(self, authenticated_session):
        """Export Excel should return xlsx MIME type"""
        response = authenticated_session.get(f"{BASE_URL}/api/tasks/export/excel")
        content_type = response.headers.get("Content-Type", "")
        assert "spreadsheet" in content_type or "xlsx" in content_type, \
            f"Expected xlsx content type, got {content_type}"
        print(f"Excel export content type: {content_type}")

    def test_export_excel_has_content(self, authenticated_session):
        """Export Excel should return non-empty content"""
        response = authenticated_session.get(f"{BASE_URL}/api/tasks/export/excel")
        assert len(response.content) > 0, "Excel export content is empty"
        print(f"Excel export size: {len(response.content)} bytes")

    def test_export_excel_with_status_filter(self, authenticated_session):
        """Export Excel with status filter should return 200"""
        response = authenticated_session.get(
            f"{BASE_URL}/api/tasks/export/excel",
            params={"status": "todo"}
        )
        assert response.status_code == 200
        print(f"Excel export with status filter: {response.status_code}")

    def test_export_excel_with_priority_filter(self, authenticated_session):
        """Export Excel with priority filter should return 200"""
        response = authenticated_session.get(
            f"{BASE_URL}/api/tasks/export/excel",
            params={"priority": "high"}
        )
        assert response.status_code == 200
        print(f"Excel export with priority filter: {response.status_code}")

    def test_export_excel_with_date_range(self, authenticated_session):
        """Export Excel with date range filter should return 200"""
        response = authenticated_session.get(
            f"{BASE_URL}/api/tasks/export/excel",
            params={"date_from": "2026-01-01", "date_to": "2026-12-31"}
        )
        assert response.status_code == 200
        print(f"Excel export with date filter: {response.status_code}")

    def test_export_excel_unauthorized(self):
        """Export Excel without auth should return 401/403"""
        response = requests.get(f"{BASE_URL}/api/tasks/export/excel")
        assert response.status_code in [401, 403], \
            f"Expected 401/403, got {response.status_code}"
        print(f"Unauthorized Excel export: {response.status_code}")


class TestTasksExportPdf:
    """Tests for Export to PDF endpoint"""

    def test_export_pdf_returns_200(self, authenticated_session):
        """GET /api/tasks/export/pdf should return 200"""
        response = authenticated_session.get(f"{BASE_URL}/api/tasks/export/pdf")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"PDF export returned status {response.status_code}")

    def test_export_pdf_content_type(self, authenticated_session):
        """Export PDF should return pdf MIME type"""
        response = authenticated_session.get(f"{BASE_URL}/api/tasks/export/pdf")
        content_type = response.headers.get("Content-Type", "")
        assert "pdf" in content_type.lower(), f"Expected pdf content type, got {content_type}"
        print(f"PDF export content type: {content_type}")

    def test_export_pdf_has_content(self, authenticated_session):
        """Export PDF should return non-empty content"""
        response = authenticated_session.get(f"{BASE_URL}/api/tasks/export/pdf")
        assert len(response.content) > 0, "PDF export content is empty"
        print(f"PDF export size: {len(response.content)} bytes")

    def test_export_pdf_with_status_filter(self, authenticated_session):
        """Export PDF with status filter should return 200"""
        response = authenticated_session.get(
            f"{BASE_URL}/api/tasks/export/pdf",
            params={"status": "in_progress"}
        )
        assert response.status_code == 200
        print(f"PDF export with status filter: {response.status_code}")

    def test_export_pdf_with_priority_filter(self, authenticated_session):
        """Export PDF with priority filter should return 200"""
        response = authenticated_session.get(
            f"{BASE_URL}/api/tasks/export/pdf",
            params={"priority": "medium"}
        )
        assert response.status_code == 200
        print(f"PDF export with priority filter: {response.status_code}")

    def test_export_pdf_with_date_range(self, authenticated_session):
        """Export PDF with date range filter should return 200"""
        response = authenticated_session.get(
            f"{BASE_URL}/api/tasks/export/pdf",
            params={"date_from": "2026-02-01", "date_to": "2026-02-28"}
        )
        assert response.status_code == 200
        print(f"PDF export with date filter: {response.status_code}")

    def test_export_pdf_unauthorized(self):
        """Export PDF without auth should return 401/403"""
        response = requests.get(f"{BASE_URL}/api/tasks/export/pdf")
        assert response.status_code in [401, 403], \
            f"Expected 401/403, got {response.status_code}"
        print(f"Unauthorized PDF export: {response.status_code}")


class TestTasksCRUD:
    """Tests for basic tasks CRUD operations"""

    def test_get_tasks_returns_200(self, authenticated_session):
        """GET /api/tasks should return 200"""
        response = authenticated_session.get(f"{BASE_URL}/api/tasks")
        assert response.status_code == 200
        print(f"GET tasks: {response.status_code}")

    def test_get_tasks_with_status_filter(self, authenticated_session):
        """GET /api/tasks with status filter should return 200"""
        response = authenticated_session.get(
            f"{BASE_URL}/api/tasks",
            params={"status": "todo"}
        )
        assert response.status_code == 200
        print(f"GET tasks with status filter: {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
