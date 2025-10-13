"""
Webhook Service

Manages webhook registration, delivery, and retry logic with exponential backoff.
Integrates with PostgreSQL for persistence and Redis/Celery for async delivery.
"""

import asyncio
import hashlib
import hmac
import json
import logging
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from uuid import uuid4

import httpx
from sqlalchemy import and_, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.webhook_models import (
    WebhookConfig,
    WebhookCreate,
    WebhookDelivery,
    WebhookDeliveryStatus,
    WebhookEvent,
    WebhookEventType,
    WebhookStats,
    WebhookStatus,
    WebhookUpdate,
)

logger = logging.getLogger(__name__)

# Configuration
MAX_RETRY_ATTEMPTS = 3
INITIAL_RETRY_DELAY = 60  # seconds
MAX_RETRY_DELAY = 3600  # 1 hour
DELIVERY_TIMEOUT = 30  # seconds


class WebhookService:
    """
    Service for managing webhooks and delivering events to external endpoints.
    """

    def __init__(self, db_session: AsyncSession):
        self.db = db_session

    async def create_webhook(
        self,
        partner_id: str,
        webhook_data: WebhookCreate
    ) -> WebhookConfig:
        """
        Register a new webhook for a partner.

        Args:
            partner_id: Partner identifier
            webhook_data: Webhook configuration

        Returns:
            Created webhook configuration
        """
        webhook_id = f"wh_{int(time.time())}_{uuid4().hex[:8]}"

        webhook = WebhookConfig(
            id=webhook_id,
            partner_id=partner_id,
            url=str(webhook_data.url),
            events=[e.value for e in webhook_data.events],
            secret=webhook_data.secret,  # Should be encrypted in production
            description=webhook_data.description,
            status=WebhookStatus.ACTIVE,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            total_deliveries=0,
            successful_deliveries=0,
            failed_deliveries=0,
        )

        # Insert into database (pseudo-code - adapt to your ORM)
        # await self.db.execute(insert(webhooks).values(webhook.dict()))
        # await self.db.commit()

        logger.info(
            "Webhook created",
            extra={
                "webhook_id": webhook_id,
                "partner_id": partner_id,
                "url": webhook.url,
                "events": webhook.events,
            },
        )

        return webhook

    async def list_webhooks(
        self,
        partner_id: str,
        page: int = 1,
        page_size: int = 25
    ) -> tuple[List[WebhookConfig], int]:
        """
        List all webhooks for a partner.

        Args:
            partner_id: Partner identifier
            page: Page number (1-indexed)
            page_size: Items per page

        Returns:
            Tuple of (webhooks, total_count)
        """
        # Query database (pseudo-code)
        # query = select(Webhook).where(Webhook.partner_id == partner_id)
        # total = await self.db.execute(select(func.count()).select_from(query.subquery()))
        # webhooks = await self.db.execute(
        #     query.offset((page - 1) * page_size).limit(page_size)
        # )

        # Mock response
        return [], 0

    async def get_webhook(self, webhook_id: str, partner_id: str) -> Optional[WebhookConfig]:
        """
        Get webhook by ID, verifying partner ownership.

        Args:
            webhook_id: Webhook identifier
            partner_id: Partner identifier

        Returns:
            Webhook configuration if found and owned by partner
        """
        # Query database (pseudo-code)
        # result = await self.db.execute(
        #     select(Webhook).where(
        #         and_(Webhook.id == webhook_id, Webhook.partner_id == partner_id)
        #     )
        # )
        # return result.scalar_one_or_none()

        return None

    async def update_webhook(
        self,
        webhook_id: str,
        partner_id: str,
        update_data: WebhookUpdate
    ) -> Optional[WebhookConfig]:
        """
        Update webhook configuration.

        Args:
            webhook_id: Webhook identifier
            partner_id: Partner identifier
            update_data: Fields to update

        Returns:
            Updated webhook configuration
        """
        webhook = await self.get_webhook(webhook_id, partner_id)
        if not webhook:
            return None

        # Update fields
        update_dict = update_data.dict(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(webhook, field, value)

        webhook.updated_at = datetime.utcnow()

        # Save to database (pseudo-code)
        # await self.db.commit()
        # await self.db.refresh(webhook)

        logger.info(f"Webhook updated: {webhook_id}", extra={"webhook_id": webhook_id})

        return webhook

    async def delete_webhook(self, webhook_id: str, partner_id: str) -> bool:
        """
        Delete a webhook.

        Args:
            webhook_id: Webhook identifier
            partner_id: Partner identifier

        Returns:
            True if deleted, False if not found
        """
        webhook = await self.get_webhook(webhook_id, partner_id)
        if not webhook:
            return False

        # Delete from database (pseudo-code)
        # await self.db.execute(delete(Webhook).where(Webhook.id == webhook_id))
        # await self.db.commit()

        logger.info(f"Webhook deleted: {webhook_id}", extra={"webhook_id": webhook_id})

        return True

    async def deliver_event(self, webhook_id: str, event: WebhookEvent) -> WebhookDelivery:
        """
        Deliver an event to a webhook endpoint (with retries).

        This method should be called asynchronously (e.g., via Celery task).

        Args:
            webhook_id: Webhook identifier
            event: Event to deliver

        Returns:
            Delivery record
        """
        # Get webhook configuration
        webhook = await self.get_webhook(webhook_id, event.partner_id)
        if not webhook or webhook.status != WebhookStatus.ACTIVE:
            logger.warning(f"Webhook not found or inactive: {webhook_id}")
            raise ValueError("Webhook not found or inactive")

        # Create delivery record
        delivery_id = f"del_{int(time.time())}_{uuid4().hex[:8]}"
        delivery = WebhookDelivery(
            id=delivery_id,
            webhook_id=webhook_id,
            event_type=event.event.value,
            payload=event.dict(),
            status=WebhookDeliveryStatus.PENDING,
            attempt=1,
            created_at=datetime.utcnow(),
        )

        # Attempt delivery with retries
        for attempt in range(1, MAX_RETRY_ATTEMPTS + 1):
            delivery.attempt = attempt

            try:
                result = await self._send_webhook(webhook, event)

                if result["success"]:
                    delivery.status = WebhookDeliveryStatus.SUCCESS
                    delivery.response_status = result["status_code"]
                    delivery.response_body = result.get("response_body", "")[:1000]
                    delivery.delivered_at = datetime.utcnow()
                    delivery.duration_ms = result["duration_ms"]

                    # Update webhook stats
                    await self._update_webhook_stats(webhook_id, success=True)

                    logger.info(
                        f"Webhook delivered successfully",
                        extra={
                            "webhook_id": webhook_id,
                            "delivery_id": delivery_id,
                            "attempt": attempt,
                        },
                    )

                    break  # Success, exit retry loop
                else:
                    # Delivery failed, will retry
                    delivery.status = WebhookDeliveryStatus.RETRY
                    delivery.response_status = result.get("status_code")
                    delivery.error_message = result.get("error", "")[:500]

                    if attempt < MAX_RETRY_ATTEMPTS:
                        # Calculate next retry with exponential backoff
                        retry_delay = min(
                            INITIAL_RETRY_DELAY * (2 ** (attempt - 1)),
                            MAX_RETRY_DELAY,
                        )
                        delivery.next_retry_at = datetime.utcnow() + timedelta(seconds=retry_delay)

                        logger.warning(
                            f"Webhook delivery failed, will retry",
                            extra={
                                "webhook_id": webhook_id,
                                "delivery_id": delivery_id,
                                "attempt": attempt,
                                "retry_in": retry_delay,
                            },
                        )

                        # Wait before retry
                        await asyncio.sleep(retry_delay)
                    else:
                        # Max retries exceeded
                        delivery.status = WebhookDeliveryStatus.FAILED
                        await self._update_webhook_stats(webhook_id, success=False)

                        logger.error(
                            f"Webhook delivery failed after {MAX_RETRY_ATTEMPTS} attempts",
                            extra={
                                "webhook_id": webhook_id,
                                "delivery_id": delivery_id,
                            },
                        )

            except Exception as e:
                logger.exception(f"Webhook delivery exception: {e}")
                delivery.status = WebhookDeliveryStatus.FAILED
                delivery.error_message = str(e)[:500]
                await self._update_webhook_stats(webhook_id, success=False)

        # Save delivery record to database
        # await self.db.execute(insert(webhook_deliveries).values(delivery.dict()))
        # await self.db.commit()

        return delivery

    async def _send_webhook(self, webhook: WebhookConfig, event: WebhookEvent) -> Dict[str, Any]:
        """
        Send HTTP POST request to webhook endpoint.

        Args:
            webhook: Webhook configuration
            event: Event to deliver

        Returns:
            Dictionary with success status and response details
        """
        payload = event.json()
        signature = self._generate_signature(payload, webhook.secret)

        headers = {
            "Content-Type": "application/json",
            "User-Agent": "PSRA-Webhook/1.0",
            "X-Signature": signature,
            "X-Event-Type": event.event.value,
            "X-Webhook-ID": webhook.id,
        }

        if event.correlation_id:
            headers["X-Correlation-ID"] = event.correlation_id

        start_time = time.time()

        try:
            async with httpx.AsyncClient(timeout=DELIVERY_TIMEOUT) as client:
                response = await client.post(
                    webhook.url,
                    content=payload,
                    headers=headers,
                )

                duration_ms = int((time.time() - start_time) * 1000)

                # Consider 2xx status codes as success
                success = 200 <= response.status_code < 300

                return {
                    "success": success,
                    "status_code": response.status_code,
                    "response_body": response.text[:1000],  # Truncate for storage
                    "duration_ms": duration_ms,
                }

        except httpx.TimeoutException:
            return {
                "success": False,
                "error": f"Timeout after {DELIVERY_TIMEOUT} seconds",
                "duration_ms": int((time.time() - start_time) * 1000),
            }
        except httpx.RequestError as e:
            return {
                "success": False,
                "error": f"Request error: {str(e)}",
                "duration_ms": int((time.time() - start_time) * 1000),
            }

    def _generate_signature(self, payload: str, secret: str) -> str:
        """
        Generate HMAC-SHA256 signature for webhook payload.

        Args:
            payload: JSON payload
            secret: Webhook secret

        Returns:
            Signature in format "sha256=<hex_digest>"
        """
        signature = hmac.new(
            secret.encode("utf-8"),
            payload.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

        return f"sha256={signature}"

    async def _update_webhook_stats(self, webhook_id: str, success: bool):
        """
        Update webhook delivery statistics.

        Args:
            webhook_id: Webhook identifier
            success: Whether delivery was successful
        """
        # Update in database (pseudo-code)
        # await self.db.execute(
        #     update(Webhook)
        #     .where(Webhook.id == webhook_id)
        #     .values(
        #         total_deliveries=Webhook.total_deliveries + 1,
        #         successful_deliveries=Webhook.successful_deliveries + (1 if success else 0),
        #         failed_deliveries=Webhook.failed_deliveries + (0 if success else 1),
        #         last_delivery_at=datetime.utcnow(),
        #     )
        # )
        # await self.db.commit()
        pass

    async def get_webhook_stats(self, webhook_id: str, partner_id: str) -> Optional[WebhookStats]:
        """
        Get delivery statistics for a webhook.

        Args:
            webhook_id: Webhook identifier
            partner_id: Partner identifier

        Returns:
            Webhook statistics
        """
        webhook = await self.get_webhook(webhook_id, partner_id)
        if not webhook:
            return None

        # Query delivery logs for detailed stats (pseudo-code)
        # This would aggregate data from webhook_deliveries table

        return WebhookStats(
            webhook_id=webhook.id,
            partner_id=webhook.partner_id,
            url=webhook.url,
            status=webhook.status,
            total_deliveries=webhook.total_deliveries,
            successful_deliveries=webhook.successful_deliveries,
            failed_deliveries=webhook.failed_deliveries,
            success_rate=(
                webhook.successful_deliveries / webhook.total_deliveries * 100
                if webhook.total_deliveries > 0
                else 0.0
            ),
            last_delivery_at=webhook.last_delivery_at,
        )
