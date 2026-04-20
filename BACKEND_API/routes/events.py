import asyncio
from fastapi import APIRouter, Query
from services.ticketmaster_service import fetch_events as fetch_ticketmaster
from normalizers.ticketmaster_normalizer import normalize_ticketmaster
from services.datatourisme_service import fetch_datatourisme_events
from normalizers.datatourisme_normalizer import normalize_datatourisme
from utils.cache_utils import cache_get, cache_set

router = APIRouter(prefix="/events", tags=["events"])


@router.get("/{city}")
async def get_events(
    city: str,
    radius_km: int = Query(30, ge=5, le=50, description="Search radius in km around the city (DataTourisme only)"),
):
    """Fetch events for a city from Ticketmaster + DataTourisme concurrently."""
    cache_params = {"city": city.lower(), "radius_km": radius_km}

    cached = cache_get("events", cache_params)
    if cached:
        print(f"[Cache] HIT events {cache_params}")
        return cached

    loop = asyncio.get_event_loop()
    raw_tm, raw_dt = await asyncio.gather(
        loop.run_in_executor(None, fetch_ticketmaster, city),
        loop.run_in_executor(None, fetch_datatourisme_events, city, radius_km),
    )

    tm_events = normalize_ticketmaster(raw_tm)
    dt_events = normalize_datatourisme(raw_dt)
    all_events = tm_events + dt_events

    result = {
        "city": city,
        "total": len(all_events),
        "events": all_events,
        "sources": {
            "ticketmaster": {"status": "ok", "count": len(tm_events)},
            "datatourisme": {"status": "ok", "count": len(dt_events)},
        },
    }

    cache_set("events", cache_params, result)
    return result
