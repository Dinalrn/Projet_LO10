# normalizers/openagenda_normalizer.py
# Maps OpenAgenda v2 event objects to the unified Event schema.

from models.events_model import Event


def _pick(multilang: dict | None, *langs) -> str:
    """Return the first non-empty value found among the given language keys."""
    if not multilang:
        return ""
    for lang in langs:
        val = multilang.get(lang)
        if val:
            return val if isinstance(val, str) else str(val)
    # Fallback: first value regardless of language
    first = next(iter(multilang.values()), "")
    return first if isinstance(first, str) else str(first)


def normalize_openagenda(events: list) -> list:
    normalized = []

    for e in events:
        try:
            loc = e.get("location", {})
            location = {
                "name": loc.get("name", ""),
                "city": loc.get("city", ""),
                "lat": str(loc.get("latitude", "")),
                "lon": str(loc.get("longitude", "")),
            }

            # Titles and descriptions are multilingual dicts {"fr": "...", "en": "..."}
            title = _pick(e.get("title"), "fr", "en")

            desc_obj = e.get("description") or e.get("longDescription")
            description = _pick(desc_obj, "fr", "en")

            # Keywords → category (take the first keyword in fr, fallback en)
            kw = e.get("keywords", {})
            kw_list = kw.get("fr") or kw.get("en") or []
            category = kw_list[0] if kw_list else "Événement"

            # Date/time from firstTiming.begin  (ISO 8601: "2024-06-01T19:00:00+02:00")
            first_timing = e.get("firstTiming", {})
            begin = first_timing.get("begin", "")
            date = begin[:10] if begin else ""
            time = begin[11:16] if len(begin) > 10 else ""

            image = e.get("thumbnail", "")

            event = Event(
                id=f"oa-{e.get('uid', '')}",
                title=title,
                description=description,
                category=category,
                date=date,
                time=time,
                location=location,
                price=0,
                image=image,
                source="openagenda",
            )
            normalized.append(event.to_json())
        except Exception as ex:
            print(f"[OpenAgenda Normalizer] Skipping event uid={e.get('uid')}: {ex}")

    return normalized
