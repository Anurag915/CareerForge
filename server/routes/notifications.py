from flask import Blueprint, jsonify, request

import db
from security import auth_required


notifications_bp = Blueprint("notifications", __name__)


@notifications_bp.get("/api/notifications")
@auth_required
def list_notifications():
    only_unread = request.args.get("unread") == "true"
    notifications = db.get_notifications(request.user["user_id"], only_unread)
    return jsonify(notifications)


@notifications_bp.get("/api/notifications/unread-count")
@auth_required
def unread_count():
    return jsonify({"count": db.get_unread_count(request.user["user_id"])})


@notifications_bp.post("/api/notifications/<notif_id>/read")
@auth_required
def mark_read(notif_id):
    db.mark_notification_read(notif_id, request.user["user_id"])
    return jsonify({"success": True})
