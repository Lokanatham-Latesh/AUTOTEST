import asyncio
import aio_pika
from aio_pika.pool import Pool
from app.config.setting import settings
from app.config.logger import logger


class RabbitMQConnection:
    def __init__(self):
        self.connection_pool = None
        self.channel_pool = None
        self._lock = asyncio.Lock()

    async def connect(self):
        async with self._lock:
            if self.channel_pool:
                return  # already connected

            while True:
                try:
                    logger.info("Connecting to RabbitMQ...")

                    connection = await aio_pika.connect_robust(
                        settings.RABBITMQ_URL,
                        heartbeat=120,
                        timeout=30,
                    )

                    async def get_connection():
                        return connection

                    self.connection_pool = Pool(get_connection, max_size=5)

                    async def get_channel():
                        async with self.connection_pool.acquire() as conn:
                            return await conn.channel()

                    self.channel_pool = Pool(get_channel, max_size=20)

                    logger.info("RabbitMQ connected successfully")
                    return

                except Exception as e:
                    logger.error(f"RabbitMQ not ready: {e}")
                    await asyncio.sleep(5)

    async def close(self):
        if self.channel_pool:
            await self.channel_pool.close()
        if self.connection_pool:
            await self.connection_pool.close()

        self.channel_pool = None
        self.connection_pool = None

        logger.info("RabbitMQ connection closed")


rabbitmq_connection = RabbitMQConnection()
