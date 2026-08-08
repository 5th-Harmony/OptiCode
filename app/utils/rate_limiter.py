"""
IP-based Rate Limiter — Sliding Window Counter (In-Memory)
Industry standard: 5 login attempts per 15 min, 60 requests/min for general API.
"""
import time
import threading
from collections import defaultdict, deque
from typing import Dict, Deque
from app.utils.logger import get_logger

logger = get_logger("RateLimiter")


class SlidingWindowRateLimiter:
    """Thread-safe sliding window rate limiter keyed by IP address + route."""

    def __init__(self):
        self._lock = threading.Lock()
        # {(ip, route): deque of timestamps}
        self._windows: Dict[tuple, Deque[float]] = defaultdict(deque)
        # Blocked IPs with unblock time
        self._blocked: Dict[tuple, float] = {}

    def is_allowed(
        self,
        ip: str,
        route: str,
        max_requests: int,
        window_seconds: int,
        lockout_seconds: int = 0,
    ) -> tuple[bool, dict]:
        """
        Returns (allowed: bool, info: dict) with rate limit headers info.
        lockout_seconds: how long to hard-block after max_requests exceeded (0 = no hard block).
        """
        key = (ip, route)
        now = time.time()

        with self._lock:
            # Check hard block
            if key in self._blocked:
                unblock_at = self._blocked[key]
                if now < unblock_at:
                    retry_after = int(unblock_at - now)
                    logger.warning(f"[BLOCKED] IP={ip} route={route} retry_after={retry_after}s")
                    return False, {
                        "X-RateLimit-Limit": max_requests,
                        "X-RateLimit-Remaining": 0,
                        "X-RateLimit-Reset": int(unblock_at),
                        "Retry-After": retry_after,
                        "blocked": True,
                    }
                else:
                    # Unblock expired
                    del self._blocked[key]

            # Sliding window: evict timestamps outside window
            window = self._windows[key]
            cutoff = now - window_seconds
            while window and window[0] < cutoff:
                window.popleft()

            remaining = max(0, max_requests - len(window))

            if len(window) >= max_requests:
                # Exceeded — apply hard lockout if configured
                if lockout_seconds > 0:
                    self._blocked[key] = now + lockout_seconds
                    logger.warning(
                        f"[RATE_LIMIT] IP={ip} route={route} LOCKED OUT for {lockout_seconds}s"
                    )
                retry_after = int(window_seconds - (now - window[0])) if window else window_seconds
                return False, {
                    "X-RateLimit-Limit": max_requests,
                    "X-RateLimit-Remaining": 0,
                    "X-RateLimit-Reset": int(now + retry_after),
                    "Retry-After": max(retry_after, 1),
                    "blocked": False,
                }

            # Allowed — record request
            window.append(now)
            return True, {
                "X-RateLimit-Limit": max_requests,
                "X-RateLimit-Remaining": remaining - 1,
                "X-RateLimit-Reset": int(now + window_seconds),
                "Retry-After": 0,
                "blocked": False,
            }

    def reset(self, ip: str, route: str):
        """Manually reset counters for an IP+route (e.g., after successful login)."""
        key = (ip, route)
        with self._lock:
            self._windows.pop(key, None)
            self._blocked.pop(key, None)


# Singleton instance
rate_limiter = SlidingWindowRateLimiter()

# Pre-configured policies
POLICY_LOGIN = dict(max_requests=5, window_seconds=900, lockout_seconds=900)   # 5/15 min → 15 min lockout
POLICY_OPTIMIZE = dict(max_requests=30, window_seconds=60, lockout_seconds=0)  # 30/min
POLICY_GENERAL = dict(max_requests=120, window_seconds=60, lockout_seconds=0)  # 120/min
