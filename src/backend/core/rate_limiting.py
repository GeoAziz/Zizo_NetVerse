# src/backend/core/rate_limiting.py
"""
Redis-backed rate limiting for API endpoints.
Supports sliding window, token bucket, and fixed window strategies.
"""

import time
import logging
from typing import Optional, Dict, Any
from enum import Enum
from dataclasses import dataclass
from datetime import datetime, timedelta
import redis
import os

logger = logging.getLogger(__name__)


class RateLimitStrategy(str, Enum):
    """Rate limiting strategies."""
    FIXED_WINDOW = "fixed_window"  # Fixed time windows
    SLIDING_WINDOW = "sliding_window"  # Sliding time windows
    TOKEN_BUCKET = "token_bucket"  # Token bucket algorithm


@dataclass
class RateLimitConfig:
    """Configuration for rate limiting."""
    max_requests: int  # Maximum requests allowed
    window_size: int  # Time window in seconds
    strategy: RateLimitStrategy = RateLimitStrategy.SLIDING_WINDOW
    redis_ttl: int = None  # Redis key TTL in seconds (defaults to window_size)
    
    def __post_init__(self):
        if self.redis_ttl is None:
            self.redis_ttl = max(self.window_size * 2, 3600)  # At least 1 hour


@dataclass
class RateLimitStatus:
    """Status of a rate limit check."""
    is_allowed: bool  # Whether request is allowed
    requests_made: int  # Requests made in current window
    requests_remaining: int  # Requests remaining
    reset_at: datetime  # When the limit resets
    retry_after: Optional[int] = None  # Seconds to wait before retry (if denied)


