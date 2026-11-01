import os
import sys
import unittest
from pathlib import Path
from unittest.mock import Mock, patch


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost/test")
os.environ.setdefault("JWT_SECRET", "test-secret-that-is-long-enough-for-tests")

import db


class JobCancellationTests(unittest.TestCase):
    @patch("db.get_db_connection")
    def test_cancelled_job_cannot_be_completed(self, get_connection):
        cursor = Mock(rowcount=0)
        connection = Mock()
        connection.cursor.return_value = cursor
        get_connection.return_value = connection

        updated = db.update_job_result("job-1", {"secret": "result"})

        self.assertFalse(updated)
        sql = cursor.execute.call_args.args[0]
        self.assertIn("status <> 'cancelled'", sql)
