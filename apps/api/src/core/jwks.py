"""JWKS (JSON Web Key Set) caching for Cognito JWT verification
Feature: 002-dev-deployment-arch - Phase 5 (Cognito Integration)
"""
import time
import httpx
from typing import Dict, Optional
from .config import settings


class JWKSCache:
    """
    Simple in-memory cache for JWKS (JSON Web Key Set) from Cognito.

    Cognito rotates keys periodically, so we cache the JWKS but refresh
    it after a TTL (Time To Live) expires.
    """

    def __init__(self, ttl_seconds: int = 3600):
        """
        Initialize JWKS cache.

        Args:
            ttl_seconds: Cache time-to-live in seconds (default: 1 hour)
        """
        self._cache: Optional[Dict] = None
        self._cache_time: float = 0
        self._ttl_seconds = ttl_seconds

    def get_jwks(self) -> Optional[Dict]:
        """
        Get JWKS from cache or fetch from Cognito if cache is stale.

        Returns:
            JWKS dictionary or None if fetch fails
        """
        current_time = time.time()

        # Return cached JWKS if still valid
        if self._cache and (current_time - self._cache_time) < self._ttl_seconds:
            return self._cache

        # Fetch new JWKS from Cognito
        jwks_url = settings.cognito_jwks_url
        if not jwks_url:
            return None

        try:
            response = httpx.get(jwks_url, timeout=10.0)
            response.raise_for_status()
            self._cache = response.json()
            self._cache_time = current_time
            return self._cache
        except Exception as e:
            # Log error but don't crash - return stale cache if available
            print(f"Error fetching JWKS from {jwks_url}: {e}")
            return self._cache

    def clear(self):
        """Clear the JWKS cache (useful for testing)."""
        self._cache = None
        self._cache_time = 0


# Global JWKS cache instance
jwks_cache = JWKSCache(ttl_seconds=3600)  # Cache for 1 hour
