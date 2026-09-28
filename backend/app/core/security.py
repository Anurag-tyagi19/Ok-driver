"""
Security & JWT Utilities
========================
JSON Web Token (JWT) generate aur verify karne ke simple functions.
"""

from datetime import datetime, timedelta
import jwt
import os

# Secret key for JWT encoding/decoding (Environment se ya default secure demo key)
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "okdriver-super-secret-key-2026-cctv-jwt")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours


def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """
    Ek naya JWT access token create karta hai.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    """
    JWT access token ko decode aur verify karta hai.
    Agar invalid ya expired ho to None return karta hai.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None
