"""Database engine and session factory helpers."""

from __future__ import annotations

import os
from contextlib import contextmanager
from typing import Iterator

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

DEFAULT_DSN_ENV = "PSRA_DB_DSN"


def build_engine(dsn: str | None = None, *, echo: bool = False) -> Engine:
    """Build a synchronous SQLAlchemy engine for Postgres."""

    url = dsn or os.getenv(DEFAULT_DSN_ENV) or os.getenv("DATABASE_URL")
    if not url:
        raise RuntimeError(
            "Database DSN must be provided via argument, PSRA_DB_DSN or DATABASE_URL env var",
        )
    return create_engine(url, echo=echo, future=True)


def create_session_factory(engine: Engine) -> sessionmaker[Session]:
    """Create a configured sessionmaker bound to the provided engine."""

    return sessionmaker(bind=engine, expire_on_commit=False, future=True)


@contextmanager
def session_scope(factory: sessionmaker[Session]) -> Iterator[Session]:
    """Provide a transactional scope around a series of operations."""

    session = factory()
    try:
        yield session
        session.commit()
    except Exception:  # pragma: no cover - defensive rollback
        session.rollback()
        raise
    finally:
        session.close()
