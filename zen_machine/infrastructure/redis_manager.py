"""Redis streaming infrastructure for Zen Machine."""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
import redis.asyncio as redis
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class RedisConfig:
    """Configuration for Redis connection."""
    
    host: str = "localhost"
    port: int = 6379
    db: int = 0
    password: Optional[str] = None
    max_connections: int = 50
    socket_timeout: int = 5
    socket_connect_timeout: int = 5


class RedisManager:
    """Manages Redis streams and caching for Zen Machine."""
    
    def __init__(self, config: RedisConfig):
        self.config = config
        self.redis_client: Optional[redis.Redis] = None
        self.pubsub: Optional[redis.client.PubSub] = None
        
        # Stream names
        self.ZEN_OUTBOUND = "zen_outbound"
        self.STORE_OUTBOUND = "store_outbound"
        self.ADVERSARY_LOG = "adversary_log"
        self.ETHICS_LEDGER = "ethics_ledger"
        self.STATE_UPDATES = "state_updates"
        
    async def initialize(self):
        """Initialize Redis connection."""
        
        try:
            self.redis_client = redis.Redis(
                host=self.config.host,
                port=self.config.port,
                db=self.config.db,
                password=self.config.password,
                max_connections=self.config.max_connections,
                socket_timeout=self.config.socket_timeout,
                socket_connect_timeout=self.config.socket_connect_timeout,
                decode_responses=True
            )
            
            # Test connection
            await self.redis_client.ping()
            
            # Create consumer groups
            await self._create_consumer_groups()
            
            logger.info("Redis connection established successfully")
            
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise
    
    async def _create_consumer_groups(self):
        """Create consumer groups for streams."""
        
        streams = [
            self.ZEN_OUTBOUND,
            self.STORE_OUTBOUND,
            self.ADVERSARY_LOG,
            self.ETHICS_LEDGER,
            self.STATE_UPDATES
        ]
        
        for stream in streams:
            try:
                await self.redis_client.xgroup_create(
                    stream, 
                    f"{stream}_consumers", 
                    mkstream=True
                )
            except redis.ResponseError as e:
                if "BUSYGROUP" not in str(e):
                    logger.warning(f"Failed to create consumer group for {stream}: {e}")
    
    async def publish_event(
        self,
        stream: str,
        event_type: str,
        data: Dict[str, Any],
        metadata: Optional[Dict] = None
    ) -> str:
        """Publish event to Redis stream."""
        
        if not self.redis_client:
            raise RuntimeError("Redis client not initialized")
        
        event_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": event_type,
            "data": json.dumps(data),
            "metadata": json.dumps(metadata or {})
        }
        
        message_id = await self.redis_client.xadd(stream, event_data)
        
        logger.debug(f"Published event to {stream}: {event_type}")
        
        return message_id
    
    async def consume_events(
        self,
        stream: str,
        consumer_group: str,
        consumer_name: str,
        count: int = 10,
        block_ms: int = 5000
    ) -> List[Dict[str, Any]]:
        """Consume events from Redis stream."""
        
        if not self.redis_client:
            raise RuntimeError("Redis client not initialized")
        
        try:
            messages = await self.redis_client.xreadgroup(
                consumer_group,
                consumer_name,
                {stream: ">"},
                count=count,
                block=block_ms
            )
            
            events = []
            for stream_name, message_list in messages:
                for message_id, fields in message_list:
                    event = {
                        "id": message_id,
                        "stream": stream_name,
                        "timestamp": fields.get("timestamp"),
                        "event_type": fields.get("event_type"),
                        "data": json.loads(fields.get("data", "{}")),
                        "metadata": json.loads(fields.get("metadata", "{}"))
                    }
                    events.append(event)
            
            return events
            
        except Exception as e:
            logger.error(f"Error consuming events from {stream}: {e}")
            return []
    
    async def acknowledge_event(self, stream: str, message_id: str) -> bool:
        """Acknowledge event processing."""
        
        try:
            await self.redis_client.xack(stream, f"{stream}_consumers", message_id)
            return True
        except Exception as e:
            logger.error(f"Failed to acknowledge message {message_id}: {e}")
            return False
    
    async def publish_state_update(self, state_type: str, data: Dict[str, Any]) -> None:
        """Publish state update via pub/sub."""
        
        if not self.redis_client:
            return
        
        update_data = {
            "type": state_type,
            "timestamp": datetime.utcnow().isoformat(),
            "data": data
        }
        
        await self.redis_client.publish(
            self.STATE_UPDATES,
            json.dumps(update_data)
        )
    
    async def subscribe_to_updates(self) -> None:
        """Subscribe to state updates."""
        
        if not self.redis_client:
            return
        
        self.pubsub = self.redis_client.pubsub()
        await self.pubsub.subscribe(self.STATE_UPDATES)
    
    async def get_state_updates(self) -> List[Dict[str, Any]]:
        """Get pending state updates."""
        
        if not self.pubsub:
            return []
        
        updates = []
        message = await self.pubsub.get_message(ignore_subscribe_messages=True)
        
        while message:
            if message["type"] == "message":
                try:
                    data = json.loads(message["data"])
                    updates.append(data)
                except json.JSONDecodeError:
                    logger.warning("Invalid JSON in state update")
            
            message = await self.pubsub.get_message(ignore_subscribe_messages=True)
        
        return updates
    
    async def cache_data(
        self,
        key: str,
        data: Dict[str, Any],
        ttl: int = 3600
    ) -> bool:
        """Cache data with TTL."""
        
        try:
            await self.redis_client.setex(
                key,
                ttl,
                json.dumps(data)
            )
            return True
        except Exception as e:
            logger.error(f"Failed to cache data: {e}")
            return False
    
    async def get_cached_data(self, key: str) -> Optional[Dict[str, Any]]:
        """Get cached data."""
        
        try:
            data = await self.redis_client.get(key)
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            logger.error(f"Failed to get cached data: {e}")
            return None
    
    async def get_stream_info(self, stream: str) -> Dict[str, Any]:
        """Get stream information."""
        
        try:
            info = await self.redis_client.xinfo_stream(stream)
            return dict(info)
        except Exception as e:
            logger.error(f"Failed to get stream info for {stream}: {e}")
            return {}
    
    async def get_pending_messages(self, stream: str, consumer_group: str) -> int:
        """Get number of pending messages for consumer group."""
        
        try:
            pending = await self.redis_client.xpending(stream, consumer_group)
            return pending.get("pending", 0)
        except Exception:
            return 0
    
    async def cleanup_old_messages(self, stream: str, max_age_hours: int = 24) -> int:
        """Clean up old messages from stream."""
        
        try:
            cutoff_time = int((datetime.utcnow() - 
                             timedelta(hours=max_age_hours)).timestamp() * 1000)
            
            # Get stream info to find minimum ID
            info = await self.get_stream_info(stream)
            if not info:
                return 0
            
            # Delete old messages
            deleted = await self.redis_client.xtrim(stream, 
                                                  minid=f"{cutoff_time}-0")
            
            logger.info(f"Cleaned up {deleted} old messages from {stream}")
            return deleted
            
        except Exception as e:
            logger.error(f"Failed to cleanup old messages: {e}")
            return 0
    
    async def get_health_status(self) -> Dict[str, Any]:
        """Get Redis health status."""
        
        try:
            info = await self.redis_client.info()
            
            return {
                "connected": True,
                "version": info.get("redis_version"),
                "used_memory": info.get("used_memory_human"),
                "connected_clients": info.get("connected_clients"),
                "total_commands_processed": info.get("total_commands_processed"),
                "keyspace_hits": info.get("keyspace_hits"),
                "keyspace_misses": info.get("keyspace_misses")
            }
            
        except Exception as e:
            return {
                "connected": False,
                "error": str(e)
            }
    
    async def close(self):
        """Close Redis connection."""
        
        if self.pubsub:
            await self.pubsub.close()
        
        if self.redis_client:
            await self.redis_client.close()
            logger.info("Redis connection closed")
