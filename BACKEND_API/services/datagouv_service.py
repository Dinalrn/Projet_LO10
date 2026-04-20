# services/datagouv_service.py
# data.culture.gouv.fr – cultural events via the Opendatasoft v2 Explore API.
# No API key required.
#
# Dataset discovery is done once at first call and cached for the lifetime of
# the process (auto-refreshes on server restart).



"""
Not used for the moment
"""


import requests
from configuration import settings

_ODS_BASE = "https://data.culture.gouv.fr/api/explore/v2.1"

# Module-level cache: (dataset_id, city_field_name)
_dataset_cache: tuple[str, str] | None = None

# Candidate field names that might hold the commune/city in the dataset
_CITY_FIELD_CANDIDATES = ["commune", "ville", "city", "localite", "localité", "nom_commune"]


def fetch_datagouv_events(city: str) -> list:
    dataset_id, city_field = _resolve_dataset()
    if not dataset_id:
        print("[DataCulture] No suitable dataset found in catalog, skipping.")
        return []

    url = f"{_ODS_BASE}/catalog/datasets/{dataset_id}/records"

    # Opendatasoft v2 where clause (SQL-like, case-insensitive with ilike)
    where_clauses = [f"{city_field} like '{city}'" for city_field in _CITY_FIELD_CANDIDATES]
    where = " OR ".join(where_clauses)

    params = {
        "where": where,
        "limit": 100,
        "lang": "fr",
    }

    try:
        r = requests.get(url, params=params, timeout=10)
        r.raise_for_status()
        data = r.json()
        return data.get("results", [])
    except Exception as e:
        print(f"[DataCulture] Fetch error for city '{city}': {e}")
        return []


# ── private helpers ──────────────────────────────────────────────────────────

def _resolve_dataset() -> tuple[str, str]:
    """
    Returns (dataset_id, city_field) from cache, or discovers them via
    the Opendatasoft catalog API and caches the result.
    """
    global _dataset_cache
    if _dataset_cache is not None:
        return _dataset_cache

    dataset_id = _discover_dataset_id()
    if not dataset_id:
        _dataset_cache = ("", "commune")
        return _dataset_cache

    city_field = _detect_city_field(dataset_id)
    _dataset_cache = (dataset_id, city_field)
    print(f"[DataCulture] Using dataset='{dataset_id}', city field='{city_field}'")
    return _dataset_cache


def _discover_dataset_id() -> str:
    """Search the data.culture.gouv.fr catalog for a cultural events dataset."""
    keywords = ["agenda", "manifestation", "evenement", "événement"]
    catalog_url = f"{_ODS_BASE}/catalog/datasets"

    for kw in keywords:
        try:
            r = requests.get(catalog_url, params={"search": kw, "limit": 10}, timeout=10)
            r.raise_for_status()
            for ds in r.json().get("results", []):
                ds_id = ds.get("dataset_id", "")
                if any(k in ds_id.lower() for k in keywords):
                    return ds_id
        except Exception as e:
            print(f"[DataCulture] Catalog search error (keyword='{kw}'): {e}")

    return ""


def _detect_city_field(dataset_id: str) -> str:
    """
    Fetch one record from the dataset and return the field name that most
    likely represents the commune/city. Defaults to 'commune'.
    """
    try:
        url = f"{_ODS_BASE}/catalog/datasets/{dataset_id}/records"
        r = requests.get(url, params={"limit": 1}, timeout=10)
        r.raise_for_status()
        results = r.json().get("results", [])
        if results:
            first = results[0]
            for candidate in _CITY_FIELD_CANDIDATES:
                if candidate in first:
                    return candidate
    except Exception as e:
        print(f"[DataCulture] Field detection error: {e}")

    return "commune"
