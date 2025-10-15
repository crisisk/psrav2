import json
import logging
from app.events.event_bus import event_bus
from app.tasks import process_certificate_created, process_validation_completed  # Assumed Celery tasks

logger = logging.getLogger(__name__)

class EventSubscriber:
    """Subscriber for events, triggering Celery tasks."""
    
    @staticmethod
    def handle_certificate_created(ch, method, properties, body):
        """Callback for CertificateCreated events."""
        try:
            message = json.loads(body)
            data = message["data"]
            # Trigger Celery task
            process_certificate_created.delay(data["certificate_id"], data["user_id"])
            ch.basic_ack(delivery_tag=method.delivery_tag)
            logger.info(f"Processed CertificateCreated: {message['event_id']}")
        except Exception as e:
            logger.error(f"Failed to process CertificateCreated: {e}")
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)  # To DLQ

    @staticmethod
    def handle_validation_completed(ch, method, properties, body):
        """Callback for ValidationCompleted events."""
        try:
            message = json.loads(body)
            data = message["data"]
            # Trigger Celery task
            process_validation_completed.delay(data["validation_id"], data["result"])
            ch.basic_ack(delivery_tag=method.delivery_tag)
            logger.info(f"Processed ValidationCompleted: {message['event_id']}")
        except Exception as e:
            logger.error(f"Failed to process ValidationCompleted: {e}")
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)  # To DLQ

# Start subscribers (call in app startup, e.g., via FastAPI lifespan)
def start_subscribers():
    import threading
    def subscribe_certificate():
        event_bus.subscribe("psra_certificatecreated_queue", EventSubscriber.handle_certificate_created)
    
    def subscribe_validation():
        event_bus.subscribe("psra_validationcompleted_queue", EventSubscriber.handle_validation_completed)
    
    threading.Thread(target=subscribe_certificate, daemon=True).start()
    threading.Thread(target=subscribe_validation, daemon=True).start()
    logger.info("Event subscribers started")