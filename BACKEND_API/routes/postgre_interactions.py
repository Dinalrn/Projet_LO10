# routes.postgre_itneractions.py

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from utils.postgre_utils import PostgreUtils
from utils.logger_utils import Logger

from models.postgre_route_models import UserCreate, UserUpdate, NoteCreate, NoteUpdate, AppConfigUpdate

logger = Logger.get_logger("postgres-router")

postgre_router = APIRouter(
    prefix="/postgres",
    tags=["postgres"]
)

db = PostgreUtils()


# User endpoints 

@postgre_router.post("/users", status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate):
    result = db.add_user(payload.user_name)
    if result != "Success":
        raise HTTPException(status_code=500, detail="Failed to create user")
    return {"status": result}


@postgre_router.put("/users/{user_id}")
def update_user(user_id: int, payload: UserUpdate):
    result = db.update_user(user_id, payload.user_name)
    if result != "Success":
        raise HTTPException(status_code=500, detail="Failed to update user")
    return {"status": result}


@postgre_router.delete("/users/{user_id}")
def delete_user(user_id: int):
    result = db.delete_user(user_id)
    if result != "Success":
        raise HTTPException(status_code=500, detail="Failed to delete user")
    return {"status": result}


# Notes endpoints

@postgre_router.post("/notes", status_code=status.HTTP_201_CREATED)
def create_note(payload: NoteCreate):
    result = db.add_notes(payload.message, payload.author_id)
    if result != "Success":
        raise HTTPException(status_code=500, detail="Failed to create note")
    return {"status": result}


@postgre_router.put("/notes/{notes_id}")
def update_note(notes_id: int, payload: NoteUpdate):
    result = db.update_notes(
        message=payload.message,
        author_id=payload.author_id,
        notes_id=notes_id,
    )
    if result != "Success":
        raise HTTPException(status_code=403, detail="Note update not allowed")
    return {"status": result}


@postgre_router.delete("/notes/{notes_id}")
def delete_note(notes_id: int):
    result = db.delete_notes(notes_id)
    if result != "Success":
        raise HTTPException(status_code=500, detail="Failed to delete note")
    return {"status": result}


# App configuration endpoints

@postgre_router.post("/config/init")
def init_app_configuration():
    result = db.initialisation_app_configuration()
    if result != "Success":
        raise HTTPException(status_code=500, detail="Initialization failed")
    return {"status": result}


@postgre_router.put("/config")
def update_app_configuration(payload: AppConfigUpdate):
    result = db.update_app_configuration(
        on_premise=payload.on_premise,
        home_name=payload.home_name,
    )
    if result != "Success":
        raise HTTPException(status_code=500, detail="Update failed")
    return {"status": result}
