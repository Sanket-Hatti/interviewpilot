import os
import uuid
import re
from fastapi import UploadFile

ALLOWED_EXTENSIONS = {"pdf"}

def sanitize_filename(filename: str) -> str:
    """Strip out unsafe path characters."""
    clean = re.sub(r"[^a-zA-Z0-9_.-]", "_", filename)
    return clean.strip("._") or "file.pdf"

def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def save_upload(upload_file: UploadFile, upload_folder: str, max_size_bytes: int = 10 * 1024 * 1024) -> tuple[str, str]:
    """Save FastAPI UploadFile with size limit and PDF signature check. Returns (filename, filepath)."""
    original = sanitize_filename(upload_file.filename or "resume.pdf")
    unique = f"{uuid.uuid4().hex}_{original}"
    filepath = os.path.join(upload_folder, unique)
    os.makedirs(upload_folder, exist_ok=True)
    
    total_size = 0
    first_chunk = True
    
    try:
        with open(filepath, "wb") as f:
            while True:
                chunk = upload_file.file.read(64 * 1024)
                if not chunk:
                    break
                if first_chunk:
                    # Validate PDF magic bytes (%PDF-)
                    if not chunk.startswith(b"%PDF"):
                        raise ValueError("Invalid file format. The file is not a valid PDF document.")
                    first_chunk = False
                total_size += len(chunk)
                if total_size > max_size_bytes:
                    raise ValueError(f"File size exceeds maximum allowed limit of {max_size_bytes // (1024 * 1024)}MB.")
                f.write(chunk)
    except Exception:
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except OSError:
                pass
        raise
        
    return unique, filepath
