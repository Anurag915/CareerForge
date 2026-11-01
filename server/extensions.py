"""Shared Flask extension instances.

Extensions are created without an application so route modules can import them
without causing startup side effects or circular imports.
"""

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_socketio import SocketIO
from config import settings


limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri=settings.rate_limit_storage_uri,
)
socketio = SocketIO()
