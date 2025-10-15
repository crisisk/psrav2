"""
GDPR Compliance Module
Implements GDPR requirements including data subject rights, consent management, and privacy controls.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from enum import Enum
import json
import hashlib
from sqlalchemy import Column, String, DateTime, Boolean, Text, ForeignKey, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, Session
from pydantic import BaseModel, EmailStr
import logging

from ..core.database import Base
from ..core.security import get_current_user
from .audit_logger import AuditLogger
from .data_classification import DataClassifier
from .consent_manager import ConsentManager

logger = logging.getLogger(__name__)

class DataSubjectRights(Enum):
    ACCESS = "access"
    RECTIFICATION = "rectification"
    ERASURE = "erasure"
    PORTABILITY = "portability"
    RESTRICTION = "restriction"
    OBJECTION = "objection"

class RequestStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    REJECTED = "rejected"

class GDPRRequest(Base):
    __tablename__ = "gdpr_requests"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    request_type = Column(String, nullable=False)  # DataSubjectRights
    status = Column(String, default=RequestStatus.PENDING.value)
    description = Column(Text)
    requested_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime)
    processed_by = Column(String)
    response_data = Column(Text)  # JSON response
    verification_token = Column(String)
    verified = Column(Boolean, default=False)
    
    # Relationships
    user = relationship("User", back_populates="gdpr_requests")

class DataProcessingActivity(Base):
    __tablename__ = "data_processing_activities"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    purpose = Column(Text, nullable=False)
    legal_basis = Column(String, nullable=False)
    data_categories = Column(Text)  # JSON array
    data_subjects = Column(Text)  # JSON array
    recipients = Column(Text)  # JSON array
    retention_period = Column(Integer)  # days
    security_measures = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

class GDPRRequestModel(BaseModel):
    request_type: DataSubjectRights
    description: Optional[str] = None
    email: EmailStr

class GDPRResponseModel(BaseModel):
    request_id: str
    status: RequestStatus
    message: str
    verification_required: bool = True

class DataPortabilityResponse(BaseModel):
    user_data: Dict[str, Any]
    exported_at: datetime
    format: str = "JSON"

class GDPRCompliance:
    def __init__(self, db: Session):
        self.db = db
        self.audit_logger = AuditLogger(db)
        self.data_classifier = DataClassifier()
        self.consent_manager = ConsentManager(db)
    
    async def submit_data_subject_request(
        self, 
        request: GDPRRequestModel,
        user_id: str
    ) -> GDPRResponseModel:
        """Submit a GDPR data subject request"""
        try:
            # Generate request ID
            request_id = self._generate_request_id(user_id, request.request_type.value)
            
            # Create verification token
            verification_token = self._generate_verification_token(request_id)
            
            # Create GDPR request
            gdpr_request = GDPRRequest(
                id=request_id,
                user_id=user_id,
                request_type=request.request_type.value,
                description=request.description,
                verification_token=verification_token
            )
            
            self.db.add(gdpr_request)
            self.db.commit()
            
            # Log the request
            await self.audit_logger.log_event(
                event_type="gdpr_request_submitted",
                user_id=user_id,
                details={
                    "request_id": request_id,
                    "request_type": request.request_type.value,
                    "description": request.description
                }
            )
            
            # Send verification email (implementation depends on email service)
            await self._send_verification_email(request.email, verification_token)
            
            return GDPRResponseModel(
                request_id=request_id,
                status=RequestStatus.PENDING,
                message="Request submitted successfully. Please check your email for verification.",
                verification_required=True
            )
            
        except Exception as e:
            logger.error(f"Error submitting GDPR request: {str(e)}")
            raise
    
    async def verify_request(self, request_id: str, token: str) -> bool:
        """Verify a GDPR request using the verification token"""
        try:
            request = self.db.query(GDPRRequest).filter(
                GDPRRequest.id == request_id,
                GDPRRequest.verification_token == token
            ).first()
            
            if not request:
                return False
            
            request.verified = True
            request.status = RequestStatus.IN_PROGRESS.value
            self.db.commit()
            
            # Auto-process certain request types
            if request.request_type in [DataSubjectRights.ACCESS.value, DataSubjectRights.PORTABILITY.value]:
                await self._auto_process_request(request)
            
            return True
            
        except Exception as e:
            logger.error(f"Error verifying GDPR request: {str(e)}")
            return False
    
    async def process_access_request(self, request_id: str) -> Dict[str, Any]:
        """Process a data access request (Article 15)"""
        try:
            request = self.db.query(GDPRRequest).filter(
                GDPRRequest.id == request_id,
                GDPRRequest.verified == True
            ).first()
            
            if not request or request.request_type != DataSubjectRights.ACCESS.value:
                raise ValueError("Invalid or unverified access request")
            
            # Collect user data from all sources
            user_data = await self._collect_user_data(request.user_id)
            
            # Include processing information
            processing_info = await self._get_processing_information(request.user_id)
            
            response_data = {
                "personal_data": user_data,
                "processing_information": processing_info,
                "data_sources": list(user_data.keys()),
                "retention_periods": await self._get_retention_periods(request.user_id),
                "third_party_recipients": await self._get_third_party_recipients(request.user_id),
                "exported_at": datetime.utcnow().isoformat()
            }
            
            # Update request status
            request.status = RequestStatus.COMPLETED.value
            request.processed_at = datetime.utcnow()
            request.response_data = json.dumps(response_data)
            self.db.commit()
            
            # Log the access
            await self.audit_logger.log_event(
                event_type="gdpr_access_completed",
                user_id=request.user_id,
                details={"request_id": request_id}
            )
            
            return response_data
            
        except Exception as e:
            logger.error(f"Error processing access request: {str(e)}")
            raise
    
    async def process_erasure_request(self, request_id: str, admin_user_id: str) -> bool:
        """Process a data erasure request (Article 17 - Right to be forgotten)"""
        try:
            request = self.db.query(GDPRRequest).filter(
                GDPRRequest.id == request_id,
                GDPRRequest.verified == True
            ).first()
            
            if not request or request.request_type != DataSubjectRights.ERASURE.value:
                raise ValueError("Invalid or unverified erasure request")
            
            # Check if erasure is legally required
            can_erase = await self._can_erase_data(request.user_id)
            
            if not can_erase:
                request.status = RequestStatus.REJECTED.value
                request.response_data = json.dumps({
                    "reason": "Data retention required for legal compliance"
                })
                self.db.commit()
                return False
            
            # Perform data erasure
            erasure_results = await self._erase_user_data(request.user_id)
            
            # Update request status
            request.status = RequestStatus.COMPLETED.value
            request.processed_at = datetime.utcnow()
            request.processed_by = admin_user_id
            request.response_data = json.dumps(erasure_results)
            self.db.commit()
            
            # Log the erasure
            await self.audit_logger.log_event(
                event_type="gdpr_erasure_completed",
                user_id=request.user_id,
                details={
                    "request_id": request_id,
                    "processed_by": admin_user_id,
                    "erasure_results": erasure_results
                }
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Error processing erasure request: {str(e)}")
            raise
    
    async def process_portability_request(self, request_id: str) -> DataPortabilityResponse:
        """Process a data portability request (Article 20)"""
        try:
            request = self.db.query(GDPRRequest).filter(
                GDPRRequest.id == request_id,
                GDPRRequest.verified == True
            ).first()
            
            if not request or request.request_type != DataSubjectRights.PORTABILITY.value:
                raise ValueError("Invalid or unverified portability request")
            
            # Collect portable data (only data provided by user)
            portable_data = await self._collect_portable_data(request.user_id)
            
            # Create structured export
            export_data = {
                "user_profile": portable_data.get("profile", {}),
                "user_content": portable_data.get("content", {}),
                "user_preferences": portable_data.get("preferences", {}),
                "export_metadata": {
                    "exported_at": datetime.utcnow().isoformat(),
                    "format": "JSON",
                    "version": "1.0"
                }
            }
            
            # Update request status
            request.status = RequestStatus.COMPLETED.value
            request.processed_at = datetime.utcnow()
            request.response_data = json.dumps(export_data)
            self.db.commit()
            
            # Log the export
            await self.audit_logger.log_event(
                event_type="gdpr_portability_completed",
                user_id=request.user_id,
                details={"request_id": request_id}
            )
            
            return DataPortabilityResponse(
                user_data=export_data,
                exported_at=datetime.utcnow()
            )
            
        except Exception as e:
            logger.error(f"Error processing portability request: {str(e)}")
            raise
    
    async def get_processing_activities(self) -> List[Dict[str, Any]]:
        """Get all data processing activities (Article 30)"""
        try:
            activities = self.db.query(DataProcessingActivity).all()
            
            return [
                {
                    "id": activity.id,
                    "name": activity.name,
                    "purpose": activity.purpose,
                    "legal_basis": activity.legal_basis,
                    "data_categories": json.loads(activity.data_categories or "[]"),
                    "data_subjects": json.loads(activity.data_subjects or "[]"),
                    "recipients": json.loads(activity.recipients or "[]"),
                    "retention_period": activity.retention_period,
                    "security_measures": activity.security_measures
                }
                for activity in activities
            ]
            
        except Exception as e:
            logger.error(f"Error getting processing activities: {str(e)}")
            raise
    
    async def register_processing_activity(self, activity_data: Dict[str, Any]) -> str:
        """Register a new data processing activity"""
        try:
            activity_id = self._generate_activity_id(activity_data["name"])
            
            activity = DataProcessingActivity(
                id=activity_id,
                name=activity_data["name"],
                purpose=activity_data["purpose"],
                legal_basis=activity_data["legal_basis"],
                data_categories=json.dumps(activity_data.get("data_categories", [])),
                data_subjects=json.dumps(activity_data.get("data_subjects", [])),
                recipients=json.dumps(activity_data.get("recipients", [])),
                retention_period=activity_data.get("retention_period"),
                security_measures=activity_data.get("security_measures", "")
            )
            
            self.db.add(activity)
            self.db.commit()
            
            return activity_id
            
        except Exception as e:
            logger.error(f"Error registering processing activity: {str(e)}")
            raise
    
    async def check_compliance_status(self, user_id: str) -> Dict[str, Any]:
        """Check GDPR compliance status for a user"""
        try:
            # Check consent status
            consent_status = await self.consent_manager.get_user_consent_status(user_id)
            
            # Check data retention compliance
            retention_status = await self._check_retention_compliance(user_id)
            
            # Check pending requests
            pending_requests = self.db.query(GDPRRequest).filter(
                GDPRRequest.user_id == user_id,
                GDPRRequest.status.in_([RequestStatus.PENDING.value, RequestStatus.IN_PROGRESS.value])
            ).count()
            
            return {
                "user_id": user_id,
                "consent_status": consent_status,
                "retention_compliance": retention_status,
                "pending_requests": pending_requests,
                "last_checked": datetime.utcnow().isoformat(),
                "compliant": all([
                    consent_status.get("valid", False),
                    retention_status.get("compliant", False),
                    pending_requests == 0
                ])
            }
            
        except Exception as e:
            logger.error(f"Error checking compliance status: {str(e)}")
            raise
    
    # Private helper methods
    
    def _generate_request_id(self, user_id: str, request_type: str) -> str:
        """Generate a unique request ID"""
        timestamp = datetime.utcnow().isoformat()
        data = f"{user_id}:{request_type}:{timestamp}"
        return f"gdpr_{hashlib.sha256(data.encode()).hexdigest()[:16]}"
    
    def _generate_verification_token(self, request_id: str) -> str:
        """Generate a verification token"""
        timestamp = datetime.utcnow().isoformat()
        data = f"{request_id}:{timestamp}"
        return hashlib.sha256(data.encode()).hexdigest()
    
    def _generate_activity_id(self, name: str) -> str:
        """Generate a unique activity ID"""
        timestamp = datetime.utcnow().isoformat()
        data = f"{name}:{timestamp}"
        return f"activity_{hashlib.sha256(data.encode()).hexdigest()[:16]}"
    
    async def _send_verification_email(self, email: str, token: str):
        """Send verification email (placeholder - implement with actual email service)"""
        # This would integrate with your email service
        logger.info(f"Verification email sent to {email} with token {token}")
    
    async def _auto_process_request(self, request: GDPRRequest):
        """Auto-process certain types of requests"""
        if request.request_type == DataSubjectRights.ACCESS.value:
            await self.process_access_request(request.id)
        elif request.request_type == DataSubjectRights.PORTABILITY.value:
            await self.process_portability_request(request.id)
    
    async def _collect_user_data(self, user_id: str) -> Dict[str, Any]:
        """Collect all user data from various sources"""
        # This would collect data from all tables/services containing user data
        return {
            "profile": {},  # User profile data
            "preferences": {},  # User preferences
            "activity": {},  # User activity logs
            "content": {}  # User-generated content
        }
    
    async def _get_processing_information(self, user_id: str) -> Dict[str, Any]:
        """Get information about how user data is processed"""
        return {
            "purposes": ["Service provision", "Analytics", "Marketing"],
            "legal_bases": ["Consent", "Legitimate interest"],
            "retention_periods": {"profile": 365, "activity": 90},
            "automated_decision_making": False
        }
    
    async def _get_retention_periods(self, user_id: str) -> Dict[str, int]:
        """Get data retention periods for different data types"""
        return {
            "profile_data": 365,
            "activity_logs": 90,
            "marketing_data": 730
        }
    
    async def _get_third_party_recipients(self, user_id: str) -> List[str]:
        """Get list of third parties that receive user data"""
        return ["Analytics Provider", "Email Service Provider"]
    
    async def _can_erase_data(self, user_id: str) -> bool:
        """Check if user data can be erased (considering legal obligations)"""
        # Check for legal retention requirements
        return True  # Simplified - implement actual logic
    
    async def _erase_user_data(self, user_id: str) -> Dict[str, Any]:
        """Erase user data from all systems"""
        # This would implement actual data erasure across all systems
        return {
            "profile_data": "erased",
            "activity_logs": "erased",
            "user_content": "anonymized"
        }
    
    async def _collect_portable_data(self, user_id: str) -> Dict[str, Any]:
        """Collect data that can be ported (user-provided data only)"""
        return {
            "profile": {},  # User-provided profile data
            "content": {},  # User-created content
            "preferences": {}  # User preferences
        }
    
    async def _check_retention_compliance(self, user_id: str) -> Dict[str, Any]:
        """Check if data retention is compliant"""
        return {
            "compliant": True,
            "expired_data": [],
            "next_review": (datetime.utcnow() + timedelta(days=30)).isoformat()
        }