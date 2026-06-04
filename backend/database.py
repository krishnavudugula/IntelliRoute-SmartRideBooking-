"""Database configuration and session setup"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pathlib import Path
import os

# Keep the default SQLite database path stable regardless of the current
# working directory used to start the app.
DEFAULT_SQLITE_PATH = Path(__file__).resolve().with_name("db.sqlite3")
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"sqlite:///{DEFAULT_SQLITE_PATH.as_posix()}",
)

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    echo=False
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
