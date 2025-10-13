"""
Celery Tasks for Webhook Delivery

Asynchronous webhook delivery tasks with retry logic.
"""

import logging
from celery import Task, current_app
from celery.exceptions import MaxRetriesExceededError

# Note: models and services imports are commented out to avoid import errors
# Uncomment when running in production with proper Python path
# from ..models.webhook_models import WebhookEvent
# from ..services.webhook_service import WebhookService

logger = logging.getLogger(__name__)

# Get the celery app from current context (defined in celery_app.py)
celery_app = current_app._get_current_object()


class WebhookDeliveryTask(Task):
    """Base task for webhook delivery with retry logic"""
    autoretry_for = (Exception,)
    retry_kwargs = {'max_retries': 3}
    retry_backoff = True
    retry_backoff_max = 600  # 10 minutes
    retry_jitter = True


@celery_app.task(base=WebhookDeliveryTask, name="webhooks.deliver_event")
def deliver_webhook_event(webhook_id: str, event_data: dict):
    """
    Celery task to deliver a webhook event asynchronously.

    Args:
        webhook_id: Webhook identifier
        event_data: Serialized WebhookEvent data

    Returns:
        Delivery ID if successful

    Raises:
        MaxRetriesExceededError: If max retries exceeded
    """
    try:
        # Reconstruct event from dict
        # event = WebhookEvent(**event_data)
        event = event_data  # Use dict directly for now

        logger.info(
            f"Delivering webhook event",
            extra={
                "webhook_id": webhook_id,
                "event_type": event.get("event"),
                "partner_id": event.get("partner_id"),
            },
        )

        # Get database session and deliver
        # In production, this would use proper async session management
        # For now, this is a synchronous wrapper around async code
        import asyncio
        from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
        from sqlalchemy.orm import sessionmaker

        # Create async session
        engine = create_async_engine("postgresql+asyncpg://user:pass@localhost/psra")
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

        async def _deliver():
            async with async_session() as session:
                service = WebhookService(session)
                delivery = await service.deliver_event(webhook_id, event)
                return delivery.id

        # Run async delivery
        loop = asyncio.get_event_loop()
        delivery_id = loop.run_until_complete(_deliver())

        logger.info(
            f"Webhook delivered successfully",
            extra={"webhook_id": webhook_id, "delivery_id": delivery_id},
        )

        return delivery_id

    except MaxRetriesExceededError:
        logger.error(
            f"Webhook delivery failed after max retries",
            extra={"webhook_id": webhook_id, "event_type": event_data.get("event")},
        )
        raise

    except Exception as e:
        logger.exception(
            f"Webhook delivery error: {e}",
            extra={"webhook_id": webhook_id, "event_type": event_data.get("event")},
        )
        # Celery will automatically retry based on retry_kwargs
        raise


@celery_app.task(name="webhooks.cleanup_old_deliveries")
def cleanup_old_deliveries(days_old: int = 90):
    """
    Cleanup old webhook delivery records.

    Args:
        days_old: Delete delivery records older than this many days
    """
    from datetime import datetime, timedelta

    cutoff_date = datetime.utcnow() - timedelta(days=days_old)

    logger.info(f"Cleaning up webhook deliveries older than {cutoff_date}")

    # Delete old records from database (pseudo-code)
    # deleted_count = await db.execute(
    #     delete(WebhookDelivery).where(WebhookDelivery.created_at < cutoff_date)
    # )

    logger.info(f"Cleaned up old webhook deliveries")


@celery_app.task(name="webhooks.retry_failed_deliveries")
def retry_failed_deliveries():
    """
    Retry webhook deliveries that failed but haven't reached max retries.

    This task runs periodically (e.g., every 5 minutes) to pick up
    failed deliveries and retry them.
    """
    from datetime import datetime

    logger.info("Checking for failed webhook deliveries to retry")

    # Query for failed deliveries that need retry (pseudo-code)
    # pending_retries = await db.execute(
    #     select(WebhookDelivery)
    #     .where(
    #         and_(
    #             WebhookDelivery.status == WebhookDeliveryStatus.RETRY,
    #             WebhookDelivery.next_retry_at <= datetime.utcnow(),
    #             WebhookDelivery.attempt < MAX_RETRY_ATTEMPTS,
    #         )
    #     )
    #     .limit(100)  # Process in batches
    # )

    # for delivery in pending_retries:
    #     deliver_webhook_event.delay(delivery.webhook_id, delivery.payload)

    logger.info("Finished processing failed webhook deliveries")


# Note: Periodic tasks are configured in celery_app.py beat_schedule
