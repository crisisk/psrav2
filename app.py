import os, uuid
from fastapi import FastAPI
from pydantic import BaseModel
import httpx
from utils import post_webhook
import os, asyncio, json
from typing import Optional
try:
    import nats
except Exception:
    nats = None


PARSER_URL = "http://parser:8000"
EMBED_URL = "http://embed:8000"
RAG_URL = "http://rag:8000"
CLASSIFY_URL = "http://classify:8000"
NER_URL = "http://ner:8000"

app = FastAPI(title="PSRA ML Gateway")

class IntakeReq(BaseModel):
    file_url: str
    supplier_id: str

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/pipeline/origin-intake")
def origin_intake(req: IntakeReq):
    doc_id = str(uuid.uuid4())
    with httpx.Client(timeout=30) as c:
        # 1) Fetch document
        r = c.get(req.file_url)
        r.raise_for_status()
        # 2) Parse
        files = {"file": ("doc.pdf", r.content, "application/pdf")}
        parsed = c.post(f"{PARSER_URL}/parse", files=files).json()
        text = parsed.get("text", "")
        # 3) Classify
        cls = c.post(f"{CLASSIFY_URL}/predict", json={"text": text, "task": "doc_type"}).json()
        # 4) NER
        ents = c.post(f"{NER_URL}/extract", json={"text": text}).json()
        # 5) RAG search
        rag = c.post(f"{RAG_URL}/search", json={"query": f"origin evaluation: {text[:300]}"}).json()

    payload = {
        "pipeline": "origin-intake",
        "status": "ok",
        "doc_id": doc_id,
        "supplier_id": req.supplier_id,
        "classifiers": cls,
        "entities": ents.get("entities", []),
        "retrieval": rag.get("retrieval", []),
        "explanation": rag.get("explanation", ""),
    }
    post_webhook(payload)
    
    # Publish to NATS if configured
    nats_url = os.getenv("NATS_URL")
    if nats and nats_url:
        async def nats_publish(data: dict):
            nc = await nats.connect(nats_url)
            try:
                await nc.publish("psra.ml.events", json.dumps(data).encode())
            finally:
                await nc.drain()
        try:
            asyncio.get_event_loop().run_until_complete(nats_publish(payload))
        except RuntimeError:
            asyncio.run(nats_publish(payload))
    return payload
