import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.config.setting import settings
from app.config.logger import logger
from app.db.session import get_db
from app.config.rabbitmq import rabbitmq_connection

from app.messaging.rabbitmq_consumer import RabbitMQConsumer
from app.workers.queue_router import QUEUE_HANDLER_MAP

# Routers
from app.routers.auth import router as auth_router
from app.routers.site import router as site_router
from app.routers.pages import router as pages_router
from app.routers.websocket import router as websocket_router
from app.routers.setting import router as setting_router
from app.routers.test_scenario import router as test_scenario_router
from app.routers.provider import router as provider_router
from app.routers.provider_model import router as provider_model_router
from app.routers.function import router as function_router
from app.routers.test_case import router as test_case_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting FastAPI application...")

    consumer_task = None
    consumer = None

    # -------------------- STARTUP --------------------
    try:
        # Connect RabbitMQ
        await rabbitmq_connection.connect()
        logger.info("RabbitMQ connected successfully")

        # Initialize consumer
        consumer = RabbitMQConsumer(rabbitmq_connection.channel_pool)

        # Register all queue handlers
        for queue_name, handler in QUEUE_HANDLER_MAP.items():
            consumer.register_handler(queue_name, handler)

        # Start consuming in background
        consumer_task = asyncio.create_task(consumer.consume_all())
        logger.info(" RabbitMQ consumer started")

    except Exception as e:
        logger.error(f"Failed to initialize RabbitMQ: {e}")

    yield

    # -------------------- SHUTDOWN --------------------
    logger.info(" Shutting down FastAPI application...")

    try:
        if consumer:
            await consumer.stop()
            logger.info(" Consumer stopped")

        if consumer_task:
            consumer_task.cancel()
            try:
                await consumer_task
            except asyncio.CancelledError:
                logger.info(" Consumer task cancelled")

        await rabbitmq_connection.close()
        logger.info("RabbitMQ connection closed")

    except Exception as e:
        logger.error(f"Error during shutdown: {e}")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description=settings.DESCRIPTION,
        debug=settings.DEBUG,
        lifespan=lifespan,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_HOSTS or ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Root endpoint
    @app.get("/")
    def root():
        return {"message": f"{settings.PROJECT_NAME} is running successfully!"}

    # Healthcheck
    @app.get("/api/v1/healthcheck")
    def health_check(db: Session = Depends(get_db)):
        try:
            db.execute(text("SELECT 1"))
            return {
                "status": "healthy",
                "database_connection": "successful",
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Database connection failed: {str(e)}",
            )

    # Include Routers
    app.include_router(auth_router, prefix="/api/v1/auth")
    app.include_router(site_router, prefix="/api/v1")
    app.include_router(websocket_router, prefix="/api/v1")
    app.include_router(pages_router, prefix="/api/v1")
    app.include_router(setting_router, prefix="/api/v1")
    app.include_router(provider_router, prefix="/api/v1")
    app.include_router(provider_model_router, prefix="/api/v1")
    app.include_router(function_router, prefix="/api/v1")
    app.include_router(test_scenario_router, prefix="/api/v1")
    app.include_router(test_case_router, prefix="/api/v1")

    return app

app = create_app()