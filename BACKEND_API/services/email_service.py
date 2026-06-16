from datetime import datetime

import httpx

from configuration import settings
from utils.logger_utils import Logger

logger = Logger.get_logger("email-service")

_BREVO_URL = "https://api.brevo.com/v3/smtp/email"
_SENDER = {"name": "WannaGo", "email": "dina.louarn@utt.fr"}


# ── HTML builder ──────────────────────────────────────────────────────────────

def _weather_block(weather_data: dict, event_date: str) -> str:
    """Return an HTML <tr> with the day's forecast, or empty string if not found."""
    for day in weather_data.get("daily", []):
        if datetime.utcfromtimestamp(day["date"]).strftime("%Y-%m-%d") == event_date:
            desc = day.get("description", "").capitalize()
            t_min = day.get("temp_min", "?")
            t_max = day.get("temp_max", "?")
            pop = day.get("pop", 0)
            icon = day.get("icon", "")
            icon_html = (
                f'<img src="https://openweathermap.org/img/wn/{icon}@2x.png" '
                f'width="40" height="40" alt="{desc}" style="vertical-align:middle;" />'
                if icon else ""
            )
            rain_note = f" · {pop}% rain" if pop > 0 else ""
            return f"""
            <tr>
              <td style="padding:0 24px 16px;">
                <table width="100%" cellpadding="0" cellspacing="0"
                       style="background:#ede9fe;border-radius:12px;">
                  <tr>
                    <td style="padding:12px 16px;">
                      <span style="font-size:13px;color:#6b7280;display:block;margin-bottom:4px;">
                        🌤 Weather forecast
                      </span>
                      <div style="display:flex;align-items:center;gap:10px;">
                        {icon_html}
                        <div>
                          <p style="margin:0;font-size:14px;color:#1f2937;">{desc}</p>
                          <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">
                            {t_min:.0f}°C – {t_max:.0f}°C{rain_note}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>"""
    return ""


def _build_html(event_data: dict, weather_data: dict | None) -> str:
    title       = event_data.get("title", "Untitled event")
    description = event_data.get("description", "")
    date        = event_data.get("date", "")
    time        = event_data.get("time", "")
    price       = event_data.get("price", 0)
    location    = event_data.get("location", {})
    venue       = location.get("name", "")
    city        = location.get("city", "")
    lat         = location.get("lat", "")
    lon         = location.get("lon", "")

    # Human-readable date
    date_display = date
    if date:
        try:
            date_display = datetime.strptime(date, "%Y-%m-%d").strftime("%A, %B %d %Y")
        except ValueError:
            pass
    time_suffix = f" · {time[:5]}" if time else ""

    # Google Maps link
    if lat and lon and lat not in ("0", "") and lon not in ("0", ""):
        maps_url = f"https://www.google.com/maps?q={lat},{lon}"
    else:
        query = "+".join(filter(None, [venue, city])).replace(" ", "+")
        maps_url = f"https://www.google.com/maps/search/{query}"

    location_text = " · ".join(filter(None, [venue, city]))
    price_text    = f"{price} €" if price and price > 0 else "Free admission"

    desc_row = (
        f'<tr><td style="padding:0 24px 16px;">'
        f'<p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">{description}</p>'
        f"</td></tr>"
    ) if description else ""

    location_row = (
        f'<tr><td style="padding:12px 16px;border-bottom:1px solid #ede9fe;">'
        f'<span style="font-size:13px;color:#6b7280;display:block;margin-bottom:2px;">📍 Location</span>'
        f'<strong style="font-size:14px;color:#1f2937;">{location_text}</strong>'
        f"</td></tr>"
    ) if location_text else ""

    weather_html = _weather_block(weather_data, date) if weather_data else ""

    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f5f3ff;font-family:system-ui,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;padding:32px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0"
           style="background:#fff;border-radius:16px;overflow:hidden;
                  box-shadow:0 4px 24px rgba(109,40,217,.08);">

      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#7c3aed,#4c1d95);
                   padding:28px 24px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">🎭 WannaGo</h1>
          <p style="margin:6px 0 0;color:#ddd6fe;font-size:13px;">Your event details</p>
        </td>
      </tr>

      <!-- Title -->
      <tr>
        <td style="padding:24px 24px 8px;">
          <h2 style="margin:0;color:#1f2937;font-size:20px;font-weight:700;">{title}</h2>
        </td>
      </tr>

      {desc_row}

      <!-- Info grid -->
      <tr>
        <td style="padding:0 24px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#f5f3ff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:12px 16px;border-bottom:1px solid #ede9fe;">
                <span style="font-size:13px;color:#6b7280;display:block;margin-bottom:2px;">📅 Date</span>
                <strong style="font-size:14px;color:#1f2937;">{date_display}{time_suffix}</strong>
              </td>
            </tr>
            {location_row}
            <tr>
              <td style="padding:12px 16px;">
                <span style="font-size:13px;color:#6b7280;display:block;margin-bottom:2px;">🎟️ Price</span>
                <strong style="font-size:14px;color:#1f2937;">{price_text}</strong>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      {weather_html}

      <!-- Maps button -->
      <tr>
        <td style="padding:0 24px 24px;text-align:center;">
          <a href="{maps_url}" target="_blank"
             style="display:inline-block;background:#7c3aed;color:#fff;
                    text-decoration:none;padding:12px 28px;border-radius:10px;
                    font-size:14px;font-weight:600;">
            📍 Open in Google Maps
          </a>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f9fafb;padding:16px 24px;text-align:center;
                   border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            Sent by WannaGo — your cultural events companion.
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>"""


# ── Public API ────────────────────────────────────────────────────────────────

def send_event_details(
    recipient_email: str,
    recipient_name: str,
    event_data: dict,
    weather_data: dict | None = None,
) -> None:
    """Send event details via Brevo. Never raises — logs errors instead."""
    if not settings.BREVO_API_KEY:
        logger.warning("[Email] BREVO_API_KEY not set — skipping send.")
        return

    title = event_data.get("title", "Your event")
    payload = {
        "sender": _SENDER,
        "to": [{"email": recipient_email, "name": recipient_name}],
        "subject": f"🎭 {title} — WannaGo",
        "htmlContent": _build_html(event_data, weather_data),
    }

    try:
        with httpx.Client(timeout=15) as client:
            resp = client.post(
                _BREVO_URL,
                json=payload,
                headers={"api-key": settings.BREVO_API_KEY, "Content-Type": "application/json"},
            )
            resp.raise_for_status()
            logger.info(f"[Email] Sent to {recipient_email} (HTTP {resp.status_code})")
    except Exception as e:
        logger.error(f"[Email] Brevo error sending to {recipient_email}: {e}")
