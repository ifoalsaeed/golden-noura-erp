from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import date, datetime, timedelta
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import pandas as pd
import io
from fastapi.responses import StreamingResponse

from db.database import get_db
from db.models import Worker, Contract, Client, Payroll, Expense, Account, JournalEntry
from services.financial_report_service import FinancialReportService

router = APIRouter()

class ReportFilter(BaseModel):
    date_start: Optional[date] = None
    date_end: Optional[date] = None
    department: Optional[str] = None
    worker_status: Optional[str] = None
    client_type: Optional[str] = None
    contract_status: Optional[str] = None
    nationality: Optional[str] = None
    transaction_type: Optional[str] = None
    account: Optional[str] = None
    compliance_type: Optional[str] = None
    risk_level: Optional[str] = None
    project: Optional[str] = None
    amount_min: Optional[float] = None
    amount_max: Optional[float] = None

class AdvancedReportRequest(BaseModel):
    report_type: str
    filters: Optional[ReportFilter] = None
    group_by: Optional[str] = None
    sort_by: Optional[str] = None
    sort_order: Optional[str] = 'asc'
    limit: Optional[int] = 100
    include_charts: bool = True
    format: Optional[str] = 'json'

class FinancialOverview(BaseModel):
    total_revenue: float
    total_expenses: float
    net_profit: float
    growth_rate: float
    profit_margin: float
    revenue_per_worker: float
    expense_per_worker: float

class WorkerPerformance(BaseModel):
    worker_id: int
    worker_name: str
    nationality: str
    department: str
    total_revenue: float
    total_cost: float
    net_profit: float
    profit_margin: float
    productivity_score: float
    attendance_rate: float
    performance_rating: str

class ClientProfitability(BaseModel):
    client_id: int
    client_name: str
    client_type: str
    total_contracts: int
    active_contracts: int
    total_revenue: float
    total_cost: float
    net_profit: float
    profit_margin: float
    retention_rate: float
    avg_contract_value: float

class ComplianceMetric(BaseModel):
    compliance_type: str
    total_checks: int
    passed_checks: int
    failed_checks: int
    compliance_score: float
    risk_level: str
    last_audit_date: Optional[date]

