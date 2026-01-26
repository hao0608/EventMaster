"""Application configuration using Pydantic Settings"""
from pydantic_settings import BaseSettings
from pydantic import computed_field
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Application
    APP_NAME: str = "EventMaster API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database
    DATABASE_URL: str = "sqlite:///./eventmaster.db"

    # JWT Authentication (legacy - will be deprecated in favor of Cognito)
    SECRET_KEY: str = "your-secret-key-please-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # AWS Cognito Configuration
    COGNITO_USER_POOL_ID: str = ""
    COGNITO_CLIENT_ID: str = ""
    COGNITO_REGION: str = "ap-northeast-1"

    @computed_field
    @property
    def cognito_jwks_url(self) -> str:
        """Construct JWKS URL from Cognito settings."""
        if not self.COGNITO_USER_POOL_ID or not self.COGNITO_REGION:
            return ""
        return f"https://cognito-idp.{self.COGNITO_REGION}.amazonaws.com/{self.COGNITO_USER_POOL_ID}/.well-known/jwks.json"

    @computed_field
    @property
    def cognito_issuer(self) -> str:
        """Construct issuer URL from Cognito settings."""
        if not self.COGNITO_USER_POOL_ID or not self.COGNITO_REGION:
            return ""
        return f"https://cognito-idp.{self.COGNITO_REGION}.amazonaws.com/{self.COGNITO_USER_POOL_ID}"

    # CORS - can be set as comma-separated string in environment variable
    # Format: comma-separated URLs (e.g., "https://app.pages.dev,https://example.com")
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    @computed_field
    @property
    def allowed_origins_list(self) -> List[str]:
        """Parse ALLOWED_ORIGINS from comma-separated string to list."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    # Cloudflare Pages wildcard support (set to your project name, e.g., "eventmaster-web")
    # This allows *.eventmaster-web.pages.dev
    CLOUDFLARE_PAGES_PROJECT: str = ""

    # Logging
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Allow extra environment variables (e.g., AWS credentials)


settings = Settings()
