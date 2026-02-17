"""
Test suite for Tasks and Reports functionality
- Tests TasksPage backend APIs: GET, POST, PUT, DELETE tasks
- Tests Export functionality: Excel, PDF exports for tasks and reports
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL')
if not BASE_URL:
    raise ValueError("REACT_APP_BACKEND_URL environment variable not set")
BASE_URL = BASE_URL.rstrip('/')

# Test credentials from review request
TEST_EMAIL = "jane.smith@uct.ac.za"
TEST_PASSWORD = "securepass123"

class TestAuthentication:
    """Authentication tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        return data["access_token"]
    
    def test_login_success(self, auth_token):
        """Test login works with valid credentials"""
        assert auth_token is not None
        assert len(auth_token) > 0
        print(f"Login successful, token length: {len(auth_token)}")


class TestTasksAPI:
    """Test Tasks CRUD operations - TasksPage backend integration"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Login failed: {response.text}")
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Auth headers for requests"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_get_all_tasks(self, auth_headers):
        """GET /api/tasks - Get all tasks (TasksPage loads real backend data)"""
        response = requests.get(f"{BASE_URL}/api/tasks", headers=auth_headers)
        assert response.status_code == 200
        tasks = response.json()
        assert isinstance(tasks, list)
        print(f"Retrieved {len(tasks)} tasks from backend")
        return tasks
    
    def test_create_task(self, auth_headers):
        """POST /api/tasks - Create new task via Add Task modal"""
        task_data = {
            "title": "TEST_TasksPage_CreateTest",
            "description": "Test task created via Add Task modal",
            "status": "todo",
            "priority": "high",
            "assignee_name": "Test Assignee",
            "due_date": "2026-02-15T00:00:00Z",
            "project_name": "Test Project",
            "tags": ["urgent", "testing"]
        }
        response = requests.post(f"{BASE_URL}/api/tasks", json=task_data, headers=auth_headers)
        assert response.status_code == 200, f"Create task failed: {response.text}"
        created_task = response.json()
        assert created_task["title"] == task_data["title"]
        assert created_task["status"] == "todo"
        assert created_task["priority"] == "high"
        assert "id" in created_task
        print(f"Created task with id: {created_task['id']}")
        return created_task["id"]
    
    def test_create_task_and_verify_persistence(self, auth_headers):
        """Create task → GET verify it persists (Add Task modal save)"""
        # CREATE
        task_data = {
            "title": "TEST_Persistence_Check",
            "description": "Verify task persists after creation",
            "status": "in_progress",
            "priority": "medium",
            "assignee_name": "Jane Smith",
            "due_date": "2026-03-01T00:00:00Z",
            "tags": ["persistence"]
        }
        create_response = requests.post(f"{BASE_URL}/api/tasks", json=task_data, headers=auth_headers)
        assert create_response.status_code == 200
        created_task = create_response.json()
        task_id = created_task["id"]
        
        # GET to verify persistence
        get_response = requests.get(f"{BASE_URL}/api/tasks/{task_id}", headers=auth_headers)
        assert get_response.status_code == 200
        fetched_task = get_response.json()
        assert fetched_task["title"] == task_data["title"]
        assert fetched_task["status"] == "in_progress"
        assert fetched_task["priority"] == "medium"
        print(f"Task persistence verified for id: {task_id}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/tasks/{task_id}", headers=auth_headers)
    
    def test_update_task_status(self, auth_headers):
        """PUT /api/tasks/{id} - Update task status (dropdown status change)"""
        # First create a task
        task_data = {"title": "TEST_StatusChange", "status": "todo", "priority": "low"}
        create_resp = requests.post(f"{BASE_URL}/api/tasks", json=task_data, headers=auth_headers)
        assert create_resp.status_code == 200
        task_id = create_resp.json()["id"]
        
        # Update status to in_progress
        update_resp = requests.put(f"{BASE_URL}/api/tasks/{task_id}", 
                                   json={"status": "in_progress"}, headers=auth_headers)
        assert update_resp.status_code == 200
        
        # Verify status changed
        get_resp = requests.get(f"{BASE_URL}/api/tasks/{task_id}", headers=auth_headers)
        assert get_resp.status_code == 200
        assert get_resp.json()["status"] == "in_progress"
        
        # Update to completed
        update_resp2 = requests.put(f"{BASE_URL}/api/tasks/{task_id}", 
                                    json={"status": "completed"}, headers=auth_headers)
        assert update_resp2.status_code == 200
        
        # Verify completed
        get_resp2 = requests.get(f"{BASE_URL}/api/tasks/{task_id}", headers=auth_headers)
        assert get_resp2.json()["status"] == "completed"
        print(f"Status change verified: todo -> in_progress -> completed")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/tasks/{task_id}", headers=auth_headers)
    
    def test_delete_task(self, auth_headers):
        """DELETE /api/tasks/{id} - Delete task option"""
        # Create a task to delete
        task_data = {"title": "TEST_ToBeDeleted", "status": "todo", "priority": "low"}
        create_resp = requests.post(f"{BASE_URL}/api/tasks", json=task_data, headers=auth_headers)
        assert create_resp.status_code == 200
        task_id = create_resp.json()["id"]
        
        # Delete the task
        delete_resp = requests.delete(f"{BASE_URL}/api/tasks/{task_id}", headers=auth_headers)
        assert delete_resp.status_code == 200
        
        # Verify deleted (should 404)
        get_resp = requests.get(f"{BASE_URL}/api/tasks/{task_id}", headers=auth_headers)
        assert get_resp.status_code == 404
        print(f"Task deleted and verified: {task_id}")


class TestTasksExport:
    """Test Task Export functionality - Export dropdown on TasksPage"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Login failed: {response.text}")
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Auth headers for requests"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_export_tasks_excel(self, auth_headers):
        """GET /api/tasks/export/excel - Export tasks to Excel (TasksPage Export dropdown)"""
        response = requests.get(f"{BASE_URL}/api/tasks/export/excel", headers=auth_headers)
        assert response.status_code == 200, f"Excel export failed: {response.text}"
        
        # Check content type
        content_type = response.headers.get('Content-Type', '')
        assert 'spreadsheet' in content_type or 'octet-stream' in content_type, f"Unexpected content type: {content_type}"
        
        # Check we got binary data
        assert len(response.content) > 0
        print(f"Excel export successful, size: {len(response.content)} bytes")
    
    def test_export_tasks_pdf(self, auth_headers):
        """GET /api/tasks/export/pdf - Export tasks to PDF (TasksPage Export dropdown)"""
        response = requests.get(f"{BASE_URL}/api/tasks/export/pdf", headers=auth_headers)
        assert response.status_code == 200, f"PDF export failed: {response.text}"
        
        # Check content type
        content_type = response.headers.get('Content-Type', '')
        assert 'pdf' in content_type or 'octet-stream' in content_type, f"Unexpected content type: {content_type}"
        
        # Check we got binary data
        assert len(response.content) > 0
        # PDF files start with %PDF
        assert response.content[:4] == b'%PDF' or len(response.content) > 100
        print(f"PDF export successful, size: {len(response.content)} bytes")


