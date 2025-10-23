import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Application
    APP_NAME = "Sigmoid GenAI Incident Management"
    VERSION = "1.0.0"
    DEBUG = os.getenv("DEBUG", "False").lower() == "true"
    
    # Google AI Studio
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
    GEMINI_MODEL = "gemini-pro"
    
    # Database
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./incident_management.db")
    
    # Security
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 30
    
    # CORS
    ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    
    # File Upload
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    UPLOAD_DIR = "uploads"
    
    # AI Configuration
    MAX_CONVERSATION_HISTORY = 10
    CONFIDENCE_THRESHOLD = 0.7
    SIMILARITY_THRESHOLD = 0.8
    
    # Incident Configuration
    AUTO_RESOLUTION_ENABLED = True
    SENTIMENT_ANALYSIS_ENABLED = True
    MULTILINGUAL_SUPPORT = True

settings = Settings()
