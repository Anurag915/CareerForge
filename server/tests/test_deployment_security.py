import unittest
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]


class DeploymentSecurityTests(unittest.TestCase):
    def test_backend_environment_file_is_excluded_from_images(self):
        dockerignore = (REPOSITORY_ROOT / "server" / ".dockerignore").read_text()
        self.assertIn(".env", {line.strip() for line in dockerignore.splitlines()})

    def test_compose_does_not_hardcode_jwt_secret(self):
        compose = (REPOSITORY_ROOT / "docker-compose.yml").read_text()
        self.assertNotIn("JWT_SECRET=", compose)

    def test_readme_discloses_remote_ai_processing(self):
        readme = (REPOSITORY_ROOT / "README.md").read_text(encoding="utf-8")
        self.assertIn("sent to Google Gemini", readme)
        self.assertNotIn("All analysis is performed locally", readme)
