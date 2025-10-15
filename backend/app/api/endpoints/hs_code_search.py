from fastapi import FastAPI, Query, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import asyncpg
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HSCode(BaseModel):
    code: str
    description_en: str
    description_fr: Optional[str] = None
    description_es: Optional[str] = None
    description_de: Optional[str] = None

class SearchResponse(BaseModel):
    results: List[HSCode]

async def get_db_connection():
    return await asyncpg.connect(
        user="your_db_user",
        password="your_db_password",
        database="your_db_name",
        host="localhost"
    )

@app.get("/hs-codes/search", response_model=SearchResponse)
async def search_hs_codes(
    code: Optional[str] = Query(None, description="HS code or prefix"),
    description: Optional[str] = Query(None, description="Description in any language")
):
    if not code and not description:
        raise HTTPException(status_code=400, detail="Either code or description must be provided")

    conn = await get_db_connection()
    try:
        query = """
        SELECT code, description_en, description_fr, description_es, description_de
        FROM hs_codes
        WHERE 
            (code ILIKE $1 OR $1 IS NULL)
            OR (to_tsvector('english', description_en || ' ' || description_fr || ' ' || description_es || ' ' || description_de) @@ plainto_tsquery('english', $2) OR $2 IS NULL)
        ORDER BY 
            CASE 
                WHEN code = $1 THEN 1
                WHEN code ILIKE $1 || '%' THEN 2
                ELSE 3
            END,
            ts_rank(to_tsvector('english', description_en || ' ' || description_fr || ' ' || description_es || ' ' || description_de), plainto_tsquery('english', $2)) DESC
        LIMIT 50
        """
        code_param = code if code else None
        description_param = description if description else None
        results = await conn.fetch(query, code_param, description_param)

        return SearchResponse(results=[HSCode(**dict(row)) for row in results])
    finally:
        await conn.close()
