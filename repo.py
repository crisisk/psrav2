from sqlalchemy import select
from datetime import date
from typing import Optional, List

from .models import Project, ProjectItem
from app.modules.inventory.models import Item  # monolith read

def overlaps(a_start, a_end, b_start, b_end) -> bool:
    return not (a_end < b_start or b_end < a_start)
