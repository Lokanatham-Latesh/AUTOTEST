# app/workers/worker.py

import json
from typing import Dict, Union

from app.config.logger import logger
from app.websocket.manager import manager


class WorkerService:

    async def process_page_status_update(
        self,
        message: Union[bytes, str, Dict]
    ) -> None:
        """
        Consume PAGE_STATUS_UPDATE event from queue
        and broadcast to active WebSocket connections.
        """

        try:
            if isinstance(message, (bytes, bytearray)):
                body: Dict = json.loads(message.decode("utf-8"))

            elif isinstance(message, str):
                body: Dict = json.loads(message)

            elif isinstance(message, dict):
                body: Dict = message

            else:
                logger.error(
                    f"[WS_CONSUMER] Unsupported message type: {type(message)}"
                )
                return

            event = body.get("event")
            payload: Dict = body.get("payload", {})

            if event != "PAGE_STATUS_UPDATE":
                logger.warning(
                    f"[WS_CONSUMER] Unexpected event: {event}"
                )
                return

            page_id = payload.get("page_id")
            status = payload.get("status")
            page_title = payload.get("page_title")

            logger.info(
                f"[WS_CONSUMER] PAGE_STATUS_UPDATE received | "
                f"page_id={page_id} | status={status} page_title={page_title}"
            )

            if not manager.connections:
                logger.info("[WS_CONSUMER] No active WebSocket connections")
                return

            ws_message = {
                "type": "PAGE_STATUS_UPDATE",
                "payload": payload,
            }

            await manager.broadcast(ws_message)

            logger.info(
                f"[WS_CONSUMER] Broadcast complete | "
                f"active_users={len(manager.connections)}"
            )

        except json.JSONDecodeError:
            logger.exception("[WS_CONSUMER] Invalid JSON message received")

        except Exception as e:
            logger.exception(
                f"[WS_CONSUMER] Error processing PAGE_STATUS_UPDATE: {e}"
            )


worker_service = WorkerService()