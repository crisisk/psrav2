import redis
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload, selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Request, Response
import gzip
import brotli
from typing import List, Optional

# Redis for caching
cache = redis.Redis(host='localhost', port=6379, db=0)

# Read replica connection (example: use a separate engine for reads)
from sqlalchemy import create_engine
read_engine = create_engine('postgresql://user:pass@replica_host/db')  # Configure for read replicas

class QueryOptimizer:
    @staticmethod
    async def eager_load_example(session: AsyncSession) -> List:
        """
        Prevent N+1 queries with eager loading.
        Example: Load users with their orders.
        """
        query = select(User).options(joinedload(User.orders))
        result = await session.execute(query)
        return result.scalars().all()

    @staticmethod
    async def batch_load_example(session: AsyncSession, user_ids: List[int]) -> List:
        """
        Batch loading to prevent N+1.
        """
        query = select(User).where(User.id.in_(user_ids)).options(selectinload(User.orders))
        result = await session.execute(query)
        return result.scalars().all()

    @staticmethod
    def cache_query_result(key: str, result: dict, ttl: int = 3600):
        """
        Cache frequent query results in Redis.
        """
        cache.setex(key, ttl, str(result))

    @staticmethod
    def get_cached_result(key: str) -> Optional[dict]:
        """
        Retrieve cached result.
        """
        data = cache.get(key)
        return eval(data) if data else None  # Use JSON in production

    @staticmethod
    def cursor_based_pagination(session: AsyncSession, model, cursor: Optional[int], limit: int = 50):
        """
        Cursor-based pagination for efficient large datasets.
        """
        query = select(model).where(model.id > cursor).limit(limit).order_by(model.id)
        result = session.execute(query)
        return result.scalars().all()

    @staticmethod
    def route_to_read_replica(query_type: str, session: AsyncSession):
        """
        Route read queries to replicas.
        """
        if query_type == 'read':
            # Use read_engine for SELECT queries
            return read_engine
        return session.bind  # Default for writes

    @staticmethod
    async def compress_response(response: Response, data: dict, request: Request):
        """
        Compress API responses with Gzip or Brotli.
        """
        accept_encoding = request.headers.get('Accept-Encoding', '')
        compressed_data = str(data).encode('utf-8')
        
        if 'br' in accept_encoding:
            compressed_data = brotli.compress(compressed_data)
            response.headers['Content-Encoding'] = 'br'
        elif 'gzip' in accept_encoding:
            compressed_data = gzip.compress(compressed_data)
            response.headers['Content-Encoding'] = 'gzip'
        
        response.body = compressed_data
        return response

# Example usage in an API endpoint
from fastapi import APIRouter
router = APIRouter()

@router.get("/users")
async def get_users(request: Request, response: Response, session: AsyncSession):
    # Use read replica for reads
    QueryOptimizer.route_to_read_replica('read', session)
    
    # Check cache
    cache_key = "users_list"
    cached = QueryOptimizer.get_cached_result(cache_key)
    if cached:
        return await QueryOptimizer.compress_response(response, cached, request)
    
    # Eager load and paginate
    users = await QueryOptimizer.eager_load_example(session)
    paginated = QueryOptimizer.cursor_based_pagination(session, User, cursor=None)
    
    # Cache result
    QueryOptimizer.cache_query_result(cache_key, {"users": [u.dict() for u in paginated]})
    
    return await QueryOptimizer.compress_response(response, {"users": paginated}, request)