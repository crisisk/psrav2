"""ERP integration package."""

from .service import (
    ERPIntegrationService,
    FatalERPIntegrationError,
    InventoryGateway,
    OutboxEntry,
    OutboxStatus,
    ProcessSummary,
)

__all__ = [
    "ERPIntegrationService",
    "InventoryGateway",
    "OutboxEntry",
    "OutboxStatus",
    "ProcessSummary",
    "FatalERPIntegrationError",
]
