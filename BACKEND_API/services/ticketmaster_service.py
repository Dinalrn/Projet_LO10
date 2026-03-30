import requests
from configuration import settings 

def fetch_events(city):

    url = f"{BASE_URL}?apikey={TICKETMASTER_API_KEY}&city={city}"

    response = requests.get(url)

    data = response.json()

    if "_embedded" not in data:
        return []

    return data["_embedded"]["events"]