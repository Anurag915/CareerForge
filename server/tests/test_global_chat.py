import os
import sys
import unittest
from pathlib import Path
from unittest.mock import call, patch

import jwt


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost/test")
os.environ.setdefault("JWT_SECRET", "test-secret-that-is-long-enough-for-tests")

from config import settings


class GlobalChatTests(unittest.TestCase):
    def test_messages_use_active_session_signature(self):
        with patch("db.init_db"):
            import api

        token = jwt.encode(
            {"user_id": "user-1"}, settings.jwt_secret, algorithm=settings.jwt_algorithm
        )
        with patch("security.db.get_user_by_id", return_value={"id": "user-1"}), patch(
            "api.rag.query_global_index", return_value="owned context"
        ), patch(
            "api.rag.global_index_exists", return_value=True
        ), patch("api.llm.get_global_chat_response", return_value="answer"), patch(
            "api.db.get_chat_session", return_value=None
        ), patch("api.db.create_chat_session", return_value="session-1"), patch(
            "api.db.save_chat_message"
        ) as save_message:
            response = api.app.test_client().post(
                "/global-chat",
                json={"question": "Help me"},
                headers={"Authorization": f"Bearer {token}"},
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            save_message.call_args_list,
            [
                call("session-1", "user", "Help me"),
                call("session-1", "assistant", "answer"),
            ],
        )
