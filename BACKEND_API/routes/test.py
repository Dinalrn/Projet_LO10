from fastapi import APIRouter
from pydantic import BaseModel

test = APIRouter()

@test.get("/test")
async def test_route():
    """
    Simple GET endpoint to test API
    """
    return {
        "message": "This is the /test route",
        "status": "success"
    }

@test.post("/test")
async def test_post(data: dict):
    """
    Simple POST endpoint to test API
    """
    return {
        "message": "Received POST data",
        "data": data
    }
