from fastapi import APIRouter, HTTPException, Query
from services.weather_service import fetch_weather
from utils.cache_utils import cache_get, cache_set

router = APIRouter(prefix="/weather", tags=["weather"])


@router.get("")
def get_weather(
    city: str | None = Query(None, description="City name"),
    lat: float | None = Query(None, description="Latitude"),
    lon: float | None = Query(None, description="Longitude"),
):
    """Returns current conditions + daily forecast. Pass ?city=Paris OR ?lat=48.85&lon=2.35"""
    if not city and (lat is None or lon is None):
        raise HTTPException(status_code=400, detail="Provide 'city' or 'lat' and 'lon'.")

    # Round coords to 2 decimal places so nearby GPS readings share the same cache entry
    cache_params = {
        "city": city,
        "lat": round(lat, 2) if lat is not None else None,
        "lon": round(lon, 2) if lon is not None else None,
    }

    cached = cache_get("weather", cache_params)
    if cached:
        print(f"[Cache] HIT weather {cache_params}")
        return cached

    result = fetch_weather(city=city, lat=lat, lon=lon)
    if result is None:
        raise HTTPException(status_code=502, detail="Weather service unavailable.")

    cache_set("weather", cache_params, result)
    return result
