# pyrefly: ignore [missing-import]
from fastapi import FastAPI, Request
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from fastapi.responses import JSONResponse
# pyrefly: ignore [missing-import]
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings
from app.api.routes import router as api_router
from app.utils.logger import get_logger
from app.db import init_db

logger = get_logger("Main")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for Big-O Code Complexity Analysis, AST Parsing, Optimization Engine, and Verification Sandbox."
)

@app.on_event("startup")
def on_startup():
    logger.info("Initializing OPTICODE Database...")
    init_db()
    logger.info("Database initialized successfully.")

# Enable CORS for Web Application Frontend
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-RateLimit-Limit", "X-RateLimit-Remaining"],
    expose_headers=["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset", "Retry-After"],
)

# Include API Router
app.include_router(api_router, prefix=settings.API_PREFIX)

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception caught on route {request.url}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"success": False, "error_message": f"Internal Server Error: {str(exc)}"}
    )

@app.get("/")
def root():
    return {
        "message": "Welcome to the Big-O Optimization Checker API",
        "docs_url": "/docs",
        "health_url": f"{settings.API_PREFIX}/health"
    }

if __name__ == "__main__":
    # pyrefly: ignore [missing-import]
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
