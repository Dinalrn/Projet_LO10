# routes/events.py
# Aggregates events from all configured sources for a given city.

import asyncio
from typing import Optional

from fastapi import APIRouter, Query

from services.ticketmaster_service import fetch_events as fetch_ticketmaster
from services.openagenda_service import fetch_openagenda_events
from services.datagouv_service import fetch_datagouv_events
from services.datatourisme_service import fetch_datatourisme_events

from normalizers.ticketmaster_normalizer import normalize_ticketmaster
from normalizers.openagenda_normalizer import normalize_openagenda
from normalizers.datagouv_normalizer import normalize_datagouv
from normalizers.datatourisme_normalizer import normalize_datatourisme

router = APIRouter(prefix="/events", tags=["events"])

# ── helpers ──────────────────────────────────────────────────────────────────

_SOURCES = [
    ("ticketmaster",         fetch_ticketmaster,        normalize_ticketmaster),
    ("openagenda",           fetch_openagenda_events,   normalize_openagenda),
    ("data.culture.gouv.fr", fetch_datagouv_events,     normalize_datagouv),
    ("datatourisme",         fetch_datatourisme_events, normalize_datatourisme),
]


def _safe_normalize(normalizer, raw, source: str) -> list:
    try:
        return normalizer(raw)
    except Exception as e:
        print(f"[{source}] Normalizer error: {e}")
        return []


# ── routes ───────────────────────────────────────────────────────────────────

@router.get("/{city}")
async def get_events(
    city: str,
    date: Optional[str] = Query(None, description="Filter by date (YYYY-MM-DD)"),
    category: Optional[str] = Query(None, description="Filter by category keyword (case-insensitive)"),
):
    """
    Fetch and merge events for a city from all sources (Ticketmaster, OpenAgenda,
    data.culture.gouv.fr, DataTourisme).

    Optional filters:
    - **date**: only return events on this date (e.g. `2024-07-14`)
    - **category**: case-insensitive substring match on the event category
    """

    # Fetch all sources in parallel (services use sync `requests` → run in thread pool)
    raw_results = await asyncio.gather(
        *[asyncio.to_thread(fetch_fn, city) for _, fetch_fn, _ in _SOURCES],
        return_exceptions=True,
    )

    all_events: list = []
    source_stats: dict = {}

    for (name, _, normalize_fn), raw in zip(_SOURCES, raw_results):
        if isinstance(raw, Exception):
            print(f"[{name}] Fetch exception: {raw}")
            source_stats[name] = {"status": "error", "count": 0}
            continue

        events = _safe_normalize(normalize_fn, raw, name)
        all_events.extend(events)
        source_stats[name] = {"status": "ok", "count": len(events)}

    # ── post-normalisation filters ────────────────────────────────────────────
    if date:
        all_events = [e for e in all_events if e.get("date", "").startswith(date)]
    if category:
        all_events = [e for e in all_events if category.lower() in e.get("category", "").lower()]

    return {
        "city": city,
        "total": len(all_events),
        "filters": {"date": date, "category": category},
        "sources": source_stats,
        "events": all_events,
    }
