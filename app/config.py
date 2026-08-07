import os
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field

def _get_env_float(key: str, default: float) -> float:
    val = os.getenv(key)
    if val is None or not val.strip():
        return default
    try:
        return float(val)
    except ValueError:
        return default

def _get_env_int(key: str, default: int) -> int:
    val = os.getenv(key)
    if val is None or not val.strip():
        return default
    try:
        return int(val)
    except ValueError:
        return default

def _get_env_bool(key: str, default: bool) -> bool:
    val = os.getenv(key)
    if val is None or not val.strip():
        return default
    return val.strip().lower() in ("true", "1", "yes", "on")

class Settings(BaseModel):
    PROJECT_NAME: str = "Big-O Optimization Checker Backend"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"
    
    # Sandbox configuration
    SANDBOX_DOCKER_IMAGE: str = Field(default_factory=lambda: os.getenv("SANDBOX_DOCKER_IMAGE", "bigo-sandbox:latest"))
    SANDBOX_TIMEOUT_SECONDS: float = Field(default_factory=lambda: _get_env_float("SANDBOX_TIMEOUT_SECONDS", 5.0))
    SANDBOX_MEMORY_LIMIT: str = Field(default_factory=lambda: os.getenv("SANDBOX_MEMORY_LIMIT", "128m"))
    SANDBOX_NCPU: float = Field(default_factory=lambda: _get_env_float("SANDBOX_NCPU", 1.0))
    MAX_CODE_LENGTH: int = Field(default_factory=lambda: _get_env_int("MAX_CODE_LENGTH", 20000))
    
    # Execution Fallback
    ALLOW_LOCAL_FALLBACK: bool = Field(default_factory=lambda: _get_env_bool("ALLOW_LOCAL_FALLBACK", True))

settings = Settings()
