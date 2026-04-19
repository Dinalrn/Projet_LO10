# normalizers/datatourisme_normalizer.py
# Maps DataTourisme REST API v1 /catalog POI objects to the unified Event schema.
#
# Key POI fields used:
#   uuid, label, type
#   takesPlaceAt[]:  startDate, startTime
#   isLocatedAt[]:   geo.{latitude,longitude}, label, address[].hasAddressCity.label
#   hasDescription[]: shortDescription, description (multilingual dicts)
#   hasMainRepresentation[]: url/uri or hasRelatedResource[].url
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


def _extract_type(type_val) -> str:
    """
    Extract a readable category name from the type field.
    The API may return a full URI like 'https://...ontology/core/1.0/#Festival'
    or a simple string like 'Festival'.
    """
    if not type_val:
        return "Événement"
    if isinstance(type_val, list):
        type_val = type_val[0] if type_val else ""
    if not isinstance(type_val, str):
        return "Événement"
    # Strip URI fragment: "https://...#Festival" → "Festival"
    if "#" in type_val:
        return type_val.split("#")[-1]
    # Strip URI path: "https://.../Festival" → "Festival"
    if "/" in type_val:
        return type_val.rstrip("/").split("/")[-1]
    return type_val


def _extract_image(media_list) -> str:
    """Pull the first usable image URL from hasMainRepresentation."""
    if isinstance(media_list, dict):
        media_list = [media_list]
    for m in (media_list or []):
        if not isinstance(m, dict):
            continue
        url = m.get("url") or m.get("uri") or ""
        if url:
            return str(url)
        for resource in (m.get("hasRelatedResource") or []):
            if isinstance(resource, dict):
                url = (
                    resource.get("url")
                    or resource.get("uri")
                    or resource.get("ebucore:locator")
                    or ""
                )
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
            # ── Title ─────────────────────────────────────────────────────────
            title = _label(e.get("label"))

            # ── Description ───────────────────────────────────────────────────
            description = ""
            for desc in (e.get("hasDescription") or []):
                if not isinstance(desc, dict):
                    continue
                # shortDescription and description can be multilingual dicts
                text = _label(desc.get("shortDescription") or desc.get("description"))
                if text:
                    description = text
                    break
            # Fall back to top-level comment field if no hasDescription
            if not description:
                description = _label(e.get("comment") or "")

            # ── Dates ─────────────────────────────────────────────────────────
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

            # ── Location ──────────────────────────────────────────────────────
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

                # address is an *array* of objects per the schema
                addr_raw = loc.get("address") or []
                if isinstance(addr_raw, dict):
                    addr_raw = [addr_raw]
                addr = addr_raw[0] if addr_raw else {}

                city_obj = addr.get("hasAddressCity") or {}
                city_name = _label(
                    city_obj.get("label") if isinstance(city_obj, dict) else city_obj
                )

            # ── Category ──────────────────────────────────────────────────────
            category = _extract_type(e.get("type"))

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
