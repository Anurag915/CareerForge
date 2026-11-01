"""Gunicorn production defaults for the Flask-SocketIO application."""

import os


bind = f"0.0.0.0:{os.getenv('PORT', '5000')}"
worker_class = "geventwebsocket.gunicorn.workers.GeventWebSocketWorker"

# Flask-SocketIO requires one Gunicorn worker per container. Scale by adding
# containers behind a load balancer; Redis carries Socket.IO events between them.
workers = 1
worker_connections = int(os.getenv("WORKER_CONNECTIONS", "1000"))
timeout = int(os.getenv("GUNICORN_TIMEOUT", "120"))
graceful_timeout = int(os.getenv("GUNICORN_GRACEFUL_TIMEOUT", "30"))
keepalive = int(os.getenv("GUNICORN_KEEPALIVE", "5"))
max_requests = int(os.getenv("GUNICORN_MAX_REQUESTS", "1000"))
max_requests_jitter = int(os.getenv("GUNICORN_MAX_REQUESTS_JITTER", "100"))
accesslog = "-"
errorlog = "-"
capture_output = True
