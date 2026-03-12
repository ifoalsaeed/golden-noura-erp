from pydantic import BaseModel
from typing import List, Dict, Any

class FinancialSummary(BaseModel):
    revenue: float
    expenses: float
    profit: float

class TimelinePoint(BaseModel):
    name: str # Month name (e.g., "Jan")
    revenue: float
    expenses: float

class ProfitLossItem(BaseModel):
    category: str
    amount: float

class ProfitLossResponse(BaseModel):
    revenue_items: List[ProfitLossItem]
    expense_items: List[ProfitLossItem]
    total_revenue: float
    total_expenses: float
    net_profit: float

class BalanceSheetItem(BaseModel):
    name: str
    code: str
    balance: float

class BalanceSheetResponse(BaseModel):
    assets: Dict[str, Any]
    liabilities: Dict[str, Any]
    equity: Dict[str, Any]
    total_liabilities_and_equity: float

class CashFlowItem(BaseModel):
    category: str
    amount: float

class CashFlowResponse(BaseModel):
    inflow: List[CashFlowItem]
    outflow: List[CashFlowItem]
    net_cash_flow: float
