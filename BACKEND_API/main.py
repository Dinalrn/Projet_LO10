# main.py - Exemple API main script

#Route event 
from routes.events import router as events_router

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from configuration import settings
from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend

from utils.logger_utils import Logger

from middlewares.jwt_middleware import jwt_auth_middleware

from routes.test import test
from routes.testid import testid
from routes.postgre_interactions import postgre_router
from routes.auth import router as auth_router

logger = Logger.get_logger("API main")

# FastAPI creation
app = FastAPI(
    title="Exemple API",
    description="Exemple API for interaction with users via frontend or HTTP requests",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)


# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list, # for now [*] all origins are allowed
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Middlewares
# JWT Authentification
@app.middleware("http")
async def jwt_middleware(request: Request, call_next):
    return await jwt_auth_middleware(request, call_next)


#Allowed IP, For instance might be interesting to restrict to Private IP only our a specific subset, not MVP but code for the futur implementation"

# allowed_ips = ["127.0.0.1/32", ...] 

# @app.middleware("http")
# async def restrict_ip_middleware(request: Request, call_next):
#     client_host = ipaddress.ip_address(request.client.host)
#     allowed_networks = [ipaddress.ip_network(ip) for ip in allowed_ips]

#     if not any(client_host in net for net in allowed_networks):
#         logger.warning(f"Accès refusé pour l'IP: {client_host}")
#         # On renvoie directement une réponse JSON au lieu de lever HTTPException
#         return JSONResponse(
#             status_code=403,
#             content={"detail": "Access forbidden: IP not allowed"}
#         )
#     return await call_next(request)

@app.on_event("startup")
async def startup():
    """Cash setup"""
    FastAPICache.init(InMemoryBackend(), prefix="fastapi-cache")
    logger.info("✓ FastAPI Cache configured")
    logger.info("✓ Application started")

@app.on_event("shutdown")
async def shutdown():
    """Cash Clean"""
    logger.info("Application stoped")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health Check route for the API"""
    return {"status": "healthy", "service": "homecloud-api"}

# debug endpoint
@app.get("/debug/auth-test")
async def auth_test():
    """Simple test"""
    return {"message": "API accessible", "timestamp": "2026-01-01"}


# ROUTING
app.include_router(test)
app.include_router(testid)
app.include_router(postgre_router)
app.include_router(auth_router)
#ajout pr ev 
app.include_router(events_router)




# Root Route 
@app.get("/")
async def root():
    """API Home page"""
    return {
        "message": "Exemple API",
        "version": "1.0.0",
        "endpoints": {
            "test": "/test",
            "testid": "/testid/{test_id}",
            "health": "/health"
        }
    }

@app.get("/")
async def root():
    return {"message": "Welcome to Exemple API !"}


#API Starting function
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )