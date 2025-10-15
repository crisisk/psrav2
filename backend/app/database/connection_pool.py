from sqlalchemy import create_engine, event
from sqlalchemy.pool import QueuePool
import logging
import time
import os

# Configure logging for leak detection
logger = logging.getLogger(__name__)

# Database URL from environment (e.g., postgresql://user:pass@host/db)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost/db")

# Pool configuration
POOL_SIZE = 20
MAX_OVERFLOW = 40
POOL_TIMEOUT = 30  # seconds
POOL_RECYCLE = 3600  # seconds

# Create engine with optimized pool
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=POOL_SIZE,
    max_overflow=MAX_OVERFLOW,
    pool_timeout=POOL_TIMEOUT,
    pool_recycle=POOL_RECYCLE,
    pool_pre_ping=True,  # Health checks: Ping before use
    pool_reset_on_return='rollback',  # Reset connections on return to detect issues
    echo=False,  # Set to True for debug logging
    execution_options={"timeout": 30},  # Global query timeout (30 seconds)
    # Statement caching and prepared statements are enabled by default
)

# Connection leak detection: Log if a connection is checked out for too long
@event.listens_for(engine, "checkout")
def log_checkout(dbapi_connection, connection_record, connection_proxy):
    connection_record.info['checkout_time'] = time.time()

@event.listens_for(engine, "checkin")
def log_checkin(dbapi_connection, connection_record, connection_proxy):
    checkout_time = connection_record.info.get('checkout_time')
    if checkout_time:
        duration = time.time() - checkout_time
        if duration > 300:  # Log if checked out for >5 minutes (potential leak)
            logger.warning(f"Potential connection leak: checked out for {duration:.2f} seconds")

# Graceful pool exhaustion handling: Retry with backoff on TimeoutError
def get_connection_with_retry(max_retries=3, backoff_factor=2):
    for attempt in range(max_retries):
        try:
            return engine.connect()
        except Exception as e:
            if "pool is exhausted" in str(e) or isinstance(e, TimeoutError):
                wait_time = backoff_factor ** attempt
                logger.warning(f"Pool exhausted, retrying in {wait_time} seconds (attempt {attempt+1})")
                time.sleep(wait_time)
            else:
                raise
    raise RuntimeError("Failed to acquire connection after retries")

# Function to get a session (use this in your app instead of raw engine)
from sqlalchemy.orm import sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db_session():
    return SessionLocal()