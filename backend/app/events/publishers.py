import logging
from app.events.event_bus import event_bus
from app.events.schemas import Event

logger = logging.getLogger(__name__)

class EventPublisher:
    """Publisher for events."""
    
    @staticmethod
    def publish_event(event: Event):
        """Publish a Pydantic event model."""
        try:
            event_bus.publish(event.event_type, event.dict())
            logger.info(f"Published {event.event_type}")
        except Exception as e:
            logger.error(f"Failed to publish {event.event_type}: {e}")
            raise

# Convenience functions
def publish_certificate_created(certificate_id: str, user_id: str):
    from app.events.schemas import CertificateCreated
    event = CertificateCreated(certificate_id=certificate_id, user_id=user_id)
    EventPublisher.publish_event(event)

def publish_validation_completed(validation_id: str, result: str):
    from app.events.schemas import ValidationCompleted
    event = ValidationCompleted(validation_id=validation_id, result=result)
    EventPublisher.publish_event(event)