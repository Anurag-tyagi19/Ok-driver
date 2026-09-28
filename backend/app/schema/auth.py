"""
Authentication & RBAC Schemas
=============================
Login request, token response, aur user details ke Pydantic models.
"""

from pydantic import BaseModel
from typing import Optional


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    role: str
    full_name: Optional[str] = None


class UserProfile(BaseModel):
    username: str
    role: str
    full_name: str
