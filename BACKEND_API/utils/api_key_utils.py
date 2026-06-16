from fastapi import Header, HTTPException

from configuration import settings


def verify_api_key(x_wannago_key: str | None = Header(None, alias="X-WannaGo-Key")) -> None:
    """
    FastAPI dependency that enforces the X-WannaGo-Key header.
    Raises 401 if the header is absent or does not match PUBLIC_API_KEY.
    """
    if not x_wannago_key or x_wannago_key != settings.PUBLIC_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")
