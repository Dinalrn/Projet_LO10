# services/datatourisme_service.py
# DataTourisme REST API v1 – https://api.datatourisme.fr/v1
#
# Geocodes the city name via Nominatim (OpenStreetMap, no key needed),
# then queries /catalog with geo_distance to get nearby POIs.

import requests
from configuration import settings

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
# Required by Nominatim usage policy — identifies your app
NOMINATIM_UA = "WannaGo/1.0 (event-discovery-app)"


def _get_city_coords(city: str) -> tuple[float, float] | None:
    """Geocode a city name to (lat, lon) using OpenStreetMap Nominatim."""
    try:
        resp = requests.get(
            NOMINATIM_URL,
            params={"q": city, "countrycodes": "fr", "format": "json", "limit": 1},
            headers={"User-Agent": NOMINATIM_UA},
            timeout=5,
        )
        resp.raise_for_status()
        results = resp.json()
        if results:
            return float(results[0]["lat"]), float(results[0]["lon"])
        print(f"[DataTourisme] Nominatim returned no results for '{city}'")
    except Exception as e:
        print(f"[DataTourisme] Geocoding error for '{city}': {e}")
    return None


def fetch_datatourisme_events(city: str, radius_km: int = 30) -> list:
    """
    Return up to 100 event POIs within `radius_km` of `city`.
    Translates the city name to coordinates first via Nominatim.
    """
    if not settings.DATATOURISME_TOKEN:
        print("[DataTourisme] DATATOURISME_TOKEN not set, skipping.")
        return []

    coords = _get_city_coords(city)
    if not coords:
        print(f"[DataTourisme] Cannot geocode '{city}', skipping.")
        return []

    lat, lon = coords
    print(f"[DataTourisme] Searching {radius_km}km around {city} ({lat:.4f}, {lon:.4f})")

    try:
        resp = requests.get(
            f"{settings.DATATOURISME_BASE_URL}/catalog",
            headers={"X-API-Key": settings.DATATOURISME_TOKEN},
            params={
                "geo_distance": f"{lat},{lon},{radius_km}km",
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
            },
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        objects = data.get("objects", [])
        total = data.get("meta", {}).get("total", "?")
        print(f"[DataTourisme] {len(objects)} POIs returned (total matching: {total})")
        return objects
    except Exception as e:
        print(f"[DataTourisme] Fetch error for '{city}': {e}")
        return []
