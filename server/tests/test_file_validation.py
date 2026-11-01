import io
import os
import sys
import unittest
from pathlib import Path

from werkzeug.datastructures import FileStorage


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost/test")
os.environ.setdefault("JWT_SECRET", "test-secret-that-is-long-enough-for-tests")

from file_validation import InvalidUpload, validate_pdf_upload


class PdfUploadValidationTests(unittest.TestCase):
    def upload(self, content=b"%PDF-1.7", filename="resume.pdf", mimetype="application/pdf"):
        return FileStorage(stream=io.BytesIO(content), filename=filename, content_type=mimetype)

    def test_valid_pdf_is_accepted_and_stream_is_rewound(self):
        upload = self.upload()
        validate_pdf_upload(upload)
        self.assertEqual(upload.stream.tell(), 0)

    def test_spoofed_pdf_is_rejected(self):
        with self.assertRaises(InvalidUpload):
            validate_pdf_upload(self.upload(content=b"not-a-pdf"))

    def test_non_pdf_extension_is_rejected(self):
        with self.assertRaises(InvalidUpload):
            validate_pdf_upload(self.upload(filename="resume.txt"))
