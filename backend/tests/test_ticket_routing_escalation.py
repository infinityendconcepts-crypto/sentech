"""
Iteration 25 Tests - Ticket Routing and Escalation System
Tests for:
- Auto-assignment of training_application/bursary_application tickets to subgroup head
- Routing of hr_query/technical_support tickets to admins
- Escalation (category change) re-routes ticket and creates system comment
- Notifications created for assigned head or admins
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
SUPER_ADMIN_EMAIL = "jane.smith@uct.ac.za"
SUPER_ADMIN_PASSWORD = "securepass123"
ADMIN_EMAIL = "test.admin@sentech.co.za"
ADMIN_PASSWORD = "password"
# MIB Employee in Bloemfontein Operations (has subgroup head)
MIB_EMPLOYEE_EMAIL = "mokoenam@sentech.co.za"
MIB_EMPLOYEE_PASSWORD = "password"
# Subgroup Head for Bloemfontein Operations
SUBGROUP_HEAD_EMAIL = "mothibik@sentech.co.za"
SUBGROUP_HEAD_PASSWORD = "password"
# Expected subgroup head ID
EXPECTED_HEAD_ID = "378ba860-327e-4135-89f8-b81df86bc35f"
EXPECTED_HEAD_NAME = "Kgomotso Tsholofetso Mothibi"


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
def super_admin_token():
    """Get super admin auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": SUPER_ADMIN_EMAIL,
        "password": SUPER_ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip(f"Super admin login failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def mib_employee_token():
    """Get MIB employee auth token (mokoenam@sentech.co.za)"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": MIB_EMPLOYEE_EMAIL,
        "password": MIB_EMPLOYEE_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip(f"MIB employee login failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def subgroup_head_token():
    """Get subgroup head auth token (mothibik@sentech.co.za)"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": SUBGROUP_HEAD_EMAIL,
        "password": SUBGROUP_HEAD_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip(f"Subgroup head login failed: {response.status_code} - {response.text}")


class TestTicketAutoRouting:
    """Tests for automatic ticket routing based on category"""
    
    def test_training_application_auto_assigns_to_subgroup_head(self, mib_employee_token, admin_token):
        """Training Application ticket should auto-assign to subgroup head"""
        ticket_data = {
            "title": "TEST_Training_Application_Routing",
            "description": "Test ticket for training application routing",
            "category": "training_application",
            "priority": "medium"
        }
        response = requests.post(
            f"{BASE_URL}/api/tickets",
            headers={"Authorization": f"Bearer {mib_employee_token}"},
            json=ticket_data
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        ticket_id = data.get("id")
        
        # Verify auto-assignment to subgroup head
        assert data.get("assigned_to") == EXPECTED_HEAD_ID, f"Expected assigned_to={EXPECTED_HEAD_ID}, got {data.get('assigned_to')}"
        assert data.get("assigned_to_name") == EXPECTED_HEAD_NAME, f"Expected assigned_to_name={EXPECTED_HEAD_NAME}, got {data.get('assigned_to_name')}"
        assert data.get("routed_to") == "head", f"Expected routed_to='head', got {data.get('routed_to')}"
        
        print(f"Training Application ticket {ticket_id} auto-assigned to {data.get('assigned_to_name')}")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/tickets/{ticket_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
    
    def test_bursary_application_auto_assigns_to_subgroup_head(self, mib_employee_token, admin_token):
        """Bursary Application ticket should auto-assign to subgroup head"""
        ticket_data = {
            "title": "TEST_Bursary_Application_Routing",
            "description": "Test ticket for bursary application routing",
            "category": "bursary_application",
            "priority": "medium"
        }
        response = requests.post(
            f"{BASE_URL}/api/tickets",
            headers={"Authorization": f"Bearer {mib_employee_token}"},
            json=ticket_data
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        ticket_id = data.get("id")
        
        # Verify auto-assignment to subgroup head
        assert data.get("assigned_to") == EXPECTED_HEAD_ID, f"Expected assigned_to={EXPECTED_HEAD_ID}, got {data.get('assigned_to')}"
        assert data.get("assigned_to_name") == EXPECTED_HEAD_NAME, f"Expected assigned_to_name={EXPECTED_HEAD_NAME}, got {data.get('assigned_to_name')}"
        assert data.get("routed_to") == "head", f"Expected routed_to='head', got {data.get('routed_to')}"
        
        print(f"Bursary Application ticket {ticket_id} auto-assigned to {data.get('assigned_to_name')}")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/tickets/{ticket_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
    
    def test_hr_query_routes_to_admins(self, mib_employee_token, admin_token):
        """HR Query ticket should route to admins with no specific assignee"""
        ticket_data = {
            "title": "TEST_HR_Query_Routing",
            "description": "Test ticket for HR query routing",
            "category": "hr_query",
            "priority": "medium"
        }
        response = requests.post(
            f"{BASE_URL}/api/tickets",
            headers={"Authorization": f"Bearer {mib_employee_token}"},
            json=ticket_data
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        ticket_id = data.get("id")
        
        # Verify routing to admins with no specific assignee
        assert data.get("assigned_to") is None, f"Expected assigned_to=None, got {data.get('assigned_to')}"
        assert data.get("assigned_to_name") is None, f"Expected assigned_to_name=None, got {data.get('assigned_to_name')}"
        assert data.get("routed_to") == "admins", f"Expected routed_to='admins', got {data.get('routed_to')}"
        
        print(f"HR Query ticket {ticket_id} routed to admins")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/tickets/{ticket_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
    
    def test_technical_support_routes_to_admins(self, mib_employee_token, admin_token):
        """Technical Support ticket should route to admins with no specific assignee"""
        ticket_data = {
            "title": "TEST_Technical_Support_Routing",
            "description": "Test ticket for technical support routing",
            "category": "technical_support",
            "priority": "high"
        }
        response = requests.post(
            f"{BASE_URL}/api/tickets",
            headers={"Authorization": f"Bearer {mib_employee_token}"},
            json=ticket_data
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        ticket_id = data.get("id")
        
        # Verify routing to admins with no specific assignee
        assert data.get("assigned_to") is None, f"Expected assigned_to=None, got {data.get('assigned_to')}"
        assert data.get("assigned_to_name") is None, f"Expected assigned_to_name=None, got {data.get('assigned_to_name')}"
        assert data.get("routed_to") == "admins", f"Expected routed_to='admins', got {data.get('routed_to')}"
        
        print(f"Technical Support ticket {ticket_id} routed to admins")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/tickets/{ticket_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )


class TestSubgroupHeadTicketVisibility:
    """Tests for subgroup head seeing assigned tickets"""
    
    def test_subgroup_head_sees_assigned_tickets(self, mib_employee_token, subgroup_head_token, admin_token):
        """Subgroup head should see tickets assigned to them"""
        # Create a training application ticket as MIB employee
        ticket_data = {
            "title": "TEST_Head_Visibility_Ticket",
            "description": "Test ticket for head visibility",
            "category": "training_application",
            "priority": "medium"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/tickets",
            headers={"Authorization": f"Bearer {mib_employee_token}"},
            json=ticket_data
        )
        assert create_response.status_code == 200
        ticket_id = create_response.json().get("id")
        
        # Subgroup head should see this ticket
        head_tickets_response = requests.get(
            f"{BASE_URL}/api/tickets",
            headers={"Authorization": f"Bearer {subgroup_head_token}"}
        )
        assert head_tickets_response.status_code == 200
        
        head_tickets = head_tickets_response.json()
        ticket_ids = [t.get("id") for t in head_tickets]
        assert ticket_id in ticket_ids, f"Subgroup head should see ticket {ticket_id}"
        
        print(f"Subgroup head sees {len(head_tickets)} tickets including {ticket_id}")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/tickets/{ticket_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )


class TestTicketEscalation:
    """Tests for ticket escalation (category change)"""
    
    def test_escalation_to_hr_query_reroutes_to_admins(self, mib_employee_token, subgroup_head_token, admin_token):
        """Escalating training_application to hr_query should re-route to admins"""
        # Create a training application ticket
        ticket_data = {
            "title": "TEST_Escalation_To_HR",
            "description": "Test ticket for escalation to HR",
            "category": "training_application",
            "priority": "medium"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/tickets",
            headers={"Authorization": f"Bearer {mib_employee_token}"},
            json=ticket_data
        )
        assert create_response.status_code == 200
        ticket_id = create_response.json().get("id")
        original_category = create_response.json().get("category")
        
        # Subgroup head escalates to HR Query
        escalate_response = requests.put(
            f"{BASE_URL}/api/tickets/{ticket_id}",
            headers={"Authorization": f"Bearer {subgroup_head_token}"},
            json={"category": "hr_query"}
        )
        assert escalate_response.status_code == 200, f"Expected 200, got {escalate_response.status_code}: {escalate_response.text}"
        
        # Verify ticket is now routed to admins
        get_response = requests.get(
            f"{BASE_URL}/api/tickets/{ticket_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert get_response.status_code == 200
        
        updated_ticket = get_response.json()
        assert updated_ticket.get("category") == "hr_query", f"Expected category='hr_query', got {updated_ticket.get('category')}"
        assert updated_ticket.get("routed_to") == "admins", f"Expected routed_to='admins', got {updated_ticket.get('routed_to')}"
        assert updated_ticket.get("assigned_to") is None, f"Expected assigned_to=None after escalation, got {updated_ticket.get('assigned_to')}"
        assert updated_ticket.get("escalated_from") == "training_application", f"Expected escalated_from='training_application', got {updated_ticket.get('escalated_from')}"
        
        print(f"Ticket {ticket_id} escalated from training_application to hr_query, routed to admins")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/tickets/{ticket_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
    
    def test_escalation_to_technical_support_reroutes_to_admins(self, mib_employee_token, subgroup_head_token, admin_token):
        """Escalating bursary_application to technical_support should re-route to admins"""
        # Create a bursary application ticket
        ticket_data = {
            "title": "TEST_Escalation_To_Tech",
            "description": "Test ticket for escalation to technical support",
            "category": "bursary_application",
            "priority": "medium"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/tickets",
            headers={"Authorization": f"Bearer {mib_employee_token}"},
            json=ticket_data
        )
        assert create_response.status_code == 200
        ticket_id = create_response.json().get("id")
        
        # Subgroup head escalates to Technical Support
        escalate_response = requests.put(
            f"{BASE_URL}/api/tickets/{ticket_id}",
            headers={"Authorization": f"Bearer {subgroup_head_token}"},
            json={"category": "technical_support"}
        )
        assert escalate_response.status_code == 200, f"Expected 200, got {escalate_response.status_code}: {escalate_response.text}"
        
        # Verify ticket is now routed to admins
        get_response = requests.get(
            f"{BASE_URL}/api/tickets/{ticket_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert get_response.status_code == 200
        
        updated_ticket = get_response.json()
        assert updated_ticket.get("category") == "technical_support", f"Expected category='technical_support', got {updated_ticket.get('category')}"
        assert updated_ticket.get("routed_to") == "admins", f"Expected routed_to='admins', got {updated_ticket.get('routed_to')}"
        assert updated_ticket.get("escalated_from") == "bursary_application", f"Expected escalated_from='bursary_application', got {updated_ticket.get('escalated_from')}"
        
        print(f"Ticket {ticket_id} escalated from bursary_application to technical_support, routed to admins")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/tickets/{ticket_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
    
    def test_escalation_creates_system_comment(self, mib_employee_token, subgroup_head_token, admin_token):
        """Escalation should create a system comment about the category change"""
        # Create a training application ticket
        ticket_data = {
            "title": "TEST_Escalation_Comment",
            "description": "Test ticket for escalation comment",
            "category": "training_application",
            "priority": "medium"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/tickets",
            headers={"Authorization": f"Bearer {mib_employee_token}"},
            json=ticket_data
        )
        assert create_response.status_code == 200
        ticket_id = create_response.json().get("id")
        
        # Subgroup head escalates to HR Query
        escalate_response = requests.put(
            f"{BASE_URL}/api/tickets/{ticket_id}",
            headers={"Authorization": f"Bearer {subgroup_head_token}"},
            json={"category": "hr_query"}
        )
        assert escalate_response.status_code == 200
        
        # Check for system comment
        comments_response = requests.get(
            f"{BASE_URL}/api/tickets/{ticket_id}/comments",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert comments_response.status_code == 200
        
        comments = comments_response.json()
        assert len(comments) >= 1, "Expected at least 1 comment (escalation comment)"
        
        # Find escalation comment
        escalation_comment = None
        for comment in comments:
            if "Escalated" in comment.get("content", ""):
                escalation_comment = comment
                break
        
        assert escalation_comment is not None, "Expected escalation comment to be created"
        assert "Training Application" in escalation_comment.get("content", ""), "Comment should mention original category"
        assert "HR Query" in escalation_comment.get("content", ""), "Comment should mention new category"
        
        print(f"Escalation comment created: {escalation_comment.get('content')}")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/tickets/{ticket_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )


class TestNotifications:
    """Tests for notification creation on ticket events"""
    
    def test_notification_created_for_assigned_head(self, mib_employee_token, subgroup_head_token, admin_token):
        """Notification should be created for assigned head when training/bursary ticket is created"""
        # Create a training application ticket
        ticket_data = {
            "title": "TEST_Notification_For_Head",
            "description": "Test ticket for head notification",
            "category": "training_application",
            "priority": "medium"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/tickets",
            headers={"Authorization": f"Bearer {mib_employee_token}"},
            json=ticket_data
        )
        assert create_response.status_code == 200
        ticket_id = create_response.json().get("id")
        
        # Check notifications for subgroup head
        time.sleep(0.5)  # Small delay for notification to be created
        notif_response = requests.get(
            f"{BASE_URL}/api/notifications",
            headers={"Authorization": f"Bearer {subgroup_head_token}"}
        )
        assert notif_response.status_code == 200
        
        notifications = notif_response.json()
        # Find notification for this ticket
        ticket_notif = None
        for notif in notifications:
            if notif.get("reference_id") == ticket_id:
                ticket_notif = notif
                break
        
        assert ticket_notif is not None, f"Expected notification for ticket {ticket_id}"
        assert ticket_notif.get("type") == "ticket_assigned", f"Expected type='ticket_assigned', got {ticket_notif.get('type')}"
        assert "Training Application" in ticket_notif.get("title", ""), "Notification title should mention Training Application"
        
        print(f"Notification created for head: {ticket_notif.get('title')}")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/tickets/{ticket_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
    
    def test_notifications_created_for_admins_on_hr_query(self, mib_employee_token, admin_token):
        """Notifications should be created for all admins when hr_query ticket is created"""
        # Create an HR query ticket
        ticket_data = {
            "title": "TEST_Notification_For_Admins_HR",
            "description": "Test ticket for admin notification on HR query",
            "category": "hr_query",
            "priority": "medium"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/tickets",
            headers={"Authorization": f"Bearer {mib_employee_token}"},
            json=ticket_data
        )
        assert create_response.status_code == 200
        ticket_id = create_response.json().get("id")
        
        # Check notifications for admin
        time.sleep(0.5)  # Small delay for notification to be created
        notif_response = requests.get(
            f"{BASE_URL}/api/notifications",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert notif_response.status_code == 200
        
        notifications = notif_response.json()
        # Find notification for this ticket
        ticket_notif = None
        for notif in notifications:
            if notif.get("reference_id") == ticket_id:
                ticket_notif = notif
                break
        
        assert ticket_notif is not None, f"Expected notification for ticket {ticket_id}"
        assert ticket_notif.get("type") == "ticket_assigned", f"Expected type='ticket_assigned', got {ticket_notif.get('type')}"
        assert "HR Query" in ticket_notif.get("title", ""), "Notification title should mention HR Query"
        
        print(f"Notification created for admin: {ticket_notif.get('title')}")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/tickets/{ticket_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
    
    def test_notifications_created_for_admins_on_technical_support(self, mib_employee_token, admin_token):
        """Notifications should be created for all admins when technical_support ticket is created"""
        # Create a technical support ticket
        ticket_data = {
            "title": "TEST_Notification_For_Admins_Tech",
            "description": "Test ticket for admin notification on technical support",
            "category": "technical_support",
            "priority": "high"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/tickets",
            headers={"Authorization": f"Bearer {mib_employee_token}"},
            json=ticket_data
        )
        assert create_response.status_code == 200
        ticket_id = create_response.json().get("id")
        
        # Check notifications for admin
        time.sleep(0.5)  # Small delay for notification to be created
        notif_response = requests.get(
            f"{BASE_URL}/api/notifications",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert notif_response.status_code == 200
        
        notifications = notif_response.json()
        # Find notification for this ticket
        ticket_notif = None
        for notif in notifications:
            if notif.get("reference_id") == ticket_id:
                ticket_notif = notif
                break
        
        assert ticket_notif is not None, f"Expected notification for ticket {ticket_id}"
        assert ticket_notif.get("type") == "ticket_assigned", f"Expected type='ticket_assigned', got {ticket_notif.get('type')}"
        assert "Technical Support" in ticket_notif.get("title", ""), "Notification title should mention Technical Support"
        
        print(f"Notification created for admin: {ticket_notif.get('title')}")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/tickets/{ticket_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )


class TestAdminTicketVisibility:
    """Tests for admin seeing all tickets including escalated ones"""
    
    def test_admin_sees_all_tickets(self, mib_employee_token, admin_token):
        """Admin should see all tickets including escalated ones"""
        # Create tickets of different categories
        ticket_ids = []
        
        for category in ["training_application", "hr_query", "technical_support"]:
            ticket_data = {
                "title": f"TEST_Admin_Visibility_{category}",
                "description": f"Test ticket for admin visibility - {category}",
                "category": category,
                "priority": "medium"
            }
            create_response = requests.post(
                f"{BASE_URL}/api/tickets",
                headers={"Authorization": f"Bearer {mib_employee_token}"},
                json=ticket_data
            )
            assert create_response.status_code == 200
            ticket_ids.append(create_response.json().get("id"))
        
        # Admin should see all tickets
        admin_tickets_response = requests.get(
            f"{BASE_URL}/api/tickets",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert admin_tickets_response.status_code == 200
        
        admin_tickets = admin_tickets_response.json()
        admin_ticket_ids = [t.get("id") for t in admin_tickets]
        
        for tid in ticket_ids:
            assert tid in admin_ticket_ids, f"Admin should see ticket {tid}"
        
        print(f"Admin sees {len(admin_tickets)} tickets including all test tickets")
        
        # Cleanup
        for tid in ticket_ids:
            requests.delete(
                f"{BASE_URL}/api/tickets/{tid}",
                headers={"Authorization": f"Bearer {admin_token}"}
            )


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
