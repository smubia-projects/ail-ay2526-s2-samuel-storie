"""Project adapter over the shared rate-limit engine.

The engine (`rate_limit_engine.py`) is vendored from
`shared/rate-limit/engine/fastapi/`. This adapter just supplies Storie's slug and
buckets; the engine handles caching, X-Forwarded-For, event mode, the kill
switch, and fail-open.
"""

from __future__ import annotations

from fastapi import Request

from app.config import settings
from app.rate_limit_engine import RateLimiter

limiter = RateLimiter(
    # Slug = full project folder name (canonical identifier across code + sheet).
    project="ail-ay2526-s2-samuel-storie",
    buckets={
        "gen": settings.rate_limit_generate_max,
        "img": settings.rate_limit_image_max,
        "txt": settings.rate_limit_text_max,
    },
    redis_url=settings.redis_url,
    redis_token=settings.redis_token,
    default_window=settings.rate_limit_window_seconds,
)


def check_rate_limit(request: Request, bucket: str) -> None:
    limiter.enforce(request, bucket)
