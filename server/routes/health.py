from flask import Blueprint, current_app, jsonify

import db
from extensions import limiter


health_bp = Blueprint("health", __name__)


@health_bp.get("/health/live")
@limiter.exempt
def live():
    return jsonify({"status": "ok", "service": "careerforge-api"})


@health_bp.get("/health/ready")
@limiter.exempt
def ready():
    connection = None
    try:
        connection = db.get_db_connection()
        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        return jsonify({"status": "ready"})
    except Exception:
        current_app.logger.exception("readiness_check_failed")
        return jsonify({"status": "not_ready"}), 503
    finally:
        if connection is not None:
            connection.close()
