"""
Test OTP Authentication Flow
Tests: /api/auth/request-otp and /api/auth/verify-otp endpoints
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestOTPAuthentication:
    """OTP authentication endpoint tests"""
    
    def test_request_otp_success(self):
        """Test POST /api/auth/request-otp returns OTP in dev mode"""
        response = requests.post(
            f"{BASE_URL}/api/auth/request-otp",
            json={"email": "pytest.otp.test@sentech.co.za"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data
        assert "email" in data
        assert data["email"] == "pytest.otp.test@sentech.co.za"
        # In dev mode (no SMTP configured), dev_note should contain OTP
        assert "dev_note" in data, "dev_note should be present in dev mode"
        assert "OTP:" in data["dev_note"], "dev_note should contain OTP code"
        
        # Extract and validate OTP format (6 digits)
        otp_code = data["dev_note"].replace("OTP:", "").strip()
        assert len(otp_code) == 6, f"OTP should be 6 digits, got: {otp_code}"
        assert otp_code.isdigit(), f"OTP should be numeric, got: {otp_code}"
    
    def test_request_otp_missing_email(self):
        """Test POST /api/auth/request-otp without email returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/auth/request-otp",
            json={},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        assert "detail" in response.json()
    
    def test_request_otp_empty_email(self):
        """Test POST /api/auth/request-otp with empty email returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/auth/request-otp",
            json={"email": ""},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
    
    def test_verify_otp_success(self):
        """Test full OTP flow: request -> verify -> get JWT token"""
        test_email = "pytest.verify.test@sentech.co.za"
        
        # Step 1: Request OTP
        request_response = requests.post(
            f"{BASE_URL}/api/auth/request-otp",
            json={"email": test_email},
            headers={"Content-Type": "application/json"}
        )
        assert request_response.status_code == 200
        
        # Extract OTP from dev_note
        otp_code = request_response.json()["dev_note"].replace("OTP:", "").strip()
        
        # Step 2: Verify OTP
        verify_response = requests.post(
            f"{BASE_URL}/api/auth/verify-otp",
            json={"email": test_email, "otp": otp_code},
            headers={"Content-Type": "application/json"}
        )
        assert verify_response.status_code == 200, f"Expected 200, got {verify_response.status_code}: {verify_response.text}"
        
        data = verify_response.json()
        # Verify response structure
        assert "access_token" in data, "Response should contain access_token"
        assert "token_type" in data, "Response should contain token_type"
        assert data["token_type"] == "bearer"
        assert "user" in data, "Response should contain user object"
        
        # Verify user data
        user = data["user"]
        assert user["email"] == test_email
        assert "id" in user
        assert "roles" in user
        assert user["is_verified"] == True
    
    def test_verify_otp_wrong_code(self):
        """Test POST /api/auth/verify-otp with wrong OTP returns 400"""
        test_email = "pytest.wrong.otp@sentech.co.za"
        
        # Request OTP first
        requests.post(
            f"{BASE_URL}/api/auth/request-otp",
            json={"email": test_email},
            headers={"Content-Type": "application/json"}
        )
        
        # Try to verify with wrong code
        verify_response = requests.post(
            f"{BASE_URL}/api/auth/verify-otp",
            json={"email": test_email, "otp": "000000"},
            headers={"Content-Type": "application/json"}
        )
        assert verify_response.status_code == 400
        assert "Invalid OTP" in verify_response.json()["detail"]
    
    def test_verify_otp_missing_params(self):
        """Test POST /api/auth/verify-otp without required params"""
        # Missing both
        response = requests.post(
            f"{BASE_URL}/api/auth/verify-otp",
            json={},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400
        
        # Missing OTP
        response = requests.post(
            f"{BASE_URL}/api/auth/verify-otp",
            json={"email": "test@example.com"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400
    
    def test_verify_otp_no_otp_requested(self):
        """Test POST /api/auth/verify-otp for email that never requested OTP"""
        response = requests.post(
            f"{BASE_URL}/api/auth/verify-otp",
            json={"email": "never.requested@example.com", "otp": "123456"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400
        assert "No OTP found" in response.json()["detail"]
    
    def test_otp_creates_new_user_if_not_exists(self):
        """Test that OTP login auto-creates user if email not in DB"""
        unique_email = f"pytest.newuser.{int(time.time())}@sentech.co.za"
        
        # Request OTP for new email
        request_response = requests.post(
            f"{BASE_URL}/api/auth/request-otp",
            json={"email": unique_email},
            headers={"Content-Type": "application/json"}
        )
        assert request_response.status_code == 200
        otp_code = request_response.json()["dev_note"].replace("OTP:", "").strip()
        
        # Verify OTP - should create new user
        verify_response = requests.post(
            f"{BASE_URL}/api/auth/verify-otp",
            json={"email": unique_email, "otp": otp_code},
            headers={"Content-Type": "application/json"}
        )
        assert verify_response.status_code == 200
        
        data = verify_response.json()
        assert data["user"]["email"] == unique_email
        # User should be auto-created with default role
        assert "employee" in data["user"]["roles"]


class TestStandardLogin:
    """Standard email/password login tests"""
    
    def test_login_with_credentials(self):
        """Test login with known credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "jane.smith@uct.ac.za", "password": "securepass123"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == "jane.smith@uct.ac.za"
    
    def test_login_wrong_password(self):
        """Test login with wrong password returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "jane.smith@uct.ac.za", "password": "wrongpassword"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400
        assert "Invalid email or password" in response.json()["detail"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
