import os
import sys
import unittest
from pathlib import Path


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost/test")
os.environ.setdefault("JWT_SECRET", "test-secret-that-is-long-enough-for-tests")

from config import _as_bool, _as_list, settings


class ConfigParsingTests(unittest.TestCase):
    def test_boolean_values(self):
        self.assertTrue(_as_bool("true"))
        self.assertTrue(_as_bool("1"))
        self.assertFalse(_as_bool("false"))
        self.assertFalse(_as_bool(None))

    def test_comma_separated_values_are_normalized(self):
        self.assertEqual(
            _as_list("https://one.example/, https://two.example", ()),
            ("https://one.example", "https://two.example"),
        )

    def test_privileged_signup_is_disabled_by_default(self):
        self.assertFalse(settings.allow_public_hiring_manager_signup)


if __name__ == "__main__":
    unittest.main()
