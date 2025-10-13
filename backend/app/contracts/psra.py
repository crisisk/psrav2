"""Canonical PSRA domain contracts used across services.

This module provides comprehensive Pydantic v2 models for the PSRA (Preferential
Status Rules Assessment) system. These models represent the core domain objects
used throughout the application for trade compliance, origin determination, and
rules of origin assessment.

Key Domain Models:
    - Product: Finished goods with materials and BOM
    - Material: Raw materials and components with origin tracking
    - BOM: Hierarchical Bill of Materials
    - Assessment: Comprehensive origin assessment results
    - Verdict: Multi-state verdict system (qualified, not_qualified, etc.)
    - TradeAgreement: FTA definitions with rules
    - OriginRule: Rules of origin with criteria and decisions

All models use Pydantic v2 with:
    - Strict validation (extra="forbid")
    - Immutability (frozen=True)
    - Type safety with Annotated types
    - Comprehensive field validators
    - JSON serialization support
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Annotated, Any, Dict, List, Optional
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    computed_field,
    field_validator,
    model_validator,
)
from typing_extensions import Self

RuleId = Annotated[str, Field(pattern=r"^[A-Z]{2,5}-HS[0-9]{2}-[0-9]{3}$")]
JurisdictionCode = Annotated[str, Field(pattern=r"^[A-Z]{2}$")]
AgreementCode = Annotated[str, Field(pattern=r"^[A-Z0-9-]{2,10}$")]
HSChapter = Annotated[str, Field(pattern=r"^[0-9]{2}$")]
HSHeading = Annotated[str, Field(pattern=r"^[0-9]{4}$")]
HSSubheading = Annotated[str, Field(pattern=r"^[0-9]{6}$")]
OperationCode = Annotated[str, Field(pattern=r"^[A-Z0-9_-]{3,32}$")]
ReasonCode = Annotated[str, Field(pattern=r"^[A-Z0-9_]{3,32}$")]
CertificateCode = Annotated[str, Field(min_length=2, max_length=64)]
EvidenceType = Annotated[str, Field(pattern=r"^[a-z0-9-]+$")]
CountryCode = Annotated[str, Field(pattern=r"^[A-Z]{2}$")]
CurrencyCode = Annotated[str, Field(pattern=r"^[A-Z]{3}$")]


class PSRABaseModel(BaseModel):
    """Base class for immutable, strictly-validated PSRA contracts."""

    model_config = ConfigDict(extra="forbid", frozen=True, str_strip_whitespace=True)


class HSCode(PSRABaseModel):
    """Represents a Harmonised System code at chapter/heading/subheading levels.

    The Harmonized System (HS) is an international nomenclature for the classification
    of products. It allows participating countries to classify traded goods on a common
    basis for customs purposes.

    Attributes:
        chapter: 2-digit HS chapter code (e.g., "39" for plastics)
        heading: 4-digit HS heading code (e.g., "3901")
        subheading: 6-digit HS subheading code (e.g., "390110")

    Example:
        >>> hs = HSCode(chapter="39", heading="3901", subheading="390110")
        >>> hs.full_code
        '390110'
    """

    chapter: HSChapter
    heading: HSHeading
    subheading: HSSubheading

    @computed_field(return_type=str)
    def full_code(self) -> str:
        """Returns the full 6-digit HS code."""
        return self.subheading

    @field_validator("heading")
    @classmethod
    def _validate_heading_matches_chapter(cls, v: str, info) -> str:
        """Ensure heading starts with the chapter digits."""
        if "chapter" in info.data and not v.startswith(info.data["chapter"]):
            raise ValueError(f"Heading {v} must start with chapter {info.data['chapter']}")
        return v

    @field_validator("subheading")
    @classmethod
    def _validate_subheading_matches_heading(cls, v: str, info) -> str:
        """Ensure subheading starts with the heading digits."""
        if "heading" in info.data and not v.startswith(info.data["heading"]):
            raise ValueError(f"Subheading {v} must start with heading {info.data['heading']}")
        return v


class Agreement(PSRABaseModel):
    """Represents a trade agreement (FTA/PTA).

    Attributes:
        code: Short code identifier (e.g., "CETA", "USMCA")
        name: Full name of the agreement

    Example:
        >>> agreement = Agreement(code="CETA", name="Canada-European Union Comprehensive Economic and Trade Agreement")
    """

    code: AgreementCode
    name: Annotated[str, Field(min_length=5, max_length=255)]


# ============================================================================
# Trade Agreement Domain Models
# ============================================================================


class AgreementType(str, Enum):
    """Types of trade agreements."""

    FREE_TRADE_AGREEMENT = "free_trade_agreement"
    CUSTOMS_UNION = "customs_union"
    PREFERENTIAL_TRADE_AGREEMENT = "preferential_trade_agreement"
    ECONOMIC_PARTNERSHIP = "economic_partnership"


class OriginRuleType(str, Enum):
    """Types of rules of origin."""

    CHANGE_IN_TARIFF_CLASSIFICATION = "change_in_tariff_classification"
    REGIONAL_VALUE_CONTENT = "regional_value_content"
    SPECIFIC_PROCESS = "specific_process"
    WHOLLY_OBTAINED = "wholly_obtained"
    MIXED = "mixed"


class OriginRule(PSRABaseModel):
    """Detailed origin rule definition.

    Represents a specific rule of origin that defines when a product
    can be considered originating under a trade agreement.

    Attributes:
        rule_id: Unique identifier for the rule
        rule_type: Type of origin rule
        hs_code: HS code(s) this rule applies to
        description: Human-readable description
        conditions: List of conditions that must be met
        required_cth: Change in tariff heading (if applicable)
        required_ctsh: Change in tariff subheading (if applicable)
        rvc_threshold: Regional value content threshold percentage
        allowed_operations: Operations that preserve origin
        disallowed_operations: Operations that break origin

    Example:
        >>> rule = OriginRule(
        ...     rule_id="CETA-HS39-001",
        ...     rule_type=OriginRuleType.REGIONAL_VALUE_CONTENT,
        ...     hs_code="390110",
        ...     description="Polymers must have 50% RVC",
        ...     conditions=["RVC >= 50%", "Production in party country"],
        ...     rvc_threshold=50.0
        ... )
    """

    rule_id: RuleId
    rule_type: OriginRuleType
    hs_code: Annotated[str, Field(pattern=r"^[0-9]{4,10}$")]
    description: Annotated[str, Field(min_length=10, max_length=2048)]
    conditions: List[Annotated[str, Field(max_length=512)]] = Field(min_length=1)
    required_cth: Optional[Annotated[str, Field(pattern=r"^[0-9]{4}$")]] = None
    required_ctsh: Optional[Annotated[str, Field(pattern=r"^[0-9]{6}$")]] = None
    rvc_threshold: Optional[Annotated[Decimal, Field(ge=0, le=100)]] = None
    allowed_operations: List[OperationCode] = Field(default_factory=list)
    disallowed_operations: List[OperationCode] = Field(default_factory=list)
    exceptions: List[Annotated[str, Field(max_length=512)]] = Field(default_factory=list)

    @model_validator(mode="after")
    def _validate_rvc_rules(self) -> Self:
        """Ensure RVC rules have a threshold."""
        if self.rule_type == OriginRuleType.REGIONAL_VALUE_CONTENT:
            if self.rvc_threshold is None:
                raise ValueError("Regional value content rules must specify rvc_threshold")
        return self


class TradeAgreement(PSRABaseModel):
    """Comprehensive trade agreement model.

    Represents a complete trade agreement with all its rules and metadata.

    Attributes:
        agreement_code: Short code (e.g., "CETA", "USMCA")
        name: Full name of the agreement
        agreement_type: Type of trade agreement
        parties: List of country codes that are parties
        effective_date: When the agreement came into force
        expiry_date: When the agreement expires (if applicable)
        rules: List of origin rules under this agreement
        cumulation_allowed: Whether cumulation is allowed
        cumulation_partners: Countries for cumulation
        de_minimis_threshold: De minimis threshold percentage
        product_specific_rules: Additional product-specific rules

    Example:
        >>> agreement = TradeAgreement(
        ...     agreement_code="CETA",
        ...     name="Canada-European Union Comprehensive Economic and Trade Agreement",
        ...     agreement_type=AgreementType.FREE_TRADE_AGREEMENT,
        ...     parties=["CA", "BE", "BG", ...],  # EU member states
        ...     effective_date=date(2017, 9, 21),
        ...     rules=[rule1, rule2, ...],
        ...     cumulation_allowed=True,
        ...     de_minimis_threshold=Decimal("10")
        ... )
    """

    agreement_code: AgreementCode
    name: Annotated[str, Field(min_length=5, max_length=512)]
    agreement_type: AgreementType
    parties: List[CountryCode] = Field(min_length=2)
    effective_date: date
    expiry_date: Optional[date] = None
    rules: List[OriginRule] = Field(default_factory=list)
    cumulation_allowed: bool = False
    cumulation_partners: List[CountryCode] = Field(default_factory=list)
    de_minimis_threshold: Optional[Annotated[Decimal, Field(ge=0, le=100)]] = None
    product_specific_rules: Dict[str, Any] = Field(default_factory=dict)
    official_url: Optional[Annotated[str, Field(max_length=1024)]] = Field(
        default=None, pattern=r"^https?://"
    )
    notes: Optional[Annotated[str, Field(max_length=4096)]] = None

    @field_validator("parties")
    @classmethod
    def _validate_unique_parties(cls, v: List[CountryCode]) -> List[CountryCode]:
        """Ensure all parties are unique."""
        if len(set(v)) != len(v):
            raise ValueError("Party country codes must be unique")
        return v

    @model_validator(mode="after")
    def _validate_cumulation_partners(self) -> Self:
        """Ensure cumulation partners are parties or have relationship."""
        if self.cumulation_partners:
            if not self.cumulation_allowed:
                raise ValueError("cumulation_partners specified but cumulation_allowed is False")
        return self

    @model_validator(mode="after")
    def _validate_dates(self) -> Self:
        """Ensure expiry date is after effective date."""
        if self.expiry_date and self.expiry_date <= self.effective_date:
            raise ValueError("expiry_date must be after effective_date")
        return self

    def is_active(self, as_of: date = None) -> bool:
        """Check if the agreement is active on a given date.

        Args:
            as_of: Date to check (defaults to today)

        Returns:
            True if the agreement is in force on the given date
        """
        check_date = as_of or date.today()
        if check_date < self.effective_date:
            return False
        if self.expiry_date and check_date > self.expiry_date:
            return False
        return True

    def get_rules_for_hs_code(self, hs_code: str) -> List[OriginRule]:
        """Get all rules that apply to a specific HS code.

        Args:
            hs_code: The HS code to search for

        Returns:
            List of applicable rules
        """
        return [rule for rule in self.rules if rule.hs_code == hs_code]

    def to_json_dict(self) -> Dict[str, Any]:
        """Serialize to JSON-compatible dictionary."""
        return self.model_dump(mode="json")


# ============================================================================
# Material and Product Domain Models
# ============================================================================


class MaterialType(str, Enum):
    """Classification of material types in production."""

    RAW_MATERIAL = "raw_material"
    COMPONENT = "component"
    SUBASSEMBLY = "subassembly"
    PACKAGING = "packaging"
    SERVICE = "service"


class OriginStatus(str, Enum):
    """Origin determination status for materials."""

    ORIGINATING = "originating"
    NON_ORIGINATING = "non_originating"
    UNKNOWN = "unknown"
    CONDITIONAL = "conditional"


class Material(PSRABaseModel):
    """Represents a material or component used in production.

    This model captures all relevant information about materials, including
    origin, value, and composition data needed for rules of origin assessment.

    Attributes:
        material_id: Unique identifier for the material
        hs_code: Harmonized System classification code (4-8 digits)
        description: Human-readable description
        material_type: Classification of material
        percentage: Percentage by weight or value in final product (0-100)
        origin_country: ISO 3166-1 alpha-2 country code
        value: Monetary value in specified currency
        origin_status: Origin determination status
        supplier_reference: Optional supplier part number
        parent_material_id: For hierarchical BOM structures

    Example:
        >>> material = Material(
        ...     material_id="MAT-001",
        ...     hs_code="390110",
        ...     description="Polyethylene resin",
        ...     material_type=MaterialType.RAW_MATERIAL,
        ...     percentage=45.5,
        ...     origin_country="CA",
        ...     value=MonetaryValue(amount=1000.00, currency="USD"),
        ...     origin_status=OriginStatus.ORIGINATING
        ... )
    """

    material_id: Annotated[str, Field(min_length=1, max_length=64)]
    hs_code: Annotated[str, Field(pattern=r"^[0-9]{4,10}$")]
    description: Annotated[str, Field(min_length=3, max_length=512)]
    material_type: MaterialType
    percentage: Annotated[Decimal, Field(ge=0, le=100, decimal_places=4)]
    origin_country: CountryCode
    value: MonetaryValue
    origin_status: OriginStatus = OriginStatus.UNKNOWN
    supplier_reference: Optional[Annotated[str, Field(max_length=128)]] = None
    parent_material_id: Optional[Annotated[str, Field(max_length=64)]] = None
    customs_value: Optional[MonetaryValue] = None
    weight_kg: Optional[Annotated[Decimal, Field(ge=0)]] = None

    @field_validator("percentage")
    @classmethod
    def _validate_percentage_precision(cls, v: Decimal) -> Decimal:
        """Ensure percentage has reasonable precision."""
        if v.as_tuple().exponent < -4:
            raise ValueError("Percentage precision cannot exceed 4 decimal places")
        return v

    def to_json_dict(self) -> Dict[str, Any]:
        """Serialize to JSON-compatible dictionary.

        Returns:
            Dictionary with all fields in JSON-serializable format
        """
        data = self.model_dump(mode="json")
        # Convert Decimal to float for JSON
        data["percentage"] = float(self.percentage)
        if self.weight_kg:
            data["weight_kg"] = float(self.weight_kg)
        return data


class Product(PSRABaseModel):
    """Represents a finished product or good.

    This model represents the final product being assessed for preferential origin,
    including all constituent materials and production information.

    Attributes:
        product_code: Internal product identifier or SKU
        description: Product description
        hs_code: Product's HS classification
        declared_origin: Declared country of origin
        materials: List of constituent materials
        ex_works_price: Factory/ex-works value
        fob_price: Free on board price (optional)
        production_country: Country where production occurred
        manufacturer: Optional manufacturer identifier

    Example:
        >>> product = Product(
        ...     product_code="PROD-12345",
        ...     description="Automotive plastic component",
        ...     hs_code="870829",
        ...     declared_origin="CA",
        ...     materials=[material1, material2],
        ...     ex_works_price=MonetaryValue(amount=5000.00, currency="USD"),
        ...     production_country="CA"
        ... )
    """

    product_code: Annotated[str, Field(min_length=1, max_length=100)]
    description: Annotated[str, Field(min_length=3, max_length=512)]
    hs_code: Annotated[str, Field(pattern=r"^[0-9]{6,10}$")]
    declared_origin: CountryCode
    materials: List[Material] = Field(default_factory=list)
    ex_works_price: MonetaryValue
    fob_price: Optional[MonetaryValue] = None
    production_country: CountryCode
    manufacturer: Optional[Annotated[str, Field(max_length=255)]] = None
    certification_references: List[str] = Field(default_factory=list)

    @field_validator("materials")
    @classmethod
    def _validate_materials_unique_ids(cls, v: List[Material]) -> List[Material]:
        """Ensure all material IDs are unique."""
        material_ids = [m.material_id for m in v]
        if len(material_ids) != len(set(material_ids)):
            raise ValueError("Material IDs must be unique within a product")
        return v

    @model_validator(mode="after")
    def _validate_material_percentages(self) -> Self:
        """Validate that material percentages sum to reasonable total."""
        if self.materials:
            total_percentage = sum(m.percentage for m in self.materials)
            # Allow some tolerance for rounding, but should be close to 100
            if total_percentage > Decimal("100.01"):
                raise ValueError(
                    f"Material percentages sum to {total_percentage}%, exceeding 100%"
                )
        return self

    @computed_field(return_type=Decimal)
    def total_material_value(self) -> Decimal:
        """Calculate total value of all materials."""
        # Note: This assumes all materials use the same currency
        return Decimal(sum(m.value.amount for m in self.materials))

    @computed_field(return_type=Decimal)
    def originating_material_percentage(self) -> Decimal:
        """Calculate percentage of originating materials by value."""
        if not self.materials:
            return Decimal("0")

        originating_value = sum(
            m.value.amount
            for m in self.materials
            if m.origin_status == OriginStatus.ORIGINATING
        )
        total_value = sum(m.value.amount for m in self.materials)

        if total_value == 0:
            return Decimal("0")

        return Decimal(str((originating_value / total_value) * 100))

    def to_json_dict(self) -> Dict[str, Any]:
        """Serialize to JSON-compatible dictionary."""
        return self.model_dump(mode="json")


class BOMNode(PSRABaseModel):
    """Represents a node in a hierarchical Bill of Materials tree.

    Attributes:
        material: The material at this node
        children: Child nodes (sub-materials/components)
        level: Depth level in the BOM tree (0 = root)
        quantity: Quantity of this material used

    Example:
        >>> root_material = Material(...)
        >>> child1 = BOMNode(material=child_material1, children=[], level=1, quantity=2)
        >>> root = BOMNode(material=root_material, children=[child1], level=0, quantity=1)
    """

    material: Material
    children: List[BOMNode] = Field(default_factory=list)
    level: Annotated[int, Field(ge=0, le=20)]
    quantity: Annotated[Decimal, Field(gt=0)]
    unit_of_measure: Annotated[str, Field(max_length=10)] = "EA"

    @model_validator(mode="after")
    def _validate_hierarchy(self) -> Self:
        """Ensure children have correct level depth."""
        for child in self.children:
            if child.level != self.level + 1:
                raise ValueError(
                    f"Child level {child.level} must be exactly one more than parent level {self.level}"
                )
        return self

    def flatten(self) -> List[Material]:
        """Flatten the BOM tree to a list of all materials.

        Returns:
            List of all materials in the tree (depth-first traversal)
        """
        result = [self.material]
        for child in self.children:
            result.extend(child.flatten())
        return result

    @computed_field(return_type=int)
    def total_nodes(self) -> int:
        """Count total nodes in the subtree."""
        return 1 + sum(child.total_nodes for child in self.children)


class BillOfMaterials(PSRABaseModel):
    """Complete Bill of Materials with hierarchical structure.

    This model represents the complete hierarchical BOM for a product,
    supporting complex multi-level assemblies.

    Attributes:
        bom_id: Unique identifier for this BOM
        product_code: Reference to the finished product
        version: BOM version number
        effective_date: When this BOM becomes effective
        root_nodes: Top-level materials/assemblies
        created_at: BOM creation timestamp
        created_by: User or system that created the BOM

    Example:
        >>> bom = BillOfMaterials(
        ...     bom_id="BOM-12345",
        ...     product_code="PROD-12345",
        ...     version="1.0",
        ...     effective_date=date.today(),
        ...     root_nodes=[root_node]
        ... )
    """

    bom_id: Annotated[str, Field(min_length=1, max_length=64)]
    product_code: Annotated[str, Field(min_length=1, max_length=100)]
    version: Annotated[str, Field(pattern=r"^\d+\.\d+(\.\d+)?$")]
    effective_date: date
    root_nodes: List[BOMNode] = Field(min_length=1)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[Annotated[str, Field(max_length=128)]] = None
    notes: Optional[Annotated[str, Field(max_length=2048)]] = None

    @field_validator("root_nodes")
    @classmethod
    def _validate_root_levels(cls, v: List[BOMNode]) -> List[BOMNode]:
        """Ensure all root nodes are at level 0."""
        for node in v:
            if node.level != 0:
                raise ValueError("Root nodes must be at level 0")
        return v

    def get_all_materials(self) -> List[Material]:
        """Get flattened list of all materials in the BOM.

        Returns:
            List of all materials across all levels
        """
        materials = []
        for root in self.root_nodes:
            materials.extend(root.flatten())
        return materials

    @computed_field(return_type=int)
    def total_material_count(self) -> int:
        """Total count of all materials in the BOM."""
        return sum(root.total_nodes for root in self.root_nodes)

    @computed_field(return_type=int)
    def max_depth(self) -> int:
        """Maximum depth of the BOM tree."""
        def get_depth(node: BOMNode) -> int:
            if not node.children:
                return node.level
            return max(get_depth(child) for child in node.children)

        if not self.root_nodes:
            return 0
        return max(get_depth(root) for root in self.root_nodes)

    def to_json_dict(self) -> Dict[str, Any]:
        """Serialize to JSON-compatible dictionary."""
        return self.model_dump(mode="json")


class RequiredInputType(str, Enum):
    MATERIAL = "material"
    COMPONENT = "component"
    SERVICE = "service"


class RequiredInput(PSRABaseModel):
    type: RequiredInputType
    hs_code: Annotated[str, Field(pattern=r"^[0-9]{4,8}$")]
    description: Annotated[str, Field(min_length=5, max_length=512)]
    max_percentage: Optional[Annotated[float, Field(ge=0, le=100)]] = None


class RegionalValueMethod(str, Enum):
    BUILD_UP = "build-up"
    BUILD_DOWN = "build-down"
    NET_COST = "net-cost"


class RegionalValueContent(PSRABaseModel):
    method: RegionalValueMethod
    threshold: Annotated[float, Field(ge=0, le=100)]
    calculation_window_days: Annotated[int, Field(ge=30, le=1095)]


class NonOriginatingMaterials(PSRABaseModel):
    max_percentage: Annotated[float, Field(ge=0, le=100)]


class BillOfMaterialsCriteria(PSRABaseModel):
    required_inputs: List[RequiredInput]
    regional_value_content: RegionalValueContent
    non_originating_materials: Optional[NonOriginatingMaterials] = None


class Operation(PSRABaseModel):
    code: OperationCode
    description: Annotated[str, Field(min_length=5, max_length=512)]


class ProcessCriteria(PSRABaseModel):
    required_operations: List[Operation]
    disallowed_operations: List[Operation]

    @field_validator("required_operations")
    @classmethod
    def _ensure_required_non_empty(cls, value: List[Operation]) -> List[Operation]:
        if not value:
            raise ValueError("required_operations must contain at least one operation")
        return value


class AdditionalEvidence(PSRABaseModel):
    type: EvidenceType
    description: Annotated[str, Field(min_length=5, max_length=512)]


class DocumentationCriteria(PSRABaseModel):
    certificates: List[CertificateCode]
    record_retention_days: Annotated[int, Field(ge=365, le=7300)]
    additional_evidence: Optional[List[AdditionalEvidence]] = None

    @field_validator("certificates")
    @classmethod
    def _ensure_certificates_non_empty(cls, value: List[CertificateCode]) -> List[CertificateCode]:
        if not value:
            raise ValueError("At least one certificate is required")
        return value


class RuleCriteria(PSRABaseModel):
    bom: BillOfMaterialsCriteria
    process: ProcessCriteria
    documentation: DocumentationCriteria


class Citation(PSRABaseModel):
    reference: Annotated[str, Field(min_length=5, max_length=512)]
    section: Optional[Annotated[str, Field(min_length=1, max_length=128)]] = None
    url: Optional[Annotated[str, Field(max_length=1024)]] = Field(default=None, pattern=r"^https?://")


class QualifiedVerdict(PSRABaseModel):
    description: Annotated[str, Field(min_length=10, max_length=2048)]
    citations: List[Citation]

    @field_validator("citations")
    @classmethod
    def _ensure_citations(cls, value: List[Citation]) -> List[Citation]:
        if not value:
            raise ValueError("Qualified verdict must contain at least one citation")
        return value


class Severity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class DisqualificationReason(PSRABaseModel):
    code: ReasonCode
    description: Annotated[str, Field(min_length=5, max_length=2048)]
    severity: Severity


class DisqualifiedVerdict(PSRABaseModel):
    reasons: List[DisqualificationReason]

    @field_validator("reasons")
    @classmethod
    def _ensure_reasons(cls, value: List[DisqualificationReason]) -> List[DisqualificationReason]:
        if not value:
            raise ValueError("Disqualified verdict must contain at least one reason")
        return value


# ============================================================================
# Assessment and Verdict Domain Models
# ============================================================================


class AssessmentStatus(str, Enum):
    """Status of an origin assessment."""

    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    REQUIRES_REVIEW = "requires_review"


class VerdictType(str, Enum):
    """Comprehensive verdict types for origin assessment.

    These represent all possible outcomes of a rules of origin assessment.
    """

    QUALIFIED = "qualified"
    NOT_QUALIFIED = "not_qualified"
    INSUFFICIENT_INFO = "insufficient_info"
    PENDING = "pending"
    CONDITIONAL = "conditional"
    MANUAL_REVIEW = "manual_review"


class ConfidenceLevel(str, Enum):
    """Confidence level categories."""

    VERY_LOW = "very_low"  # 0-0.3
    LOW = "low"  # 0.3-0.5
    MEDIUM = "medium"  # 0.5-0.7
    HIGH = "high"  # 0.7-0.9
    VERY_HIGH = "very_high"  # 0.9-1.0


class RuleApplication(PSRABaseModel):
    """Records the application of a specific rule during assessment.

    Attributes:
        rule_id: Identifier of the applied rule
        rule_title: Human-readable rule title
        outcome: Whether this rule passed, failed, or is conditional
        confidence: Confidence in this specific rule application
        explanation: Why this rule was applied and the outcome
        matched_criteria: Which criteria from the rule were matched
        failed_criteria: Which criteria from the rule were not met

    Example:
        >>> rule_app = RuleApplication(
        ...     rule_id="CETA-HS39-001",
        ...     rule_title="Polymer origin rule",
        ...     outcome=VerdictType.QUALIFIED,
        ...     confidence=0.85,
        ...     explanation="Product meets RVC threshold of 50%",
        ...     matched_criteria=["regional_value_content"],
        ...     failed_criteria=[]
        ... )
    """

    rule_id: RuleId
    rule_title: Annotated[str, Field(min_length=5, max_length=255)]
    outcome: VerdictType
    confidence: Annotated[float, Field(ge=0, le=1)]
    explanation: Annotated[str, Field(min_length=10, max_length=4096)]
    matched_criteria: List[str] = Field(default_factory=list)
    failed_criteria: List[str] = Field(default_factory=list)
    citations: List[Citation] = Field(default_factory=list)

    @computed_field(return_type=ConfidenceLevel)
    def confidence_level(self) -> ConfidenceLevel:
        """Categorize the confidence score."""
        if self.confidence >= 0.9:
            return ConfidenceLevel.VERY_HIGH
        elif self.confidence >= 0.7:
            return ConfidenceLevel.HIGH
        elif self.confidence >= 0.5:
            return ConfidenceLevel.MEDIUM
        elif self.confidence >= 0.3:
            return ConfidenceLevel.LOW
        else:
            return ConfidenceLevel.VERY_LOW


class AssessmentMetrics(PSRABaseModel):
    """Performance metrics for an assessment.

    Attributes:
        processing_time_ms: Total processing time in milliseconds
        rules_evaluated: Number of rules evaluated
        materials_analyzed: Number of materials analyzed
        api_calls_made: Number of external API calls
        cache_hits: Number of cache hits
        llm_tokens_used: Number of LLM tokens consumed (if applicable)

    Example:
        >>> metrics = AssessmentMetrics(
        ...     processing_time_ms=1250.5,
        ...     rules_evaluated=3,
        ...     materials_analyzed=15,
        ...     api_calls_made=5,
        ...     cache_hits=2
        ... )
    """

    processing_time_ms: Annotated[float, Field(ge=0)]
    rules_evaluated: Annotated[int, Field(ge=0)]
    materials_analyzed: Annotated[int, Field(ge=0)]
    api_calls_made: Annotated[int, Field(ge=0)] = 0
    cache_hits: Annotated[int, Field(ge=0)] = 0
    llm_tokens_used: Optional[Annotated[int, Field(ge=0)]] = None


class ComprehensiveVerdict(PSRABaseModel):
    """Comprehensive verdict with detailed reasoning.

    This is the primary verdict model that includes all information needed
    to understand the assessment outcome.

    Attributes:
        verdict: The primary verdict type
        confidence: Overall confidence score (0-1)
        explanation: Detailed explanation of the verdict
        rules_applied: List of rules that were applied
        disqualification_reasons: Reasons for disqualification (if any)
        recommendations: Recommendations for improvement
        required_actions: Actions needed to achieve qualification

    Example:
        >>> verdict = ComprehensiveVerdict(
        ...     verdict=VerdictType.QUALIFIED,
        ...     confidence=0.92,
        ...     explanation="Product qualifies under CETA",
        ...     rules_applied=[rule_application],
        ...     disqualification_reasons=[],
        ...     recommendations=["Maintain current sourcing"],
        ...     required_actions=[]
        ... )
    """

    verdict: VerdictType
    confidence: Annotated[float, Field(ge=0, le=1)]
    explanation: Annotated[str, Field(min_length=10, max_length=8192)]
    rules_applied: List[RuleApplication] = Field(default_factory=list)
    disqualification_reasons: List[DisqualificationReason] = Field(default_factory=list)
    recommendations: List[Annotated[str, Field(max_length=512)]] = Field(
        default_factory=list
    )
    required_actions: List[Annotated[str, Field(max_length=512)]] = Field(
        default_factory=list
    )

    @model_validator(mode="after")
    def _validate_disqualification_consistency(self) -> Self:
        """Ensure disqualification reasons are present for NOT_QUALIFIED verdicts."""
        if self.verdict == VerdictType.NOT_QUALIFIED and not self.disqualification_reasons:
            raise ValueError(
                "NOT_QUALIFIED verdict must include at least one disqualification reason"
            )
        return self

    @model_validator(mode="after")
    def _validate_rules_applied(self) -> Self:
        """Ensure at least one rule was applied for non-pending verdicts."""
        if self.verdict not in [VerdictType.PENDING, VerdictType.INSUFFICIENT_INFO]:
            if not self.rules_applied:
                raise ValueError(
                    f"Verdict {self.verdict} must have at least one rule applied"
                )
        return self

    @computed_field(return_type=ConfidenceLevel)
    def confidence_level(self) -> ConfidenceLevel:
        """Categorize the overall confidence score."""
        if self.confidence >= 0.9:
            return ConfidenceLevel.VERY_HIGH
        elif self.confidence >= 0.7:
            return ConfidenceLevel.HIGH
        elif self.confidence >= 0.5:
            return ConfidenceLevel.MEDIUM
        elif self.confidence >= 0.3:
            return ConfidenceLevel.LOW
        else:
            return ConfidenceLevel.VERY_LOW

    @computed_field(return_type=bool)
    def is_qualified(self) -> bool:
        """Check if the product is qualified for preferential treatment."""
        return self.verdict in [VerdictType.QUALIFIED, VerdictType.CONDITIONAL]

    def to_json_dict(self) -> Dict[str, Any]:
        """Serialize to JSON-compatible dictionary."""
        return self.model_dump(mode="json")


class Assessment(PSRABaseModel):
    """Comprehensive origin assessment result.

    This is the top-level model that encapsulates a complete assessment of a
    product's origin status under specific trade agreements.

    Attributes:
        assessment_id: Unique identifier for this assessment
        product: The product being assessed
        agreement: The trade agreement being evaluated
        assessed_at: Timestamp of assessment
        assessed_by: System or user performing assessment
        status: Current status of the assessment
        verdict: The comprehensive verdict
        metrics: Performance metrics
        bom: Optional full BOM used in assessment
        provenance: Audit trail and provenance information

    Example:
        >>> assessment = Assessment(
        ...     assessment_id=uuid4(),
        ...     product=product,
        ...     agreement=Agreement(code="CETA", name="CETA"),
        ...     assessed_at=datetime.utcnow(),
        ...     assessed_by="psra-engine-v1",
        ...     status=AssessmentStatus.COMPLETED,
        ...     verdict=verdict,
        ...     metrics=metrics
        ... )
    """

    assessment_id: UUID
    product: Product
    agreement: Agreement
    assessed_at: datetime = Field(default_factory=datetime.utcnow)
    assessed_by: Annotated[str, Field(min_length=1, max_length=128)]
    status: AssessmentStatus
    verdict: ComprehensiveVerdict
    metrics: AssessmentMetrics
    bom: Optional[BillOfMaterials] = None
    provenance: Dict[str, Any] = Field(default_factory=dict)
    notes: Optional[Annotated[str, Field(max_length=4096)]] = None
    ledger_reference: Optional[Annotated[str, Field(pattern=r"^ledger://[-/a-z0-9]+$")]] = None

    @model_validator(mode="after")
    def _validate_completed_status(self) -> Self:
        """Ensure completed assessments have valid verdicts."""
        if self.status == AssessmentStatus.COMPLETED:
            if self.verdict.verdict == VerdictType.PENDING:
                raise ValueError("Completed assessment cannot have PENDING verdict")
        return self

    def to_json_dict(self) -> Dict[str, Any]:
        """Serialize to JSON-compatible dictionary."""
        return self.model_dump(mode="json")

    def summary(self) -> str:
        """Generate a human-readable summary of the assessment.

        Returns:
            String summary of the assessment result
        """
        return (
            f"Assessment {self.assessment_id}: "
            f"Product {self.product.product_code} "
            f"under {self.agreement.code} - "
            f"{self.verdict.verdict.value.upper()} "
            f"(confidence: {self.verdict.confidence:.2%})"
        )


class RuleVerdicts(PSRABaseModel):
    """Legacy rule verdicts structure for backwards compatibility."""

    qualified: QualifiedVerdict
    disqualified: DisqualifiedVerdict


class RuleDecision(PSRABaseModel):
    verdicts: RuleVerdicts

    @computed_field(return_type=QualifiedVerdict)
    def qualified(self) -> QualifiedVerdict:
        return self.verdicts.qualified

    @computed_field(return_type=DisqualifiedVerdict)
    def disqualified(self) -> DisqualifiedVerdict:
        return self.verdicts.disqualified


class Traceability(PSRABaseModel):
    lineage_required: bool
    ledger_reference: Annotated[str, Field(pattern=r"^ledger://[-/a-z0-9]+$")]


class RuleAudit(PSRABaseModel):
    traceability: Traceability
    last_reviewed: date
    reviewer: Annotated[str, Field(pattern=r"^[a-z0-9-]{3,64}$")]


class RuleMetadata(PSRABaseModel):
    rule_id: RuleId
    title: Annotated[str, Field(min_length=5, max_length=255)]
    description: Annotated[str, Field(min_length=10, max_length=4096)]
    agreement: Agreement
    hs_code: HSCode
    jurisdiction: List[JurisdictionCode]
    effective_from: date
    effective_to: Optional[date] = None
    priority: Annotated[int, Field(ge=0, le=999)]
    supersedes: List[RuleId]

    @field_validator("jurisdiction")
    @classmethod
    def _ensure_unique_jurisdictions(cls, value: List[JurisdictionCode]) -> List[JurisdictionCode]:
        if len(set(value)) != len(value):
            raise ValueError("Jurisdiction entries must be unique")
        return value


class PSRARule(PSRABaseModel):
    version: Annotated[str, Field(pattern=r"^2\.\d+\.\d+$")]
    metadata: RuleMetadata
    criteria: RuleCriteria
    decision: RuleDecision
    audit: RuleAudit


class MonetaryValue(PSRABaseModel):
    amount: Annotated[float, Field(ge=0)]
    currency: CurrencyCode


class BillOfMaterialsItem(PSRABaseModel):
    line_id: Annotated[str, Field(min_length=1, max_length=64)]
    description: Annotated[str, Field(min_length=3, max_length=512)]
    hs_code: Annotated[str, Field(pattern=r"^[0-9]{4,8}$")]
    country_of_origin: CountryCode
    value: MonetaryValue
    is_originating: bool


class ProductionOperation(PSRABaseModel):
    code: OperationCode
    performed_at: Optional[datetime] = None
    location: Optional[CountryCode] = None


class ProcessSnapshot(PSRABaseModel):
    performed_operations: List[ProductionOperation]
    total_manufacturing_cost: MonetaryValue
    value_added_percentage: Annotated[float, Field(ge=0, le=100)]


class DocumentationSnapshot(PSRABaseModel):
    submitted_certificates: List[CertificateCode]
    evidence: Dict[str, str]


class EvaluationContext(PSRABaseModel):
    tenant_id: UUID
    request_id: UUID
    agreement: Agreement
    hs_code: HSCode
    effective_date: date
    import_country: CountryCode
    export_country: CountryCode


class EvaluationInput(PSRABaseModel):
    context: EvaluationContext
    bill_of_materials: List[BillOfMaterialsItem]
    process: ProcessSnapshot
    documentation: DocumentationSnapshot

    @field_validator("bill_of_materials")
    @classmethod
    def _ensure_bom_non_empty(cls, value: List[BillOfMaterialsItem]) -> List[BillOfMaterialsItem]:
        if not value:
            raise ValueError("Bill of materials cannot be empty for evaluation")
        return value


class VerdictStatus(str, Enum):
    QUALIFIED = "qualified"
    DISQUALIFIED = "disqualified"
    MANUAL_REVIEW = "manual_review"


class EvaluationVerdict(PSRABaseModel):
    evaluation_id: UUID
    rule_id: RuleId
    status: VerdictStatus
    decided_at: datetime
    confidence: Annotated[float, Field(ge=0, le=1)]
    citations: List[Citation]
    disqualification_reasons: List[DisqualificationReason] = Field(default_factory=list)
    notes: Optional[str] = None
    ledger_reference: Optional[str] = Field(default=None, pattern=r"^ledger://[-/a-z0-9]+$")

    @field_validator("citations")
    @classmethod
    def _ensure_citations(cls, value: List[Citation]) -> List[Citation]:
        if not value:
            raise ValueError("At least one citation is required")
        return value


class EvaluationMetrics(PSRABaseModel):
    processing_time_ms: Annotated[float, Field(ge=0)]
    rules_evaluated: Annotated[int, Field(ge=1)]


class EvaluationOutput(PSRABaseModel):
    input: EvaluationInput
    rule: PSRARule
    verdict: EvaluationVerdict
    metrics: EvaluationMetrics
    provenance: Dict[str, str]
