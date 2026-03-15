from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from decimal import Decimal
from enum import Enum

# Enums
class PayrollStatus(str, Enum):
    DRAFT = "DRAFT"
    CALCULATED = "CALCULATED"
    APPROVED = "APPROVED"
    LOCKED = "LOCKED"
    PAID = "PAID"

class AllowanceType(str, Enum):
    HOUSING = "HOUSING"
    TRANSPORTATION = "TRANSPORTATION"
    FOOD = "FOOD"
    MOBILE = "MOBILE"
    MEDICAL = "MEDICAL"
    OTHER = "OTHER"

class DeductionType(str, Enum):
    ABSENCE = "ABSENCE"
    LATE = "LATE"
    LOAN = "LOAN"
    ADVANCE = "ADVANCE"
    PENALTY = "PENALTY"
    GOSI = "GOSI"
    TAX = "TAX"
    OTHER = "OTHER"

class ExpenseAllocationType(str, Enum):
    VISA = "VISA"
    ACCOMMODATION = "ACCOMMODATION"
    TRANSPORTATION = "TRANSPORTATION"
    MEDICAL_INSURANCE = "MEDICAL_INSURANCE"
    UNIFORM = "UNIFORM"
    TRAINING = "TRAINING"
    OTHER = "OTHER"

# Base Schemas
class WorkerBase(BaseModel):
    id: int
    name: str
    employee_id: str
    nationality: str
    job_title: str
    profession: str
    branch: Optional[str] = None
    department: Optional[str] = None
    contract_type: str
    employment_status: str
    hire_date: Optional[date] = None
    
    class Config:
        from_attributes = True

class AllowanceBase(BaseModel):
    allowance_type: AllowanceType
    amount: Decimal = Field(..., ge=0, decimal_places=2)
    description: Optional[str] = None
    is_taxable: bool = True

class DeductionBase(BaseModel):
    deduction_type: DeductionType
    amount: Decimal = Field(..., ge=0, decimal_places=2)
    description: Optional[str] = None
    reference_number: Optional[str] = None

class ExpenseAllocationBase(BaseModel):
    expense_type: ExpenseAllocationType
    amount: Decimal = Field(..., ge=0, decimal_places=2)
    allocation_method: str = "PER_EMPLOYEE"
    description: Optional[str] = None
    expense_date: date

# Payroll Period Schemas
class PayrollPeriodBase(BaseModel):
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2020, le=2100)

class PayrollPeriodCreate(PayrollPeriodBase):
    pass

class PayrollPeriodResponse(PayrollPeriodBase):
    id: int
    status: PayrollStatus
    total_employees: int
    total_payroll_cost: Decimal
    created_at: datetime
    calculated_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    locked_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Payroll Schemas
class SalaryComponents(BaseModel):
    basic_salary: Decimal = Field(..., ge=0, decimal_places=2)
    housing_allowance: Decimal = Field(default=0, ge=0, decimal_places=2)
    transportation_allowance: Decimal = Field(default=0, ge=0, decimal_places=2)
    food_allowance: Decimal = Field(default=0, ge=0, decimal_places=2)
    other_allowances: Decimal = Field(default=0, ge=0, decimal_places=2)

class OvertimeComponents(BaseModel):
    overtime_hours: Decimal = Field(default=0, ge=0, decimal_places=2)
    overtime_rate: Decimal = Field(default=0, ge=0, decimal_places=2)
    overtime_amount: Decimal = Field(default=0, ge=0, decimal_places=2)

class DeductionComponents(BaseModel):
    absence_deduction: Decimal = Field(default=0, ge=0, decimal_places=2)
    late_deduction: Decimal = Field(default=0, ge=0, decimal_places=2)
    loan_deduction: Decimal = Field(default=0, ge=0, decimal_places=2)
    advance_deduction: Decimal = Field(default=0, ge=0, decimal_places=2)
    penalty_deduction: Decimal = Field(default=0, ge=0, decimal_places=2)
    gosi_deduction: Decimal = Field(default=0, ge=0, decimal_places=2)
    other_deductions: Decimal = Field(default=0, ge=0, decimal_places=2)

class AttendanceData(BaseModel):
    working_days: int = Field(default=30, ge=0, le=31)
    present_days: int = Field(default=30, ge=0, le=31)
    absent_days: int = Field(default=0, ge=0, le=31)
    overtime_hours: Decimal = Field(default=0, ge=0, decimal_places=2)

class PayrollCreate(BaseModel):
    worker_id: int
    period_id: int
    salary_components: SalaryComponents
    overtime_components: OvertimeComponents = Field(default_factory=OvertimeComponents)
    deduction_components: DeductionComponents = Field(default_factory=DeductionComponents)
    attendance_data: AttendanceData = Field(default_factory=AttendanceData)
    allowances: List[AllowanceBase] = Field(default_factory=list)
    deductions: List[DeductionBase] = Field(default_factory=list)
    expense_allocations: List[ExpenseAllocationBase] = Field(default_factory=list)

