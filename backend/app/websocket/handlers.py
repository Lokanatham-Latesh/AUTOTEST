from app.schemas.websocket import WSMessage
from app.websocket.manager import manager
from app.config.logger import logger


async def handle_ws_message(user_id: int, msg: WSMessage) -> None:
    logger.debug(
        f"[WS_HANDLER] user_id={user_id} | type={msg.type}"
    )

    if msg.type == "PING":
        await manager.send(
            user_id,
            {"type": "PONG", "payload": {}}
        )
        return

    if msg.type == "EVENT":
        logger.info(
            f"[WS_HANDLER] EVENT | user_id={user_id} | payload={msg.payload}"
        )

        await manager.send(
            user_id,
            {"type": "EVENT", "payload": msg.payload}
        )
        return

    logger.warning(
        f"[WS_HANDLER] Unknown message type | user_id={user_id}"
    )