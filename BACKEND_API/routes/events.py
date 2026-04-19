# routes/events.py
from fastapi import APIRouter
from services.ticketmaster_service import fetch_events
from normalizers.ticketmaster_normalizer import normalize_ticketmaster

router = APIRouter(
    prefix="/events",
    tags=["events"]
)

@router.get("/{city}")
async def get_events(city: str):
    """
    Récupère les événements pour une ville donnée depuis Ticketmaster et renvoie le JSON standardisé.
    """
    # 1️⃣ Récupération brute
    raw_events = fetch_events(city)

    # 2️⃣ Normalisation
    normalized = normalize_ticketmaster(raw_events)

    # 3️⃣ Retour JSON
    return {"city": city, "events": normalized}