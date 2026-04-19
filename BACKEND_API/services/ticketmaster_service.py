# services/ticketmaster_service.py

import requests
from configuration import settings


def fetch_events(city: str) -> list:
    if not settings.TICKETMASTER_API_KEY:
        print("[Ticketmaster] API key not set (TICKETMASTER_API_KEY env var missing), skipping.")
        return []

    url = (
        f"{settings.TICKETMASTER_BASE_URL}"
        f"?apikey={settings.TICKETMASTER_API_KEY}&city={city}"
    )

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        if "_embedded" not in data:
            return []
        return data["_embedded"]["events"]
    except Exception as e:
        print(f"[Ticketmaster] Fetch error for city '{city}': {e}")
        return []
