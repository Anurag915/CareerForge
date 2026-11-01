import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

import jwt
from flask import Flask, jsonify, request


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost/test")
os.environ.setdefault("JWT_SECRET", "test-secret-that-is-long-enough-for-tests")

from config import settings
from security import auth_required


class AuthenticationDecoratorTests(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)

        @self.app.get("/protected")
        @auth_required
        def protected():
            return jsonify({"user_id": request.user["user_id"]})

        self.client = self.app.test_client()

    def test_missing_token_is_rejected(self):
        response = self.client.get("/protected")
        self.assertEqual(response.status_code, 401)

    @patch("security.db.get_user_by_id", return_value={"id": "user-1"})
    def test_valid_token_populates_request_user(self, _get_user):
        token = jwt.encode(
            {"user_id": "user-1"},
            settings.jwt_secret,
            algorithm=settings.jwt_algorithm,
        )
        response = self.client.get(
            "/protected",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {"user_id": "user-1"})


if __name__ == "__main__":
    unittest.main()
