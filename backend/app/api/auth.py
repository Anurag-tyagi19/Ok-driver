"""
Authentication & Role-Based Access Control (RBAC) API
=====================================================
Simple JWT-based authentication with Admin and Operator roles.

Demo Users:
  1. Username: admin     | Password: admin123     | Role: admin
     - Full privileges: Camera CRUD, Watchlist CRUD, Alerts
  2. Username: operator  | Password: operator123  | Role: operator
     - Restricted: View cameras, Search entities, Acknowledge alerts
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional

from app.core.security import create_access_token, decode_access_token
from app.schema.auth import LoginRequest, TokenResponse, UserProfile


router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Authentication"]
)

security = HTTPBearer(auto_error=False)

# Demo users dictionary for easy internship testing & evaluation
DEMO_USERS = {
    "admin": {
        "password": "admin123",
        "role": "admin",
        "full_name": "Senior Administrator"
    },
    "operator": {
        "password": "operator123",
        "role": "operator",
        "full_name": "CCTV Control Room Operator"
    }
}


@router.post("/login", response_model=TokenResponse)
def login(credentials: LoginRequest):
    """
    User login endpoint. Validates username & password and returns a JWT token with user role.
    """
    user = DEMO_USERS.get(credentials.username.strip().lower())

    if not user or user["password"] != credentials.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    # JWT Token payload contains username and assigned role
    token_payload = {
        "sub": credentials.username.strip().lower(),
        "role": user["role"],
        "full_name": user["full_name"]
    }

    access_token = create_access_token(data=token_payload)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        username=credentials.username.strip().lower(),
        role=user["role"],
        full_name=user["full_name"]
    )


def get_current_user(
    auth_credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> dict:
    """
    Dependency to get and verify the current logged-in user from Bearer Token.
    """
    if not auth_credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token missing. Please login."
        )

    token = auth_credentials.credentials
    payload = decode_access_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token"
        )

    return {
        "username": payload.get("sub"),
        "role": payload.get("role"),
        "full_name": payload.get("full_name")
    }


def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """
    RBAC Dependency: Restricts endpoint access strictly to Admin role.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Admin role required for this action."
        )
    return current_user


@router.get("/me", response_model=UserProfile)
def get_current_user_profile(user: dict = Depends(get_current_user)):
    """
    Returns the profile and role of the currently logged-in user.
    """
    return UserProfile(
        username=user["username"],
        role=user["role"],
        full_name=user.get("full_name", user["username"])
    )
