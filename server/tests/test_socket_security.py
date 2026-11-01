import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

import jwt
from flask import Flask, session


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost/test")
os.environ.setdefault("JWT_SECRET", "test-secret-that-is-long-enough-for-tests")

from config import settings
from socket_events import authenticate_socket, join_user_room


class SocketAuthenticationTests(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.secret_key = settings.jwt_secret

    def test_connection_without_token_is_rejected(self):
        with self.app.test_request_context("/"):
            self.assertFalse(authenticate_socket({}))

    @patch("socket_events.join_room")
    @patch("socket_events.db.get_user_by_id", return_value={"id": "owner"})
    def test_room_is_derived_from_signed_token(self, _get_user, join_room):
        token = jwt.encode({"user_id": "owner"}, settings.jwt_secret, algorithm=settings.jwt_algorithm)
        with self.app.test_request_context("/"):
            self.assertTrue(authenticate_socket({"token": token}))
            join_user_room({"user_id": "attacker-selected-user"})
            self.assertEqual(session["socket_user_id"], "owner")
        self.assertTrue(all(call.args[0] == "user_owner" for call in join_room.call_args_list))


class JobEmissionTests(unittest.TestCase):
    @patch("tasks.socket_emitter.emit")
    def test_job_event_is_scoped_to_owner_room(self, emit):
        from tasks import emit_job

        emit_job("job-1", "owner", {"status": "completed"})
        self.assertEqual(emit.call_args.kwargs["room"], "user_owner")
