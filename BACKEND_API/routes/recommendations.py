import asyncio
from fastapi import APIRouter
from pydantic import BaseModel

from services.ticketmaster_service import fetch_events as fetch_ticketmaster
from normalizers.ticketmaster_normalizer import normalize_ticketmaster
from services.datatourisme_service import fetch_datatourisme_events
from normalizers.datatourisme_normalizer import normalize_datatourisme
from services.recommendation_service import score_events
from utils.cache_utils import cache_get, cache_set

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


class UserContext(BaseModel):
    preferred_categories: list[str] = []
    registered_ids: list[str] = []
    past_categories: list[str] = []
    saved_ids: list[str] = []
    friend_categories: dict[str, int] = {}


class RecommendationRequest(BaseModel):
    city: str
    radius_km: int = 30
    user_context: UserContext


@router.post("")
async def get_recommendations(body: RecommendationRequest):
    """
    Fetch events for `city`, score them against the supplied user context,
    and return the top 10 recommendations.

    Results are cached in Redis keyed by city + radius + a hash of the user
    context, so different users (or the same user after behaviour changes)
    each get their own personalised cache entry.
    """
    ctx = body.user_context

    # Build a deterministic cache key — sort every list so order doesn't matter
    cache_params = {
        "city":       body.city.lower(),
        "radius_km":  body.radius_km,
        "preferred":  sorted(ctx.preferred_categories),
        "past":       sorted(ctx.past_categories),
        "registered": sorted(ctx.registered_ids),
        "saved":      sorted(ctx.saved_ids),
        "friend_cats": sorted(ctx.friend_categories.items()),
    }

    cached = cache_get("recommendations", cache_params)
    if cached:
        print(f"[Cache] HIT recommendations {body.city}")
        return cached

    # Fetch events from both sources concurrently (same pattern as /events)
    loop = asyncio.get_event_loop()
    raw_tm, raw_dt = await asyncio.gather(
        loop.run_in_executor(None, fetch_ticketmaster, body.city),
        loop.run_in_executor(None, fetch_datatourisme_events, body.city, body.radius_km),
    )

    all_events = normalize_ticketmaster(raw_tm) + normalize_datatourisme(raw_dt)

    recommendations = score_events(
        all_events,
        preferred_categories=ctx.preferred_categories,
        registered_ids=ctx.registered_ids,
        past_categories=ctx.past_categories,
        saved_ids=ctx.saved_ids,
        friend_categories=ctx.friend_categories,
    )

    result = {"city": body.city, "recommendations": recommendations}
    cache_set("recommendations", cache_params, result)
    return result
