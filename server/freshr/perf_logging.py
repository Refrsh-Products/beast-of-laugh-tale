"""Temporary request-timing middleware for the pre-load-test performance
baseline (RPS/p95 per endpoint). Safe to remove once the baseline is captured.
"""

import logging
import time

logger = logging.getLogger("perf")


class RequestPerfLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.monotonic()
        response = self.get_response(request)
        duration_ms = (time.monotonic() - start) * 1000
        endpoint = request.resolver_match.route if request.resolver_match else request.path
        logger.info("", extra={
            "endpoint": endpoint,
            "method": request.method,
            "status": response.status_code,
            "duration_ms": round(duration_ms, 2),
        })
        return response
