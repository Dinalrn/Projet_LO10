import os
import json
import hashlib
import time
import redis

_client: redis.Redis | None = None


def get_client() -> redis.Redis:
    global _client
    if _client is None:
        _client = redis.Redis(
            host=os.getenv("REDIS_HOST", "redis-service"),
            port=int(os.getenv("REDIS_PORT", 6379)),
            decode_responses=True,
        )
    return _client


# Maximum number of cached entries kept per namespace before oldest are evicted.
NAMESPACE_LIMITS: dict[str, int] = {
    "weather": 20,
    "events": 20,
}

# Default TTL in seconds per namespace.
NAMESPACE_TTL: dict[str, int] = {
    "weather": 1800,   # 30 min — weather data is fresh enough
    "events": 7200,    # 2 h   — event listings change slowly
}


def _data_key(namespace: str, params: dict) -> str:
    digest = hashlib.md5(json.dumps(params, sort_keys=True).encode()).hexdigest()[:16]
    return f"cache:data:{namespace}:{digest}"


def _index_key(namespace: str) -> str:
    return f"cache:index:{namespace}"


def cache_get(namespace: str, params: dict) -> dict | None:
    """Return cached payload for this namespace+params, or None on miss/error."""
    try:
        raw = get_client().get(_data_key(namespace, params))
        if raw:
            return json.loads(raw)
    except Exception as e:
        print(f"[Cache] GET error ({namespace}): {e}")
    return None


def cache_set(namespace: str, params: dict, data: dict) -> None:
    """
    Store data under namespace+params.
    Evicts the oldest entry when the namespace exceeds its limit.
    """
    try:
        client = get_client()
        key = _data_key(namespace, params)
        index = _index_key(namespace)
        limit = NAMESPACE_LIMITS.get(namespace, 20)
        ttl = NAMESPACE_TTL.get(namespace, 1800)

        # Register key in the sorted set (score = insertion timestamp)
        client.zadd(index, {key: time.time()})

        # Evict oldest entries that exceed the limit
        excess = client.zcard(index) - limit
        if excess > 0:
            oldest_keys = client.zrange(index, 0, excess - 1)
            if oldest_keys:
                client.delete(*oldest_keys)
                client.zremrangebyrank(index, 0, excess - 1)

        client.set(key, json.dumps(data), ex=ttl)
    except Exception as e:
        print(f"[Cache] SET error ({namespace}): {e}")
