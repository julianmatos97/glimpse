import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Import Base from your models file
# Assuming models.py is in the src directory
from src.models import Base

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get Database URL from environment variable (same as in main.py)
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # Provide a default or raise an error if not set
    # Example: Use a default SQLite DB for local dev if no URL provided
    # DATABASE_URL = "sqlite:///./test.db"
    # Or raise an error:
    raise RuntimeError("DATABASE_URL environment variable not set. Cannot initialize DB.")

# Create the synchronous engine (ensure it matches your main.py setup)
# Use the same URL as your FastAPI app
engine = create_engine(DATABASE_URL)

def initialize_database():
    """Creates all database tables based on SQLAlchemy models."""
    logger.info(f"Initializing database schema using URL: {engine.url}")
    try:
        # Create all tables defined in models that inherit from Base
        Base.metadata.create_all(bind=engine)
        logger.info("Database schema initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize database schema: {e}")
        # Depending on the error, you might want to handle specific cases
        # For example, permissions issues, connection errors, etc.
        raise # Re-raise the exception after logging

if __name__ == "__main__":
    # This block allows running the script directly
    logger.info("Running database initialization script...")
    initialize_database()
    logger.info("Database initialization script finished.") 