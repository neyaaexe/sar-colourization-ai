import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "SAR Colourization using AI"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./sar_app.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "sar_colourization_secret_key_super_secure_984729103847")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")

    class Config:
        env_file = ".env"

settings = Settings()
