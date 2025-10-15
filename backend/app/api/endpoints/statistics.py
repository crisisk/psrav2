from datetime import date
from typing import Optional, List, Dict
from fastapi import FastAPI, Query, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select, and_, or_
from sqlalchemy.orm import Session
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.types import Float, Integer, String, Date

app = FastAPI()

Base = declarative_base()

class Certificate(Base):
    __tablename__ = 'certificates'
    id = Column(Integer, primary_key=True)
    status = Column(String)  # 'pending', 'approved', 'rejected'
    agreement = Column(String)
    origin_country = Column(String)
    destination_country = Column(String)
    value = Column(Float)
    rvc = Column(Float)
    created_at = Column(Date)

class StatsResponse(BaseModel):
    total_certificates: int
    by_status: Dict[str, int]
    by_agreement: Dict[str, int]
    top_origin_countries: List[Dict[str, int]]
    top_destination_countries: List[Dict[str, int]]
    total_value: float
    average_rvc: float

@app.get("/certificates/stats", response_model=StatsResponse)
def get_certificate_stats(
    from_date: Optional[date] = Query(None, description="Start date for filtering"),
    to_date: Optional[date] = Query(None, description="End date for filtering")
):
    session = Session()  # Assume session is properly initialized
    try:
        # Base query with date filters
        query = select(Certificate)
        if from_date and to_date:
            query = query.where(and_(Certificate.created_at >= from_date, Certificate.created_at <= to_date))
        elif from_date:
            query = query.where(Certificate.created_at >= from_date)
        elif to_date:
            query = query.where(Certificate.created_at <= to_date)

        # Total certificates
        total_certificates = session.query(func.count(Certificate.id)).scalar()

        # Certificates by status
        by_status = session.query(Certificate.status, func.count(Certificate.id)).group_by(Certificate.status).all()
        by_status_dict = {status: count for status, count in by_status}

        # Certificates by agreement
        by_agreement = session.query(Certificate.agreement, func.count(Certificate.id)).group_by(Certificate.agreement).all()
        by_agreement_dict = {agreement: count for agreement, count in by_agreement}

        # Top origin countries
        top_origin_countries = session.query(Certificate.origin_country, func.count(Certificate.id)).group_by(Certificate.origin_country).order_by(func.count(Certificate.id).desc()).limit(5).all()
        top_origin_countries_list = [{"country": country, "count": count} for country, count in top_origin_countries]

        # Top destination countries
        top_destination_countries = session.query(Certificate.destination_country, func.count(Certificate.id)).group_by(Certificate.destination_country).order_by(func.count(Certificate.id).desc()).limit(5).all()
        top_destination_countries_list = [{"country": country, "count": count} for country, count in top_destination_countries]

        # Total value
        total_value = session.query(func.sum(Certificate.value)).scalar() or 0.0

        # Average RVC
        average_rvc = session.query(func.avg(Certificate.rvc)).scalar() or 0.0

        return StatsResponse(
            total_certificates=total_certificates,
            by_status=by_status_dict,
            by_agreement=by_agreement_dict,
            top_origin_countries=top_origin_countries_list,
            top_destination_countries=top_destination_countries_list,
            total_value=total_value,
            average_rvc=average_rvc
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        session.close()