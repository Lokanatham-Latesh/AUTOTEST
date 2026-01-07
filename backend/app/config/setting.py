from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, ClassVar

class Settings(BaseSettings):
    # Project Metadata Settings
    PROJECT_NAME: str = "Autotest"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "A FastAPI application for managing users"
    ALLOWED_HOSTS: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173","http://localhost:3000", "http://127.0.0.1:3000"]
    
    DATABASE_URL: str
    JWT_SECRET: str = "change_me"
    ALGO: str ="HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES:int =5
    REFRESH_TOKEN_EXPIRE_MINUTES:int =60*2
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "Admin@123"
    ADMIN_NAME: str = "Admin User"
    ADMIN_EMAIL: str = "admin@example.com"
    HOST: str = "0.0.0.0"
    PORT:int = 8000
    DEBUG:bool = True
    # RabbitMQ
    RABBITMQ_URL: str
    RABBITMQ_USER: str = "guest"
    RABBITMQ_PASSWORD: str = "guest"
    RABBITMQ_VHOST: str = "/"
    RABBITMQ_HOST: str = "autotest_rabbitmq"
    RABBITMQ_PORT: str = "5672:5672"
    SITE_ANALYSE_QUEUE: str = "site_analyse_queue"
    PAGE_ANALYSE_QUEUE: ClassVar[str] = "page_analyse_queue"
    PAGE_EXTRACT_QUEUE: str = "page_extract_queue"
    LLM_QUEUE: str = "llm_queue"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_class_vars=True,
        extra="allow",
    )

settings = Settings()
