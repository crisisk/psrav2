import logging
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import engine
from app.db.base import Base
from app.schemas.user import UserCreate
from app.services.user import user_service

logger = logging.getLogger(__name__)


async def init_db() -> None:
    """
    Initialize database.
    """
    try:
        # Create tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        # Create first superuser if it doesn't exist
        async with AsyncSession(engine) as db:
            user = await user_service.get_by_email(db, email=settings.FIRST_SUPERUSER_EMAIL)
            if not user:
                user_in = UserCreate(
                    email=settings.FIRST_SUPERUSER_EMAIL,
                    password=settings.FIRST_SUPERUSER_PASSWORD,
                    is_superuser=True,
                )
                await user_service.create(db, obj_in=user_in)
                logger.info("Created first superuser")
            else:
                logger.info("First superuser already exists")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise
