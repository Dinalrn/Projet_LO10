from contextlib import contextmanager
from datetime import datetime

import psycopg2
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from configuration import secrets
from utils.api_key_utils import verify_api_key
from utils.cache_utils import cache_get, cache_set

router = APIRouter(
    prefix="/api/v1/public",
    tags=["public-api"],
    dependencies=[Depends(verify_api_key)],
)


# ── DB helper ─────────────────────────────────────────────────────────────────

@contextmanager
def _db_cursor():
    """Open a short-lived read-only connection; always closes it."""
    conn = psycopg2.connect(
        host=secrets.postgre_host,
        database=secrets.postgre_db,
        user=secrets.postgre_user,
        password=secrets.postgre_pswd,
        port=secrets.postgre_port,
    )
    try:
        with conn, conn.cursor() as cur:
            yield cur
    finally:
        conn.close()


# ── Response models ───────────────────────────────────────────────────────────

class AttendeesResponse(BaseModel):
    event_id: str
    attendees_count: int
    first_registration: datetime | None
    last_registration: datetime | None


class InterestedResponse(BaseModel):
    event_id: str
    interested_count: int
    first_save: datetime | None
    last_save: datetime | None


class UserEventsResponse(BaseModel):
    user_id: str
    registered_events_count: int
    saved_events_count: int


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get(
    "/events/{event_id}/attendees",
    response_model=AttendeesResponse,
    summary="Event attendance statistics",
    responses={
        200: {
            "description": "Confirmed attendee count and registration window for this event.",
            "content": {
                "application/json": {
                    "example": {
                        "event_id": "Z698xZC2Z174Jv",
                        "attendees_count": 42,
                        "first_registration": "2026-05-01T14:23:00",
                        "last_registration": "2026-06-10T09:11:00",
                    }
                }
            },
        },
        401: {"description": "Missing or invalid X-WannaGo-Key header."},
    },
)
def get_event_attendees(event_id: str):
    """
    Return the number of WannaGo users who registered as attending this event,
    along with the timestamps of the first and last registration.

    All data is **anonymised** — only aggregate counts and timestamps are returned.
    Results are cached for **5 minutes**.

    Requires a valid `X-WannaGo-Key` header.
    """
    cache_params = {"event_id": event_id, "type": "attendees"}
    cached = cache_get("public_api", cache_params)
    if cached:
        return cached

    try:
        with _db_cursor() as cur:
            cur.execute(
                """
                SELECT COUNT(*) AS count,
                       MIN(registered_at) AS first_registration,
                       MAX(registered_at) AS last_registration
                FROM event_registrations
                WHERE external_event_id = %s
                """,
                (event_id,),
            )
            count, first_reg, last_reg = cur.fetchone()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database unavailable: {e}")

    result = {
        "event_id": event_id,
        "attendees_count": int(count),
        "first_registration": first_reg.isoformat() if first_reg else None,
        "last_registration": last_reg.isoformat() if last_reg else None,
    }
    cache_set("public_api", cache_params, result)
    return result


@router.get(
    "/events/{event_id}/interested",
    response_model=InterestedResponse,
    summary="Event interest statistics",
    responses={
        200: {
            "description": "Number of users who saved this event, and the save window.",
            "content": {
                "application/json": {
                    "example": {
                        "event_id": "Z698xZC2Z174Jv",
                        "interested_count": 128,
                        "first_save": "2026-04-15T08:00:00",
                        "last_save": "2026-06-12T20:30:00",
                    }
                }
            },
        },
        401: {"description": "Missing or invalid X-WannaGo-Key header."},
    },
)
def get_event_interested(event_id: str):
    """
    Return the number of WannaGo users who saved this event to their watchlist,
    along with the timestamps of the first and last save action.

    All data is **anonymised** — only aggregate counts and timestamps are returned.
    Results are cached for **5 minutes**.

    Requires a valid `X-WannaGo-Key` header.
    """
    cache_params = {"event_id": event_id, "type": "interested"}
    cached = cache_get("public_api", cache_params)
    if cached:
        return cached

    try:
        with _db_cursor() as cur:
            cur.execute(
                """
                SELECT COUNT(*) AS count,
                       MIN(saved_at) AS first_save,
                       MAX(saved_at) AS last_save
                FROM saved_events
                WHERE external_event_id = %s
                """,
                (event_id,),
            )
            count, first_save, last_save = cur.fetchone()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database unavailable: {e}")

    result = {
        "event_id": event_id,
        "interested_count": int(count),
        "first_save": first_save.isoformat() if first_save else None,
        "last_save": last_save.isoformat() if last_save else None,
    }
    cache_set("public_api", cache_params, result)
    return result


@router.get(
    "/users/{user_id}/events",
    response_model=UserEventsResponse,
    summary="User activity statistics (anonymised)",
    responses={
        200: {
            "description": "Aggregated event counts for a user — no personal data exposed.",
            "content": {
                "application/json": {
                    "example": {
                        "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                        "registered_events_count": 7,
                        "saved_events_count": 23,
                    }
                }
            },
        },
        401: {"description": "Missing or invalid X-WannaGo-Key header."},
    },
)
def get_user_events(user_id: str):
    """
    Return the number of events a user has registered for and saved.

    **No personal data is ever returned** — no username, email, or any identifier
    beyond the `user_id` supplied in the URL. Counts only.

    Results are cached for **5 minutes**.

    Requires a valid `X-WannaGo-Key` header.
    """
    cache_params = {"user_id": user_id, "type": "user_events"}
    cached = cache_get("public_api", cache_params)
    if cached:
        return cached

    try:
        with _db_cursor() as cur:
            cur.execute(
                """
                SELECT
                  (SELECT COUNT(*) FROM event_registrations WHERE user_id = %s) AS registered_count,
                  (SELECT COUNT(*) FROM saved_events         WHERE user_id = %s) AS saved_count
                """,
                (user_id, user_id),
            )
            registered_count, saved_count = cur.fetchone()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database unavailable: {e}")

    result = {
        "user_id": user_id,
        "registered_events_count": int(registered_count),
        "saved_events_count": int(saved_count),
    }
    cache_set("public_api", cache_params, result)
    return result
