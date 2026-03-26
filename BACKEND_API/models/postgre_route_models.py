# models.postgre_route_models.py

from pydantic import BaseModel, Field

"""
Pydantic Models for PostgreSQL interactions route
"""

class UserCreate(BaseModel):
    user_name: str = Field(..., min_length=1, max_length=100)


class UserUpdate(BaseModel):
    user_name: str = Field(..., min_length=1, max_length=100)


class NoteCreate(BaseModel):
    message: str = Field(..., min_length=1)
    author_id: int


class NoteUpdate(BaseModel):
    message: str = Field(..., min_length=1)
    author_id: int


class AppConfigUpdate(BaseModel):
    home_name: str
    on_premise: bool

