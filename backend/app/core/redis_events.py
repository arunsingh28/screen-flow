"""
Redis Event Bus for Celery <-> WebSocket communication
Allows Celery tasks to publish events that WebSocket clients receive
"""

import json
import redis
from typing import Dict, Any
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class RedisEventBus:
    """Publish/Subscribe event bus using Redis"""

    def __init__(self):
        try:
            self.redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
            self.pubsub = self.redis_client.pubsub()
            logger.info("Redis Event Bus initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Redis Event Bus: {e}")
            self.redis_client = None
            self.pubsub = None

    def publish_cv_progress(
        self,
        user_id: str,
        cv_id: str,
        batch_id: str,
        progress: int,
        status: str,
        **kwargs
    ):
        """
        Publish CV processing progress event

        Args:
            user_id: User UUID
            cv_id: CV UUID
            batch_id: Batch UUID
            progress: Progress percentage (0-100)
            status: Status message
            **kwargs: Additional data
        """
        if not self.redis_client:
            return

        event = {
            "type": "cv_progress",
            "user_id": user_id,
            "cv_id": cv_id,
            "batch_id": batch_id,
            "progress": progress,
            "status": status,
            **kwargs,
        }

        try:
            # Publish to user-specific channel
            channel = f"user:{user_id}:events"
            self.redis_client.publish(channel, json.dumps(event))
            logger.debug(f"Published CV progress to {channel}: {progress}%")
        except Exception as e:
            logger.error(f"Failed to publish CV progress: {e}")

    def publish_batch_progress(
        self,
        user_id: str,
        batch_id: str,
        queue_status: Dict[str, Any]
    ):
        """
        Publish batch queue progress event

        Args:
            user_id: User UUID
            batch_id: Batch UUID
            queue_status: Queue status dictionary
        """
        if not self.redis_client:
            return

        event = {
            "type": "batch_progress",
            "user_id": user_id,
            "batch_id": batch_id,
            **queue_status,
        }

        try:
            channel = f"user:{user_id}:events"
            self.redis_client.publish(channel, json.dumps(event))
            logger.debug(f"Published batch progress to {channel}")
        except Exception as e:
            logger.error(f"Failed to publish batch progress: {e}")

    def publish_jd_progress(
        self,
        user_id: str,
        jd_id: str,
        progress: int,
        status: str,
        **kwargs
    ):
        """
        Publish JD generation progress event

        Args:
            user_id: User UUID
            jd_id: JD UUID
            progress: Progress percentage (0-100)
            status: Status message
            **kwargs: Additional data
        """
        if not self.redis_client:
            return

        event = {
            "type": "jd_progress",
            "user_id": user_id,
            "jd_id": jd_id,
            "progress": progress,
            "status": status,
            **kwargs,
        }

        try:
            channel = f"user:{user_id}:events"
            self.redis_client.publish(channel, json.dumps(event))
            logger.debug(f"Published JD progress to {channel}: {progress}%")
        except Exception as e:
            logger.error(f"Failed to publish JD progress: {e}")

    def subscribe(self, user_id: str):
        """
        Subscribe to events for a user

        Args:
            user_id: User UUID

        Returns:
            PubSub object
        """
        if not self.pubsub:
            return None

        channel = f"user:{user_id}:events"
        self.pubsub.subscribe(channel)
        logger.info(f"Subscribed to {channel}")
        return self.pubsub

    def listen(self, user_id: str):
        """
        Listen for events on user channel

        Args:
            user_id: User UUID

        Yields:
            Event dictionaries
        """
        pubsub = self.subscribe(user_id)
        if not pubsub:
            return

        try:
            for message in pubsub.listen():
                if message["type"] == "message":
                    try:
                        event = json.loads(message["data"])
                        yield event
                    except json.JSONDecodeError:
                        logger.error(f"Invalid JSON in message: {message['data']}")
        except Exception as e:
            logger.error(f"Error listening to events: {e}")
        finally:
            pubsub.unsubscribe()


# Singleton instance
redis_event_bus = RedisEventBus()
