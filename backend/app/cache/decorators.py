import functools
from .cache_manager import CacheManager
from typing import Any, Callable

def cached(cache_manager: CacheManager, data_type: str):
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            key = f"{data_type}:{args}:{kwargs}"  # Consistent key naming
            return cache_manager.get(key, lambda: func(*args, **kwargs))
        return wrapper
    return decorator

def invalidate_on_change(cache_manager: CacheManager, key_func: Callable):
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            result = await func(*args, **kwargs)
            key = key_func(*args, **kwargs)
            cache_manager.invalidate(key)
            return result
        return wrapper
    return decorator

# Example usage:
# @cached(manager, "user")
# def get_user(user_id): return fetch_user(user_id)
#
# @invalidate_on_change(manager, lambda user_id, data: f"user:{user_id}")
# async def update_user(user_id, data): return update_db(user_id, data)