from pydantic import BaseModel
from typing import List

class FinancialSummary(BaseModel):
    revenue: float
    expenses: float
    profit: float

class TimelinePoint(BaseModel):
    name: str # Month name (e.g., "Jan")
    revenue: float
    expenses: float

class ReportsTimelineResponse(BaseModel):
    __root__: List[TimelinePoint]
