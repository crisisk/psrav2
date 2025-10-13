from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.db import SessionLocal
from .security import decode_token
from .repo import UserRepo

oauth2 = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_db():