@router.get("/financial-overview")
async def get_financial_overview(
    date_start: Optional[date] = Query(None),
    date_end: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    """Generate comprehensive financial overview"""
    
    if not date_start:
        date_start = date(date.today().year, 1, 1)
    if not date_end:
        date_end = date.today()
    
    service = FinancialReportService(db)
    
    # Get P&L data
    pl_data = service.get_profit_and_loss(date_start, date_end)
    
    # Get worker count
    worker_count = db.query(Worker).filter(Worker.is_active == True).count()
    
    # Calculate metrics
    total_revenue = pl_data["revenue"]["total"]
    total_expenses = pl_data["expenses"]["total"]
    net_profit = pl_data["net_profit"]
    profit_margin = (net_profit / total_revenue * 100) if total_revenue > 0 else 0
    
    # Get previous period data for growth calculation
    prev_period_start = date_start - timedelta(days=(date_end - date_start).days)
    prev_period_end = date_start - timedelta(days=1)
    
    try:
        prev_pl = service.get_profit_and_loss(prev_period_start, prev_period_end)
        prev_profit = prev_pl["net_profit"]
        growth_rate = ((net_profit - prev_profit) / abs(prev_profit) * 100) if prev_profit != 0 else 0
    except:
        growth_rate = 0
    
    revenue_per_worker = total_revenue / worker_count if worker_count > 0 else 0
    expense_per_worker = total_expenses / worker_count if worker_count > 0 else 0
    
    return FinancialOverview(
        total_revenue=total_revenue,
        total_expenses=total_expenses,
        net_profit=net_profit,
        growth_rate=growth_rate,
        profit_margin=profit_margin,
        revenue_per_worker=revenue_per_worker,
        expense_per_worker=expense_per_worker
    )

@router.get("/worker-performance")
async def get_worker_performance(
    date_start: Optional[date] = Query(None),
    date_end: Optional[date] = Query(None),
    department: Optional[str] = Query(None),
    nationality: Optional[str] = Query(None),
    limit: int = Query(50),
    db: Session = Depends(get_db)
):
    """Generate worker performance analysis"""
    
    if not date_start:
        date_start = date(date.today().year, 1, 1)
    if not date_end:
        date_end = date.today()
    
    # Base query for workers
    query = db.query(Worker).filter(Worker.is_active == True)
    
    if department:
        query = query.filter(Worker.department == department)
    if nationality:
        query = query.filter(Worker.nationality.ilike(f"%{nationality}%"))
    
    workers = query.limit(limit).all()
    
    performance_data = []
    
    for worker in workers:
        # Get worker's contracts in the period
        contracts = db.query(Contract).filter(
            and_(
                Contract.worker_id == worker.id,
                Contract.start_date <= date_end,
                or_(Contract.end_date >= date_start, Contract.end_date.is_(None))
            )
        ).all()
        
        # Calculate revenue from contracts
        total_revenue = sum(c.monthly_rental_price for c in contracts if c.monthly_rental_price)
        
        # Calculate costs (payroll + expenses)
        payroll_data = db.query(Payroll).filter(
            and_(
                Payroll.worker_id == worker.id,
                Payroll.payment_date >= date_start,
                Payroll.payment_date <= date_end
            )
        ).all()
        
        total_cost = sum(p.net_salary for p in payroll_data)
        
        # Calculate metrics
        net_profit = total_revenue - total_cost
        profit_margin = (net_profit / total_revenue * 100) if total_revenue > 0 else 0
        
        # Mock productivity score (would be calculated from actual performance data)
        productivity_score = min(100, (net_profit / 10000) * 100) if net_profit > 0 else 50
        
        # Mock attendance rate
        attendance_rate = 95.0  # Would be calculated from actual attendance data
        
        # Performance rating based on profit margin
        if profit_margin >= 20:
            performance_rating = "Excellent"
        elif profit_margin >= 10:
            performance_rating = "Good"
        elif profit_margin >= 5:
            performance_rating = "Average"
        else:
            performance_rating = "Needs Improvement"
        
        performance_data.append(WorkerPerformance(
            worker_id=worker.id,
            worker_name=worker.name,
            nationality=worker.nationality,
            department=worker.department or "Unassigned",
            total_revenue=total_revenue,
            total_cost=total_cost,
            net_profit=net_profit,
            profit_margin=profit_margin,
            productivity_score=productivity_score,
            attendance_rate=attendance_rate,
            performance_rating=performance_rating
        ))
    
    # Sort by net profit descending
    performance_data.sort(key=lambda x: x.net_profit, reverse=True)
    
    return performance_data

@router.get("/client-profitability")
async def get_client_profitability(
    date_start: Optional[date] = Query(None),
    date_end: Optional[date] = Query(None),
    client_type: Optional[str] = Query(None),
    limit: int = Query(50),
    db: Session = Depends(get_db)
):
    """Generate client profitability analysis"""
    
    if not date_start:
        date_start = date(date.today().year, 1, 1)
    if not date_end:
        date_end = date.today()
    
    # Base query for clients
    query = db.query(Client)
    
    if client_type:
        query = query.filter(Client.client_type == client_type)
    
    clients = query.limit(limit).all()
    
    profitability_data = []
    
    for client in clients:
        # Get client's contracts in the period
        contracts = db.query(Contract).filter(
            and_(
                Contract.client_id == client.id,
                Contract.start_date <= date_end,
                or_(Contract.end_date >= date_start, Contract.end_date.is_(None))
            )
        ).all()
        
        total_contracts = len(contracts)
        active_contracts = len([c for c in contracts if c.status == 'ACTIVE'])
        
        # Calculate revenue from contracts
        total_revenue = sum(c.monthly_rental_price for c in contracts if c.monthly_rental_price)
        
        # Estimate costs (70% of revenue as rough estimate)
        total_cost = total_revenue * 0.7
        
        # Calculate metrics
        net_profit = total_revenue - total_cost
        profit_margin = (net_profit / total_revenue * 100) if total_revenue > 0 else 0
        
        # Calculate retention rate (mock data)
        retention_rate = 85.0  # Would be calculated from actual contract renewal data
        
        avg_contract_value = total_revenue / total_contracts if total_contracts > 0 else 0
        
        profitability_data.append(ClientProfitability(
            client_id=client.id,
            client_name=client.company_name,
            client_type=client.client_type,
            total_contracts=total_contracts,
            active_contracts=active_contracts,
            total_revenue=total_revenue,
            total_cost=total_cost,
            net_profit=net_profit,
            profit_margin=profit_margin,
            retention_rate=retention_rate,
            avg_contract_value=avg_contract_value
        ))
    
    # Sort by net profit descending
    profitability_data.sort(key=lambda x: x.net_profit, reverse=True)
    
    return profitability_data

@router.get("/compliance-report")
async def get_compliance_report(
    date_start: Optional[date] = Query(None),
    date_end: Optional[date] = Query(None),
    compliance_type: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Generate compliance and audit report"""
    
    if not date_start:
        date_start = date(date.today().year, 1, 1)
    if not date_end:
        date_end = date.today()
    
    # Mock compliance data (would be fetched from actual compliance tables)
    compliance_types = [
        "Labor Law", "Financial", "Safety", "Immigration", 
        "Contract Compliance", "Documentation", "Training"
    ]
    
    compliance_data = []
    
    for comp_type in compliance_types:
        if compliance_type and comp_type != compliance_type:
            continue
        
        # Mock compliance metrics
        total_checks = 100 + (hash(comp_type) % 50)
        passed_checks = int(total_checks * (0.85 + (hash(comp_type) % 10) / 100))
        failed_checks = total_checks - passed_checks
        compliance_score = (passed_checks / total_checks) * 100
        
        # Determine risk level
        if compliance_score >= 95:
            risk = "Low"
        elif compliance_score >= 85:
            risk = "Medium"
        elif compliance_score >= 70:
            risk = "High"
        else:
            risk = "Critical"
        
        if risk_level and risk != risk_level:
            continue
        
        compliance_data.append(ComplianceMetric(
            compliance_type=comp_type,
            total_checks=total_checks,
            passed_checks=passed_checks,
            failed_checks=failed_checks,
            compliance_score=compliance_score,
            risk_level=risk,
            last_audit_date=date_end - timedelta(days=(hash(comp_type) % 30))
        ))
    
    return compliance_data

@router.post("/generate-advanced-report")
async def generate_advanced_report(
    request: AdvancedReportRequest,
    db: Session = Depends(get_db)
):
    """Generate advanced custom report"""
    
    try:
        if request.report_type == "financial-overview":
            data = await get_financial_overview(
                request.filters.date_start if request.filters else None,
                request.filters.date_end if request.filters else None,
                db
            )
        elif request.report_type == "worker-performance":
            data = await get_worker_performance(
                request.filters.date_start if request.filters else None,
                request.filters.date_end if request.filters else None,
                request.filters.department if request.filters else None,
                request.filters.nationality if request.filters else None,
                request.limit or 100,
                db
            )
        elif request.report_type == "client-profitability":
            data = await get_client_profitability(
                request.filters.date_start if request.filters else None,
                request.filters.date_end if request.filters else None,
                request.filters.client_type if request.filters else None,
                request.limit or 100,
                db
            )
        elif request.report_type == "compliance-report":
            data = await get_compliance_report(
                request.filters.date_start if request.filters else None,
                request.filters.date_end if request.filters else None,
                request.filters.compliance_type if request.filters else None,
                request.filters.risk_level if request.filters else None,
                db
            )
        else:
            raise HTTPException(status_code=400, detail="Invalid report type")
        
        # Convert to DataFrame for easier manipulation
        if isinstance(data, list):
            df = pd.DataFrame([item.dict() for item in data])
        else:
            df = pd.DataFrame([data.dict()])
        
        # Apply filters
        if request.filters:
            if request.filters.amount_min:
                df = df[df.select_dtypes(include=[float, int]).ge(request.filters.amount_min).any(axis=1)]
            if request.filters.amount_max:
                df = df[df.select_dtypes(include=[float, int]).le(request.filters.amount_max).any(axis=1)]
        
        # Apply sorting
        if request.sort_by and request.sort_by in df.columns:
            df = df.sort_values(
                by=request.sort_by,
                ascending=request.sort_order == 'asc'
            )
        
        # Apply limit
        if request.limit:
            df = df.head(request.limit)
        
        # Generate response
        if request.format == 'csv':
            csv_buffer = io.StringIO()
            df.to_csv(csv_buffer, index=False)
            csv_buffer.seek(0)
            
            return StreamingResponse(
                io.BytesIO(csv_buffer.getvalue().encode()),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename=report_{request.report_type}.csv"}
            )
        elif request.format == 'excel':
            excel_buffer = io.BytesIO()
            df.to_excel(excel_buffer, index=False, engine='openpyxl')
            excel_buffer.seek(0)
            
            return StreamingResponse(
                excel_buffer,
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={"Content-Disposition": f"attachment; filename=report_{request.report_type}.xlsx"}
            )
        else:
            return {
                "report_type": request.report_type,
                "generated_at": datetime.now().isoformat(),
                "total_records": len(df),
                "data": df.to_dict('records'),
                "charts_enabled": request.include_charts
            }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")

@router.get("/report-templates")
async def get_report_templates():
    """Get available report templates"""
    
    templates = [
        {
            "id": "financial-overview",
            "name": "Financial Overview",
            "type": "financial",
            "category": "Financial Reports",
            "description": "Comprehensive financial performance summary",
            "metrics": ["revenue", "expenses", "profit", "cash_flow", "growth_rate"],
            "filters": ["date_range", "department", "project"],
            "export_formats": ["json", "csv", "excel"]
        },
        {
            "id": "worker-performance",
            "name": "Worker Performance Analysis",
            "type": "operational",
            "category": "Operational Reports",
            "description": "Detailed worker productivity and performance metrics",
            "metrics": ["productivity", "attendance", "performance_score", "revenue_per_worker"],
            "filters": ["date_range", "department", "worker_status", "nationality"],
            "export_formats": ["json", "csv", "excel"]
        },
        {
            "id": "client-profitability",
            "name": "Client Profitability Analysis",
            "type": "analytical",
            "category": "Business Intelligence",
            "description": "Profitability analysis per client and contract",
            "metrics": ["revenue_per_client", "profit_margin", "contract_value", "retention_rate"],
            "filters": ["date_range", "client_type", "contract_status"],
            "export_formats": ["json", "csv", "excel"]
        },
        {
            "id": "compliance-audit",
            "name": "Compliance & Audit Report",
            "type": "compliance",
            "category": "Compliance Reports",
            "description": "Regulatory compliance and internal audit findings",
            "metrics": ["compliance_score", "audit_findings", "risk_assessment", "remediation_status"],
            "filters": ["date_range", "compliance_type", "risk_level"],
            "export_formats": ["json", "csv", "excel"]
        }
    ]
    
    return templates

@router.get("/export/{report_type}")
async def export_report(
    report_type: str,
    format: str = Query("excel", regex="^(excel|csv|pdf)$"),
    date_start: Optional[date] = Query(None),
    date_end: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    """Export report in various formats"""
    
    request = AdvancedReportRequest(
        report_type=report_type,
        format=format,
        limit=10000  # Higher limit for exports
    )
    
    return await generate_advanced_report(request, db)
