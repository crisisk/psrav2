"""Odoo ERP adapter for product and inventory synchronisation.

This adapter provides integration with Odoo (formerly OpenERP) systems for:
- Product master data synchronisation
- Inventory level management
- Bill of Materials (BoM) sync
- Manufacturing order creation

Requirements:
    pip install odoorpc

Environment Variables:
    ODOO_URL: Odoo server URL (e.g., https://mycompany.odoo.com)
    ODOO_DB: Database name
    ODOO_USERNAME: Username
    ODOO_PASSWORD: Password or API key
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Optional

try:
    import odoorpc  # type: ignore
    ODOO_AVAILABLE = True
except ImportError:
    ODOO_AVAILABLE = False


@dataclass
class OdooConfig:
    """Odoo connection configuration."""

    url: str  # Server URL (without protocol if using host/port separately)
    database: str
    username: str
    password: str  # Can be password or API key
    port: int = 8069
    protocol: str = "jsonrpc+ssl"  # jsonrpc, jsonrpc+ssl
    timeout: int = 300  # Request timeout in seconds

    @property
    def host(self) -> str:
        """Extract host from URL."""
        return self.url.replace("https://", "").replace("http://", "").split(":")[0]


@dataclass
class OdooConnection:
    """Odoo connection wrapper."""

    config: OdooConfig
    _odoo: Optional[Any] = None

    def __enter__(self) -> OdooConnection:
        """Establish Odoo connection."""
        if not ODOO_AVAILABLE:
            raise RuntimeError("odoorpc library not installed. Run: pip install odoorpc")

        self._odoo = odoorpc.ODOO(
            host=self.config.host,
            port=self.config.port,
            protocol=self.config.protocol,
            timeout=self.config.timeout,
        )
        self._odoo.login(
            db=self.config.database,
            login=self.config.username,
            password=self.config.password,
        )
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):  # noqa: ANN001
        """Close Odoo connection."""
        if self._odoo:
            # Odoo RPC doesn't require explicit logout for stateless connections
            self._odoo = None

    @property
    def env(self) -> Any:
        """Access Odoo environment for model operations."""
        if not self._odoo:
            raise RuntimeError("Connection not established. Use context manager.")
        return self._odoo.env

    def search_read(self, model: str, domain: list, fields: list[str]) -> list[dict[str, Any]]:
        """Search and read records from Odoo model."""
        if not self._odoo:
            raise RuntimeError("Connection not established.")
        return self._odoo.execute(model, "search_read", domain, fields)

    def create(self, model: str, values: dict[str, Any]) -> int:
        """Create a new record in Odoo."""
        if not self._odoo:
            raise RuntimeError("Connection not established.")
        return self._odoo.execute(model, "create", values)

    def write(self, model: str, record_ids: list[int], values: dict[str, Any]) -> bool:
        """Update existing records in Odoo."""
        if not self._odoo:
            raise RuntimeError("Connection not established.")
        return self._odoo.execute(model, "write", record_ids, values)


@dataclass
class ProductSyncResult:
    """Result of product synchronisation to Odoo."""

    product_id: str  # Internal product ID
    odoo_product_id: int  # Odoo product.product ID
    odoo_template_id: int  # Odoo product.template ID
    default_code: str  # SKU/reference
    synced_at: datetime
    operation: str  # "created" or "updated"
    notes: Optional[str] = None


@dataclass
class InventorySyncResult:
    """Result of inventory synchronisation to Odoo."""

    items_processed: int
    items_created: int
    items_updated: int
    synced_at: datetime
    location_id: int  # Odoo stock location
    notes: Optional[str] = None


class OdooAdapter:
    """Adapter for Odoo ERP integration."""

    def __init__(self, config: OdooConfig):
        """Initialize Odoo adapter with configuration."""
        self.config = config

    def connect(self) -> OdooConnection:
        """Create a new Odoo connection context."""
        return OdooConnection(self.config)

    def sync_product(
        self,
        product_id: str,
        *,
        name: str,
        default_code: str,
        product_type: str = "product",  # "product", "consu", "service"
        uom_id: int = 1,  # Unit of measure (1=Unit by default)
        categ_id: int = 1,  # Product category
        list_price: float = 0.0,
        standard_price: float = 0.0,
        description: Optional[str] = None,
        hs_code: Optional[str] = None,
        extra_fields: Optional[dict[str, Any]] = None,
    ) -> ProductSyncResult:
        """Synchronise product to Odoo.

        Args:
            product_id: Internal product identifier
            name: Product name
            default_code: Product SKU/reference code
            product_type: Product type (product=stockable, consu=consumable, service)
            uom_id: Unit of measure ID (query via product.uom model)
            categ_id: Product category ID (query via product.category model)
            list_price: Sales price
            standard_price: Cost price
            description: Product description
            hs_code: Harmonized System code
            extra_fields: Additional Odoo fields to set

        Returns:
            ProductSyncResult with Odoo identifiers

        Raises:
            RuntimeError: If product sync fails
        """
        with self.connect() as conn:
            # Check if product exists by default_code
            existing = conn.search_read(
                "product.product",
                [("default_code", "=", default_code)],
                ["id", "product_tmpl_id"],
            )

            values = {
                "name": name,
                "default_code": default_code,
                "type": product_type,
                "uom_id": uom_id,
                "uom_po_id": uom_id,
                "categ_id": categ_id,
                "list_price": list_price,
                "standard_price": standard_price,
            }

            if description:
                values["description"] = description
            if hs_code:
                values["hs_code"] = hs_code
            if extra_fields:
                values.update(extra_fields)

            if existing:
                # Update existing product
                odoo_product_id = existing[0]["id"]
                odoo_template_id = existing[0]["product_tmpl_id"][0]
                conn.write("product.product", [odoo_product_id], values)
                operation = "updated"
            else:
                # Create new product
                odoo_product_id = conn.create("product.product", values)
                # Retrieve template ID
                product_data = conn.search_read(
                    "product.product",
                    [("id", "=", odoo_product_id)],
                    ["product_tmpl_id"],
                )
                odoo_template_id = product_data[0]["product_tmpl_id"][0]
                operation = "created"

            return ProductSyncResult(
                product_id=product_id,
                odoo_product_id=odoo_product_id,
                odoo_template_id=odoo_template_id,
                default_code=default_code,
                synced_at=datetime.utcnow(),
                operation=operation,
                notes=f"Product {operation} in Odoo",
            )

    def sync_inventory(
        self,
        items: list[dict[str, Any]],
        *,
        location_id: int = 8,  # Stock location (8=Physical Locations/Stock by default)
        create_missing_products: bool = False,
    ) -> InventorySyncResult:
        """Synchronise inventory levels to Odoo.

        Args:
            items: List of inventory items with structure:
                [
                    {
                        "product_code": "PROD-001",
                        "quantity": 100.0,
                        "lot_number": "LOT-2024-001",  # Optional
                    },
                    ...
                ]
            location_id: Odoo stock location ID
            create_missing_products: Auto-create products if not found

        Returns:
            InventorySyncResult with sync statistics

        Raises:
            RuntimeError: If inventory sync fails
        """
        with self.connect() as conn:
            created = 0
            updated = 0

            for item in items:
                product_code = item["product_code"]
                quantity = item["quantity"]
                lot_number = item.get("lot_number")

                # Find product
                products = conn.search_read(
                    "product.product",
                    [("default_code", "=", product_code)],
                    ["id"],
                )

                if not products:
                    if create_missing_products:
                        # Create basic product
                        product_id = conn.create(
                            "product.product",
                            {
                                "name": product_code,
                                "default_code": product_code,
                                "type": "product",
                            },
                        )
                        created += 1
                    else:
                        continue
                else:
                    product_id = products[0]["id"]

                # Create inventory adjustment using stock.quant
                # In Odoo 14+, direct stock.quant manipulation is used
                quant_values = {
                    "product_id": product_id,
                    "location_id": location_id,
                    "quantity": quantity,
                }

                if lot_number:
                    # Find or create lot
                    lots = conn.search_read(
                        "stock.production.lot",
                        [
                            ("product_id", "=", product_id),
                            ("name", "=", lot_number),
                        ],
                        ["id"],
                    )
                    if lots:
                        lot_id = lots[0]["id"]
                    else:
                        lot_id = conn.create(
                            "stock.production.lot",
                            {
                                "product_id": product_id,
                                "name": lot_number,
                                "company_id": 1,
                            },
                        )
                    quant_values["lot_id"] = lot_id

                # Check if quant exists
                quant_domain = [
                    ("product_id", "=", product_id),
                    ("location_id", "=", location_id),
                ]
                if lot_number:
                    quant_domain.append(("lot_id", "=", lot_id))

                existing_quants = conn.search_read("stock.quant", quant_domain, ["id"])

                if existing_quants:
                    # Update existing quant
                    conn.write("stock.quant", [existing_quants[0]["id"]], quant_values)
                    updated += 1
                else:
                    # Create new quant
                    conn.create("stock.quant", quant_values)
                    created += 1

            return InventorySyncResult(
                items_processed=len(items),
                items_created=created,
                items_updated=updated,
                synced_at=datetime.utcnow(),
                location_id=location_id,
                notes=f"Synced to location {location_id}",
            )

    def sync_bom(
        self,
        product_code: str,
        components: list[dict[str, Any]],
        *,
        bom_type: str = "normal",  # "normal" or "phantom"
        quantity: float = 1.0,
    ) -> dict[str, Any]:
        """Synchronise Bill of Materials to Odoo.

        Args:
            product_code: Product SKU for the finished good
            components: List of component materials:
                [
                    {
                        "product_code": "RM-001",
                        "quantity": 2.0,
                        "uom_id": 1,
                    },
                    ...
                ]
            bom_type: "normal" for regular BoM, "phantom" for kits
            quantity: Quantity of finished product this BoM produces

        Returns:
            Dictionary with bom_id and status
        """
        with self.connect() as conn:
            # Find product
            products = conn.search_read(
                "product.product",
                [("default_code", "=", product_code)],
                ["id", "product_tmpl_id"],
            )

            if not products:
                raise ValueError(f"Product {product_code} not found in Odoo")

            product_tmpl_id = products[0]["product_tmpl_id"][0]

            # Prepare BoM lines
            bom_lines = []
            for comp in components:
                comp_products = conn.search_read(
                    "product.product",
                    [("default_code", "=", comp["product_code"])],
                    ["id"],
                )
                if not comp_products:
                    continue

                bom_lines.append(
                    (
                        0,
                        0,
                        {
                            "product_id": comp_products[0]["id"],
                            "product_qty": comp["quantity"],
                            "product_uom_id": comp.get("uom_id", 1),
                        },
                    )
                )

            # Create BoM
            bom_values = {
                "product_tmpl_id": product_tmpl_id,
                "product_qty": quantity,
                "type": bom_type,
                "bom_line_ids": bom_lines,
            }

            bom_id = conn.create("mrp.bom", bom_values)

            return {
                "bom_id": bom_id,
                "product_tmpl_id": product_tmpl_id,
                "components_synced": len(bom_lines),
                "status": "success",
            }


# Convenience functions for backward compatibility
def connect_odoo(url: str, api_key: str, **kwargs: Any) -> OdooConnection:
    """Create Odoo connection from URL and API key.

    Args:
        url: Odoo server URL
        api_key: API key or password
        **kwargs: Additional configuration (database, username, etc.)

    Returns:
        OdooConnection context manager

    Example:
        >>> with connect_odoo("https://mycompany.odoo.com", "api_key",
        ...                    database="prod", username="admin") as conn:
        ...     products = conn.search_read("product.product", [], ["name"])
    """
    config = OdooConfig(
        url=url,
        database=kwargs.get("database", "odoo"),
        username=kwargs.get("username", "admin"),
        password=api_key,
        port=kwargs.get("port", 8069),
        protocol=kwargs.get("protocol", "jsonrpc+ssl"),
    )
    return OdooConnection(config)


def sync_product(product_id: str, adapter: OdooAdapter, **kwargs: Any) -> ProductSyncResult:
    """Synchronise product using provided adapter.

    Args:
        product_id: Product identifier
        adapter: Configured OdooAdapter instance
        **kwargs: Additional arguments for sync_product

    Returns:
        ProductSyncResult
    """
    return adapter.sync_product(product_id, **kwargs)


def sync_inventory(items: list[dict[str, Any]], adapter: OdooAdapter, **kwargs: Any) -> InventorySyncResult:
    """Synchronise inventory using provided adapter.

    Args:
        items: Inventory items to sync
        adapter: Configured OdooAdapter instance
        **kwargs: Additional arguments for sync_inventory

    Returns:
        InventorySyncResult
    """
    return adapter.sync_inventory(items, **kwargs)
