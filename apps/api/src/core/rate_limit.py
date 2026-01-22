"""Simple in-memory rate limiter for API endpoints."""
from collections import defaultdict, deque
import time
from fastapi import HTTPException, status


class RateLimiter:
    """In-memory sliding window rate limiter."""

    def __init__(self, max_calls: int, period_seconds: int) -> None:
        self.max_calls = max_calls
        self.period_seconds = period_seconds
        self.calls = defaultdict(deque)

    def enforce(self, key: str) -> None:
        now = time.monotonic()
        window = self.calls[key]

        while window and now - window[0] > self.period_seconds:
            window.popleft()

        if len(window) >= self.max_calls:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many approval actions, please slow down",
            )

        window.append(now)
