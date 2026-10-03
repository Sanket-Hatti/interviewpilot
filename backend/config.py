import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./interviewpilot.db"
    )

    # JWT
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "dev-secret-change-in-production")
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRES_HOURS: int = 24

    # AI
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # Uploads
    MAX_CONTENT_LENGTH: int = 10 * 1024 * 1024  # 10 MB
    UPLOAD_FOLDER: str = os.path.join(os.path.dirname(__file__), "uploads")
    ALLOWED_EXTENSIONS: set = {"pdf"}

    # CORS
    CORS_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
        if origin.strip()
    ]

settings = Settings()
os.makedirs(settings.UPLOAD_FOLDER, exist_ok=True)
