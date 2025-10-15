# /home/vncuser/psra-ltsd-enterprise-v2/backend/app/api/endpoints/certificates_validation.py

"""
This module defines the Pydantic models and validation logic for the POST /certificates endpoint.
It includes comprehensive field validation, custom validators for uniqueness, format checks, and business rules.
"""

from datetime import date, timedelta
from typing import List
from pydantic import BaseModel, Field, validator, ValidationError
import pycountry  # Assuming pycountry is installed for country validation
from sqlalchemy.orm import Session  # Assuming SQLAlchemy for DB access; adjust if using another ORM
from app.database import get_db  # Assuming a database session getter; adjust based on your setup
from app.models import Certificate  # Assuming a Certificate model exists; adjust based on your models

class Material(BaseModel):
    """
    Model for a material in the certificate.
    
    Attributes:
        name (str): Name of the material, must be at least 1 character.
        origin_percentage (float): Percentage of origin, must be between 0 and 100.
    """
    name: str = Field(..., min_length=1, description="Name of the material")
    origin_percentage: float = Field(..., ge=0, le=100, description="Origin percentage (0-100)")

class CertificateCreate(BaseModel):
    """
    Pydantic model for creating a certificate via POST /certificates.
    
    This model includes field validations and custom validators for business rules.
    
    Attributes:
        certificate_number (str): Unique alphanumeric string, max 50 chars.
        issue_date (date): ISO format date, not in the future.
        expiry_date (date): Date after issue_date, max 5 years ahead.
        exporter (str): Required, min 2 chars.
        importer (str): Required, min 2 chars.
        hs_code (str): 6-10 digits, valid HS code.
        origin_country (str): ISO 3166-1 alpha-2 country code.
        destination_country (str): ISO 3166-1 alpha-2 country code.
        fta_agreement (str): Required, max 100 chars, must exist.
        materials (List[Material]): List of materials with percentages summing to 100%.
    """
    certificate_number: str = Field(
        ..., 
        max_length=50, 
        regex=r'^[a-zA-Z0-9]+$', 
        description="Unique alphanumeric certificate number"
    )
    issue_date: date = Field(..., description="Issue date in ISO format, not in future")
    expiry_date: date = Field(..., description="Expiry date after issue_date, max 5 years ahead")
    exporter: str = Field(..., min_length=2, description="Exporter name, min 2 chars")
    importer: str = Field(..., min_length=2, description="Importer name, min 2 chars")
    hs_code: str = Field(
        ..., 
        regex=r'^\d{6,10}$', 
        description="HS code, 6-10 digits"
    )
    origin_country: str = Field(
        ..., 
        regex=r'^[A-Z]{2}$', 
        description="Origin country ISO 3166-1 alpha-2 code"
    )
    destination_country: str = Field(
        ..., 
        regex=r'^[A-Z]{2}$', 
        description="Destination country ISO 3166-1 alpha-2 code"
    )
    fta_agreement: str = Field(
        ..., 
        max_length=100, 
        description="FTA agreement name, must exist"
    )
    materials: List[Material] = Field(..., description="List of materials with origin percentages")

    @validator('issue_date')
    def validate_issue_date(cls, v: date) -> date:
        """
        Validate that issue_date is not in the future.
        
        Args:
            v (date): The issue date.
            
        Returns:
            date: The validated date.
            
        Raises:
            ValueError: If the date is in the future.
        """
        if v > date.today():
            raise ValueError("Issue date cannot be in the future")
        return v

    @validator('expiry_date')
    def validate_expiry_date(cls, v: date, values: dict) -> date:
        """
        Validate that expiry_date is after issue_date and not more than 5 years ahead.
        
        Args:
            v (date): The expiry date.
            values (dict): Other field values.
            
        Returns:
            date: The validated date.
            
        Raises:
            ValueError: If expiry_date is not after issue_date or exceeds 5 years.
        """
        if 'issue_date' in values:
            issue_date = values['issue_date']
            if v <= issue_date:
                raise ValueError("Expiry date must be after issue date")
            max_expiry = issue_date + timedelta(days=365 * 5)
            if v > max_expiry:
                raise ValueError("Expiry date cannot be more than 5 years after issue date")
        return v

    @validator('certificate_number')
    def validate_certificate_number_uniqueness(cls, v: str) -> str:
        """
        Validate that certificate_number is unique in the database.
        
        Args:
            v (str): The certificate number.
            
        Returns:
            str: The validated number.
            
        Raises:
            ValueError: If the number is not unique.
        """
        db: Session = next(get_db())  # Get DB session; adjust if your setup differs
        if db.query(Certificate).filter(Certificate.certificate_number == v).first():
            raise ValueError("Certificate number must be unique")
        return v

    @validator('hs_code')
    def validate_hs_code(cls, v: str) -> str:
        """
        Validate HS code format and existence.
        
        Args:
            v (str): The HS code.
            
        Returns:
            str: The validated code.
            
        Raises:
            ValueError: If the HS code is invalid or does not exist.
        """
        # Format is already checked by regex. For existence, assume a function or API check.
        # In production, integrate with HS code database or API (e.g., UN Comtrade or custom DB).
        if not is_valid_hs_code(v):
            raise ValueError("Invalid or non-existent HS code")
        return v

    @validator('origin_country', 'destination_country')
    def validate_country_code(cls, v: str) -> str:
        """
        Validate country code against ISO 3166-1 alpha-2.
        
        Args:
            v (str): The country code.
            
        Returns:
            str: The validated code.
            
        Raises:
            ValueError: If the code is invalid.
        """
        if not pycountry.countries.get(alpha_2=v.upper()):
            raise ValueError("Invalid country code")
        return v

    @validator('fta_agreement')
    def validate_fta_agreement(cls, v: str) -> str:
        """
        Validate that FTA agreement exists.
        
        Args:
            v (str): The FTA agreement name.
            
        Returns:
            str: The validated name.
            
        Raises:
            ValueError: If the agreement does not exist.
        """
        # Assume a function or DB check for FTA existence.
        if not fta_agreement_exists(v):
            raise ValueError("FTA agreement does not exist")
        return v

    @validator('materials')
    def validate_materials_percentages(cls, v: List[Material]) -> List[Material]:
        """
        Validate that material origin percentages sum to 100%.
        
        Args:
            v (List[Material]): The list of materials.
            
        Returns:
            List[Material]: The validated list.
            
        Raises:
            ValueError: If percentages do not sum to 100%.
        """
        total_percentage = sum(material.origin_percentage for material in v)
        if total_percentage != 100:
            raise ValueError("Material origin percentages must sum to 100%")
        return v

# Helper functions (implement based on your data sources)

def is_valid_hs_code(hs_code: str) -> bool:
    """
    Check if HS code exists. In production, query a HS code database or API.
    
    Args:
        hs_code (str): The HS code.
        
    Returns:
        bool: True if valid, else False.
    """
    # Placeholder: Implement actual check, e.g., via API or DB.
    # For example, query a table or call an external service.
    return len(hs_code) >= 6  # Dummy implementation; replace with real logic.

def fta_agreement_exists(fta_name: str) -> bool:
    """
    Check if FTA agreement exists. In production, query a database or list.
    
    Args:
        fta_name (str): The FTA agreement name.
        
    Returns:
        bool: True if exists, else False.
    """
    # Placeholder: Implement actual check, e.g., query FTA table.
    # For example, db.query(FTAAgreement).filter(name == fta_name).first() is not None
    return True  # Dummy implementation; replace with real logic.
