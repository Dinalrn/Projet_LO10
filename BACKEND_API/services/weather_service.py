import requests
from configuration import settings
from collections import defaultdict
from datetime import datetime, timezone

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
NOMINATIM_UA = "WannaGo/1.0 (event-discovery-app)"

CURRENT_URL = "https://api.openweathermap.org/data/2.5/weather"
FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast"


def _geocode(city: str) -> tuple[float, float] | None:
    try:
        resp = requests.get(
            NOMINATIM_URL,
            params={"q": city, "format": "json", "limit": 1},
            headers={"User-Agent": NOMINATIM_UA},
            timeout=5,
        )
        resp.raise_for_status()
        results = resp.json()
        if results:
            return float(results[0]["lat"]), float(results[0]["lon"])
        print(f"[Weather] Nominatim no results for '{city}'")
    except Exception as e:
        print(f"[Weather] Geocoding error for '{city}': {e}")
    return None


def fetch_weather(city: str | None = None, lat: float | None = None, lon: float | None = None) -> dict | None:
    """
    Fetch current conditions (2.5/weather) + 5-day 3h forecast (2.5/forecast),
    aggregated into daily buckets. Free-tier compatible.
    """
    if not settings.OPENWEATHER_API_KEY:
        print("[Weather] OPENWEATHER_API_KEY not set, skipping.")
        return None

    if lat is None or lon is None:
        if not city:
            return None
        coords = _geocode(city)
        if not coords:
            return None
        lat, lon = coords

    params = {
        "lat": lat,
        "lon": lon,
        "units": "metric",
        "lang": "fr",
        "appid": settings.OPENWEATHER_API_KEY,
    }

    try:
        current_resp = requests.get(CURRENT_URL, params=params, timeout=8)
        current_resp.raise_for_status()
        current_data = current_resp.json()

        forecast_resp = requests.get(FORECAST_URL, params=params, timeout=8)
        forecast_resp.raise_for_status()
        forecast_data = forecast_resp.json()
    except Exception as e:
        print(f"[Weather] API error: {e}")
        return None

    c = current_data
    current = {
        "dt": c.get("dt"),
        "temp": c["main"]["temp"],
        "feels_like": c["main"]["feels_like"],
        "humidity": c["main"]["humidity"],
        "wind_speed": c.get("wind", {}).get("speed", 0),
        "uvi": None,
        "weather_id": c["weather"][0]["id"] if c.get("weather") else None,
        "description": c["weather"][0]["description"] if c.get("weather") else "",
        "icon": c["weather"][0]["icon"] if c.get("weather") else "",
    }

    # Aggregate 3-hour slots into daily buckets using the city's UTC offset
    tz_offset = c.get("timezone", 0)
    days: dict[str, list] = defaultdict(list)
    for entry in forecast_data.get("list", []):
        local_dt = datetime.fromtimestamp(entry["dt"] + tz_offset, tz=timezone.utc)
        days[local_dt.strftime("%Y-%m-%d")].append(entry)

    daily = []
    for day_key in sorted(days.keys()):
        entries = days[day_key]
        temps = [e["main"]["temp"] for e in entries]
        humidities = [e["main"]["humidity"] for e in entries]
        winds = [e["wind"]["speed"] for e in entries if "wind" in e]
        pops = [e.get("pop", 0) for e in entries]

        # Representative entry: slot closest to noon local time
        noon = min(entries, key=lambda e: abs(
            datetime.fromtimestamp(e["dt"] + tz_offset, tz=timezone.utc).hour - 12
        ))

        daily.append({
            "date": noon["dt"],
            "temp_min": min(temps),
            "temp_max": max(temps),
            "temp_day": noon["main"]["temp"],
            "feels_like_day": noon["main"].get("feels_like"),
            "humidity": round(sum(humidities) / len(humidities)),
            "wind_speed": max(winds) if winds else 0,
            "pop": round(max(pops) * 100),
            "rain": sum(e.get("rain", {}).get("3h", 0) for e in entries),
            "weather_id": noon["weather"][0]["id"] if noon.get("weather") else None,
            "description": noon["weather"][0]["description"] if noon.get("weather") else "",
            "icon": noon["weather"][0]["icon"] if noon.get("weather") else "",
        })

    return {
        "lat": lat,
        "lon": lon,
        "timezone": c.get("name", ""),
        "current": current,
        "daily": daily[:8],
    }
