import json
import logging
from typing import Any, Callable, Optional, Union
from functools import wraps
import hashlib
from datetime import timedelta

from fastapi import Request, Response
from redis import asyncio as aioredis
from app.core.config import settings

logger = logging.getLogger(__name__)

class CacheService:
    def __init__(self):
        self.redis: Optional[aioredis.Redis] = None
        self.default_ttl = 300  # 5 minutes

    async def connect(self):
        if not self.redis:
            self.redis = aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True
            )
            logger.info("Connected to Redis")

    async def close(self):
        if self.redis:
            await self.redis.close()
            self.redis = None

    async def get(self, key: str) -> Optional[Any]:
        if not self.redis:
            await self.connect()
        try:
            data = await self.redis.get(key)
            if data:
                logger.info(f"Cache HIT: {key}")
                return json.loads(data)
            else:
                logger.info(f"Cache MISS: {key}")
        except Exception as e:
            logger.error(f"Redis get error: {e}")
        return None

    async def set(self, key: str, value: Any, ttl: int = None):
        if not self.redis:
            await self.connect()
        try:
            await self.redis.set(
                key,
                json.dumps(value, default=str),
                ex=ttl or self.default_ttl
            )
        except Exception as e:
            logger.error(f"Redis set error: {e}")
        else:
            logger.info(f"Cache SET: {key} (ttl={ttl})")

    async def delete(self, key: str):
        if not self.redis:
            await self.connect()
        try:
            await self.redis.delete(key)
        except Exception as e:
            logger.error(f"Redis delete error: {e}")

    async def delete_pattern(self, pattern: str):
        """Delete all keys matching a pattern"""
        if not self.redis:
            await self.connect()
        try:
            keys = []
            async for key in self.redis.scan_iter(pattern):
                keys.append(key)
            if keys:
                await self.redis.delete(*keys)
        except Exception as e:
            logger.error(f"Redis delete_pattern error: {e}")

    def cache_response(self, ttl: int = 300, prefix: str = ""):
        """
        Decorator to cache FastAPI response.
        Key format: {prefix}:{user_id}:{path}:{sorted_query_params}
        """
        def decorator(func: Callable):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Try to find request and user in kwargs
                request: Request = kwargs.get('request')
                current_user = kwargs.get('current_user')
                
                # If not explicitly passed, look for them in args (harder with FastAPI dependency injection)
                # For now, we assume standard pattern where these are available or we skip caching
                
                if not current_user:
                    # Try to find user in args if it's there (unlikely with Depends)
                    # If we can't identify user, we might want to skip or use global cache
                    # For this app, everything is user-scoped
                    return await func(*args, **kwargs)

                user_id = str(current_user.id)
                
                # Construct cache key
                # We use the function name if prefix is not provided
                key_prefix = prefix or func.__name__
                
                # Create a unique signature from arguments
                # We filter out 'request', 'db', 'current_user' from key generation
                key_args = {
                    k: v for k, v in kwargs.items() 
                    if k not in ['request', 'db', 'current_user', 'response']
                }
                
                arg_str = json.dumps(key_args, sort_keys=True, default=str)
                arg_hash = hashlib.md5(arg_str.encode()).hexdigest()
                
                cache_key = f"cache:{user_id}:{key_prefix}:{arg_hash}"

                # Try to get from cache
                cached_data = await self.get(cache_key)
                if cached_data:
                    # logger.debug(f"Cache hit: {cache_key}")
                    return cached_data

                # Execute function
                result = await func(*args, **kwargs)

                # Cache result
                # Use jsonable_encoder to handle Pydantic models, SQLAlchemy objects, lists, etc.
                from fastapi.encoders import jsonable_encoder
                to_cache = jsonable_encoder(result)
                
                await self.set(cache_key, to_cache, ttl)
                
                return result
            return wrapper
        return decorator

cache_service = CacheService()
