from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base
import os

# Database configuration
DATABASE_URL = "sqlite:///./incident_management.db"

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False},
    echo=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Initialize database with tables"""
    Base.metadata.create_all(bind=engine)
    
def get_db():
    """Database dependency for FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def reset_db():
    """Reset database (for development)"""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
