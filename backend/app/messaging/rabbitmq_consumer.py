import asyncio
import json
from app.config.logger import logger


class RabbitMQConsumer:
    def __init__(self, channel_pool):
        self.channel_pool = channel_pool
        self.handlers = {}
        self._stop_event = asyncio.Event()

    def register_handler(self, queue_name: str, handler):
        self.handlers[queue_name] = handler
        logger.info(f"Registered handler for queue: {queue_name}")

    async def consume_queue(self, queue_name: str):
        handler = self.handlers[queue_name]

        while not self._stop_event.is_set():
            try:
                async with self.channel_pool.acquire() as channel:
                    queue = await channel.declare_queue(
                        queue_name,
                        durable=True,
                        arguments={"x-max-priority": 10},
                    )

                    async for message in queue.iterator():
                        try:
                            body = json.loads(message.body.decode())
                            logger.info(
                                f"[CONSUMER] {queue_name} | payload={body}"
                            )
                            if not message.channel.is_closed:
                                await message.ack()

                            await handler(body)


                        except Exception:
                            logger.exception(
                                f"[CONSUMER] Error in {queue_name}"
                            )

            except Exception:
                logger.exception(
                    f"[CONSUMER] Connection lost for {queue_name}, retrying..."
                )
                await asyncio.sleep(5)

    async def consume_all(self):
        tasks = [
            asyncio.create_task(self.consume_queue(queue))
            for queue in self.handlers
        ]
        await asyncio.gather(*tasks)

    async def stop(self):
        self._stop_event.set()
