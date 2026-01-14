"""Input sanitization utilities for XSS protection"""
import html
import re
from typing import Optional


def sanitize_html(value: str) -> str:
    """
    Sanitize HTML content by escaping HTML entities

    This prevents XSS attacks by converting HTML special characters
    to their entity equivalents.

    Args:
        value: Input string that may contain HTML

    Returns:
        Sanitized string with HTML entities escaped

    Example:
        >>> sanitize_html("<script>alert('xss')</script>")
        "&lt;script&gt;alert('xss')&lt;/script&gt;"
    """
    if not value:
        return value
    return html.escape(value, quote=True)


def sanitize_string(value: Optional[str]) -> Optional[str]:
    """
    Sanitize a string input by:
    1. Stripping leading/trailing whitespace
    2. Escaping HTML entities
    3. Removing null bytes and other control characters

    Args:
        value: Input string to sanitize

    Returns:
        Sanitized string or None if input was None
    """
    if value is None:
        return None

    # Strip whitespace
    value = value.strip()

    # Remove null bytes and other control characters (except newlines and tabs)
    value = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', value)

    # Escape HTML entities
    value = sanitize_html(value)

    return value


def sanitize_multiline(value: Optional[str]) -> Optional[str]:
    """
    Sanitize multiline text (like descriptions) by:
    1. Stripping leading/trailing whitespace
    2. Escaping HTML entities
    3. Removing control characters but preserving newlines

    Args:
        value: Input multiline string to sanitize

    Returns:
        Sanitized multiline string or None if input was None
    """
    if value is None:
        return None

    # Strip outer whitespace
    value = value.strip()

    # Remove null bytes and control characters except newlines, carriage returns, tabs
    value = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', value)

    # Escape HTML entities
    value = sanitize_html(value)

    return value
