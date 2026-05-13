import time
from collections import deque
from threading import Lock

from app.app.settings import settings


class RateLimiter:
    """
    Sliding-window in-memory rate limiter.
    Tracks request timestamps per identifier and enforces a max RPM.
    """

    def __init__(self, max_requests: int = 10, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._buckets: dict[str, deque[float]] = {}
        self._lock = Lock()

    def check(self, identifier: str) -> bool:
        now = time.monotonic()
        cutoff = now - self.window_seconds

        with self._lock:
            if identifier not in self._buckets:
                self._buckets[identifier] = deque()

            bucket = self._buckets[identifier]

            while bucket and bucket[0] < cutoff:
                bucket.popleft()

            if len(bucket) >= self.max_requests:
                return False

            bucket.append(now)

            empty_keys = [
                k for k, v in self._buckets.items() if k != identifier and not v
            ]
            for k in empty_keys:
                del self._buckets[k]

            return True


rate_limiter = RateLimiter(max_requests=settings.OPENAI_RATE_LIMIT_RPM)
