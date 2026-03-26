# middlewares.jwt_middleware.py

from fastapi import Request
from fastapi.responses import JSONResponse
from jose import JWTError

from utils.jwt_utils import verify_jwt
from utils.logger_utils import Logger

logger = Logger.get_logger("JWT-Middleware")

EXCLUDED_PATHS = {
    "/health",
    "/auth/login",
    "/docs",
    "/redoc",
    "/openapi.json",
}


async def jwt_auth_middleware(request: Request, call_next):
    """
    JWT authentication middleware
    """

    path = request.url.path

    # Skip auth for excluded routes
    if path in EXCLUDED_PATHS:
        return await call_next(request)

    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        logger.warning("Missing or invalid Authorization header")
        return JSONResponse(
            status_code=401,
            content={"detail": "Authorization header missing or invalid"},
        )

    token = auth_header.split(" ")[1]

    try:
        payload = verify_jwt(token)
        # Store user info in request state
        request.state.user = payload

    except JWTError:
        return JSONResponse(
            status_code=401,
            content={"detail": "Invalid or expired token"},
        )

    return await call_next(request)
