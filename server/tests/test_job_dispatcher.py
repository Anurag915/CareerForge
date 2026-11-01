import os
import sys
import threading
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock, patch


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost/test")
os.environ.setdefault("JWT_SECRET", "test-secret-that-is-long-enough-for-tests")

import job_dispatcher


class JobDispatcherTests(unittest.TestCase):
    def test_redis_configuration_uses_celery(self):
        task = Mock()
        with patch.object(
            job_dispatcher,
            "settings",
            SimpleNamespace(redis_url="redis://localhost", is_production=False),
        ):
            job_dispatcher.dispatch_job(task, "job-1", {"value": 1}, "user-1")

        task.apply_async.assert_called_once_with(
            args=["job-1", {"value": 1}, "user-1"],
            task_id="job-1",
        )

    def test_development_fallback_runs_task(self):
        completed = threading.Event()
        task = Mock(side_effect=lambda *_: completed.set())
        with patch.object(
            job_dispatcher,
            "settings",
            SimpleNamespace(redis_url="", is_production=False),
        ):
            job_dispatcher.dispatch_job(task, "job-2", {}, "user-2")

        self.assertTrue(completed.wait(timeout=1))
        task.assert_called_once_with("job-2", {}, "user-2")

    def test_production_requires_queue(self):
        with patch.object(
            job_dispatcher,
            "settings",
            SimpleNamespace(redis_url="", is_production=True),
        ):
            with self.assertRaises(RuntimeError):
                job_dispatcher.dispatch_job(Mock(), "job-3", {}, "user-3")


if __name__ == "__main__":
    unittest.main()
