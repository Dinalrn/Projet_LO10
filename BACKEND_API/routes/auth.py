# routes/auth.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from auth.jwt import create_access_token

from configuration import settings

router = APIRouter(prefix="/auth", tags=["auth"])

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest):
    # 🚨 TEMP — replace with DB lookup
    if data.username != settings.auth_username or data.password != settings.auth_password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({
        "sub": data.username,
        "role": "admin"
    })

    return {"access_token": token}
