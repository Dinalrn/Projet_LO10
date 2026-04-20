# routes/weather.py

from fastapi import APIRouter, HTTPException, Query
from services.weather_service import fetch_weather

router = APIRouter(prefix="/weather", tags=["weather"])


@router.get("")
def get_weather(
    city: str | None = Query(None, description="City name"),
    lat: float | None = Query(None, description="Latitude"),
    lon: float | None = Query(None, description="Longitude"),
):
    """
    Returns current conditions + 8-day daily forecast.
    Pass ?city=Paris  OR  ?lat=48.85&lon=2.35
    """
    if not city and (lat is None or lon is None):
        raise HTTPException(status_code=400, detail="Provide 'city' or 'lat' and 'lon'.")

    result = fetch_weather(city=city, lat=lat, lon=lon)
    if result is None:
        raise HTTPException(status_code=502, detail="Weather service unavailable.")
    return result
