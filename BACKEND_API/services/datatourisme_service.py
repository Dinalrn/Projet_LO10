# services/datatourisme_service.py
# DataTourisme REST API v1 – https://api.datatourisme.fr/v1
#
# Uses the /entertainmentAndEvent pre-filtered endpoint (Fêtes et Manifestations).
# Auth: X-API-Key header.
# Rate limits: ~10 req/s sustained, 1000 req/hour.

import requests
from configuration import settings


def fetch_datatourisme_events(city: str) -> list:
    """
    Return up to 100 entertainment/event POIs whose city label matches `city`.
    """
    if not settings.DATATOURISME_TOKEN:
        print("[DataTourisme] Token not set (DATATOURISME_TOKEN env var missing), skipping.")
        return []

    url = f"{settings.DATATOURISME_BASE_URL}/entertainmentAndEvent"

    headers = {
        "X-API-Key": settings.DATATOURISME_TOKEN,
    }

    # Request exactly the fields we need (specifying fields replaces the default set)
    params = {
        "filters": f'isLocatedAt.address.hasAddressCity.label[text]="{city}"',
        "fields": (
            "uuid,label,type,"
            "takesPlaceAt,"
            "isLocatedAt,"
            "hasDescription,"
            "hasMainRepresentation,"
            "offers"
        ),
        "lang": "fr",
        "page_size": 100,
    }

    try:
        response = requests.get(url, headers=headers, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()
        return data.get("objects", [])
    except Exception as e:
        print(f"[DataTourisme] Fetch error for city '{city}': {e}")
        return []
