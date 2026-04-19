# services/openagenda_service.py
# OpenAgenda v2 public API.
#
# Strategy:
#   1. Try the global /v2/events endpoint (works if the key has global access).
#   2. On 403, fall back to searching public French agendas first, then querying
#      each one for city events. This handles free-tier keys that can only access
#      specific agendas.

import requests
from configuration import settings

_BASE = settings.OPENAGENDA_BASE_URL


def fetch_openagenda_events(city: str) -> list:
    if not settings.OPENAGENDA_API_KEY:
        print("[OpenAgenda] API key not set (OPENAGENDA_API_KEY env var missing), skipping.")
        return []

    events = _fetch_global(city)
    if events is not None:
        return events

    # Global endpoint returned 403 → try per-agenda fallback
    print("[OpenAgenda] Falling back to per-agenda search.")
    return _fetch_via_agendas(city)


# ── private helpers ──────────────────────────────────────────────────────────

def _fetch_global(city: str) -> list | None:
    """
    Returns a list of events on success, or None if the endpoint is forbidden
    (triggers the fallback). Returns [] on other errors.
    """
    params = [
        ("key", settings.OPENAGENDA_API_KEY),
        ("size", 100),
        ("lang", "fr"),
        ("search[city][]", city),
    ]
    try:
        r = requests.get(f"{_BASE}/events", params=params, timeout=10)
        if r.status_code == 403:
            print(f"[OpenAgenda] Global /events returned 403 – {r.text[:200]}")
            return None  # Signal fallback
        r.raise_for_status()
        return r.json().get("events", [])
    except Exception as e:
        print(f"[OpenAgenda] Global fetch error: {e}")
        return []


def _fetch_via_agendas(city: str) -> list:
    """
    Step 1 – get a batch of public French agendas.
    Step 2 – query each agenda for events in the target city.
    Limited to the first 5 agendas to keep response time reasonable.
    """
    agendas = _get_public_agendas()
    if not agendas:
        return []

    all_events: list = []
    for agenda in agendas[:5]:
        uid = agenda.get("uid")
        if not uid:
            continue
        try:
            params = [
                ("key", settings.OPENAGENDA_API_KEY),
                ("size", 20),
                ("lang", "fr"),
                ("search[city][]", city),
            ]
            r = requests.get(f"{_BASE}/agendas/{uid}/events", params=params, timeout=10)
            r.raise_for_status()
            all_events.extend(r.json().get("events", []))
        except Exception as e:
            print(f"[OpenAgenda] Events fetch error for agenda {uid}: {e}")

    return all_events


def _get_public_agendas() -> list:
    params = [
        ("key", settings.OPENAGENDA_API_KEY),
        ("size", 30),
        ("filters[public]", 1),
        ("filters[country]", "fr"),
    ]
    try:
        r = requests.get(f"{_BASE}/agendas", params=params, timeout=10)
        r.raise_for_status()
        return r.json().get("agendas", [])
    except Exception as e:
        print(f"[OpenAgenda] Agendas list error: {e}")
        return []
