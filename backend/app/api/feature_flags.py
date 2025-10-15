from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel
from typing import List, Optional, Any
from ..feature_flags.flags import FeatureFlag, FlagRegistry, FlagRule
from ..feature_flags.evaluator import evaluator
import secrets

app = FastAPI()
security = HTTPBasic()

# Placeholder auth (replace with real auth)
def authenticate(credentials: HTTPBasicCredentials = Depends(security)):
    correct_username = secrets.compare_digest(credentials.username, "admin")
    correct_password = secrets.compare_digest(credentials.password, "password")
    if not (correct_username and correct_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

class FlagCreateRequest(BaseModel):
    name: str
    enabled: bool = True
    kill_switch: bool = False
    rollout_percentage: int = 100
    rules: List[FlagRule] = []
    variants: Optional[Dict[str, int]] = None
    dependencies: List[str] = []

@app.get("/flags", response_model=List[FeatureFlag], dependencies=[Depends(authenticate)])
def list_flags():
    return FlagRegistry.list()

@app.post("/flags", response_model=FeatureFlag, dependencies=[Depends(authenticate)])
def create_flag(request: FlagCreateRequest):
    if FlagRegistry.get(request.name):
        raise HTTPException(status_code=400, detail="Flag already exists")
    flag = FeatureFlag(**request.dict())
    FlagRegistry.add(flag)
    return flag

@app.put("/flags/{name}", response_model=FeatureFlag, dependencies=[Depends(authenticate)])
def update_flag(name: str, request: FlagCreateRequest):
    flag = FlagRegistry.get(name)
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")
    updated = flag.copy(update=request.dict())
    FlagRegistry.add(updated)
    # Invalidate cache (simple: delete all related keys; in prod, use Redis pub/sub)
    evaluator.redis.delete(evaluator.redis.keys(f"flag:{name}:*"))
    return updated

@app.delete("/flags/{name}", dependencies=[Depends(authenticate)])
def delete_flag(name: str):
    if not FlagRegistry.get(name):
        raise HTTPException(status_code=404, detail="Flag not found")
    FlagRegistry.delete(name)
    evaluator.redis.delete(evaluator.redis.keys(f"flag:{name}:*"))
    return {"message": "Flag deleted"}

@app.get("/flags/stale", response_model=List[FeatureFlag], dependencies=[Depends(authenticate)])
def get_stale_flags(days: int = 30):
    return FlagRegistry.get_stale(days)

@app.post("/flags/{name}/evaluate")
def evaluate_flag(name: str, user_id: str, tenant_id: str, context: Dict[str, Any] = {}):
    return evaluator.evaluate(name, user_id, tenant_id, context)