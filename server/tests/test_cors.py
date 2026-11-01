import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch
import jwt


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost/test")
os.environ.setdefault("JWT_SECRET", "test-secret-that-is-long-enough-for-tests")
from config import settings


class CorsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with patch("db.init_db"):
            import api
        cls.client = api.app.test_client()

    def test_compare_preflight_allows_local_frontend(self):
        response = self.client.options(
            "/compare",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "authorization,content-type",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers.get("Access-Control-Allow-Origin"),
            "http://localhost:5173",
        )
        self.assertIn("authorization", response.headers.get("Access-Control-Allow-Headers", "").lower())

    def test_authentication_error_keeps_cors_headers(self):
        response = self.client.post(
            "/compare",
            json={},
            headers={"Origin": "http://localhost:5173"},
        )
        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            response.headers.get("Access-Control-Allow-Origin"),
            "http://localhost:5173",
        )

    def test_analyze_advanced_preflight_allows_multipart_post(self):
        response = self.client.options(
            "/analyze-advanced",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "authorization,content-type",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers.get("Access-Control-Allow-Origin"),
            "http://localhost:5173",
        )

    def test_oversized_upload_error_keeps_cors_headers(self):
        import api

        previous_limit = api.app.config["MAX_CONTENT_LENGTH"]
        api.app.config["MAX_CONTENT_LENGTH"] = 1
        try:
            token = jwt.encode(
                {"user_id": "user-1", "role": "candidate"},
                settings.jwt_secret,
                algorithm=settings.jwt_algorithm,
            )
            with patch("security.db.get_user_by_id", return_value={"id": "user-1"}):
                response = self.client.post(
                    "/analyze-advanced",
                    data=b"too large",
                    content_type="multipart/form-data",
                    headers={
                        "Origin": "http://localhost:5173",
                        "Authorization": f"Bearer {token}",
                    },
                )
        finally:
            api.app.config["MAX_CONTENT_LENGTH"] = previous_limit

        self.assertEqual(response.status_code, 413)
        self.assertEqual(
            response.headers.get("Access-Control-Allow-Origin"),
            "http://localhost:5173",
        )


if __name__ == "__main__":
    unittest.main()
