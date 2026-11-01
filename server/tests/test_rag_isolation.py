import os
import sys
import tempfile
import unittest
from contextlib import nullcontext
from pathlib import Path
from unittest.mock import patch


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost/test")
os.environ.setdefault("JWT_SECRET", "test-secret-that-is-long-enough-for-tests")

import rag


class RagTenantIsolationTests(unittest.TestCase):
    def test_indexing_requires_owner(self):
        with self.assertRaises(ValueError):
            rag.add_to_global_index("resume", "resume", "private text", None)

    def test_global_results_only_include_requested_tenant(self):
        metadata = [
            {"doc_id": "a", "user_id": "user-a", "type": "resume", "text": "alpha private"},
            {"doc_id": "b", "user_id": "user-b", "type": "resume", "text": "beta private"},
        ]
        fake_index = unittest.mock.Mock()
        fake_index.search.return_value = (None, [[0, 1]])
        fake_model = unittest.mock.Mock()
        fake_model.encode.return_value = [[0.0, 0.0]]

        with tempfile.TemporaryDirectory() as directory:
            index_path = Path(directory) / "global.index"
            metadata_path = Path(directory) / "global.metadata"
            index_path.touch()
            metadata_path.touch()
            with patch(
                "rag.global_index_paths", return_value=(str(index_path), str(metadata_path))
            ), patch("rag.get_vector_dependencies", return_value=(unittest.mock.Mock(read_index=unittest.mock.Mock(return_value=fake_index)), unittest.mock.Mock(array=lambda value: value))), patch(
                "rag.get_model", return_value=fake_model
            ), patch("rag.pickle.load", return_value=metadata), patch(
                "rag.global_index_lock", return_value=nullcontext()
            ):
                result = rag.query_global_index("user-a", "private")

        self.assertIn("alpha private", result)
        self.assertNotIn("beta private", result)
