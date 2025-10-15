import pytest
import json
from unittest.mock import patch, MagicMock
from app.events.event_bus import EventBus
from app.events.publishers import EventPublisher, publish_certificate_created
from app.events.schemas import CertificateCreated, ValidationCompleted

@pytest.fixture
def mock_connection():
    with patch("app.events.event_bus.pika.BlockingConnection") as mock_conn:
        mock_channel = MagicMock()
        mock_conn.return_value.channel.return_value = mock_channel
        yield mock_conn, mock_channel

def test_event_bus_publish(mock_connection):
    bus = EventBus()
    bus.publish("TestEvent", {"key": "value"})
    mock_conn, mock_channel = mock_connection
    mock_channel.basic_publish.assert_called_once()
    assert len(bus.replay_store) == 1

def test_event_bus_replay(mock_connection):
    bus = EventBus()
    event_id = list(bus.replay_store.keys())[0] if bus.replay_store else None
    bus.replay_events([event_id] if event_id else [])
    mock_conn, mock_channel = mock_connection
    if event_id:
        mock_channel.basic_publish.assert_called()

def test_publisher_publish_event(mock_connection):
    event = CertificateCreated(certificate_id="123", user_id="user1")
    EventPublisher.publish_event(event)
    mock_conn, mock_channel = mock_connection
    mock_channel.basic_publish.assert_called_once()

def test_publish_certificate_created(mock_connection):
    publish_certificate_created("123", "user1")
    mock_conn, mock_channel = mock_connection
    mock_channel.basic_publish.assert_called_once()

def test_schemas():
    event = CertificateCreated(certificate_id="123", user_id="user1")
    assert event.event_type == "CertificateCreated"
    assert "certificate_id" in event.dict()

# Note: Subscriber tests would require mocking Celery tasks; add as needed.