"""
Audit logging models for enterprise compliance.
Supports SOC2, GDPR, and other regulatory requirements.
"""

from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, Dict, Any, List
import json
import hashlib
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, Index, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base

class AuditEventType(str, Enum):
    """Audit event types for compliance tracking."""
    
    # Authentication Events
    LOGIN_SUCCESS = "auth.login.success"
    LOGIN_FAILURE = "auth.login.failure"
    LOGOUT = "auth.logout"
    PASSWORD_CHANGE = "auth.password.change"
    PASSWORD_RESET = "auth.password.reset"
    MFA_ENABLED = "auth.mfa.enabled"
    MFA_DISABLED = "auth.mfa.disabled"
    SESSION_EXPIRED = "auth.session.expired"
    
    # Authorization Events
    ACCESS_GRANTED = "authz.access.granted"
    ACCESS_DENIED = "authz.access.denied"
    PERMISSION_GRANTED = "authz.permission.granted"
    PERMISSION_REVOKED = "authz.permission.revoked"
    ROLE_ASSIGNED = "authz.role.assigned"
    ROLE_REMOVED = "authz.role.removed"
    
    # Data Access Events
    DATA_READ = "data.read"
    DATA_WRITE = "data.write"
    DATA_UPDATE = "data.update"
    DATA_DELETE = "data.delete"
    DATA_EXPORT = "data.export"
    DATA_IMPORT = "data.import"
    
    # Configuration Events
    CONFIG_CHANGE = "config.change"
    SYSTEM_CONFIG = "config.system"
    SECURITY_CONFIG = "config.security"
    
    # Administrative Events
    ADMIN_ACTION = "admin.action"
    USER_CREATED = "admin.user.created"
    USER_UPDATED = "admin.user.updated"
    USER_DELETED = "admin.user.deleted"
    USER_SUSPENDED = "admin.user.suspended"
    USER_ACTIVATED = "admin.user.activated"
    
    # System Events
    SYSTEM_START = "system.start"
    SYSTEM_STOP = "system.stop"
    BACKUP_CREATED = "system.backup.created"
    BACKUP_RESTORED = "system.backup.restored"
    
    # GDPR Events
    GDPR_CONSENT_GIVEN = "gdpr.consent.given"
    GDPR_CONSENT_WITHDRAWN = "gdpr.consent.withdrawn"
    GDPR_DATA_REQUEST = "gdpr.data.request"
    GDPR_DATA_DELETION = "gdpr.data.deletion"
    GDPR_DATA_PORTABILITY = "gdpr.data.portability"

