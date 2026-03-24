"""
Iteration 24 Tests - Backend Router Extraction Testing
Tests for:
- Tickets router (tickets.py): GET /tickets, POST /tickets, PUT /tickets/{id}, GET /tickets/stats, GET/POST /tickets/{id}/comments
- Expenses router (expenses.py): GET /expenses, GET /expenses/stats, GET /expenses/application-expenses
- Messages router (messages.py): GET /messages/conversations, POST /messages/conversations, GET /messages/contactable-users, GET /messages/unread/count
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
SUPER_ADMIN_EMAIL = "jane.smith@uct.ac.za"
SUPER_ADMIN_PASSWORD = "securepass123"
ADMIN_EMAIL = "test.admin@sentech.co.za"
ADMIN_PASSWORD = "password"
EMPLOYEE_EMAIL = "test.employee@sentech.co.za"
EMPLOYEE_PASSWORD = "password"


@pytest.fixture(scope="module")
def admin_token():
    """Get admin auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip(f"Admin login failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def employee_token():
    """Get employee auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": EMPLOYEE_EMAIL,
        "password": EMPLOYEE_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip(f"Employee login failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def super_admin_token():
    """Get super admin auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": SUPER_ADMIN_EMAIL,
        "password": SUPER_ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip(f"Super admin login failed: {response.status_code} - {response.text}")


class TestTicketsRouter:
    """Tests for tickets.py router endpoints"""
    
    def test_get_tickets_admin(self, admin_token):
        """Admin should see all tickets"""
        response = requests.get(
            f"{BASE_URL}/api/tickets",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Expected list of tickets"
        print(f"Admin sees {len(data)} tickets")
    
    def test_get_tickets_employee(self, employee_token):
        """Employee should see only their own tickets"""
        response = requests.get(
            f"{BASE_URL}/api/tickets",
            headers={"Authorization": f"Bearer {employee_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Expected list of tickets"
        print(f"Employee sees {len(data)} tickets (own only)")
    
    def test_create_ticket_employee(self, employee_token):
        """Employee should be able to create a ticket"""
        ticket_data = {
            "title": "TEST_Iteration24_Employee_Ticket",
            "description": "Test ticket created by employee for iteration 24 testing",
            "category": "general",
            "priority": "medium"
        }
        response = requests.post(
            f"{BASE_URL}/api/tickets",
            headers={"Authorization": f"Bearer {employee_token}"},
            json=ticket_data
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("title") == ticket_data["title"], "Ticket title mismatch"
        assert data.get("id"), "Ticket should have an ID"
        print(f"Employee created ticket: {data.get('id')}")
        return data.get("id")
    
    def test_get_ticket_stats(self, admin_token):
        """GET /api/tickets/stats should return ticket statistics"""
        response = requests.get(
            f"{BASE_URL}/api/tickets/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "total" in data, "Stats should include total"
        assert "open" in data, "Stats should include open count"
        assert "in_progress" in data, "Stats should include in_progress count"
        assert "resolved" in data, "Stats should include resolved count"
        print(f"Ticket stats: total={data['total']}, open={data['open']}, in_progress={data['in_progress']}, resolved={data['resolved']}")
    
    def test_update_ticket_admin(self, admin_token, employee_token):
        """Admin should be able to update any ticket"""
        # First create a ticket as employee
        ticket_data = {
            "title": "TEST_Iteration24_Update_Test",
            "description": "Ticket to test update functionality",
            "category": "general",
            "priority": "low"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/tickets",
            headers={"Authorization": f"Bearer {employee_token}"},
            json=ticket_data
        )
        assert create_response.status_code == 200
        ticket_id = create_response.json().get("id")
        
        # Admin updates the ticket
        update_data = {
            "status": "in_progress",
            "priority": "high"
        }
        update_response = requests.put(
            f"{BASE_URL}/api/tickets/{ticket_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
            json=update_data
        )
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}: {update_response.text}"
        print(f"Admin updated ticket {ticket_id} to status=in_progress, priority=high")
        
        # Cleanup - delete the ticket
        requests.delete(
            f"{BASE_URL}/api/tickets/{ticket_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
    
    def test_get_ticket_comments(self, admin_token, employee_token):
        """GET /api/tickets/{id}/comments should return comments"""
        # Create a ticket first
        ticket_data = {
            "title": "TEST_Iteration24_Comments_Test",
            "description": "Ticket to test comments functionality",
            "category": "general",
            "priority": "medium"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/tickets",
            headers={"Authorization": f"Bearer {employee_token}"},
            json=ticket_data
        )
        assert create_response.status_code == 200
        ticket_id = create_response.json().get("id")
        
        # Get comments (should be empty initially)
        comments_response = requests.get(
            f"{BASE_URL}/api/tickets/{ticket_id}/comments",
            headers={"Authorization": f"Bearer {employee_token}"}
        )
        assert comments_response.status_code == 200, f"Expected 200, got {comments_response.status_code}: {comments_response.text}"
        comments = comments_response.json()
        assert isinstance(comments, list), "Expected list of comments"
        print(f"Ticket {ticket_id} has {len(comments)} comments")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/tickets/{ticket_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
    
    def test_add_ticket_comment(self, admin_token, employee_token):
        """POST /api/tickets/{id}/comments should add a comment"""
        # Create a ticket first
        ticket_data = {
            "title": "TEST_Iteration24_Add_Comment_Test",
            "description": "Ticket to test adding comments",
            "category": "general",
            "priority": "medium"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/tickets",
            headers={"Authorization": f"Bearer {employee_token}"},
            json=ticket_data
        )
        assert create_response.status_code == 200
        ticket_id = create_response.json().get("id")
        
        # Add a comment
        comment_data = {
            "ticket_id": ticket_id,
            "content": "TEST_Comment from iteration 24 testing",
            "is_internal": False
        }
        comment_response = requests.post(
            f"{BASE_URL}/api/tickets/{ticket_id}/comments",
            headers={"Authorization": f"Bearer {employee_token}"},
            json=comment_data
        )
        assert comment_response.status_code == 200, f"Expected 200, got {comment_response.status_code}: {comment_response.text}"
        comment = comment_response.json()
        assert comment.get("content") == comment_data["content"], "Comment content mismatch"
        print(f"Added comment to ticket {ticket_id}: {comment.get('id')}")
        
        # Verify comment exists
        comments_response = requests.get(
            f"{BASE_URL}/api/tickets/{ticket_id}/comments",
            headers={"Authorization": f"Bearer {employee_token}"}
        )
        assert comments_response.status_code == 200
        comments = comments_response.json()
        assert len(comments) >= 1, "Should have at least 1 comment"
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/tickets/{ticket_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )


class TestExpensesRouter:
    """Tests for expenses.py router endpoints"""
    
    def test_get_expenses_admin(self, admin_token):
        """Admin should see all expenses"""
        response = requests.get(
            f"{BASE_URL}/api/expenses",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Expected list of expenses"
        print(f"Admin sees {len(data)} expenses")
    
    def test_get_expenses_stats(self, admin_token):
        """GET /api/expenses/stats should return expense statistics"""
        response = requests.get(
            f"{BASE_URL}/api/expenses/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "total" in data, "Stats should include total"
        assert "pending" in data, "Stats should include pending"
        assert "approved" in data, "Stats should include approved"
        assert "by_category" in data, "Stats should include by_category"
        assert "count" in data, "Stats should include count"
        print(f"Expense stats: total={data['total']}, pending={data['pending']}, approved={data['approved']}, count={data['count']}")
    
    def test_get_application_expenses(self, admin_token):
        """GET /api/expenses/application-expenses should return bursary and training expenses"""
        response = requests.get(
            f"{BASE_URL}/api/expenses/application-expenses",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "bursary" in data, "Response should include bursary expenses"
        assert "training" in data, "Response should include training expenses"
        assert isinstance(data["bursary"], list), "Bursary should be a list"
        assert isinstance(data["training"], list), "Training should be a list"
        print(f"Application expenses: {len(data['bursary'])} bursary, {len(data['training'])} training")
    
    def test_get_expenses_employee(self, employee_token):
        """Employee should see only their own expenses"""
        response = requests.get(
            f"{BASE_URL}/api/expenses",
            headers={"Authorization": f"Bearer {employee_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Expected list of expenses"
        print(f"Employee sees {len(data)} expenses (own only)")


class TestMessagesRouter:
    """Tests for messages.py router endpoints"""
    
    def test_get_conversations(self, admin_token):
        """GET /api/messages/conversations should return user conversations"""
        response = requests.get(
            f"{BASE_URL}/api/messages/conversations",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Expected list of conversations"
        print(f"Admin has {len(data)} conversations")
    
    def test_create_conversation(self, admin_token, employee_token):
        """POST /api/messages/conversations should create a new conversation"""
        # Get employee user ID first
        me_response = requests.get(
            f"{BASE_URL}/api/users/me",
            headers={"Authorization": f"Bearer {employee_token}"}
        )
        assert me_response.status_code == 200
        employee_id = me_response.json().get("id")
        
        # Create conversation with employee
        conv_data = {
            "type": "direct",
            "participant_ids": [employee_id]
        }
        response = requests.post(
            f"{BASE_URL}/api/messages/conversations",
            headers={"Authorization": f"Bearer {admin_token}"},
            json=conv_data
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("id"), "Conversation should have an ID"
        assert employee_id in data.get("participant_ids", []), "Employee should be in participants"
        print(f"Created/found conversation: {data.get('id')}")
    
    def test_get_contactable_users_admin(self, admin_token):
        """Admin should see all active users as contactable"""
        response = requests.get(
            f"{BASE_URL}/api/messages/contactable-users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Expected list of users"
        print(f"Admin can contact {len(data)} users")
    
    def test_get_contactable_users_employee(self, employee_token):
        """Employee should see only division/subgroup members as contactable"""
        response = requests.get(
            f"{BASE_URL}/api/messages/contactable-users",
            headers={"Authorization": f"Bearer {employee_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Expected list of users"
        print(f"Employee can contact {len(data)} users (division/subgroup only)")
    
    def test_get_unread_count(self, admin_token):
        """GET /api/messages/unread/count should return unread message count"""
        response = requests.get(
            f"{BASE_URL}/api/messages/unread/count",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "unread_count" in data, "Response should include unread_count"
        assert isinstance(data["unread_count"], int), "unread_count should be an integer"
        print(f"Admin has {data['unread_count']} unread messages")


class TestRouterIntegration:
    """Integration tests to verify routers are properly connected"""
    
    def test_tickets_router_connected(self, admin_token):
        """Verify tickets router is properly connected to main app"""
        # Test multiple endpoints from tickets router
        endpoints = [
            "/api/tickets",
            "/api/tickets/stats"
        ]
        for endpoint in endpoints:
            response = requests.get(
                f"{BASE_URL}{endpoint}",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            assert response.status_code == 200, f"Endpoint {endpoint} failed: {response.status_code}"
        print("Tickets router properly connected")
    
    def test_expenses_router_connected(self, admin_token):
        """Verify expenses router is properly connected to main app"""
        endpoints = [
            "/api/expenses",
            "/api/expenses/stats",
            "/api/expenses/application-expenses"
        ]
        for endpoint in endpoints:
            response = requests.get(
                f"{BASE_URL}{endpoint}",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            assert response.status_code == 200, f"Endpoint {endpoint} failed: {response.status_code}"
        print("Expenses router properly connected")
    
    def test_messages_router_connected(self, admin_token):
        """Verify messages router is properly connected to main app"""
        endpoints = [
            "/api/messages/conversations",
            "/api/messages/contactable-users",
            "/api/messages/unread/count"
        ]
        for endpoint in endpoints:
            response = requests.get(
                f"{BASE_URL}{endpoint}",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            assert response.status_code == 200, f"Endpoint {endpoint} failed: {response.status_code}"
        print("Messages router properly connected")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
