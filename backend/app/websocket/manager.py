from fastapi import WebSocket
from typing import Dict, List
from app.config.logger import logger


class WSManager:
    def __init__(self):
        # user_id -> list of websockets
        self.connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()

        if user_id not in self.connections:
            self.connections[user_id] = []

        self.connections[user_id].append(websocket)

        logger.info(
            f"[WS] Connected | user_id={user_id} | "
            f"user_connections={len(self.connections[user_id])} | "
            f"total_users={len(self.connections)}"
        )

    def disconnect(self, user_id: int, websocket: WebSocket | None = None):
        if user_id not in self.connections:
            return

        if websocket:
            if websocket in self.connections[user_id]:
                self.connections[user_id].remove(websocket)

        if not self.connections[user_id]:
            self.connections.pop(user_id)

        logger.info(
            f"[WS] Disconnected | user_id={user_id} | "
            f"total_users={len(self.connections)}"
        )

    async def send(self, user_id: int, message: dict):
        if user_id not in self.connections:
            logger.warning(f"[WS] No connection for user_id={user_id}")
            return

        dead_connections = []

        for ws in self.connections[user_id]:
            try:
                await ws.send_json(message)
            except Exception as e:
                logger.exception(
                    f"[WS] Send failed | user_id={user_id} | error={e}"
                )
                dead_connections.append(ws)

        # Cleanup dead sockets
        for ws in dead_connections:
            self.disconnect(user_id, ws)

    async def broadcast(self, message: dict):
        for user_id in list(self.connections.keys()):
            await self.send(user_id, message)


manager = WSManager()