# services/datagouv_service.py
# data.culture.gouv.fr – Agenda Culturel dataset via the Opendatasoft API.
# Dataset page: https://data.culture.gouv.fr/explore/dataset/agenda-culturel-odp/
# No API key required.

import requests
from configuration import settings


def fetch_datagouv_events(city: str) -> list:
    """
    Fetch cultural events from data.culture.gouv.fr filtered by commune (city).
    Returns raw Opendatasoft record dicts.
    """
    params = {
        "dataset": settings.DATAGOUV_CULTURE_DATASET,
        "rows": 100,
        # refine.commune narrows results to the exact commune name
        "refine.commune": city,
    }

    try:
        response = requests.get(settings.DATAGOUV_CULTURE_URL, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        return data.get("records", [])
    except Exception as e:
        print(f"[DataCulture] Fetch error for city '{city}': {e}")
        return []
