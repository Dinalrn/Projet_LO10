# services/datatourisme_service.py
# DataTourisme – local flux (batch feed) via diffuseur.datatourisme.fr.
#
# HOW IT WORKS:
#   DataTourisme is NOT a real-time search API. It delivers a pre-configured feed
#   (your "flux") that you download in full. We fetch it once, cache it in memory,
#   then filter by city on every request.
#
# IF THE URL DOESN'T WORK:
#   Log in to https://diffuseur.datatourisme.fr, open your flux configuration and
#   copy the exact download URL. Update DATATOURISME_FLUX_URL in configuration.py.
#
# FOR PRODUCTION:
#   Replace the in-memory cache with a scheduled background job that refreshes the
#   flux periodically (daily is usually enough) and stores it in the DB or Redis.

import requests
from configuration import settings

# Simple module-level in-memory cache (reset on server restart)
_flux_cache: list | None = None


def _load_flux() -> list:
    """Download and return the raw DataTourisme flux as a list of JSON-LD objects."""
    global _flux_cache
    if _flux_cache is not None:
        return _flux_cache

    print("[DataTourisme] Downloading flux – this may take a moment...")
    try:
        response = requests.get(settings.DATATOURISME_FLUX_URL, timeout=30)
        response.raise_for_status()
        data = response.json()

        # The flux can be a top-level list or a JSON-LD graph {"@graph": [...]}
        if isinstance(data, list):
            _flux_cache = data
        elif isinstance(data, dict):
            _flux_cache = data.get("@graph", data.get("member", []))
        else:
            _flux_cache = []

        print(f"[DataTourisme] Flux loaded – {len(_flux_cache)} objects cached.")
    except Exception as e:
        print(f"[DataTourisme] Failed to load flux: {e}")
        _flux_cache = []

    return _flux_cache


def fetch_datatourisme_events(city: str) -> list:
    """
    Return DataTourisme Event objects whose address locality matches `city`.
    Filtering is done in memory after downloading the full flux.
    """
    all_objects = _load_flux()
    city_lower = city.lower()
    matching = []

    for obj in all_objects:
        # Keep only Event-typed objects
        obj_types = obj.get("@type", [])
        if isinstance(obj_types, str):
            obj_types = [obj_types]
        if not any("event" in t.lower() for t in obj_types):
            continue

        # Check city in location address
        locations = obj.get("isLocatedAt", [])
        if isinstance(locations, dict):
            locations = [locations]

        for loc in locations:
            addresses = loc.get("schema:address", loc.get("hasAddress", []))
            if isinstance(addresses, dict):
                addresses = [addresses]
            for addr in addresses:
                locality = addr.get("schema:addressLocality", addr.get("addressLocality", ""))
                if isinstance(locality, list):
                    locality = locality[0] if locality else ""
                if city_lower in str(locality).lower():
                    matching.append(obj)
                    break
            else:
                continue
            break

    return matching
