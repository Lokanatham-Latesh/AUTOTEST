import json
from aio_pika import Message, DeliveryMode
from app.config.rabbitmq import rabbitmq_connection
from app.config.logger import logger


class RabbitMQProducer:

    @staticmethod
    async def publish_message(queue_name, message, priority=0):
        if not rabbitmq_connection.channel_pool:
            await rabbitmq_connection.connect()

        async with rabbitmq_connection.channel_pool.acquire() as channel:
            await channel.declare_queue(
                queue_name,
                durable=True,
                arguments={"x-max-priority": 10},
            )

            msg = Message(
                json.dumps(message).encode(),
                delivery_mode=DeliveryMode.PERSISTENT,
                priority=priority,
                content_type="application/json",
            )

            await channel.default_exchange.publish(
                msg,
                routing_key=queue_name
            )

            logger.info(f"[PRODUCER] Published to {queue_name}: {message}")


rabbitmq_producer = RabbitMQProducer()
