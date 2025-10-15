from fastapi import FastAPI, HTTPException, Query
from fastapi.requests import Request
from fastapi.responses import JSONResponse
from typing import Optional, Dict, Any
import redis
import psycopg2
import json
from datetime import timedelta

app = FastAPI()

# Redis and PostgreSQL configurations
REDIS_HOST = "localhost"
REDIS_PORT = 6379
REDIS_DB = 0
POSTGRES_HOST = "localhost"
POSTGRES_DB = "hs_codes"
POSTGRES_USER = "postgres"
POSTGRES_PASSWORD = "password"

# Initialize Redis connection
redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB)

def get_db_connection():
    return psycopg2.connect(
        host=POSTGRES_HOST,
        database=POSTGRES_DB,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD
    )

def fetch_hs_tree_from_db(depth: int) -> Dict[str, Any]:
    """Fetch HS code hierarchy from PostgreSQL."""
    query = """
    WITH RECURSIVE hs_tree AS (
        SELECT code, parent_code, description, level
        FROM hs_codes
        WHERE level = 1
        UNION ALL
        SELECT h.code, h.parent_code, h.description, h.level
        FROM hs_codes h
        INNER JOIN hs_tree ht ON h.parent_code = ht.code
        WHERE h.level <= %s
    )
    SELECT * FROM hs_tree ORDER BY level, code;
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (depth,))
            rows = cur.fetchall()
    return rows

def build_hierarchy(rows: list, depth: int) -> Dict[str, Any]:
    """Build hierarchical JSON structure from flat rows."""
    tree = {}
    for row in rows:
        code, parent_code, description, level = row
        node = {"description": description, "count": 0, "children": {}}
        if parent_code is None:
            tree[code] = node
        else:
            parent = find_parent(tree, parent_code)
            if parent:
                parent["children"][code] = node
                parent["count"] += 1
    return tree

def find_parent(tree: Dict[str, Any], parent_code: str) -> Optional[Dict[str, Any]]:
    """Recursively find parent node in the tree."""
    for code, node in tree.items():
        if code == parent_code:
            return node
        found = find_parent(node["children"], parent_code)
        if found:
            return found
    return None

@app.get("/hs-codes/tree")
async def get_hs_tree(request: Request, depth: int = Query(1, ge=1, le=4)) -> JSONResponse:
    """Get HS code hierarchy with specified depth."""
    cache_key = f"hs_tree_{depth}"
    cached_data = redis_client.get(cache_key)
    if cached_data:
        return JSONResponse(content=json.loads(cached_data))

    rows = fetch_hs_tree_from_db(depth)
    tree = build_hierarchy(rows, depth)
    redis_client.setex(cache_key, timedelta(hours=24), json.dumps(tree))
    return JSONResponse(content=tree)

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})