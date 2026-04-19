# services/ticketmaster_service.py

import requests
from configuration import settings


def fetch_events(city: str) -> list:
    url = f"{settings.TICKETMASTER_BASE_URL}?apikey={settings.TICKETMASTER_API_KEY}&city={city}"

    response = requests.get(url)
    data = response.json()

    if "_embedded" not in data:
        return []

    return data["_embedded"]["events"]
