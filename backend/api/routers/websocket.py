"""
api/routers/websocket.py
WebSocket endpoint for real-time dashboard updates.
Manages connected clients and broadcasts events from Raspberry Pi.
"""

import json
import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jose import JWTError

from core.security import decode_token

logger = logging.getLogger(__name__)

router = APIRouter(tags=["WebSocket"])


class ConnectionManager:
    """
    Manages a pool of active WebSocket connections.
    Thread-safe broadcast to all connected dashboard clients.
    """

    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WS client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """Remove a disconnected WebSocket from the pool."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"WS client disconnected. Total: {len(self.active_connections)}")

    async def send_personal(self, message: dict, websocket: WebSocket):
        """Send a message to a single client."""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Failed to send personal WS message: {e}")

    async def broadcast(self, message: dict):
        """Broadcast a message to all connected clients."""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)

        # Clean up dead connections
        for conn in disconnected:
            self.disconnect(conn)


# Singleton manager instance shared across the app
manager = ConnectionManager()


async def broadcast_event(event_type: str, data: dict[str, Any]):
    """
    Public helper called by other routers (events.py, device.py)
    to push a message to all WebSocket dashboard clients.
    """
    message = {
        "event": event_type,
        "data": data,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    await manager.broadcast(message)


@router.websocket("/ws/dashboard")
async def websocket_dashboard(
    websocket: WebSocket,
    token: str = Query(..., description="JWT access token for authentication"),
):
    """
    WebSocket endpoint for the dashboard.

    Clients must pass ?token=<JWT> in the connection URL.
    Once connected, they receive real-time events:
      - motion_detected
      - face_recognized
      - face_unknown
      - door_opened / door_closed / door_forced
      - alarm_triggered / alarm_stopped
      - pin_correct / pin_wrong
      - system_online / system_offline
    """
    # Validate JWT before accepting connection
    # Validate JWT before accepting connection
    try:
        payload = decode_token(token)
        username = payload.get("sub")
        if not username:
            logger.error("WebSocket connection rejected: No username in token") # <-- THÊM DÒNG NÀY
            await websocket.close(code=4001, reason="Invalid token")
            return
    except JWTError as e:
        logger.error(f"WebSocket JWT Error: {e}") # <-- THÊM DÒNG NÀY
        await websocket.close(code=4001, reason="Authentication failed")
        return
    except Exception as e:
        logger.error(f"Unexpected error in WebSocket auth: {e}") # <-- THÊM DÒNG NÀY
        await websocket.close(code=4001, reason="Authentication failed")
        return

    await manager.connect(websocket)

    # Send welcome message with connection confirmation
    await manager.send_personal(
        {
            "event": "connected",
            "data": {
                "message": f"Dashboard connected for user: {username}",
                "active_clients": len(manager.active_connections),
            },
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
        websocket,
    )

    try:
        # Keep connection alive and handle any incoming messages
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                # Handle ping/pong heartbeat from client
                if msg.get("type") == "ping":
                    await manager.send_personal(
                        {
                            "event": "pong",
                            "data": {"timestamp": datetime.now(timezone.utc).isoformat()},
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                        },
                        websocket,
                    )
            except json.JSONDecodeError:
                pass  # Ignore malformed messages

    except WebSocketDisconnect:
        manager.disconnect(websocket)
