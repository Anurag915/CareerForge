"""Validation helpers for untrusted uploaded documents."""

from pathlib import Path


PDF_SIGNATURE = b"%PDF-"
PDF_MIME_TYPES = {"application/pdf", "application/x-pdf"}


class InvalidUpload(ValueError):
    pass


def validate_pdf_upload(file_storage) -> None:
    filename = file_storage.filename or ""
    if Path(filename).suffix.lower() != ".pdf":
        raise InvalidUpload("Only PDF files are accepted")
    if file_storage.mimetype and file_storage.mimetype not in PDF_MIME_TYPES:
        raise InvalidUpload("The uploaded file is not a PDF")

    signature = file_storage.stream.read(len(PDF_SIGNATURE))
    file_storage.stream.seek(0)
    if signature != PDF_SIGNATURE:
        raise InvalidUpload("The uploaded file has an invalid PDF signature")
