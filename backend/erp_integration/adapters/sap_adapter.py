"""SAP ERP adapter for BOM and recipe synchronisation.

This adapter provides integration with SAP systems for:
- Bill of Materials (BOM) synchronisation
- Recipe/formula management
- Product master data sync

Requirements:
    pip install pyrfc  # SAP NetWeaver RFC SDK

Environment Variables:
    SAP_ASHOST: Application server hostname
    SAP_SYSNR: System number
    SAP_CLIENT: Client number
    SAP_USER: Username
    SAP_PASSWD: Password
    SAP_LANG: Language code (default: EN)
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Optional
from uuid import UUID

try:
    from pyrfc import Connection  # type: ignore
    SAP_AVAILABLE = True
except ImportError:
    SAP_AVAILABLE = False


@dataclass
class SAPConfig:
    """SAP connection configuration."""

    ashost: str  # Application server host
    sysnr: str  # System number (00-99)
    client: str  # Client number (typically 800, 100, etc.)
    user: str
    passwd: str
    lang: str = "EN"
    trace: bool = False
    saprouter: Optional[str] = None  # SAP Router string if needed

    def to_connection_params(self) -> dict[str, Any]:
        """Convert config to pyrfc connection parameters."""
        params = {
            "ashost": self.ashost,
            "sysnr": self.sysnr,
            "client": self.client,
            "user": self.user,
            "passwd": self.passwd,
            "lang": self.lang,
            "trace": "1" if self.trace else "0",
        }
        if self.saprouter:
            params["saprouter"] = self.saprouter
        return params


@dataclass
class SAPConnection:
    """SAP RFC connection wrapper."""

    config: SAPConfig
    _connection: Optional[Any] = None

    def __enter__(self) -> SAPConnection:
        """Establish SAP connection."""
        if not SAP_AVAILABLE:
            raise RuntimeError("pyrfc library not installed. Run: pip install pyrfc")
        self._connection = Connection(**self.config.to_connection_params())
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):  # noqa: ANN001
        """Close SAP connection."""
        if self._connection:
            self._connection.close()
            self._connection = None

    def call(self, function_module: str, **parameters: Any) -> dict[str, Any]:
        """Call SAP RFC function module."""
        if not self._connection:
            raise RuntimeError("Connection not established. Use context manager.")
        return self._connection.call(function_module, **parameters)


@dataclass
class BOMSyncResult:
    """Result of BOM synchronisation to SAP."""

    product_id: str
    material_number: str  # SAP material number
    bom_number: str  # SAP BOM number
    bom_version: str
    synced_at: datetime
    items_synced: int
    sap_change_number: Optional[str] = None  # Engineering change number
    notes: Optional[str] = None


@dataclass
class RecipeSyncResult:
    """Result of recipe/formula synchronisation to SAP."""

    recipe_code: str
    material_number: str  # SAP material number
    formula_number: str  # SAP formula/recipe number
    formula_version: str
    synced_at: datetime
    components_synced: int
    plant_code: Optional[str] = None  # SAP plant
    notes: Optional[str] = None


class SAPAdapter:
    """Adapter for SAP ERP integration."""

    def __init__(self, config: SAPConfig):
        """Initialize SAP adapter with configuration."""
        self.config = config

    def connect(self) -> SAPConnection:
        """Create a new SAP connection context."""
        return SAPConnection(self.config)

    def sync_bom(
        self,
        product_id: str,
        *,
        material_number: str,
        bom_items: list[dict[str, Any]],
        plant: str = "1000",
        bom_usage: str = "1",  # 1=Production, 2=Engineering, etc.
    ) -> BOMSyncResult:
        """Synchronise Bill of Materials to SAP.

        Args:
            product_id: Internal product identifier
            material_number: SAP material master number
            bom_items: List of BOM components with structure:
                [
                    {
                        "component": "RAW-MAT-001",
                        "quantity": 10.0,
                        "unit": "KG",
                        "item_category": "L",  # L=Stock item, N=Non-stock
                    },
                    ...
                ]
            plant: SAP plant code
            bom_usage: BOM usage type

        Returns:
            BOMSyncResult with SAP identifiers

        Raises:
            RuntimeError: If SAP connection fails or BOM creation fails
        """
        with self.connect() as conn:
            # Call SAP function module CSAP_MAT_BOM_CREATE or similar
            # This is a template - actual function depends on SAP version
            result = conn.call(
                "CSAP_MAT_BOM_CREATE",
                MATERIAL=material_number,
                PLANT=plant,
                BOM_USAGE=bom_usage,
                VALID_FROM=datetime.now().strftime("%Y%m%d"),
                BOM_ITEMS=bom_items,
            )

            return BOMSyncResult(
                product_id=product_id,
                material_number=material_number,
                bom_number=result.get("BOM_NO", ""),
                bom_version=result.get("BOM_VERSION", "1"),
                synced_at=datetime.utcnow(),
                items_synced=len(bom_items),
                sap_change_number=result.get("CHANGE_NO"),
                notes=f"Synced to plant {plant}",
            )

    def sync_recipe(
        self,
        recipe_data: dict[str, Any],
        *,
        plant: str = "1000",
        recipe_type: str = "F",  # F=Formula
    ) -> RecipeSyncResult:
        """Synchronise recipe/formula to SAP.

        Args:
            recipe_data: Recipe payload with structure:
                {
                    "recipe_code": "RECIPE-001",
                    "material": "FG-PRODUCT-001",
                    "version": "01",
                    "components": [
                        {
                            "material": "RM-001",
                            "quantity": 50.0,
                            "unit": "KG",
                            "sequence": 10,
                        },
                        ...
                    ],
                    "operations": [...]  # Optional process steps
                }
            plant: SAP plant code
            recipe_type: Recipe type (F=Formula, R=Recipe, etc.)

        Returns:
            RecipeSyncResult with SAP identifiers

        Raises:
            RuntimeError: If recipe sync fails
        """
        with self.connect() as conn:
            # Call SAP function module C_RECIPE_CREATE or BAPI_RECIPE_CREATE
            # This is a template - actual implementation depends on SAP PP-PI module
            result = conn.call(
                "BAPI_RECIPE_CREATE",
                MATERIAL=recipe_data["material"],
                PLANT=plant,
                RECIPE_TYPE=recipe_type,
                VALID_FROM=datetime.now().strftime("%Y%m%d"),
                COMPONENTS=recipe_data["components"],
                OPERATIONS=recipe_data.get("operations", []),
            )

            # Commit the transaction
            conn.call("BAPI_TRANSACTION_COMMIT", WAIT="X")

            return RecipeSyncResult(
                recipe_code=recipe_data["recipe_code"],
                material_number=recipe_data["material"],
                formula_number=result.get("RECIPE_NO", ""),
                formula_version=recipe_data.get("version", "01"),
                synced_at=datetime.utcnow(),
                components_synced=len(recipe_data["components"]),
                plant_code=plant,
                notes=f"Recipe type: {recipe_type}",
            )

    def get_material_info(self, material_number: str) -> dict[str, Any]:
        """Retrieve material master data from SAP.

        Args:
            material_number: SAP material number

        Returns:
            Material master data dictionary
        """
        with self.connect() as conn:
            result = conn.call(
                "BAPI_MATERIAL_GET_DETAIL",
                MATERIAL=material_number,
            )
            return result


# Convenience functions for backward compatibility
def connect_sap(config: dict[str, Any]) -> SAPConnection:
    """Create SAP connection from configuration dictionary.

    Args:
        config: Configuration dictionary with keys matching SAPConfig fields

    Returns:
        SAPConnection context manager

    Example:
        >>> config = {
        ...     "ashost": "sap.example.com",
        ...     "sysnr": "00",
        ...     "client": "800",
        ...     "user": "SAP_USER",
        ...     "passwd": "password",
        ... }
        >>> with connect_sap(config) as conn:
        ...     result = conn.call("RFC_SYSTEM_INFO")
    """
    sap_config = SAPConfig(**config)
    return SAPConnection(sap_config)


def sync_bom(product_id: str, adapter: SAPAdapter, **kwargs: Any) -> BOMSyncResult:
    """Synchronise BOM using provided adapter.

    Args:
        product_id: Product identifier
        adapter: Configured SAPAdapter instance
        **kwargs: Additional arguments for sync_bom

    Returns:
        BOMSyncResult
    """
    return adapter.sync_bom(product_id, **kwargs)


def sync_recipe(recipe_data: dict[str, Any], adapter: SAPAdapter, **kwargs: Any) -> RecipeSyncResult:
    """Synchronise recipe using provided adapter.

    Args:
        recipe_data: Recipe payload
        adapter: Configured SAPAdapter instance
        **kwargs: Additional arguments for sync_recipe

    Returns:
        RecipeSyncResult
    """
    return adapter.sync_recipe(recipe_data, **kwargs)
