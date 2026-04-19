# normalizers/datatourisme_normalizer.py
# Maps DataTourisme JSON-LD event objects to the unified Event schema.
#
# DataTourisme uses the schema.org + tourism ontology vocabulary.
# Property names look like "schema:name", "rdfs:label", "isLocatedAt", etc.

from models.events_model import Event


def _label(obj, lang="fr") -> str:
    """Extract a string label from a multilingual JSON-LD value."""
    if obj is None:
        return ""
    if isinstance(obj, str):
        return obj
    if isinstance(obj, list):
        return obj[0] if obj else ""
    if isinstance(obj, dict):
        val = obj.get(lang) or obj.get("en") or next(iter(obj.values()), "")
        return _label(val, lang)
    return str(obj)


def normalize_datatourisme(events: list) -> list:
    normalized = []

    for e in events:
        try:
            # --- Title ---
            title = _label(e.get("rdfs:label") or e.get("schema:name") or e.get("dc:title"))

            # --- Description ---
            description = _label(
                e.get("shortDescription") or e.get("schema:description") or e.get("dc:description")
            )

            # --- Category: derive from @type, skip generic "Event" suffixes ---
            types = e.get("@type", [])
            if isinstance(types, str):
                types = [types]
            category = next(
                (t.split(":")[-1] for t in types if "event" not in t.lower() and "thing" not in t.lower() and ":" in t),
                "Tourisme",
            )

            # --- Location ---
            locations = e.get("isLocatedAt", [])
            if isinstance(locations, dict):
                locations = [locations]

            lat, lon, venue_name, city = "", "", "", ""
            if locations:
                loc = locations[0]
                geo = loc.get("schema:geo", {})
                lat = str(geo.get("schema:latitude", ""))
                lon = str(geo.get("schema:longitude", ""))

                addresses = loc.get("schema:address") or loc.get("hasAddress") or []
                if isinstance(addresses, dict):
                    addresses = [addresses]
                if addresses:
                    addr = addresses[0]
                    city = _label(addr.get("schema:addressLocality") or addr.get("addressLocality"))

                venue_name = _label(loc.get("schema:name") or loc.get("rdfs:label"))

            # --- Dates ---
            date_raw = e.get("startDate") or e.get("schema:startDate") or ""
            if isinstance(date_raw, list):
                date_raw = date_raw[0] if date_raw else ""
            date = str(date_raw)[:10] if date_raw else ""

            # --- Image ---
            image = ""
            media = e.get("hasRepresentation") or e.get("schema:image") or []
            if isinstance(media, dict):
                media = [media]
            if isinstance(media, list) and media:
                first = media[0]
                if isinstance(first, dict):
                    raw_url = first.get("schema:url") or first.get("ebucore:locator") or ""
                    image = raw_url[0] if isinstance(raw_url, list) else str(raw_url)
                elif isinstance(first, str):
                    image = first

            uid = str(e.get("@id", "")).rstrip("/").split("/")[-1]

            event = Event(
                id=f"dt-{uid}",
                title=title,
                description=description,
                category=category,
                date=date,
                time="",
                location={"name": venue_name, "city": city, "lat": lat, "lon": lon},
                price=0,
                image=image,
                source="datatourisme",
            )
            normalized.append(event.to_json())
        except Exception as ex:
            print(f"[DataTourisme Normalizer] Skipping object {e.get('@id', '?')}: {ex}")

    return normalized
