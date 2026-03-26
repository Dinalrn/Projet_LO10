# utils.jwt_utils.py

from datetime import datetime, timezone
from jose import JWTError, jwt

from configuration import secrets, settings
from utils.logger_utils import Logger

logger = Logger.get_logger("JWT")

ALGORITHM = settings.ALGORITHM


def verify_jwt(token: str) -> dict:
    """
    Verify and decode JWT token
    """
    try:
        payload = jwt.decode(
            token,
            secrets.JWT_SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        exp = payload.get("exp")
        if exp and datetime.fromtimestamp(exp, tz=timezone.utc) < datetime.now(tz=timezone.utc):
            logger.warning("Expired JWT token")
            raise JWTError("Token expired")

        return payload

    except JWTError as e:
        logger.warning(f"JWT validation failed: {e}")
        raise