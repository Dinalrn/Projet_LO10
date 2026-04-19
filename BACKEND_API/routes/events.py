# routes/events.py

import asyncio
from fastapi import APIRouter
from services.ticketmaster_service import fetch_events as fetch_ticketmaster
from normalizers.ticketmaster_normalizer import normalize_ticketmaster
from services.datatourisme_service import fetch_datatourisme_events
from normalizers.datatourisme_normalizer import normalize_datatourisme

router = APIRouter(prefix="/events", tags=["events"])


@router.get("/{city}")
async def get_events(city: str):
    """
    Fetch events for a city from Ticketmaster + DataTourisme concurrently.
    """
    loop = asyncio.get_event_loop()

    raw_tm, raw_dt = await asyncio.gather(
        loop.run_in_executor(None, fetch_ticketmaster, city),
        loop.run_in_executor(None, fetch_datatourisme_events, city),
    )

    tm_events = normalize_ticketmaster(raw_tm)
    dt_events = normalize_datatourisme(raw_dt)
    all_events = tm_events + dt_events

    return {
        "city": city,
        "total": len(all_events),
        "events": all_events,
        "sources": {
            "ticketmaster": {"status": "ok", "count": len(tm_events)},
            "datatourisme": {"status": "ok", "count": len(dt_events)},
        },
    }
