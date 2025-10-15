"""
Data Classification Module
Implements data classification for PII, sensitive, and public data with automated tagging.
"""

from datetime import datetime
from typing import Dict, List, Optional, Any, Set
from enum import Enum
import re
import json
from sqlalchemy import Column, String, DateTime, Text, Boolean, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session
from pydantic import BaseModel
import logging

from ..core.database import Base

logger = logging.getLogger(__name__)

class DataClassification(Enum):
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    RESTRICTED = "restricted"
    PII = "pii"
    SENSITIVE_PII = "sensitive_pii"
    FINANCIAL = "financial"
    HEALTH = "health"
    BIOMETRIC = "biometric"

class DataSensitivity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ProcessingPurpose(Enum):
    NECESSARY = "necessary"
    LEGITIMATE_INTEREST = "legitimate_interest"
    CONSENT = "consent"
    CONTRACT = "contract"
    LEGAL_OBLIGATION = "legal_obligation"
    VITAL_INTERESTS = "vital_interests"
    PUBLIC_TASK = "public_task"

class DataElement(Base):
    __tablename__ = "data_elements"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    classification = Column(String, nullable=False)
    sensitivity = Column(String, nullable=False)
    data_type = Column(String)  # string, number, date, etc.
    source_system = Column(String)
    table_name = Column(String)
    column_name = Column(String)
    processing_purposes = Column(Text)  # JSON array
    retention_period = Column(Integer)  # days
    encryption_required = Column(Boolean, default=False)
    anonymization_method = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

class DataClassificationRule(Base):
    __tablename__ = "data_classification_rules"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    pattern = Column(String)  # Regex pattern
    keywords = Column(Text)  # JSON array of keywords
    classification = Column(String, nullable=False)
    sensitivity = Column(String, nullable=False)
    confidence_score = Column(Integer, default=100)  # 0-100
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class DataInventoryItem(Base):
    __tablename__ = "data_inventory"
    
    id = Column(String, primary_key=True)
    system_name = Column(String, nullable=False)
    database_name = Column(String)
    table_name = Column(String, nullable=False)
    column_name = Column(String, nullable=False)
    data_type = Column(String)
    classification = Column(String)
    sensitivity = Column(String)
    sample_data = Column(Text)  # Encrypted sample for analysis
    record_count = Column(Integer)
    last_scanned = Column(DateTime)
    compliance_status = Column(String)
    
class ClassificationResult(BaseModel):
    classification: DataClassification
    sensitivity: DataSensitivity
    confidence: float
    reasons: List[str]
    recommendations: List[str]

class DataElementModel(BaseModel):
    name: str
    description: Optional[str]
    data_type: str
    source_system: str
    table_name: Optional[str]
    column_name: Optional[str]
    sample_data: Optional[str]

