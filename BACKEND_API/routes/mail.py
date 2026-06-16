from datetime import datetime, timezone
from typing import Any

import psycopg2
from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from pydantic import BaseModel

from configuration import secrets
from services.email_service import send_event_details
from services.weather_service import fetch_weather
from utils.logger_utils import Logger

logger = Logger.get_logger("mail-router")

router = APIRouter(prefix="/mail", tags=["mail"])


class SendEventRequest(BaseModel):
    event_data: dict[str, Any]
    recipient_email: str | None = None


def _get_user_email(username: str) -> tuple[str | None, str]:
    """Return (email, display_name) for this username, or (None, username) on failure."""
    try:
        conn = psycopg2.connect(
            host=secrets.postgre_host,
            database=secrets.postgre_db,
            user=secrets.postgre_user,
            password=secrets.postgre_pswd,
            port=secrets.postgre_port,
        )
        with conn, conn.cursor() as cur:
            cur.execute(
                "SELECT email, username FROM users WHERE username = %s LIMIT 1",
                (username,),
            )
            row = cur.fetchone()
            if row:
                return row[0], row[1]
    except Exception as e:
        logger.error(f"[Mail] DB error fetching email for '{username}': {e}")
    return None, username


def _weather_for_event(event_data: dict) -> dict | None:
    """Fetch weather if the event is within the next 5 days and has valid coordinates."""
    date_str = event_data.get("date")
    location = event_data.get("location", {})
    lat_str  = location.get("lat", "")
    lon_str  = location.get("lon", "")

    if not date_str or not lat_str or not lon_str or lat_str in ("0", "") or lon_str in ("0", ""):
        return None

    try:
        event_date = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        delta_days = (event_date - datetime.now(tz=timezone.utc)).days
        if not (0 <= delta_days <= 5):
            return None
        return fetch_weather(lat=float(lat_str), lon=float(lon_str))
    except Exception as e:
        logger.warning(f"[Mail] Weather fetch skipped: {e}")
        return None


def _send_task(email: str, name: str, event_data: dict) -> None:
    """Background task: fetch weather then send the email."""
    weather = _weather_for_event(event_data)
    send_event_details(email, name, event_data, weather)


@router.post("/send-event", status_code=202)
def send_event(
    body: SendEventRequest,
    request: Request,
    background_tasks: BackgroundTasks,
):
    user     = request.state.user
    username = user.get("sub", "")

    if body.recipient_email:
        email_used     = body.recipient_email
        recipient_name = username
    else:
        email_used, recipient_name = _get_user_email(username)
        if not email_used:
            raise HTTPException(status_code=404, detail="User email not found")

    background_tasks.add_task(_send_task, email_used, recipient_name, body.event_data)

    return {"status": "sent", "recipient": email_used}
