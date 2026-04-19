# routes/events.py

from fastapi import APIRouter
from services.ticketmaster_service import fetch_events
from normalizers.ticketmaster_normalizer import normalize_ticketmaster

# ── Other sources (work in progress – re-enable one by one) ──────────────────
# from typing import Optional
# import asyncio
# from fastapi import Query
# from services.openagenda_service import fetch_openagenda_events
# from services.datagouv_service import fetch_datagouv_events
# from services.datatourisme_service import fetch_datatourisme_events
# from normalizers.openagenda_normalizer import normalize_openagenda
# from normalizers.datagouv_normalizer import normalize_datagouv
# from normalizers.datatourisme_normalizer import normalize_datatourisme

router = APIRouter(prefix="/events", tags=["events"])


@router.get("/{city}")
async def get_events(city: str):
    """
    Fetch events for a city from Ticketmaster and return normalised JSON.
    """
    raw_events = fetch_events(city)
    normalized = normalize_ticketmaster(raw_events)
    return {"city": city, "events": normalized}