class DataClassifier:
    def __init__(self, db: Optional[Session] = None):
        self.db = db
        self.classification_rules = self._load_classification_rules()
        self.pii_patterns = self._load_pii_patterns()
        
    def _load_classification_rules(self) -> List[Dict[str, Any]]:
        """Load classification rules from database or default rules"""
        default_rules = [
            {
                "name": "Email Address",
                "pattern": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
                "keywords": ["email", "mail", "e-mail"],
                "classification": DataClassification.PII.value,
                "sensitivity": DataSensitivity.MEDIUM.value,
                "confidence": 95
            },
            {
                "name": "Phone Number",
                "pattern": r"(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}",
                "keywords": ["phone", "telephone", "mobile", "cell"],
                "classification": DataClassification.PII.value,
                "sensitivity": DataSensitivity.MEDIUM.value,
                "confidence": 90
            },
            {
                "name": "Social Security Number",
                "pattern": r"\b\d{3}-\d{2}-\d{4}\b",
                "keywords": ["ssn", "social_security", "social security"],
                "classification": DataClassification.SENSITIVE_PII.value,
                "sensitivity": DataSensitivity.CRITICAL.value,
                "confidence": 100
            },
            {
                "name": "Credit Card Number",
                "pattern": r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b",
                "keywords": ["credit_card", "card_number", "cc_number"],
                "classification": DataClassification.FINANCIAL.value,
                "sensitivity": DataSensitivity.CRITICAL.value,
                "confidence": 95
            },
            {
                "name": "IP Address",
                "pattern": r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b",
                "keywords": ["ip_address", "ip", "address"],
                "classification": DataClassification.PII.value,
                "sensitivity": DataSensitivity.LOW.value,
                "confidence": 85
            },
            {
                "name": "Date of Birth",
                "pattern": r"\b\d{1,2}[/-]\d{1,2}[/-]\d{4}\b",
                "keywords": ["dob", "birth_date", "birthday", "date_of_birth"],
                "classification": DataClassification.SENSITIVE_PII.value,
                "sensitivity": DataSensitivity.HIGH.value,
                "confidence": 90
            },
            {
                "name": "Address",
                "pattern": r"\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)",
                "keywords": ["address", "street", "home_address", "mailing_address"],
                "classification": DataClassification.PII.value,
                "sensitivity": DataSensitivity.MEDIUM.value,
                "confidence": 80
            },
            {
                "name": "Medical Record Number",
                "pattern": r"\b[A-Z]{2,3}\d{6,10}\b",
                "keywords": ["mrn", "medical_record", "patient_id", "health_id"],
                "classification": DataClassification.HEALTH.value,
                "sensitivity": DataSensitivity.CRITICAL.value,
                "confidence": 95
            }
        ]
        
        if self.db:
            # Load from database
            db_rules = self.db.query(DataClassificationRule).filter(
                DataClassificationRule.active == True
            ).all()
            
            return [
                {
                    "name": rule.name,
                    "pattern": rule.pattern,
                    "keywords": json.loads(rule.keywords or "[]"),
                    "classification": rule.classification,
                    "sensitivity": rule.sensitivity,
                    "confidence": rule.confidence_score
                }
                for rule in db_rules
            ] + default_rules
        
        return default_rules
    
    def _load_pii_patterns(self) -> Dict[str, str]:
        """Load PII detection patterns"""
        return {
            "email": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
            "phone": r"(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}",
            "ssn": r"\b\d{3}-\d{2}-\d{4}\b",
            "credit_card": r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b",
            "ip_address": r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b",
            "date_of_birth": r"\b\d{1,2}[/-]\d{1,2}[/-]\d{4}\b",
            "passport": r"\b[A-Z]{1,2}\d{6,9}\b",
            "driver_license": r"\b[A-Z]{1,2}\d{6,8}\b"
        }
    
    async def classify_data_element(
        self, 
        element: DataElementModel,
        sample_data: Optional[str] = None
    ) -> ClassificationResult:
        """Classify a data element based on its metadata and sample data"""
        try:
            classification_scores = {}
            sensitivity_scores = {}
            reasons = []
            recommendations = []
            
            # Analyze field name and description
            field_analysis = self._analyze_field_metadata(element)
            classification_scores.update(field_analysis["classifications"])
            sensitivity_scores.update(field_analysis["sensitivities"])
            reasons.extend(field_analysis["reasons"])
            
            # Analyze sample data if provided
            if sample_data or element.sample_data:
                data_to_analyze = sample_data or element.sample_data
                data_analysis = self._analyze_sample_data(data_to_analyze)
                
                # Merge scores with higher weight for data analysis
                for cls, score in data_analysis["classifications"].items():
                    classification_scores[cls] = classification_scores.get(cls, 0) + (score * 1.5)
                
                for sens, score in data_analysis["sensitivities"].items():
                    sensitivity_scores[sens] = sensitivity_scores.get(sens, 0) + (score * 1.5)
                
                reasons.extend(data_analysis["reasons"])
            
            # Determine final classification and sensitivity
            final_classification = max(classification_scores.items(), key=lambda x: x[1])[0] if classification_scores else DataClassification.INTERNAL.value
            final_sensitivity = max(sensitivity_scores.items(), key=lambda x: x[1])[0] if sensitivity_scores else DataSensitivity.LOW.value
            
            # Calculate confidence score
            max_score = max(classification_scores.values()) if classification_scores else 0
            confidence = min(max_score / 100.0, 1.0)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(
                DataClassification(final_classification),
                DataSensitivity(final_sensitivity)
            )
            
            return ClassificationResult(
                classification=DataClassification(final_classification),
                sensitivity=DataSensitivity(final_sensitivity),
                confidence=confidence,
                reasons=reasons,
                recommendations=recommendations
            )
            
        except Exception as e:
            logger.error(f"Error classifying data element: {str(e)}")
            # Return safe default
            return ClassificationResult(
                classification=DataClassification.INTERNAL,
                sensitivity=DataSensitivity.MEDIUM,
                confidence=0.0,
                reasons=[f"Classification failed: {str(e)}"],
                recommendations=["Manual review required"]
            )
    
    def _analyze_field_metadata(self, element: DataElementModel) -> Dict[str, Any]:
        """Analyze field name and description for classification hints"""
        classifications = {}
        sensitivities = {}
        reasons = []
        
        # Combine field name, description, and column name for analysis
        text_to_analyze = " ".join(filter(None, [
            element.name.lower(),
            element.description.lower() if element.description else "",
            element.column_name.lower() if element.column_name else ""
        ]))
        
        # Check against classification rules
        for rule in self.classification_rules:
            score = 0
            rule_reasons = []
            
            # Check keywords
            for keyword in rule["keywords"]:
                if keyword.lower() in text_to_analyze:
                    score += rule["confidence"]
                    rule_reasons.append(f"Keyword '{keyword}' found in field metadata")
            
            if score > 0:
                classifications[rule["classification"]] = score
                sensitivities[rule["sensitivity"]] = score
                reasons.extend(rule_reasons)
        
        return {
            "classifications": classifications,
            "sensitivities": sensitivities,
            "reasons": reasons
        }
    
    def _analyze_sample_data(self, sample_data: str) -> Dict[str, Any]:
        """Analyze sample data for PII and sensitive information"""
        classifications = {}
        sensitivities = {}
        reasons = []
        
        # Check against PII patterns
        for pii_type, pattern in self.pii_patterns.items():
            matches = re.findall(pattern, sample_data, re.IGNORECASE)
            if matches:
                # Determine classification based on PII type
                if pii_type in ["ssn", "passport", "driver_license"]:
                    classifications[DataClassification.SENSITIVE_PII.value] = 100
                    sensitivities[DataSensitivity.CRITICAL.value] = 100
                elif pii_type in ["credit_card"]:
                    classifications[DataClassification.FINANCIAL.value] = 100
                    sensitivities[DataSensitivity.CRITICAL.value] = 100
                elif pii_type in ["email", "phone", "date_of_birth"]:
                    classifications[DataClassification.PII.value] = 90
                    sensitivities[DataSensitivity.HIGH.value] = 90
                else:
                    classifications[DataClassification.PII.value] = 70
                    sensitivities[DataSensitivity.MEDIUM.value] = 70
                
                reasons.append(f"Detected {pii_type} pattern in sample data ({len(matches)} matches)")
        
        # Check for other sensitive patterns
        sensitive_patterns = {
            "medical": r"\b(diagnosis|treatment|medication|symptom|disease|illness)\b",
            "financial": r"\b(account|balance|income|salary|payment|transaction)\b",
            "legal": r"\b(lawsuit|court|legal|attorney|judge|verdict)\b"
        }
        
        for category, pattern in sensitive_patterns.items():
            matches = re.findall(pattern, sample_data, re.IGNORECASE)
            if matches:
                if category == "medical":
                    classifications[DataClassification.HEALTH.value] = 85
                    sensitivities[DataSensitivity.CRITICAL.value] = 85
                elif category == "financial":
                    classifications[DataClassification.FINANCIAL.value] = 80
                    sensitivities[DataSensitivity.HIGH.value] = 80
                else:
                    classifications[DataClassification.CONFIDENTIAL.value] = 75
                    sensitivities[DataSensitivity.HIGH.value] = 75
                
                reasons.append(f"Detected {category} content in sample data")
        
        return {
            "classifications": classifications,
            "sensitivities": sensitivities,
            "reasons": reasons
        }
    
    def _generate_recommendations(
        self, 
        classification: DataClassification, 
        sensitivity: DataSensitivity
    ) -> List[str]:
        """Generate security and compliance recommendations"""
        recommendations = []
        
        # Encryption recommendations
        if sensitivity in [DataSensitivity.HIGH, DataSensitivity.CRITICAL]:
            recommendations.append("Implement encryption at rest and in transit")
            recommendations.append("Use strong encryption algorithms (AES-256)")
        
        # Access control recommendations
        if classification in [DataClassification.SENSITIVE_PII, DataClassification.FINANCIAL, DataClassification.HEALTH]:
            recommendations.append("Implement strict access controls with role-based permissions")
            recommendations.append("Enable audit logging for all access attempts")
            recommendations.append("Require multi-factor authentication for access")
        
        # Data retention recommendations
        if classification in [DataClassification.PII, DataClassification.SENSITIVE_PII]:
            recommendations.append("Implement data retention policies")
            recommendations.append("Enable automated data deletion after retention period")
        
        # Anonymization recommendations
        if sensitivity == DataSensitivity.CRITICAL:
            recommendations.append("Consider data anonymization for non-production environments")
            recommendations.append("Implement data masking for development and testing")
        
        # Compliance recommendations
        if classification in [DataClassification.PII, DataClassification.SENSITIVE_PII]:
            recommendations.append("Ensure GDPR compliance for EU data subjects")
            recommendations.append("Implement consent management for data processing")
        
        if classification == DataClassification.HEALTH:
            recommendations.append("Ensure HIPAA compliance for health data")
            recommendations.append("Implement business associate agreements")
        
        if classification == DataClassification.FINANCIAL:
            recommendations.append("Ensure PCI DSS compliance for payment data")
            recommendations.append("Implement secure payment processing")
        
        return recommendations
    
    async def scan_database_schema(
        self, 
        connection_string: str, 
        database_name: str
    ) -> List[Dict[str, Any]]:
        """Scan database schema and classify all columns"""
        try:
            # This would connect to the database and scan all tables/columns
            # For now, returning a mock result
            
            scan_results = []
            
            # Mock database scan results
            mock_tables = [
                {
                    "table": "users",
                    "columns": [
                        {"name": "email", "type": "varchar", "sample": "user@example.com"},
                        {"name": "phone", "type": "varchar", "sample": "555-123-4567"},
                        {"name": "ssn", "type": "varchar", "sample": "123-45-6789"},
                        {"name": "address", "type": "text", "sample": "123 Main St"},
                    ]
                },
                {
                    "table": "payments",
                    "columns": [
                        {"name": "card_number", "type": "varchar", "sample": "4111-1111-1111-1111"},
                        {"name": "amount", "type": "decimal", "sample": "99.99"},
                    ]
                }
            ]
            
            for table in mock_tables:
                for column in table["columns"]:
                    element = DataElementModel(
                        name=column["name"],
                        data_type=column["type"],
                        source_system=database_name,
                        table_name=table["table"],
                        column_name=column["name"],
                        sample_data=column["sample"]
                    )
                    
                    classification_result = await self.classify_data_element(element, column["sample"])
                    
                    scan_results.append({
                        "database": database_name,
                        "table": table["table"],
                        "column": column["name"],
                        "data_type": column["type"],
                        "classification": classification_result.classification.value,
                        "sensitivity": classification_result.sensitivity.value,
                        "confidence": classification_result.confidence,
                        "reasons": classification_result.reasons,
                        "recommendations": classification_result.recommendations
                    })
            
            return scan_results
            
        except Exception as e:
            logger.error(f"Error scanning database schema: {str(e)}")
            raise
    
    async def create_data_inventory(self, scan_results: List[Dict[str, Any]]) -> str:
        """Create or update data inventory from scan results"""
        try:
            if not self.db:
                raise ValueError("Database session required for inventory creation")
            
            inventory_id = f"inventory_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
            
            for result in scan_results:
                inventory_item = DataInventoryItem(
                    id=f"{inventory_id}_{result['table']}_{result['column']}",
                    system_name=result["database"],
                    table_name=result["table"],
                    column_name=result["column"],
                    data_type=result["data_type"],
                    classification=result["classification"],
                    sensitivity=result["sensitivity"],
                    last_scanned=datetime.utcnow(),
                    compliance_status="pending_review"
                )
                
                self.db.add(inventory_item)
            
            self.db.commit()
            return inventory_id
            
        except Exception as e:
            logger.error(f"Error creating data inventory: {str(e)}")
            raise
    
    async def get_classification_summary(self) -> Dict[str, Any]:
        """Get summary of data classifications across the organization"""
        try:
            if not self.db:
                return {"error": "Database session required"}
            
            # Count by classification
            classification_counts = {}
            sensitivity_counts = {}
            
            inventory_items = self.db.query(DataInventoryItem).all()
            
            for item in inventory_items:
                classification_counts[item.classification] = classification_counts.get(item.classification, 0) + 1
                sensitivity_counts[item.sensitivity] = sensitivity_counts.get(item.sensitivity, 0) + 1
            
            # Calculate risk score
            risk_score = self._calculate_risk_score(classification_counts, sensitivity_counts)
            
            return {
                "total_data_elements": len(inventory_items),
                "classification_breakdown": classification_counts,
                "sensitivity_breakdown": sensitivity_counts,
                "risk_score": risk_score,
                "high_risk_elements": len([
                    item for item in inventory_items 
                    if item.sensitivity in [DataSensitivity.HIGH.value, DataSensitivity.CRITICAL.value]
                ]),
                "compliance_status": self._assess_compliance_status(inventory_items),
                "last_updated": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting classification summary: {str(e)}")
            raise
    
    def _calculate_risk_score(
        self, 
        classification_counts: Dict[str, int], 
        sensitivity_counts: Dict[str, int]
    ) -> float:
        """Calculate overall data risk score (0-100)"""
        risk_weights = {
            DataClassification.PUBLIC.value: 0,
            DataClassification.INTERNAL.value: 10,
            DataClassification.CONFIDENTIAL.value: 30,
            DataClassification.RESTRICTED.value: 50,
            DataClassification.PII.value: 60,
            DataClassification.SENSITIVE_PII.value: 80,
            DataClassification.FINANCIAL.value: 90,
            DataClassification.HEALTH.value: 95,
            DataClassification.BIOMETRIC.value: 100
        }
        
        sensitivity_weights = {
            DataSensitivity.LOW.value: 1,
            DataSensitivity.MEDIUM.value: 2,
            DataSensitivity.HIGH.value: 3,
            DataSensitivity.CRITICAL.value: 4
        }
        
        total_elements = sum(classification_counts.values())
        if total_elements == 0:
            return 0
        
        weighted_score = 0
        for classification, count in classification_counts.items():
            base_weight = risk_weights.get(classification, 50)
            weighted_score += (base_weight * count)
        
        # Apply sensitivity multiplier
        sensitivity_multiplier = 1
        for sensitivity, count in sensitivity_counts.items():
            multiplier = sensitivity_weights.get(sensitivity, 1)
            sensitivity_multiplier += (multiplier * count / total_elements)
        
        final_score = (weighted_score / total_elements) * (sensitivity_multiplier / 2)
        return min(final_score, 100)
    
    def _assess_compliance_status(self, inventory_items: List[DataInventoryItem]) -> str:
        """Assess overall compliance status"""
        if not inventory_items:
            return "unknown"
        
        pending_items = len([item for item in inventory_items if item.compliance_status == "pending_review"])
        total_items = len(inventory_items)
        
        if pending_items == 0:
            return "compliant"
        elif pending_items / total_items < 0.1:
            return "mostly_compliant"
        elif pending_items / total_items < 0.5:
            return "partially_compliant"
        else:
            return "non_compliant"