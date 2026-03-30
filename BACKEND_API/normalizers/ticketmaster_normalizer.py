from models.event_model import Event


def normalize_ticketmaster(events):

    normalized_events = []

    for e in events:

        venue = e["_embedded"]["venues"][0]

        location = {
            "name": venue["name"],
            "city": venue["city"]["name"],
            "lat": venue["location"]["latitude"],
            "lon": venue["location"]["longitude"]
        }

        event = Event(
            id=e["id"],
            title=e["name"],
            description=e.get("info", ""),
            category=e["classifications"][0]["segment"]["name"],
            date=e["dates"]["start"]["localDate"],
            time=e["dates"]["start"].get("localTime", ""),
            location=location,
            price=0,
            image=e["images"][0]["url"],
            source="ticketmaster"
        )

        normalized_events.append(event.to_json())

    return normalized_events