"""Authenticated Socket.IO event handlers."""

import jwt
from flask import current_app, session
from flask_socketio import join_room

import db
from config import settings
from extensions import socketio


@socketio.on("connect")
def authenticate_socket(auth):
    token = (auth or {}).get("token", "").removeprefix("Bearer ").strip()
    if not token:
        return False
    try:
        claims = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        user_id = claims.get("user_id")
        if not user_id or not db.get_user_by_id(user_id):
            return False
        session["socket_user_id"] = user_id
        join_room(f"user_{user_id}")
        return True
    except jwt.InvalidTokenError:
        return False


@socketio.on("join")
def join_user_room(data):
    user_id = session.get("socket_user_id")
    if user_id:
        join_room(f"user_{user_id}")
        current_app.logger.debug("socket_room_joined user_id=%s", user_id)
