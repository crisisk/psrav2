from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from enum import Enum
import logging
from sqlalchemy import func, select, and_, or_
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Rule, FTA, HSCode

router = APIRouter()

logger = logging.getLogger(__name__)

class RuleType(str, Enum):
    tariff_quota = "tariff_quota"
    tariff_elimination = "tariff_elimination"
    rules_of_origin = "rules_of_origin"
    other = "other"

class RuleResponse(BaseModel):
    id: int
    fta_id: int
    fta_name: str
    hs_code: str
    hs_code_description: str
    rule_type: RuleType
    description: str
    created_at: datetime
    updated_at: datetime

class ChapterStats(BaseModel):
    chapter: str
    rule_count: int
    coverage_percentage: float

class RulesByFTAResponse(BaseModel):
    rules: List[RuleResponse]
    total_count: int
    chapter_stats: List[ChapterStats]
    current_page: int
    total_pages: int

@router.get("/by-fta/{fta_id_or_name}", response_model=RulesByFTAResponse)
async def get_rules_by_fta(
    fta_id_or_name: str,
    limit: int = Query(20, gt=0, le=100),
    offset: int = Query(0, ge=0),
    chapter: Optional[str] = Query(None, regex=r"^\d{2}$"),
    db: Session = Depends(get_db)
):
    """
    Get all rules for a specific FTA with pagination, filtering, and statistics.
    
    Args:
        fta_id_or_name: FTA ID or name (case-insensitive)
        limit: Number of items per page (default: 20, max: 100)
        offset: Pagination offset (default: 0)
        chapter: Optional HS chapter filter (2-digit string)
    
    Returns:
        RulesByFTAResponse with rules, statistics, and pagination info
    """
    try:
        # First try to find FTA by ID if input is numeric
        try:
            fta_id = int(fta_id_or_name)
            fta = db.query(FTA).filter(FTA.id == fta_id).first()
        except ValueError:
            # If not numeric, search by name
            fta = db.query(FTA).filter(func.lower(FTA.name) == fta_id_or_name.lower()).first()
        
        if not fta:
            raise HTTPException(status_code=404, detail="FTA not found")
        
        # Base query for rules
        query = db.query(
            Rule.id,
            Rule.fta_id,
            FTA.name.label("fta_name"),
            Rule.hs_code,
            HSCode.description.label("hs_code_description"),
            Rule.rule_type,
            Rule.description,
            Rule.created_at,
            Rule.updated_at
        ).join(
            FTA, Rule.fta_id == FTA.id
        ).join(
            HSCode, Rule.hs_code == HSCode.code
        ).filter(
            Rule.fta_id == fta.id
        ).order_by(
            Rule.hs_code.asc()
        )
        
        # Apply chapter filter if provided
        if chapter:
            query = query.filter(Rule.hs_code.startswith(chapter))
        
        # Get total count for pagination
        total_count = query.count()
        
        # Apply pagination
        rules = query.offset(offset).limit(limit).all()
        
        # Calculate chapter statistics
        chapter_stats_query = db.query(
            func.substr(Rule.hs_code, 1, 2).label("chapter"),
            func.count(Rule.id).label("rule_count")
        ).filter(
            Rule.fta_id == fta.id
        ).group_by(
            "chapter"
        ).order_by(
            "chapter"
        )
        
        if chapter:
            chapter_stats_query = chapter_stats_query.filter(Rule.hs_code.startswith(chapter))
        
        chapter_stats = chapter_stats_query.all()
        
        # Get total HS codes in the system for coverage calculation
        total_hs_codes = db.query(func.count(HSCode.code)).scalar()
        
        # Calculate coverage percentage for each chapter
        stats_response = []
        for stat in chapter_stats:
            # Count total HS codes in this chapter
            chapter_hs_count = db.query(func.count(HSCode.code)).filter(
                HSCode.code.startswith(stat.chapter)
            ).scalar()
            
            coverage = (stat.rule_count / chapter_hs_count * 100) if chapter_hs_count > 0 else 0
            stats_response.append(ChapterStats(
                chapter=stat.chapter,
                rule_count=stat.rule_count,
                coverage_percentage=round(coverage, 2)
            ))
        
        return RulesByFTAResponse(
            rules=[RuleResponse(**rule._asdict()) for rule in rules],
            total_count=total_count,
            chapter_stats=stats_response,
            current_page=(offset // limit) + 1,
            total_pages=(total_count + limit - 1) // limit
        )
    
    except Exception as e:
        logger.error(f"Error fetching rules for FTA {fta_id_or_name}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")