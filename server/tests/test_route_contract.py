import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost/test")
os.environ.setdefault("JWT_SECRET", "test-secret-that-is-long-enough-for-tests")


class RouteContractTests(unittest.TestCase):
    def test_public_route_contract_is_preserved(self):
        with patch("db.init_db"):
            import api

        routes = {rule.rule for rule in api.app.url_map.iter_rules()}
        expected = {
            "/health/live",
            "/health/ready",
            "/signup",
            "/login",
            "/refresh",
            "/upload",
            "/resumes",
            "/analyze-advanced",
            "/api/jobs",
            "/api/notifications",
            "/api/chat/sessions",
        }
        self.assertTrue(expected.issubset(routes))


if __name__ == "__main__":
    unittest.main()
