# ERP Integration System

Enterprise Resource Planning (ERP) integration module implementing saga pattern with outbox semantics for reliable synchronisation of product recipes, BOMs, and inventory data.

## Architecture

### Core Components

1. **Service Layer** (`service.py`)
   - Implements saga + outbox pattern
   - Handles retry logic with exponential backoff
   - Manages dead letter queue for failed operations
   - Provides idempotency guarantees

2. **Adapters** (`adapters/`)
   - SAP adapter (`sap_adapter.py`) - SAP NetWeaver RFC integration
   - Odoo adapter (`odoo_adapter.py`) - Odoo/OpenERP REST API integration
   - Extensible architecture for adding custom adapters

3. **Monitoring API** (`../api/erp_status_router.py`)
   - Real-time queue status monitoring
   - Performance metrics and analytics
   - Failed sync attempt tracking
   - Individual saga detail inspection

4. **Configuration** (`config_schema.json`)
   - JSON Schema for adapter configuration
   - Retry policy definitions
   - Timeout settings
   - Feature flags and monitoring config

## Database Schema

The `erp_outbox` table tracks all synchronisation operations:

```sql
CREATE TABLE erp_outbox (
    id UUID PRIMARY KEY,
    saga_id UUID UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    idempotency_key VARCHAR(128) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    attempts INTEGER NOT NULL DEFAULT 0,
    next_run_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_error TEXT,
    result_payload JSONB,
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_erp_outbox_idempotency UNIQUE (tenant_id, idempotency_key)
);
```

## Adapters

### SAP Adapter

Integrates with SAP ERP systems via RFC (Remote Function Call).

**Requirements:**
```bash
pip install pyrfc
```

**Features:**
- BOM synchronisation (CSAP_MAT_BOM_CREATE)
- Recipe/formula management (BAPI_RECIPE_CREATE)
- Material master data retrieval (BAPI_MATERIAL_GET_DETAIL)

**Example Usage:**
```python
from backend.erp_integration.adapters.sap_adapter import SAPAdapter, SAPConfig

config = SAPConfig(
    ashost="sap.example.com",
    sysnr="00",
    client="800",
    user="SAP_USER",
    passwd="password",
    lang="EN"
)

adapter = SAPAdapter(config)

# Sync BOM
result = adapter.sync_bom(
    product_id="PROD-001",
    material_number="FG-001",
    bom_items=[
        {
            "component": "RM-001",
            "quantity": 10.0,
            "unit": "KG",
            "item_category": "L",
        }
    ],
    plant="1000"
)
```

**Configuration:**
```json
{
  "adapter_type": "sap",
  "connection": {
    "ashost": "sap.example.com",
    "sysnr": "00",
    "client": "800",
    "user": "PSRA_USER",
    "passwd": "${SAP_PASSWORD}",
    "lang": "EN"
  }
}
```

### Odoo Adapter

Integrates with Odoo (OpenERP) via JSON-RPC API.

**Requirements:**
```bash
pip install odoorpc
```

**Features:**
- Product synchronisation (product.product, product.template)
- Inventory level management (stock.quant)
- BOM synchronisation (mrp.bom)
- Lot/serial number tracking

**Example Usage:**
```python
from backend.erp_integration.adapters.odoo_adapter import OdooAdapter, OdooConfig

config = OdooConfig(
    url="https://mycompany.odoo.com",
    database="production",
    username="admin",
    password="api_key"
)

adapter = OdooAdapter(config)

# Sync product
result = adapter.sync_product(
    product_id="PROD-001",
    name="Product Name",
    default_code="SKU-001",
    product_type="product",
    list_price=100.0,
    standard_price=75.0
)

# Sync inventory
result = adapter.sync_inventory(
    items=[
        {
            "product_code": "SKU-001",
            "quantity": 100.0,
            "lot_number": "LOT-2024-001"
        }
    ],
    location_id=8
)
```

**Configuration:**
```json
{
  "adapter_type": "odoo",
  "connection": {
    "url": "https://mycompany.odoo.com",
    "database": "production",
    "username": "psra_integration",
    "password": "${ODOO_API_KEY}",
    "port": 8069,
    "protocol": "jsonrpc+ssl"
  }
}
```

## Service Layer Usage

### Enqueue Recipe Sync