class RedisRateLimiter:
    """Redis-backed rate limiter for distributed systems."""
    
    def __init__(
        self,
        redis_url: str = None,
        default_strategy: RateLimitStrategy = RateLimitStrategy.SLIDING_WINDOW
    ):
        """
        Initialize Redis rate limiter.
        
        Args:
            redis_url: Redis connection URL (uses REDIS_URL env var if not provided)
            default_strategy: Default rate limiting strategy
        """
        self.redis_url = redis_url or os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self.default_strategy = default_strategy
        
        try:
            self.client = redis.from_url(self.redis_url, decode_responses=True)
            self.client.ping()
            logger.info(f"Redis rate limiter connected: {self.redis_url}")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self.client = None
    
    def check_rate_limit(
        self,
        key: str,
        config: RateLimitConfig
    ) -> RateLimitStatus:
        """
        Check if a request should be allowed under the rate limit.
        
        Args:
            key: Unique identifier (IP, user ID, endpoint, etc.)
            config: Rate limit configuration
            
        Returns:
            RateLimitStatus: Status of the rate limit check
        """
        if self.client is None:
            logger.warning("Redis not available, allowing request")
            return RateLimitStatus(
                is_allowed=True,
                requests_made=0,
                requests_remaining=config.max_requests,
                reset_at=datetime.now() + timedelta(seconds=config.window_size)
            )
        
        try:
            if config.strategy == RateLimitStrategy.FIXED_WINDOW:
                return self._check_fixed_window(key, config)
            elif config.strategy == RateLimitStrategy.SLIDING_WINDOW:
                return self._check_sliding_window(key, config)
            elif config.strategy == RateLimitStrategy.TOKEN_BUCKET:
                return self._check_token_bucket(key, config)
            else:
                raise ValueError(f"Unknown strategy: {config.strategy}")
                
        except Exception as e:
            logger.error(f"Rate limit check error for key {key}: {e}")
            # Fail open - allow request on error
            return RateLimitStatus(
                is_allowed=True,
                requests_made=0,
                requests_remaining=config.max_requests,
                reset_at=datetime.now() + timedelta(seconds=config.window_size)
            )
    
    def _check_fixed_window(
        self,
        key: str,
        config: RateLimitConfig
    ) -> RateLimitStatus:
        """
        Check rate limit using fixed window strategy.
        
        Window is: current_time // window_size
        Simple and fast, but susceptible to spike at window boundaries.
        """
        now = time.time()
        window = int(now // config.window_size)
        redis_key = f"rate_limit:fixed:{key}:{window}"
        
        # Use pipeline for atomic operations
        pipeline = self.client.pipeline()
        pipeline.incr(redis_key)
        pipeline.expire(redis_key, config.redis_ttl)
        results = pipeline.execute()
        
        requests_made = results[0]
        is_allowed = requests_made <= config.max_requests
        
        # Calculate reset time
        reset_at = datetime.fromtimestamp((window + 1) * config.window_size)
        retry_after = int(reset_at.timestamp() - now) if not is_allowed else None
        
        return RateLimitStatus(
            is_allowed=is_allowed,
            requests_made=requests_made,
            requests_remaining=max(0, config.max_requests - requests_made),
            reset_at=reset_at,
            retry_after=retry_after
        )
    
    def _check_sliding_window(
        self,
        key: str,
        config: RateLimitConfig
    ) -> RateLimitStatus:
        """
        Check rate limit using sliding window strategy.
        
        Uses a sorted set to track requests over a sliding window.
        More accurate but slightly more complex.
        """
        now = time.time()
        window_start = now - config.window_size
        redis_key = f"rate_limit:sliding:{key}"
        
        # Remove old entries outside the window
        self.client.zremrangebyscore(redis_key, 0, window_start)
        
        # Count requests in the window
        current_requests = self.client.zcard(redis_key)
        is_allowed = current_requests < config.max_requests
        
        # Add current request with timestamp
        if is_allowed:
            self.client.zadd(redis_key, {str(now): now})
            self.client.expire(redis_key, config.redis_ttl)
        
        # Calculate reset time (oldest request + window size)
        oldest_request = self.client.zrange(redis_key, 0, 0, withscores=True)
        if oldest_request:
            reset_at = datetime.fromtimestamp(oldest_request[0][1] + config.window_size)
        else:
            reset_at = datetime.fromtimestamp(now + config.window_size)
        
        retry_after = int(reset_at.timestamp() - now) if not is_allowed else None
        
        return RateLimitStatus(
            is_allowed=is_allowed,
            requests_made=current_requests,
            requests_remaining=max(0, config.max_requests - current_requests),
            reset_at=reset_at,
            retry_after=retry_after
        )
    
    def _check_token_bucket(
        self,
        key: str,
        config: RateLimitConfig
    ) -> RateLimitStatus:
        """
        Check rate limit using token bucket strategy.
        
        Tokens are refilled at a constant rate.
        Good for allowing bursts while maintaining average rate.
        """
        now = time.time()
        redis_key = f"rate_limit:bucket:{key}"
        
        # Get bucket state from Redis
        bucket_data = self.client.hgetall(redis_key)
        
        if not bucket_data:
            # New bucket
            tokens = config.max_requests
            last_refill = now
        else:
            tokens = float(bucket_data.get("tokens", config.max_requests))
            last_refill = float(bucket_data.get("last_refill", now))
        
        # Refill tokens based on time elapsed
        time_elapsed = now - last_refill
        refill_rate = config.max_requests / config.window_size  # Tokens per second
        tokens = min(config.max_requests, tokens + time_elapsed * refill_rate)
        
        # Check if request is allowed
        is_allowed = tokens >= 1
        
        if is_allowed:
            tokens -= 1
        
        # Store updated bucket state
        pipeline = self.client.pipeline()
        pipeline.hset(redis_key, mapping={
            "tokens": tokens,
            "last_refill": now
        })
        pipeline.expire(redis_key, config.redis_ttl)
        pipeline.execute()
        
        # Calculate reset time
        if tokens == 0:
            time_to_refill = (1 - tokens) / refill_rate
            reset_at = datetime.fromtimestamp(now + time_to_refill)
            retry_after = max(1, int(reset_at.timestamp() - now))
        else:
            reset_at = datetime.fromtimestamp(now)
            retry_after = None
        
        requests_made = config.max_requests - int(tokens)
        
        return RateLimitStatus(
            is_allowed=is_allowed,
            requests_made=requests_made,
            requests_remaining=int(tokens),
            reset_at=reset_at,
            retry_after=retry_after
        )
    
    def reset_limit(self, key: str) -> bool:
        """
        Reset rate limit for a specific key.
        
        Args:
            key: Unique identifier to reset
            
        Returns:
            bool: True if reset successful
        """
        try:
            if self.client is None:
                return False
            
            # Delete all rate limit keys for this identifier
            for strategy in RateLimitStrategy:
                pattern = f"rate_limit:{strategy.value}:{key}*"
                keys = self.client.keys(pattern)
                if keys:
                    self.client.delete(*keys)
            
            logger.info(f"Rate limit reset for key: {key}")
            return True
            
        except Exception as e:
            logger.error(f"Error resetting rate limit for key {key}: {e}")
            return False
    
    def get_stats(self, key: str) -> Dict[str, Any]:
        """
        Get rate limiting statistics for a key.
        
        Args:
            key: Unique identifier
            
        Returns:
            dict: Statistics about rate limit usage
        """
        try:
            if self.client is None:
                return {}
            
            stats = {}
            
            # Collect stats for each strategy
            for strategy in RateLimitStrategy:
                pattern = f"rate_limit:{strategy.value}:{key}*"
                keys = self.client.keys(pattern)
                stats[strategy.value] = len(keys)
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting stats for key {key}: {e}")
            return {}


# Global rate limiter instance
_rate_limiter: Optional[RedisRateLimiter] = None


def get_rate_limiter() -> Optional[RedisRateLimiter]:
    """Get or create the global rate limiter instance."""
    global _rate_limiter
    
    if _rate_limiter is None:
        _rate_limiter = RedisRateLimiter()
    
    return _rate_limiter


# ==================== Pre-configured Rate Limit Policies ====================

# API rate limits
API_LIMIT_GENEROUS = RateLimitConfig(
    max_requests=100,
    window_size=60,  # 100 requests per minute
    strategy=RateLimitStrategy.SLIDING_WINDOW
)

API_LIMIT_MODERATE = RateLimitConfig(
    max_requests=30,
    window_size=60,  # 30 requests per minute
    strategy=RateLimitStrategy.SLIDING_WINDOW
)

API_LIMIT_STRICT = RateLimitConfig(
    max_requests=10,
    window_size=60,  # 10 requests per minute
    strategy=RateLimitStrategy.SLIDING_WINDOW
)

# Auth rate limits (more strict)
AUTH_LIMIT_LOGIN = RateLimitConfig(
    max_requests=5,
    window_size=300,  # 5 attempts per 5 minutes
    strategy=RateLimitStrategy.FIXED_WINDOW
)

AUTH_LIMIT_TOKEN = RateLimitConfig(
    max_requests=10,
    window_size=600,  # 10 token refreshes per 10 minutes
    strategy=RateLimitStrategy.FIXED_WINDOW
)

# Firewall control limits
FIREWALL_LIMIT_BLOCK = RateLimitConfig(
    max_requests=20,
    window_size=60,  # 20 blocks per minute
    strategy=RateLimitStrategy.SLIDING_WINDOW
)

# Search/query limits
SEARCH_LIMIT = RateLimitConfig(
    max_requests=50,
    window_size=60,  # 50 searches per minute
    strategy=RateLimitStrategy.SLIDING_WINDOW
)
