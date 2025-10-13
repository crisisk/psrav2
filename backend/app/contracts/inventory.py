"""Canonical contracts for ERP and inventory synchronisation."""

from __future__ import annotations

from datetime import datetime
from typing import Annotated, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from backend.app.contracts.psra import MonetaryValue


class InventoryBaseModel(BaseModel):
    """Base model that enforces canonical inventory constraints."""

    model_config = ConfigDict(extra="forbid", frozen=True, str_strip_whitespace=True)


MaterialCode = Annotated[str, Field(min_length=3, max_length=64, pattern=r"^[A-Z0-9._-]+$")]
RecipeCode = Annotated[str, Field(min_length=3, max_length=64, pattern=r"^[A-Z0-9._-]+$")]
UnitOfMeasure = Annotated[str, Field(min_length=1, max_length=16, pattern=r"^[A-Z]{1,5}$")]
SourceSystem = Annotated[str, Field(min_length=3, max_length=64, pattern=r"^[a-z0-9_-]+$")]
IdempotencyKey = Annotated[str, Field(min_length=8, max_length=128, pattern=r"^[A-Za-z0-9:_-]+$")]


class RecipeMaterial(InventoryBaseModel):
    """Material definition used when synchronising recipes to the ERP."""

    material_code: MaterialCode
    description: Annotated[str, Field(min_length=3, max_length=512)]
    hs_code: Annotated[str, Field(pattern=r"^[0-9]{4,8}$")]
    quantity: Annotated[float, Field(gt=0)]
    unit_of_measure: UnitOfMeasure
    unit_cost: MonetaryValue


class Recipe(InventoryBaseModel):
    """Recipe or bill-of-materials snapshot destined for the ERP system."""

    recipe_code: RecipeCode
    name: Annotated[str, Field(min_length=3, max_length=255)]
    version: Annotated[str, Field(min_length=1, max_length=32)]
    effective_from: datetime
    materials: List[RecipeMaterial]

    @property
    def material_count(self) -> int:
        return len(self.materials)


class RecipeSyncCommand(InventoryBaseModel):
    """Command envelope used for synchronising a recipe with the ERP."""

    tenant_id: UUID
    idempotency_key: IdempotencyKey
    recipe: Recipe
    triggered_at: datetime
    source_system: SourceSystem
    requested_by: Optional[Annotated[str, Field(min_length=3, max_length=128)]] = None


class RecipeSyncResult(InventoryBaseModel):
    """Outcome returned after the ERP confirms a recipe sync."""

    external_recipe_id: Optional[RecipeCode]
    processed_at: datetime
    attempts: Annotated[int, Field(ge=1)]
    notes: Optional[Annotated[str, Field(min_length=3, max_length=1024)]] = None


__all__ = [
    "RecipeMaterial",
    "Recipe",
    "RecipeSyncCommand",
    "RecipeSyncResult",
]
