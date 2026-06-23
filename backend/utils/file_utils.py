import os
import uuid
from werkzeug.utils import secure_filename

ALLOWED_EXTENSIONS = {"pdf"}

def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def save_upload(file, upload_folder: str) -> tuple:
    """Save uploaded file with a unique name. Returns (filename, filepath)."""
    original  = secure_filename(file.filename)
    unique    = f"{uuid.uuid4().hex}_{original}"
    filepath  = os.path.join(upload_folder, unique)
    os.makedirs(upload_folder, exist_ok=True)
    file.save(filepath)
    return unique, filepath
