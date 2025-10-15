import pytest

def test_authentication_and_authorization(test_client, db_session, redis_client, mock_keycloak):
    # Step 1: Login (mocked Keycloak)
    payload = {"username": "test_user", "password": "pass"}
    response = test_client.post("/auth/login", json=payload)
    assert response.status_code == 200
    auth_data = response.json()
    assert "token" in auth_data
    headers = {"Authorization": f"Bearer {auth_data['token']}"}
    
    # Step 2: Access protected endpoint
    response = test_client.get("/protected/certificates", headers=headers)
    assert response.status_code == 200  # Authorized
    
    # Step 3: Test unauthorized access
    response = test_client.get("/protected/certificates")  # No token
    assert response.status_code == 401
    
    # Assertions: Cache behavior (token cached)
    cached_token = redis_client.get("auth:token:test_user")
    assert cached_token is not None
    
    # Error handling: Invalid credentials
    payload["password"] = "wrong"
    response = test_client.post("/auth/login", json=payload)
    assert response.status_code == 401