class AuditSeverity(str, Enum):
    """Audit event severity levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ComplianceFramework(str, Enum):
    """Supported compliance frameworks."""
    SOC2 = "soc2"
    GDPR = "gdpr"
    HIPAA = "hipaa"
    PCI_DSS = "pci_dss"
    ISO27001 = "iso27001"

class AuditLog(Base):
    """
    Main audit log table with tamper-proof features.
    Implements write-once semantics for compliance.
    """
    __tablename__ = "audit_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    event_type = Column(String(100), nullable=False, index=True)
    severity = Column(String(20), nullable=False, default=AuditSeverity.MEDIUM)
    
    # User and session information
    user_id = Column(UUID(as_uuid=True), index=True)
    username = Column(String(255), index=True)
    session_id = Column(String(255), index=True)
    
    # Request information
    ip_address = Column(String(45), index=True)  # IPv6 compatible
    user_agent = Column(Text)
    request_id = Column(String(255), index=True)
    
    # Resource information
    resource_type = Column(String(100), index=True)
    resource_id = Column(String(255), index=True)
    resource_name = Column(String(500))
    
    # Event details
    action = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    details = Column(JSONB)  # Additional structured data
    
    # Compliance and categorization
    compliance_frameworks = Column(JSONB)  # List of applicable frameworks
    risk_level = Column(String(20), default="low")
    
    # Data classification
    data_classification = Column(String(50))  # public, internal, confidential, restricted
    
    # Outcome and status
    success = Column(Boolean, nullable=False)
    error_code = Column(String(50))
    error_message = Column(Text)
    
    # Tamper detection
    checksum = Column(String(64), nullable=False)  # SHA-256 hash
    previous_checksum = Column(String(64))  # Chain of checksums
    
    # Retention and archival
    retention_date = Column(DateTime, nullable=False)
    archived = Column(Boolean, default=False)
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_audit_timestamp_event', 'timestamp', 'event_type'),
        Index('idx_audit_user_timestamp', 'user_id', 'timestamp'),
        Index('idx_audit_resource', 'resource_type', 'resource_id'),
        Index('idx_audit_compliance', 'compliance_frameworks'),
        Index('idx_audit_severity_timestamp', 'severity', 'timestamp'),
    )
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.retention_date:
            # Default 7-year retention for compliance
            self.retention_date = datetime.utcnow() + timedelta(days=7*365)
        self._calculate_checksum()
    
    def _calculate_checksum(self):
        """Calculate tamper-proof checksum."""
        data = {
            'timestamp': self.timestamp.isoformat() if self.timestamp else '',
            'event_type': self.event_type or '',
            'user_id': str(self.user_id) if self.user_id else '',
            'action': self.action or '',
            'description': self.description or '',
            'success': self.success,
            'previous_checksum': self.previous_checksum or ''
        }
        
        data_string = json.dumps(data, sort_keys=True)
        self.checksum = hashlib.sha256(data_string.encode()).hexdigest()
    
    def verify_integrity(self) -> bool:
        """Verify the integrity of this audit record."""
        original_checksum = self.checksum
        self._calculate_checksum()
        return original_checksum == self.checksum

class AuditAlert(Base):
    """
    Audit alerts for real-time monitoring.
    """
    __tablename__ = "audit_alerts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Alert configuration
    name = Column(String(255), nullable=False)
    description = Column(Text)
    enabled = Column(Boolean, default=True)
    
    # Trigger conditions
    event_types = Column(JSONB)  # List of event types to monitor
    severity_threshold = Column(String(20), default=AuditSeverity.HIGH)
    time_window_minutes = Column(Integer, default=60)
    threshold_count = Column(Integer, default=5)
    
    # Filter conditions
    user_filter = Column(JSONB)  # User IDs or patterns
    ip_filter = Column(JSONB)  # IP addresses or ranges
    resource_filter = Column(JSONB)  # Resource types or IDs
    
    # Notification settings
    notification_channels = Column(JSONB)  # email, slack, webhook, etc.
    notification_recipients = Column(JSONB)
    
    # Alert state
    last_triggered = Column(DateTime)
    trigger_count = Column(Integer, default=0)
    suppressed_until = Column(DateTime)

class AuditReport(Base):
    """
    Generated compliance reports.
    """
    __tablename__ = "audit_reports"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Report metadata
    report_type = Column(String(100), nullable=False)  # soc2, gdpr, custom
    title = Column(String(500), nullable=False)
    description = Column(Text)
    
    # Report parameters
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    filters = Column(JSONB)
    
    # Report content
    summary = Column(JSONB)  # Executive summary data
    findings = Column(JSONB)  # Detailed findings
    recommendations = Column(JSONB)  # Compliance recommendations
    
    # Report files
    report_file_path = Column(String(1000))  # Path to generated report file
    report_format = Column(String(20))  # pdf, xlsx, json
    
    # Status and approval
    status = Column(String(50), default="generated")  # generated, reviewed, approved
    generated_by = Column(UUID(as_uuid=True))
    reviewed_by = Column(UUID(as_uuid=True))
    approved_by = Column(UUID(as_uuid=True))

class AuditRetentionPolicy(Base):
    """
    Audit log retention policies for different data types.
    """
    __tablename__ = "audit_retention_policies"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Policy identification
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text)
    enabled = Column(Boolean, default=True)
    
    # Retention rules
    event_types = Column(JSONB)  # Event types this policy applies to
    data_classification = Column(String(50))  # Data classification level
    compliance_frameworks = Column(JSONB)  # Required compliance frameworks
    
    # Retention periods
    retention_days = Column(Integer, nullable=False)
    archive_after_days = Column(Integer)  # Move to cold storage
    
    # Legal hold
    legal_hold = Column(Boolean, default=False)
    legal_hold_reason = Column(Text)
    legal_hold_until = Column(DateTime)

# Compliance mapping for different frameworks
COMPLIANCE_MAPPING = {
    ComplianceFramework.SOC2: {
        "required_events": [
            AuditEventType.LOGIN_SUCCESS,
            AuditEventType.LOGIN_FAILURE,
            AuditEventType.ACCESS_DENIED,
            AuditEventType.ADMIN_ACTION,
            AuditEventType.CONFIG_CHANGE,
            AuditEventType.DATA_ACCESS,
        ],
        "retention_days": 365,
        "required_fields": ["user_id", "timestamp", "action", "success", "ip_address"]
    },
    ComplianceFramework.GDPR: {
        "required_events": [
            AuditEventType.GDPR_CONSENT_GIVEN,
            AuditEventType.GDPR_CONSENT_WITHDRAWN,
            AuditEventType.GDPR_DATA_REQUEST,
            AuditEventType.GDPR_DATA_DELETION,
            AuditEventType.DATA_READ,
            AuditEventType.DATA_EXPORT,
        ],
        "retention_days": 2555,  # 7 years
        "required_fields": ["user_id", "timestamp", "action", "data_classification"]
    }
}

def get_compliance_requirements(framework: ComplianceFramework) -> Dict[str, Any]:
    """Get compliance requirements for a specific framework."""
    return COMPLIANCE_MAPPING.get(framework, {})

def is_event_compliance_relevant(event_type: AuditEventType, framework: ComplianceFramework) -> bool:
    """Check if an event type is relevant for a compliance framework."""
    requirements = get_compliance_requirements(framework)
    return event_type in requirements.get("required_events", [])