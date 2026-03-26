from fastapi import APIRouter
from pydantic import BaseModel

testid = APIRouter()

@testid.get("/testid/{test_id}")
async def get_testid(test_id: int):
    """
    GET endpoint with path parameter
    """
    return {
        "message": f"Received test_id: {test_id}",
        "status": "success"
    }

@testid.put("/testid/{test_id}")
async def update_testid(test_id: int, data: dict):
    """
    PUT endpoint to update data by ID
    """
    return {
        "message": f"Updated test_id: {test_id}",
        "updated_data": data
    }
