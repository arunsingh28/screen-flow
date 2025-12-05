"""
WebSocket Manager for real-time updates
"""

from typing import Dict, Set
from fastapi import WebSocket
import json
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for real-time updates"""

    def __init__(self):
        # Store active connections by user_id
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        """Connect a WebSocket for a user"""
        await websocket.accept()

        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()

        self.active_connections[user_id].add(websocket)
        logger.info(f"WebSocket connected for user {user_id}")

    def disconnect(self, websocket: WebSocket, user_id: str):
        """Disconnect a WebSocket"""
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)

            # Remove user if no connections left
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

        logger.info(f"WebSocket disconnected for user {user_id}")

    async def send_personal_message(self, message: dict, user_id: str):
        """Send a message to a specific user's connections"""
        if user_id in self.active_connections:
            disconnected = set()

            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending message to user {user_id}: {e}")
                    disconnected.add(connection)

            # Remove disconnected connections
            for connection in disconnected:
                self.active_connections[user_id].discard(connection)

    async def send_cv_progress(
        self, user_id: str, cv_id: str, progress: int, status: str, **kwargs
    ):
        """Send CV processing progress update"""
        message = {
            "type": "cv_progress",
            "cv_id": cv_id,
            "progress": progress,
            "status": status,
            **kwargs,
        }
        await self.send_personal_message(message, user_id)

    async def send_batch_progress(
        self, user_id: str, batch_id: str, queue_status: dict
    ):
        """Send batch queue progress update"""
        message = {
            "type": "batch_progress",
            "batch_id": batch_id,
            **queue_status,
        }
        await self.send_personal_message(message, user_id)

    async def send_jd_generation_progress(
        self, user_id: str, jd_id: str, progress: int, status: str, **kwargs
    ):
        """Send JD generation progress update"""
        message = {
            "type": "jd_progress",
            "jd_id": jd_id,
            "progress": progress,
            "status": status,
            **kwargs,
        }
        await self.send_personal_message(message, user_id)

    async def send_jd_suggestion(
        self, user_id: str, jd_id: str, suggestion_type: str, data: dict
    ):
        """Send real-time JD suggestion"""
        message = {
            "type": "jd_suggestion",
            "jd_id": jd_id,
            "suggestion_type": suggestion_type,  # skill, responsibility, etc.
            "data": data,
        }
        await self.send_personal_message(message, user_id)


# Singleton instance
manager = ConnectionManager()
