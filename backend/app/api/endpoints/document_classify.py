from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import pandas as pd
import PyPDF2
import redis
import psycopg2
from typing import List, Dict, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI()

# Redis and PostgreSQL connection settings
REDIS_HOST = "localhost"
REDIS_PORT = 6379
POSTGRES_HOST = "localhost"
POSTGRES_DB = "ml_docs"
POSTGRES_USER = "user"
POSTGRES_PASSWORD = "password"

# Connect to Redis
redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT)

# Connect to PostgreSQL
def get_db_connection():
    return psycopg2.connect(
        host=POSTGRES_HOST,
        database=POSTGRES_DB,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD
    )

# Pydantic model for the response
class DocumentClassificationResponse(BaseModel):
    products: List[Dict[str, str]]
    hs_codes: List[Dict[str, str]]
    origins: List[Dict[str, str]]
    values: List[Dict[str, str]]
    confidence_scores: Dict[str, float]

# ML Pipeline Placeholder Functions
def parse_document(file_content: bytes, file_type: str) -> pd.DataFrame:
    """Parse document based on file type."""
    if file_type == "pdf":
        reader = PyPDF2.PdfFileReader(file_content)
        text = ""
        for page in reader.pages:
            text += page.extract_text()
        return pd.DataFrame({"text": [text]})
    elif file_type in ["csv", "excel"]:
        return pd.read_csv(file_content) if file_type == "csv" else pd.read_excel(file_content)
    else:
        raise ValueError("Unsupported file type")

def named_entity_recognition(df: pd.DataFrame) -> Dict[str, List[str]]:
    """Perform Named Entity Recognition on the parsed data."""
    # Placeholder NER logic
    return {
        "products": ["Product A", "Product B"],
        "hs_codes": ["1234", "5678"],
        "origins": ["Country A", "Country B"],
        "values": ["1000", "2000"]
    }

def classify_entities(entities: Dict[str, List[str]]) -> Dict[str, float]:
    """Classify entities and return confidence scores."""
    # Placeholder classification logic
    return {
        "products": 0.95,
        "hs_codes": 0.90,
        "origins": 0.85,
        "values": 0.80
    }

@app.post("/ml/classify-document", response_model=DocumentClassificationResponse)
async def classify_document(file: UploadFile = File(...)):
    """Endpoint to classify uploaded document."""
    try:
        file_content = await file.read()
        file_type = file.filename.split(".")[-1].lower()

        # Parse document
        parsed_data = parse_document(file_content, file_type)

        # Perform NER
        entities = named_entity_recognition(parsed_data)

        # Classify entities
        confidence_scores = classify_entities(entities)

        # Store extracted data in PostgreSQL
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO extracted_data (products, hs_codes, origins, values) VALUES (%s, %s, %s, %s)",
            (entities["products"], entities["hs_codes"], entities["origins"], entities["values"])
        )
        conn.commit()
        cursor.close()
        conn.close()

        # Return structured response
        return DocumentClassificationResponse(
            products=[{"name": product} for product in entities["products"]],
            hs_codes=[{"code": code} for code in entities["hs_codes"]],
            origins=[{"country": origin} for origin in entities["origins"]],
            values=[{"amount": value} for value in entities["values"]],
            confidence_scores=confidence_scores
        )
    except Exception as e:
        logger.error(f"Error processing document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Initialize PostgreSQL table (run once)
def initialize_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS extracted_data (
            id SERIAL PRIMARY KEY,
            products TEXT[],
            hs_codes TEXT[],
            origins TEXT[],
            values TEXT[],
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    cursor.close()
    conn.close()

initialize_db()