class TestReportsAPI:
    """Test Reports functionality - ReportsPage backend integration"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Login failed: {response.text}")
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Auth headers for requests"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_get_dashboard_stats(self, auth_headers):
        """GET /api/reports/dashboard - ReportsPage loads stats"""
        response = requests.get(f"{BASE_URL}/api/reports/dashboard", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        # Should have various stats
        assert isinstance(data, dict)
        print(f"Dashboard stats retrieved with keys: {list(data.keys())}")
    
    def test_export_tasks_report_excel(self, auth_headers):
        """GET /api/reports/export/tasks?format=excel - ReportsPage Export Excel"""
        response = requests.get(f"{BASE_URL}/api/reports/export/tasks", 
                               params={"format": "excel"}, headers=auth_headers)
        assert response.status_code == 200, f"Export failed: {response.text}"
        assert len(response.content) > 0
        print(f"Tasks report Excel export: {len(response.content)} bytes")
    
    def test_export_tasks_report_pdf(self, auth_headers):
        """GET /api/reports/export/tasks?format=pdf - ReportsPage Export PDF"""
        response = requests.get(f"{BASE_URL}/api/reports/export/tasks", 
                               params={"format": "pdf"}, headers=auth_headers)
        assert response.status_code == 200, f"Export failed: {response.text}"
        assert len(response.content) > 0
        print(f"Tasks report PDF export: {len(response.content)} bytes")
    
    def test_export_tasks_report_csv(self, auth_headers):
        """GET /api/reports/export/tasks?format=csv - ReportsPage Export CSV"""
        response = requests.get(f"{BASE_URL}/api/reports/export/tasks", 
                               params={"format": "csv"}, headers=auth_headers)
        assert response.status_code == 200, f"Export failed: {response.text}"
        # CSV should be text
        content = response.text
        assert len(content) > 0
        print(f"Tasks report CSV export: {len(content)} chars")
    
    def test_export_applications_report(self, auth_headers):
        """GET /api/reports/export/applications - Export applications report"""
        response = requests.get(f"{BASE_URL}/api/reports/export/applications", 
                               params={"format": "json"}, headers=auth_headers)
        assert response.status_code == 200


class TestCleanup:
    """Cleanup test data after test run"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Login failed")
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_cleanup_test_tasks(self, auth_headers):
        """Remove any TEST_ prefixed tasks"""
        response = requests.get(f"{BASE_URL}/api/tasks", headers=auth_headers)
        if response.status_code == 200:
            tasks = response.json()
            test_tasks = [t for t in tasks if t.get("title", "").startswith("TEST_")]
            for task in test_tasks:
                requests.delete(f"{BASE_URL}/api/tasks/{task['id']}", headers=auth_headers)
            print(f"Cleaned up {len(test_tasks)} test tasks")
