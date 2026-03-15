from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal
from datetime import datetime

from db.database import get_db
from db.payroll_models import (
    Payroll, PayrollPeriod, Worker, Allowance, Deduction, 
    ExpenseAllocation, PayrollStatus
)
from schemas.payroll_schemas import (
    PayrollResponse, PayrollCreate, PayrollUpdate,
    PayrollPeriodResponse, PayrollPeriodCreate,
    PayrollGenerationRequest, PayrollGenerationResponse,
    PayrollApprovalRequest, PayrollApprovalResponse,
    PayrollFilters, PayrollReportRequest, PayrollReportResponse,
    PayslipRequest, PayslipData, PayrollStatistics
)
from services.payroll_service import PayrollCalculator
from services.report_service import PayrollReportService
from services.payslip_service import PayslipService
from api.deps import get_current_user
from db.models import User

router = APIRouter()

# ==================== PAYROLL PERIOD ENDPOINTS ====================

@router.post("/periods", response_model=PayrollPeriodResponse)
def create_payroll_period(
    period_data: PayrollPeriodCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new payroll period"""
    
    # Check if period already exists
    existing = db.query(PayrollPeriod).filter(
        PayrollPeriod.month == period_data.month,
        PayrollPeriod.year == period_data.year
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Payroll period already exists")
    
    new_period = PayrollPeriod(**period_data.dict())
    db.add(new_period)
    db.commit()
    db.refresh(new_period)
    
    return new_period

@router.get("/periods", response_model=List[PayrollPeriodResponse])
def get_payroll_periods(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all payroll periods"""
    
    periods = db.query(PayrollPeriod).offset(skip).limit(limit).all()
    return periods

@router.get("/periods/{period_id}", response_model=PayrollPeriodResponse)
def get_payroll_period(
    period_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific payroll period"""
    
    period = db.query(PayrollPeriod).filter(PayrollPeriod.id == period_id).first()
    if not period:
        raise HTTPException(status_code=404, detail="Payroll period not found")
    
    return period

# ==================== PAYROLL ENDPOINTS ====================

@router.get("/", response_model=List[PayrollResponse])
def get_payrolls(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2020, le=2100),
    period_id: Optional[int] = None,
    worker_id: Optional[int] = None,
    status: Optional[PayrollStatus] = None,
    is_paid: Optional[bool] = None,
    employee_name: Optional[str] = None,
    employee_id: Optional[str] = None,
    project: Optional[str] = None,
    branch: Optional[str] = None,
    department: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get payroll records with advanced filtering"""
    
    query = db.query(Payroll).join(Worker)
    
    # Apply filters
    if month:
        query = query.join(PayrollPeriod).filter(PayrollPeriod.month == month)
    if year:
        query = query.join(PayrollPeriod).filter(PayrollPeriod.year == year)
    if period_id:
        query = query.filter(Payroll.period_id == period_id)
    if worker_id:
        query = query.filter(Payroll.worker_id == worker_id)
    if status:
        query = query.filter(Payroll.status == status)
    if is_paid is not None:
        query = query.filter(Payroll.is_paid == is_paid)
    if employee_name:
        query = query.filter(Worker.name.contains(employee_name))
    if employee_id:
        query = query.filter(Worker.employee_id == employee_id)
    if project:
        query = query.filter(Worker.profession.contains(project))
    if branch:
        query = query.filter(Worker.branch == branch)
    if department:
        query = query.filter(Worker.department == department)
    
    payrolls = query.offset(skip).limit(limit).all()
    return payrolls

@router.get("/{payroll_id}", response_model=PayrollResponse)
def get_payroll(
    payroll_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific payroll record"""
    
    payroll = db.query(Payroll).filter(Payroll.id == payroll_id).first()
    if not payroll:
        raise HTTPException(status_code=404, detail="Payroll record not found")
    
    return payroll

@router.post("/", response_model=PayrollResponse)
def create_payroll(
    payroll_data: PayrollCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new payroll record"""
    
    # Check if worker exists
    worker = db.query(Worker).filter(Worker.id == payroll_data.worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    
    # Check if period exists
    period = db.query(PayrollPeriod).filter(PayrollPeriod.id == payroll_data.period_id).first()
    if not period:
        raise HTTPException(status_code=404, detail="Payroll period not found")
    
    # Check if payroll already exists for this worker and period
    existing = db.query(Payroll).filter(
        Payroll.worker_id == payroll_data.worker_id,
        Payroll.period_id == payroll_data.period_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Payroll already exists for this worker and period")
    
    # Calculate payroll using service
    calculator = PayrollCalculator(db)
    payroll = calculator.calculate_payroll(payroll_data)
    
    # Apply automation rules
    calculator.apply_automation_rules(payroll, worker, period)
    
    # Save to database
    db.add(payroll)
    db.commit()
    db.refresh(payroll)
    
    return payroll

@router.put("/{payroll_id}", response_model=PayrollResponse)
def update_payroll(
    payroll_id: int,
    payroll_data: PayrollUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a payroll record"""
    
    payroll = db.query(Payroll).filter(Payroll.id == payroll_id).first()
    if not payroll:
        raise HTTPException(status_code=404, detail="Payroll record not found")
    
    if payroll.status not in [PayrollStatus.DRAFT, PayrollStatus.CALCULATED]:
        raise HTTPException(status_code=400, detail="Cannot update payroll in current status")
    
    # Update fields
    update_data = payroll_data.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        if hasattr(payroll, field):
            setattr(payroll, field, value)
    
    # Recalculate payroll if needed
    if any(field in update_data for field in ['salary_components', 'overtime_components', 'deduction_components']):
        calculator = PayrollCalculator(db)
        calculator._calculate_final_amounts(payroll)
    
    payroll.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(payroll)
    
    return payroll

@router.delete("/{payroll_id}")
def delete_payroll(
    payroll_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a payroll record"""
    
    payroll = db.query(Payroll).filter(Payroll.id == payroll_id).first()
    if not payroll:
        raise HTTPException(status_code=404, detail="Payroll record not found")
    
    if payroll.status not in [PayrollStatus.DRAFT, PayrollStatus.CALCULATED]:
        raise HTTPException(status_code=400, detail="Cannot delete payroll in current status")
    
    db.delete(payroll)
    db.commit()
    
    return {"message": "Payroll record deleted successfully"}

# ==================== PAYROLL PROCESSING ENDPOINTS ====================

@router.post("/generate", response_model=PayrollGenerationResponse)
def generate_payroll(
    generation_request: PayrollGenerationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate payroll for multiple workers"""
    
    # Check if period exists
    period = db.query(PayrollPeriod).filter(PayrollPeriod.id == generation_request.period_id).first()
    if not period:
        raise HTTPException(status_code=404, detail="Payroll period not found")
    
    # Use payroll calculator service
    calculator = PayrollCalculator(db)
    
    try:
        result = calculator.generate_bulk_payroll(
            period_id=generation_request.period_id,
            worker_ids=generation_request.worker_ids
        )
        
        # Update period status
        period.status = PayrollStatus.CALCULATED
        period.calculated_at = datetime.utcnow()
        db.commit()
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate payroll: {str(e)}")

@router.post("/calculate/{payroll_id}", response_model=PayrollResponse)
def calculate_payroll(
    payroll_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Recalculate a payroll record"""
    
    payroll = db.query(Payroll).filter(Payroll.id == payroll_id).first()
    if not payroll:
        raise HTTPException(status_code=404, detail="Payroll record not found")
    
    calculator = PayrollCalculator(db)
    calculator._calculate_final_amounts(payroll)
    
    payroll.status = PayrollStatus.CALCULATED
    payroll.calculated_by = current_user.id
    payroll.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(payroll)
    
    return payroll

@router.post("/approve", response_model=PayrollApprovalResponse)
def approve_payroll(
    approval_request: PayrollApprovalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Approve payroll records"""
    
    calculator = PayrollCalculator(db)
    
    if approval_request.approve_all:
        # Get all payrolls in CALCULATED status
        payrolls = db.query(Payroll).filter(Payroll.status == PayrollStatus.CALCULATED).all()
        payroll_ids = [p.id for p in payrolls]
    else:
        payroll_ids = approval_request.payroll_ids
    
    result = calculator.approve_payroll(payroll_ids, current_user.id)
    
    return result

@router.post("/lock/{payroll_id}")
def lock_payroll(
    payroll_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lock a payroll record (prevent further modifications)"""
    
    payroll = db.query(Payroll).filter(Payroll.id == payroll_id).first()
    if not payroll:
        raise HTTPException(status_code=404, detail="Payroll record not found")
    
    if payroll.status != PayrollStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Only approved payrolls can be locked")
    
    payroll.status = PayrollStatus.LOCKED
    db.commit()
    
    return {"message": "Payroll locked successfully"}

@router.post("/{payroll_id}/pay")
def mark_as_paid(
    payroll_id: int,
    payment_method: str = "Bank Transfer",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark payroll as paid"""
    
    calculator = PayrollCalculator(db)
    try:
        calculator.confirm_payment(payroll_id, payment_method)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    return {"message": "Payroll marked as paid successfully"}

# ==================== REPORTS AND STATISTICS ====================

@router.get("/statistics")
def get_payroll_statistics(
    period_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get payroll statistics"""
    
    calculator = PayrollCalculator(db)
    stats = calculator.get_payroll_statistics(period_id)
    
    return stats

@router.post("/reports", response_model=PayrollReportResponse)
def generate_payroll_report(
    report_request: PayrollReportRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate payroll report"""
    
    report_service = PayrollReportService(db)
    
    try:
        report = report_service.generate_report(
            report_type=report_request.report_type,
            filters=report_request.filters,
            format=report_request.format,
            generated_by=current_user.id
        )
        
        return report
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")

@router.get("/reports")
def get_payroll_reports(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get payroll reports"""
    
    from db.payroll_models import PayrollReport
    
    reports = db.query(PayrollReport).offset(skip).limit(limit).all()
    return reports

# ==================== PAYSLIP ENDPOINTS ====================

@router.post("/payslip")
def generate_payslip(
    payslip_request: PayslipRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate employee payslip"""
    
    payslip_service = PayslipService(db)
    
    try:
        payslip_data = payslip_service.generate_payslip(
            payroll_id=payslip_request.payroll_id,
            include_company_logo=payslip_request.include_company_logo,
            format=payslip_request.format
        )
        
        return payslip_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate payslip: {str(e)}")

# ==================== ATTENDANCE INTEGRATION ====================

@router.post("/sync-attendance/{period_id}")
def sync_attendance_data(
    period_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Sync attendance data for payroll period"""
    
    period = db.query(PayrollPeriod).filter(PayrollPeriod.id == period_id).first()
    if not period:
        raise HTTPException(status_code=404, detail="Payroll period not found")
    
    calculator = PayrollCalculator(db)
    
    # Get all payrolls for this period
    payrolls = db.query(Payroll).filter(Payroll.period_id == period_id).all()
    
    updated_count = 0
    
    for payroll in payrolls:
        # Sync attendance data
        attendance_data = calculator._get_attendance_data(payroll.worker_id, period)
        
        # Update payroll with attendance data
        payroll.working_days = attendance_data.working_days
        payroll.present_days = attendance_data.present_days
        payroll.absent_days = attendance_data.absent_days
        payroll.overtime_hours = attendance_data.overtime_hours
        
        # Recalculate absence deduction
        if payroll.absent_days > 0:
            daily_rate = payroll.basic_salary / Decimal('30')
            payroll.absence_deduction = daily_rate * Decimal(str(payroll.absent_days))
        
        updated_count += 1
    
    db.commit()
    
    return {
        "message": f"Updated {updated_count} payroll records with attendance data",
        "updated_count": updated_count
    }