"""SQLAlchemy base metadata for PSRA services."""

from __future__ import annotations

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Declarative base shared by all PSRA ORM models."""

    pass
