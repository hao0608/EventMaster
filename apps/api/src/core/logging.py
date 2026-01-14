"""Logging configuration for the application"""
import logging
import sys
from pathlib import Path
from typing import Optional
from .config import settings


def setup_logging(log_level: Optional[str] = None) -> None:
    """
    Configure structured logging for the application

    Args:
        log_level: Optional log level override. Uses settings.LOG_LEVEL if not provided.
    """
    level = log_level or getattr(settings, 'LOG_LEVEL', 'INFO')

    # Create logs directory if it doesn't exist
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)

    # Configure root logger
    logging.basicConfig(
        level=getattr(logging, level.upper()),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            # Console handler
            logging.StreamHandler(sys.stdout),
            # File handler for all logs
            logging.FileHandler(log_dir / "app.log"),
            # Separate file for errors
            logging.FileHandler(log_dir / "error.log", level=logging.ERROR)
        ]
    )

    # Set third-party loggers to WARNING to reduce noise
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

    logger = logging.getLogger(__name__)
    logger.info(f"Logging configured with level: {level}")


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance for the given module name

    Args:
        name: Module name (typically __name__)

    Returns:
        Logger instance
    """
    return logging.getLogger(name)
