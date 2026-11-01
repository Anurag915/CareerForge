"""Logging and request tracing helpers."""

from __future__ import annotations

import json
import logging
import time
import uuid
from datetime import datetime, timezone

from flask import Flask, g, request


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False)


def configure_logging(level: str) -> None:
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(level)


def register_request_tracing(app: Flask) -> None:
    @app.before_request
    def start_request_timer() -> None:
        g.request_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex
        g.request_started_at = time.perf_counter()

    @app.after_request
    def finish_request(response):
        response.headers["X-Request-ID"] = g.get("request_id", "")
        app.logger.info(
            "request_completed method=%s path=%s status=%s duration_ms=%.2f request_id=%s",
            request.method,
            request.path,
            response.status_code,
            (time.perf_counter() - g.get("request_started_at", time.perf_counter())) * 1000,
            g.get("request_id", ""),
        )
        return response
