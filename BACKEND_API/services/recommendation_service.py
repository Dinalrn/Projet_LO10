from datetime import datetime, timezone


def _normalize(value: str | None) -> str:
    return (value or "").lower().strip()


def score_events(
    events: list[dict],
    preferred_categories: list[str],
    registered_ids: list[str],
    past_categories: list[str],
    saved_ids: list[str],
    friend_categories: dict[str, int],
    limit: int = 10,
) -> list[dict]:
    """
    Score a list of normalized events against a user context.
    Returns the top `limit` events sorted by score descending,
    each enriched with `score` (int) and `reasons` (list[str]) fields.

    Scoring weights
    ───────────────
    Preferred category match   +30   explicit user interest
    Friends going same cat      +15  per friend, capped at +45
    Past-registration category  +10  implicit taste signal
    Already saved               +5   shows prior interest
    Upcoming this week          +15  temporal proximity
    Upcoming this month         +10
    Upcoming later              +3
    Already registered          → excluded from results
    """
    registered_set = set(registered_ids)
    preferred_set  = {_normalize(c) for c in preferred_categories}
    past_set       = {_normalize(c) for c in past_categories}
    saved_set      = set(saved_ids)
    friend_cats    = {_normalize(k): v for k, v in friend_categories.items()}

    now = datetime.now(tz=timezone.utc)
    scored: list[dict] = []

    for event in events:
        if event.get("id") in registered_set:
            continue

        score   = 0
        reasons: list[str] = []
        cat     = _normalize(event.get("category"))

        # ── Preferred category ────────────────────────────────
        if cat and cat in preferred_set:
            score += 30
            reasons.append("Your taste")

        # ── Social signal ─────────────────────────────────────
        friend_count = friend_cats.get(cat, 0)
        if friend_count > 0:
            score += min(friend_count * 15, 45)
            reasons.append(
                "1 friend going" if friend_count == 1 else f"{friend_count} friends going"
            )

        # ── Past-registration category (implicit taste) ───────
        if cat and cat in past_set and cat not in preferred_set:
            score += 10
            reasons.append("Past interest")

        # ── Already saved ─────────────────────────────────────
        if event.get("id") in saved_set:
            score += 5
            reasons.append("Saved")

        # ── Temporal proximity ────────────────────────────────
        date_str = event.get("date")
        if date_str:
            try:
                event_dt = datetime.fromisoformat(date_str).replace(tzinfo=timezone.utc)
                days_until = (event_dt - now).days
                if 0 <= days_until <= 7:
                    score += 15
                    reasons.append("This week")
                elif 7 < days_until <= 30:
                    score += 10
                    reasons.append("This month")
                elif days_until > 30:
                    score += 3
            except (ValueError, TypeError):
                pass

        if score > 0:
            scored.append({**event, "score": score, "reasons": reasons})

    scored.sort(key=lambda e: e["score"], reverse=True)
    return scored[:limit]
