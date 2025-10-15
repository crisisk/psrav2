import os
import json
import logging
import uuid
from typing import Callable, Dict, Any
import pika
from pika.exceptions import AMQPConnectionError, AMQPChannelError
from contextlib import contextmanager

logger = logging.getLogger(__name__)

class EventBus:
    """
    RabbitMQ-based event bus for publishing and subscribing to events.
    Supports DLQ for failed messages and event replay.
    """
    def __init__(self):
        self.host = os.getenv("RABBITMQ_HOST", "localhost")
        self.port = int(os.getenv("RABBITMQ_PORT", 5672))
        self.username = os.getenv("RABBITMQ_USERNAME", "guest")
        self.password = os.getenv("RABBITMQ_PASSWORD", "guest")
        self.exchange = "psra_events"
        self.dlx_exchange = "psra_dlx"  # Dead letter exchange
        self.dlq_queue = "psra_dlq"     # Dead letter queue
        self.replay_store: Dict[str, Dict[str, Any]] = {}  # In-memory store for replay (use DB in prod)

    @contextmanager
    def _get_connection(self):
        """Context manager for RabbitMQ connection."""
        try:
            credentials = pika.PlainCredentials(self.username, self.password)
            connection = pika.BlockingConnection(
                pika.ConnectionParameters(host=self.host, port=self.port, credentials=credentials)
            )
            yield connection
        except AMQPConnectionError as e:
            logger.error(f"Failed to connect to RabbitMQ: {e}")
            raise
        finally:
            if 'connection' in locals():
                connection.close()

    def _declare_infrastructure(self, channel):
        """Declare exchanges, queues, and bindings, including DLQ."""
        # Main exchange
        channel.exchange_declare(exchange=self.exchange, exchange_type="topic", durable=True)
        
        # DLX and DLQ
        channel.exchange_declare(exchange=self.dlx_exchange, exchange_type="direct", durable=True)
        channel.queue_declare(queue=self.dlq_queue, durable=True)
        channel.queue_bind(exchange=self.dlx_exchange, queue=self.dlq_queue, routing_key="failed")
        
        # Example queues for events (declare per event type as needed)
        for event_type in ["CertificateCreated", "ValidationCompleted"]:
            queue = f"psra_{event_type.lower()}_queue"
            channel.queue_declare(
                queue=queue,
                durable=True,
                arguments={
                    "x-dead-letter-exchange": self.dlx_exchange,
                    "x-dead-letter-routing-key": "failed",
                    "x-message-ttl": 60000,  # 1 min TTL for retries
                }
            )
            channel.queue_bind(exchange=self.exchange, queue=queue, routing_key=event_type)

    def publish(self, event_type: str, event_data: Dict[str, Any], routing_key: str = None):
        """Publish an event to the bus and store for replay."""
        event_id = str(uuid.uuid4())
        message = {
            "event_id": event_id,
            "event_type": event_type,
            "data": event_data,
            "timestamp": event_data.get("timestamp"),  # Assumed in data
        }
        # Store for replay
        self.replay_store[event_id] = message
        
        with self._get_connection() as connection:
            channel = connection.channel()
            self._declare_infrastructure(channel)
            channel.basic_publish(
                exchange=self.exchange,
                routing_key=routing_key or event_type,
                body=json.dumps(message),
                properties=pika.BasicProperties(delivery_mode=2)  # Persistent
            )
        logger.info(f"Published event {event_id} of type {event_type}")

    def replay_events(self, event_ids: list = None):
        """Replay stored events (all or specific IDs)."""
        to_replay = self.replay_store.values() if not event_ids else [self.replay_store.get(eid) for eid in event_ids if eid in self.replay_store]
        for event in to_replay:
            self.publish(event["event_type"], event["data"])
        logger.info(f"Replayed {len(to_replay)} events")

    def subscribe(self, queue: str, callback: Callable):
        """Subscribe to a queue and process messages with callback."""
        with self._get_connection() as connection:
            channel = connection.channel()
            self._declare_infrastructure(channel)
            channel.basic_consume(queue=queue, on_message_callback=callback, auto_ack=False)
            logger.info(f"Subscribed to queue {queue}")
            try:
                channel.start_consuming()
            except KeyboardInterrupt:
                channel.stop_consuming()
                logger.info("Stopped consuming")

# Singleton instance
event_bus = EventBus()