```python
from backend.erp_integration.service import ERPIntegrationService
from backend.app.contracts.inventory import RecipeSyncCommand, Recipe, RecipeMaterial
from backend.app.db.session import get_session_factory

service = ERPIntegrationService(
    session_factory=get_session_factory(),
    inventory_gateway=your_inventory_gateway
)

command = RecipeSyncCommand(
    tenant_id=tenant_uuid,
    idempotency_key="recipe-sync-2024-001",
    recipe=Recipe(
        recipe_code="RECIPE-001",
        name="Example Recipe",
        version="1.0",
        effective_from=datetime.utcnow(),
        materials=[
            RecipeMaterial(
                material_code="RM-001",
                description="Raw Material 1",
                hs_code="12345678",
                quantity=10.0,
                unit_of_measure="KG",
                unit_cost={"amount": 5.50, "currency": "USD"}
            )
        ]
    ),
    triggered_at=datetime.utcnow(),
    source_system="manufacturing-app"
)

# Enqueue for processing
entry = service.enqueue_recipe_sync(command)
print(f"Enqueued saga: {entry.saga_id}")
```

### Process Pending Queue

```python
# Process up to 10 pending items
summary = service.process_pending(limit=10)

print(f"Processed: {summary.processed}")
print(f"Failed: {summary.failed}")
print(f"Completed IDs: {summary.completed_ids}")
```

### Check Saga Status

```python
saga_id = uuid.UUID("...")
entry = service.get_entry(saga_id)

if entry:
    print(f"Status: {entry.status}")
    print(f"Attempts: {entry.attempts}")
    print(f"Next run: {entry.next_run_at}")

result = service.get_result(saga_id)
if result:
    print(f"External ID: {result.external_recipe_id}")
```

### List Dead Letters

```python
dead_letters = service.list_dead_letters(limit=50)
for entry in dead_letters:
    print(f"Dead saga: {entry.saga_id}")
    print(f"Error: {entry.last_error}")
```

## Monitoring API Endpoints

### GET /api/erp/status

Get current sync queue status.

**Response:**
```json
{
  "pending_count": 12,
  "in_progress_count": 2,
  "completed_count": 1543,
  "dead_count": 3,
  "oldest_pending_at": "2024-10-13T10:30:00Z",
  "newest_pending_at": "2024-10-13T14:45:00Z",
  "total_queue_size": 14,
  "backlog_hours": 4.25
}
```

### GET /api/erp/metrics?hours=24

Get performance metrics for the last N hours.

**Parameters:**
- `hours` (int, 1-168): Time period for metrics

**Response:**
```json
{
  "success_rate": 97.5,
  "avg_latency_seconds": 2.3,
  "total_processed": 1234,
  "total_succeeded": 1203,
  "total_failed": 31,
  "retry_metrics": {
    "total_retries": 45,
    "avg_retries_per_saga": 0.036,
    "max_retries_saga_id": "uuid-here",
    "max_retries_count": 4,
    "sagas_with_retries": 28
  },
  "dead_letter_queue_size": 3,
  "period_start": "2024-10-12T14:00:00Z",
  "period_end": "2024-10-13T14:00:00Z"
}
```

### GET /api/erp/failed?page=1&page_size=50

Get paginated list of failed sync attempts.

**Parameters:**
- `page` (int): Page number
- `page_size` (int, 1-200): Items per page
- `include_dead` (bool): Include dead letter items

**Response:**
```json
{
  "items": [
    {
      "saga_id": "uuid-here",
      "tenant_id": "tenant-uuid",
      "event_type": "inventory.recipe.upsert",
      "idempotency_key": "recipe-sync-2024-001",
      "attempts": 3,
      "last_error": "Connection timeout to SAP server",
      "next_run_at": "2024-10-13T15:00:00Z",
      "created_at": "2024-10-13T10:00:00Z",
      "updated_at": "2024-10-13T14:30:00Z",
      "status": "pending",
      "payload_summary": "RECIPE-001 v1.0"
    }
  ],
  "total_count": 31,
  "page": 1,
  "page_size": 50
}
```

### GET /api/erp/saga/{saga_id}

Get detailed information about a specific saga.

**Response:**
```json
{
  "saga_id": "uuid-here",
  "tenant_id": "tenant-uuid",
  "idempotency_key": "recipe-sync-2024-001",
  "event_type": "inventory.recipe.upsert",
  "status": "pending",
  "attempts": 3,
  "next_run_at": "2024-10-13T15:00:00Z",
  "last_error": "Connection timeout",
  "payload": { "recipe": {...} },
  "result_payload": null,
  "processing_started_at": "2024-10-13T14:28:00Z",
  "processed_at": null,
  "created_at": "2024-10-13T10:00:00Z",
  "updated_at": "2024-10-13T14:30:00Z",
  "backoff_seconds": 600,
  "time_in_queue_seconds": null
}
```

