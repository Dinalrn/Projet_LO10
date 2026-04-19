# normalizers/datagouv_normalizer.py
# Maps data.culture.gouv.fr (Opendatasoft) records to the unified Event schema.
#
# Field names come from the "agenda-culturel-odp" dataset schema.
# If the dataset fields change, update the _field() helper calls below.

from models.events_model import Event


def _field(fields: dict, *keys, default="") -> str:
    """Return the first non-empty value found among the candidate field names."""
    for key in keys:
        val = fields.get(key)
        if val is not None and str(val).strip():
            return str(val).strip()
    return default


def normalize_datagouv(records: list) -> list:
    normalized = []

    for record in records:
        try:
            fields = record.get("fields", {})

            # Coordinates: Opendatasoft returns [lat, lon] as a list
            coords = fields.get("geolocalisation") or fields.get("coordinates") or fields.get("geo_point_2d")
            lat, lon = "", ""
            if isinstance(coords, list) and len(coords) == 2:
                lat, lon = str(coords[0]), str(coords[1])

            location = {
                "name": _field(fields, "lieu", "nom_du_lieu", "nom_lieu", "lieu_nom"),
                "city": _field(fields, "commune", "ville", "city"),
                "lat": lat,
                "lon": lon,
            }

            date_raw = _field(fields, "date_debut", "date_de_debut", "date_start", "date")
            date = date_raw[:10] if date_raw else ""
            time = _field(fields, "heure_debut", "heure_de_debut", "heure")

            event = Event(
                id=f"dgv-{record.get('recordid', '')}",
                title=_field(fields, "titre_de_l_evenement", "titre", "nom", "title", default="Sans titre"),
                description=_field(fields, "description", "descriptif", "resume"),
                category=_field(fields, "categorie", "type_de_manifestation", "discipline", default="Culturel"),
                date=date,
                time=time,
                location=location,
                price=0,
                image=_field(fields, "image", "visuel", "photo", "illustration"),
                source="data.culture.gouv.fr",
            )
            normalized.append(event.to_json())
        except Exception as ex:
            print(f"[DataCulture Normalizer] Skipping record {record.get('recordid')}: {ex}")

    return normalized
