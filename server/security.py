"""HTTP authentication and authorization decorators."""

from functools import wraps

import jwt
from flask import jsonify, request

import db
from config import settings


def auth_required(view):
    @wraps(view)
    def decorated(*args, **kwargs):
        authorization = request.headers.get("Authorization", "")
        if not authorization:
            return jsonify({"error": "Authentication token missing"}), 401

        token = authorization.removeprefix("Bearer ").strip()
        try:
            claims = jwt.decode(
                token,
                settings.jwt_secret,
                algorithms=[settings.jwt_algorithm],
            )
            user = db.get_user_by_id(claims.get("user_id"))
            if not user:
                return jsonify({"error": "User no longer exists in system. Please sign up again."}), 401
            request.user = claims
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401

        return view(*args, **kwargs)

    return decorated


def require_role(role):
    def decorator(view):
        @wraps(view)
        def decorated(*args, **kwargs):
            if not hasattr(request, "user") or request.user.get("role") != role:
                return jsonify({"error": f"Access denied. Requires {role} role."}), 403
            return view(*args, **kwargs)

        return decorated

    return decorator


def require_any_role(*roles):
    allowed_roles = set(roles)

    def decorator(view):
        @wraps(view)
        def decorated(*args, **kwargs):
            current_role = getattr(request, "user", {}).get("role")
            if current_role not in allowed_roles:
                return jsonify({"error": "Access denied for this account role."}), 403
            return view(*args, **kwargs)

        return decorated

    return decorator
