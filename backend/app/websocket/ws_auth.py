from fastapi import WebSocket, status
from sqlalchemy.orm import Session
import jwt

from shared_orm.models.user import User
from app.config.security import security_service
from app.config.logger import logger


async def authenticate_ws(websocket: WebSocket, db: Session) -> User | None:
    token = websocket.cookies.get("access_token")

    if not token:
        logger.warning("[WS_AUTH] Missing access token")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return None

    try:
        payload = security_service.decode_token(token)
        email = payload.get("sub")

        if not email:
            raise ValueError("Token missing subject")

    except jwt.ExpiredSignatureError:
        logger.warning("[WS_AUTH] Token expired")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return None

    except jwt.InvalidTokenError:
        logger.warning("[WS_AUTH] Invalid token")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return None

    except Exception as e:
        logger.exception(f"[WS_AUTH] Unexpected error: {e}")
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        return None

    user = db.query(User).filter(User.email == email).first()

    if not user or not user.is_active:
        logger.warning(f"[WS_AUTH] Invalid or inactive user | email={email}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return None

    logger.info(f"[WS_AUTH] Authenticated | user_id={user.id}")
    return user