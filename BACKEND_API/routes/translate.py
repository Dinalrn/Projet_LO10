import requests
from fastapi import APIRouter
from pydantic import BaseModel
from configuration import settings
from utils.cache_utils import cache_get, cache_set

router = APIRouter(prefix="/translate", tags=["translate"])


class TranslateRequest(BaseModel):
    text: str
    target_lang: str = "EN"


@router.post("")
def translate(body: TranslateRequest):
    cache_params = {"text": body.text, "target_lang": body.target_lang}
    cached = cache_get("translate", cache_params)
    if cached:
        return cached

    translated = body.text  # fallback: return original if DeepL fails
    try:
        resp = requests.post(
            settings.DEEPL_BASE_URL,
            headers={"Authorization": f"DeepL-Auth-Key {settings.DEEPL_API_KEY}"},
            json={"text": [body.text], "target_lang": body.target_lang},
            timeout=10,
        )
        resp.raise_for_status()
        translated = resp.json()["translations"][0]["text"]
    except Exception as e:
        print(f"[Translate] DeepL error, falling back to original: {e}")

    result = {"translated_text": translated}
    cache_set("translate", cache_params, result)
    return result