class PayrollUpdate(BaseModel):
    salary_components: Optional[SalaryComponents] = None
    overtime_components: Optional[OvertimeComponents] = None
    deduction_components: Optional[DeductionComponents] = None
    attendance_data: Optional[AttendanceData] = None
    allowances: Optional[List[AllowanceBase]] = None
    deductions: Optional[List[DeductionBase]] = None
    expense_allocations: Optional[List[ExpenseAllocationBase]] = None

class PayrollResponse(BaseModel):
    id: int
    worker_id: int
    period_id: int
    worker: WorkerBase
    
    # Salary components
    basic_salary: Decimal
    housing_allowance: Decimal
    transportation_allowance: Decimal
    food_allowance: Decimal
    other_allowances: Decimal
    total_allowances: Decimal
    
    # Overtime
    overtime_hours: Decimal
    overtime_rate: Decimal
    overtime_amount: Decimal
    
    # Deductions
    absence_deduction: Decimal
    late_deduction: Decimal
    loan_deduction: Decimal
    advance_deduction: Decimal
    penalty_deduction: Decimal
    gosi_deduction: Decimal
    other_deductions: Decimal
    total_deductions: Decimal
    
    # Calculated fields
    gross_salary: Decimal
    net_salary: Decimal
    
    # Company financials
    company_revenue: Decimal
    company_profit: Decimal
    
    # Status and tracking
    status: PayrollStatus
    is_paid: bool
    paid_at: Optional[datetime] = None
    
    # Attendance integration
    working_days: int
    present_days: int
    absent_days: int
    overtime_hours: Decimal
    
    # Detailed components
    allowances: List[AllowanceBase] = []
    deductions_detail: List[DeductionBase] = []
    expense_allocations: List[ExpenseAllocationBase] = []
    
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Payroll Generation Schemas
class PayrollGenerationRequest(BaseModel):
    period_id: int
    worker_ids: Optional[List[int]] = None  # If None, generate for all active workers
    include_overtime: bool = True
    include_deductions: bool = True
    include_expenses: bool = True

class PayrollGenerationResponse(BaseModel):
    success: bool
    message: str
    generated_count: int
    failed_count: int
    errors: List[str] = []

# Payroll Approval Schemas
class PayrollApprovalRequest(BaseModel):
    payroll_ids: List[int]
    approve_all: bool = False

class PayrollApprovalResponse(BaseModel):
    success: bool
    message: str
    approved_count: int
    failed_count: int
    errors: List[str] = []

# Filter Schemas
class PayrollFilters(BaseModel):
    month: Optional[int] = None
    year: Optional[int] = None
    period_id: Optional[int] = None
    worker_id: Optional[int] = None
    project: Optional[str] = None
    branch: Optional[str] = None
    department: Optional[str] = None
    client: Optional[str] = None
    status: Optional[PayrollStatus] = None
    is_paid: Optional[bool] = None
    employee_name: Optional[str] = None
    employee_id: Optional[str] = None

# Report Schemas
class PayrollReportRequest(BaseModel):
    report_type: str  # MONTHLY, EMPLOYEE, CLIENT, BRANCH, OVERTIME, DEDUCTIONS
    period_id: Optional[int] = None
    filters: PayrollFilters
    format: str = "PDF"  # PDF, EXCEL, CSV

class PayrollReportResponse(BaseModel):
    id: int
    report_type: str
    report_name: str
    file_path: Optional[str] = None
    filters: Dict[str, Any]
    total_employees: int
    total_payroll_cost: Decimal
    generated_by: int
    generated_at: datetime
    
    class Config:
        from_attributes = True

# Payslip Schemas
class PayslipRequest(BaseModel):
    payroll_id: int
    include_company_logo: bool = True
    format: str = "PDF"  # PDF, HTML

class PayslipData(BaseModel):
    company_name: str = "Golden Noura Manpower Supply"
    company_address: str = "Saudi Arabia"
    company_logo: Optional[str] = None
    
    employee_info: WorkerBase
    payroll_period: str
    
    # Salary breakdown
    basic_salary: Decimal
    allowances: List[AllowanceBase]
    total_allowances: Decimal
    gross_salary: Decimal
    
    # Deductions
    deductions: List[DeductionBase]
    total_deductions: Decimal
    
    # Net salary
    net_salary: Decimal
    
    # Additional info
    working_days: int
    present_days: int
    absent_days: int
    overtime_hours: Decimal
    
    generated_date: datetime

# Dashboard/Statistics Schemas
class PayrollStatistics(BaseModel):
    total_employees: int
    total_payroll_cost: Decimal
    average_salary: Decimal
    total_overtime: Decimal
    total_deductions: Decimal
    total_company_profit: Decimal
    
    # By status
    draft_count: int
    calculated_count: int
    approved_count: int
    locked_count: int
    paid_count: int
    
    # By category
    by_branch: Dict[str, Decimal]
    by_department: Dict[str, Decimal]
    by_project: Dict[str, Decimal]

# Automation Rules Schemas
class AutomationRule(BaseModel):
    rule_name: str
    rule_type: str  # OVERTIME, ABSENCE, ADVANCE, LOAN
    conditions: Dict[str, Any]
    actions: Dict[str, Any]
    is_active: bool = True