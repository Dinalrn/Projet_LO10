# normalizers/datatourisme_normalizer.py
# Maps DataTourisme REST API v1 POI objects to the unified Event schema.
#
# Relevant POI fields (from /entertainmentAndEvent):
#   uuid, label, type
#   takesPlaceAt[].startDate / startTime / endDate
#   isLocatedAt[].geo.latitude / .longitude
#   isLocatedAt[].address.hasAddressCity.label
#   hasDescription[].shortDescription / .description
#   hasMainRepresentation[].url (or nested hasRelatedResource)
#   offers[].priceSpecification[].minPrice

from models.events_model import Event


def _label(val, lang: str = "fr") -> str:
    """Recursively extract a plain string from multilingual label structures."""
    if not val:
        return ""
    if isinstance(val, str):
        return val
    if isinstance(val, dict):
        result = val.get(lang) or val.get("en") or next(iter(val.values()), "")
        return _label(result, lang)
    if isinstance(val, list):
        return _label(val[0], lang) if val else ""
    return str(val)


def _extract_image(media_list) -> str:
    """Pull the first usable image URL from hasMainRepresentation."""
    if isinstance(media_list, dict):
        media_list = [media_list]
    for m in (media_list or []):
        if not isinstance(m, dict):
            continue
        # Direct url field
        url = m.get("url") or m.get("uri") or ""
        if url:
            return str(url)
        # Nested inside hasRelatedResource (ebucore vocabulary)
        for resource in (m.get("hasRelatedResource") or []):
            if isinstance(resource, dict):
                url = resource.get("url") or resource.get("uri") or resource.get("ebucore:locator") or ""
                if url:
                    return str(url)
    return ""


def _extract_price(offers) -> float:
    """Return the minimum price found across all price specifications, or 0."""
    for offer in (offers or []):
        if not isinstance(offer, dict):
            continue
        for spec in (offer.get("priceSpecification") or []):
            if not isinstance(spec, dict):
                continue
            min_p = spec.get("minPrice")
            if min_p is not None:
                try:
                    return float(min_p)
                except (TypeError, ValueError):
                    pass
    return 0.0


def normalize_datatourisme(events: list) -> list:
    normalized = []

    for e in events:
        try:
            # ── Title ──────────────────────────────────────────────────────────
            title = _label(e.get("label"))

            # ── Description ────────────────────────────────────────────────────
            description = ""
            for desc in (e.get("hasDescription") or []):
                if not isinstance(desc, dict):
                    continue
                text = _label(desc.get("shortDescription") or desc.get("description"))
                if text:
                    description = text
                    break

            # ── Dates ──────────────────────────────────────────────────────────
            date, time = "", ""
            timings = e.get("takesPlaceAt") or []
            if isinstance(timings, dict):
                timings = [timings]
            if timings:
                first = timings[0]
                raw_date = first.get("startDate", "")
                date = str(raw_date)[:10] if raw_date else ""
                raw_time = first.get("startTime", "")
                time = str(raw_time)[:5] if raw_time else ""

            # ── Location ───────────────────────────────────────────────────────
            lat, lon, venue_name, city_name = "", "", "", ""
            locations = e.get("isLocatedAt") or []
            if isinstance(locations, dict):
                locations = [locations]
            if locations:
                loc = locations[0]
                geo = loc.get("geo") or {}
                lat = str(geo.get("latitude", ""))
                lon = str(geo.get("longitude", ""))
                venue_name = _label(loc.get("label") or {})
                addr = loc.get("address") or {}
                city_obj = addr.get("hasAddressCity") or {}
                city_name = _label(city_obj.get("label") if isinstance(city_obj, dict) else city_obj)

            # ── Category ───────────────────────────────────────────────────────
            # `type` is a controlled vocabulary value (e.g. "Festival", "Concert")
            category = _label(e.get("type") or "Événement")

            event = Event(
                id=f"dt-{e.get('uuid', '')}",
                title=title,
                description=description,
                category=category,
                date=date,
                time=time,
                location={"name": venue_name, "city": city_name, "lat": lat, "lon": lon},
                price=_extract_price(e.get("offers")),
                image=_extract_image(e.get("hasMainRepresentation")),
                source="datatourisme",
            )
            normalized.append(event.to_json())

        except Exception as ex:
            print(f"[DataTourisme Normalizer] Skipping {e.get('uuid', '?')}: {ex}")

    return normalized
