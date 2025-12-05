
import json
import logging
import redis
from app.core.config import settings

logger = logging.getLogger(__name__)

class RedisEventBus:
    """
    Publish/Subscribe event bus using Redis for real-time updates
    between Celery workers and WebSocket server
    """

    def __init__(self):
        # Sync client for Celery tasks
        self.redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
        # Async client will be created on demand in async contexts

    def publish_cv_progress(self, user_id: str, cv_id: str, batch_id: str, progress: int, status: str, **kwargs):
        """
        Publish CV processing progress event from Celery to Redis
        """
        try:
            event = {
                "type": "cv_progress",
                "user_id": user_id,
                "cv_id": cv_id,
                "batch_id": batch_id,
                "progress": progress,
                "status": status,
                **kwargs,
            }
            channel = f"user:{user_id}:events"
            self.redis_client.publish(channel, json.dumps(event))
            # logger.info(f"Published event to {channel}: {status} ({progress}%)")
        except Exception as e:
            logger.error(f"Failed to publish Redis event: {e}")

    def publish_batch_progress(self, user_id: str, batch_id: str, queue_status: dict):
        """
        Publish batch progress event from Celery to Redis
        """
        try:
            event = {
                "type": "batch_progress",
                "batch_id": batch_id,
                **queue_status,
            }
            channel = f"user:{user_id}:events"
            self.redis_client.publish(channel, json.dumps(event))
        except Exception as e:
            logger.error(f"Failed to publish batch Redis event: {e}")

# Global instance
redis_event_bus = RedisEventBus()