## Retry Policy

The service implements exponential backoff with the following schedule:

| Attempt | Delay (seconds) | Delay (human) |
|---------|----------------|---------------|
| 1       | 30             | 30 seconds    |
| 2       | 120            | 2 minutes     |
| 3       | 600            | 10 minutes    |
| 4       | 1800           | 30 minutes    |
| 5       | 3600           | 1 hour        |

After 5 failed attempts, the saga moves to the **dead letter queue** with status `dead`.

## Configuration Schema

The `config_schema.json` defines the complete configuration structure with:

- **Connection parameters** for each adapter type
- **Retry policies** (exponential, linear, fixed, custom)
- **Timeout settings** (connection, request, sync)
- **Monitoring configuration** (alerts, thresholds, logging)
- **Feature flags** (batching, circuit breaker, validation)

### Configuration Examples

See the `examples` array in `config_schema.json` for complete configuration templates.

### Environment Variables

Sensitive credentials can be referenced using environment variable syntax:

```json
{
  "connection": {
    "passwd": "${SAP_PASSWORD}",
    "api_key": "${ODOO_API_KEY}"
  }
}
```

## Error Handling

### Fatal Errors

Raise `FatalERPIntegrationError` for unrecoverable errors (e.g., invalid payload format, authorization failure). These skip retries and go directly to dead letter queue.

```python
from backend.erp_integration.service import FatalERPIntegrationError

def upsert_recipe(self, *, tenant_id: UUID, command: RecipeSyncCommand):
    if not self.validate_authorization(tenant_id):
        raise FatalERPIntegrationError("Tenant not authorized for ERP sync")
    # ... proceed with sync
```

### Transient Errors

All other exceptions trigger retry logic:

```python
# Connection errors, timeouts, etc. will be retried automatically
try:
    result = adapter.sync_bom(...)
except ConnectionError as e:
    # Service will retry with backoff
    raise
```

## Best Practices

1. **Idempotency Keys**: Always use unique, deterministic idempotency keys (e.g., `recipe-{recipe_code}-{version}`)

2. **Monitoring**: Set up alerts for:
   - Dead letter queue items
   - Queue backlog exceeding threshold
   - Failure rate above acceptable level

3. **Batch Processing**: Run `process_pending()` on a schedule (e.g., every minute via cron/celery)

4. **Circuit Breaker**: Enable circuit breaker to prevent overwhelming ERP system during outages

5. **Logging**: Set appropriate log level in production (`INFO` or `WARNING`) and disable payload logging for sensitive data

## Testing

### Unit Tests

```bash
pytest backend/tests/erp_integration/test_service.py
pytest backend/tests/erp_integration/test_adapters.py
```

### Integration Tests

```bash
# Requires SAP/Odoo connection
pytest backend/tests/erp_integration/integration/ -m integration
```

## Deployment

1. **Install Dependencies**:
   ```bash
   pip install pyrfc  # For SAP adapter
   pip install odoorpc  # For Odoo adapter
   ```

2. **Configure Environment**:
   ```bash
   export SAP_PASSWORD="..."
   export ODOO_API_KEY="..."
   ```

3. **Run Migrations**:
   ```bash
   alembic upgrade head
   ```

4. **Start Background Worker**:
   ```bash
   # Process pending queue every 60 seconds
   celery -A backend.celery worker --beat --schedule=/tmp/celerybeat-schedule
   ```

5. **Mount API Router**:
   ```python
   from backend.api.erp_status_router import router as erp_router

   app.include_router(erp_router)
   ```

## Troubleshooting

### High Backlog

Check metrics to identify bottleneck:
```bash
curl http://localhost:8000/api/erp/metrics?hours=1
```

Increase processing rate or batch size if needed.

### Dead Letter Items

Investigate individual sagas:
```bash
curl http://localhost:8000/api/erp/failed?include_dead=true
```

Check error messages and fix underlying issues (credentials, network, schema).

### SAP Connection Issues

Enable tracing:
```json
{
  "connection": {
    "trace": true
  }
}
```

Check RFC logs in `/tmp/pyrfc.log`.

### Odoo Timeouts

Increase timeout settings:
```json
{
  "timeout_settings": {
    "request_timeout_seconds": 180,
    "sync_timeout_seconds": 600
  }
}
```

## License

Copyright 2024 SevenSA. All rights reserved.
