# services/openagenda_service.py
# OpenAgenda v2 public API – searches all public agendas by city.
# Docs: https://developers.openagenda.com/10-lecture/

import requests
from configuration import settings


def fetch_openagenda_events(city: str) -> list:
    """
    Fetch events from OpenAgenda filtered by city name.
    Returns raw event dicts from the API (up to 100 per call).
    """
    url = f"{settings.OPENAGENDA_BASE_URL}/events"

    # The v2 API uses bracket-style array params: search[city][]=Paris
    # requests encodes dict keys literally, so "search[city][]" becomes search%5Bcity%5D%5B%5D=Paris
    params = [
        ("key", settings.OPENAGENDA_API_KEY),
        ("size", 100),
        ("detailed", 1),
        ("search[city][]", city),
    ]

    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        return data.get("events", [])
    except Exception as e:
        print(f"[OpenAgenda] Fetch error for city '{city}': {e}")
        return []
