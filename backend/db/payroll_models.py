from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Enum, Date, Text, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .database import Base
from .models import (
    Worker, WorkerStatus, Payroll, Contract, 
    PayrollStatus, AllowanceType, DeductionType, ExpenseAllocationType
)

# class PayrollStatus(str, enum.Enum):
#     DRAFT = "DRAFT"
#     CALCULATED = "CALCULATED"
#     APPROVED = "APPROVED"
#     LOCKED = "LOCKED"
#     PAID = "PAID"
#
# class AllowanceType(str, enum.Enum):
#     HOUSING = "HOUSING"
#     TRANSPORTATION = "TRANSPORTATION"
#     FOOD = "FOOD"
#     MOBILE = "MOBILE"
#     MEDICAL = "MEDICAL"
#     OTHER = "OTHER"
#
# class DeductionType(str, enum.Enum):
#     ABSENCE = "ABSENCE"
#     LATE = "LATE"
#     LOAN = "LOAN"
#     ADVANCE = "ADVANCE"
#     PENALTY = "PENALTY"
#     GOSI = "GOSI"
#     TAX = "TAX"
#     OTHER = "OTHER"
#
# class ExpenseAllocationType(str, enum.Enum):
#     VISA = "VISA"
#     ACCOMMODATION = "ACCOMMODATION"
#     TRANSPORTATION = "TRANSPORTATION"
#     MEDICAL_INSURANCE = "MEDICAL_INSURANCE"
#     UNIFORM = "UNIFORM"
#     TRAINING = "TRAINING"
#     OTHER = "OTHER"

# Enhanced Worker model with payroll-specific fields
# class Worker(Base):
#     __tablename__ = "workers"
#     
#     id = Column(Integer, primary_key=True, index=True)
#     name = Column(String, index=True)
#     nationality = Column(String)
#     passport_number = Column(String, unique=True, index=True)
#     iqama_number = Column(String, unique=True, index=True)
#     profession = Column(String)
#     salary = Column(Float)  # Basic salary
#     housing_cost = Column(Float, default=0.0)
#     transport_cost = Column(Float, default=0.0)
#     visa_status = Column(String)
#     medical_status = Column(String)
#     contract_status = Column(String)
#     status = Column(Enum(WorkerStatus), default=WorkerStatus.ACTIVE)
#     photo_url = Column(String, nullable=True)
#     created_at = Column(DateTime, default=datetime.utcnow)
#     
#     # Payroll-specific fields
#     employee_id = Column(String, unique=True, index=True)
#     job_title = Column(String)
#     branch = Column(String)
#     department = Column(String)
#     contract_type = Column(String)  # FULL_TIME, PART_TIME, CONTRACT
#     employment_status = Column(String)  # ACTIVE, TERMINATED, RESIGNED
#     hire_date = Column(Date)
#     termination_date = Column(Date, nullable=True)
#     bank_name = Column(String)
#     bank_account_number = Column(String)
#     iban = Column(String)
#     
#     # Relationships
#     contracts = relationship("Contract", back_populates="worker")
#     payrolls = relationship("Payroll", back_populates="worker")
#     allowances = relationship("Allowance", back_populates="worker")
#     deductions = relationship("Deduction", back_populates="worker")
#     expense_allocations = relationship("ExpenseAllocation", back_populates="worker")
#     attendance_records = relationship("Attendance", back_populates="worker")

# Payroll Period - represents a payroll month/year
class PayrollPeriod(Base):
    __tablename__ = "payroll_periods"
    
    id = Column(Integer, primary_key=True, index=True)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    status = Column(Enum(PayrollStatus), default=PayrollStatus.DRAFT)
    total_employees = Column(Integer, default=0)
    total_payroll_cost = Column(Numeric(15, 2), default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    calculated_at = Column(DateTime, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    locked_at = Column(DateTime, nullable=True)
    
    # Relationships
    payrolls = relationship("Payroll", back_populates="period")

# Enhanced Payroll model
# class Payroll(Base):
#     __tablename__ = "payrolls"
#     
#     id = Column(Integer, primary_key=True, index=True)
#     worker_id = Column(Integer, ForeignKey("workers.id"))
#     period_id = Column(Integer, ForeignKey("payroll_periods.id"))
#     
#     # Salary components
#     basic_salary = Column(Numeric(15, 2), default=0.0)
#     housing_allowance = Column(Numeric(15, 2), default=0.0)
#     transportation_allowance = Column(Numeric(15, 2), default=0.0)
#     food_allowance = Column(Numeric(15, 2), default=0.0)
#     other_allowances = Column(Numeric(15, 2), default=0.0)
#     
#     # Overtime
#     overtime_hours = Column(Numeric(8, 2), default=0.0)
#     overtime_rate = Column(Numeric(8, 2), default=0.0)
#     overtime_amount = Column(Numeric(15, 2), default=0.0)
#     
#     # Deductions
#     absence_deduction = Column(Numeric(15, 2), default=0.0)
#     late_deduction = Column(Numeric(15, 2), default=0.0)
#     loan_deduction = Column(Numeric(15, 2), default=0.0)
#     advance_deduction = Column(Numeric(15, 2), default=0.0)
#     penalty_deduction = Column(Numeric(15, 2), default=0.0)
#     gosi_deduction = Column(Numeric(15, 2), default=0.0)
#     other_deductions = Column(Numeric(15, 2), default=0.0)
#     
#     # Calculated fields
#     total_allowances = Column(Numeric(15, 2), default=0.0)
#     gross_salary = Column(Numeric(15, 2), default=0.0)
#     total_deductions = Column(Numeric(15, 2), default=0.0)
#     net_salary = Column(Numeric(15, 2), default=0.0)
#     
#     # Company costs and profit
#     company_revenue = Column(Numeric(15, 2), default=0.0)
#     company_profit = Column(Numeric(15, 2), default=0.0)
#     
#     # Status and tracking
#     status = Column(Enum(PayrollStatus), default=PayrollStatus.DRAFT)
#     is_paid = Column(Boolean, default=False)
#     paid_at = Column(DateTime, nullable=True)
#     
#     # Attendance integration
#     working_days = Column(Integer, default=30)
#     present_days = Column(Integer, default=30)
#     absent_days = Column(Integer, default=0)
#     
#     # Metadata
#     created_at = Column(DateTime, default=datetime.utcnow)
#     updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
#     calculated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
#     approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
#     
#     # Relationships
#     worker = relationship("Worker", back_populates="payrolls")
#     period = relationship("PayrollPeriod", back_populates="payrolls")
#     allowances = relationship("Allowance", back_populates="payroll")
#     deductions = relationship("Deduction", back_populates="payroll")
#     expense_allocations = relationship("ExpenseAllocation", back_populates="payroll")

# Allowance model for detailed allowance tracking
class Allowance(Base):
    __tablename__ = "allowances"
    
    id = Column(Integer, primary_key=True, index=True)
    payroll_id = Column(Integer, ForeignKey("payrolls.id"))
    worker_id = Column(Integer, ForeignKey("workers.id"))
    allowance_type = Column(Enum(AllowanceType))
    amount = Column(Numeric(15, 2), default=0.0)
    description = Column(Text, nullable=True)
    is_taxable = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    payroll = relationship("Payroll", back_populates="allowances")
    worker = relationship("Worker", back_populates="allowances")

# Deduction model for detailed deduction tracking
class Deduction(Base):
    __tablename__ = "deductions"
    
    id = Column(Integer, primary_key=True, index=True)
    payroll_id = Column(Integer, ForeignKey("payrolls.id"))
    worker_id = Column(Integer, ForeignKey("workers.id"))
    deduction_type = Column(Enum(DeductionType))
    amount = Column(Numeric(15, 2), default=0.0)
    description = Column(Text, nullable=True)
    reference_number = Column(String, nullable=True)  # For loan references, etc.
    created_at = Column(DateTime, default=datetime.utcnow)
    
    payroll = relationship("Payroll", back_populates="deductions")
    worker = relationship("Worker", back_populates="deductions")

# Expense Allocation for company expenses allocated to employees
class ExpenseAllocation(Base):
    __tablename__ = "expense_allocations"
    
    id = Column(Integer, primary_key=True, index=True)
    payroll_id = Column(Integer, ForeignKey("payrolls.id"))
    worker_id = Column(Integer, ForeignKey("workers.id"))
    expense_type = Column(Enum(ExpenseAllocationType))
    amount = Column(Numeric(15, 2), default=0.0)
    allocation_method = Column(String)  # PER_EMPLOYEE, PER_CONTRACT, etc.
    description = Column(Text, nullable=True)
    expense_date = Column(Date)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    payroll = relationship("Payroll", back_populates="expense_allocations")
    worker = relationship("Worker", back_populates="expense_allocations")

# Attendance model for payroll integration
class Attendance(Base):
    __tablename__ = "attendance"
    
    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"))
    date = Column(Date, nullable=False)
    check_in = Column(DateTime, nullable=True)
    check_out = Column(DateTime, nullable=True)
    working_hours = Column(Numeric(5, 2), default=0.0)
    overtime_hours = Column(Numeric(5, 2), default=0.0)
    status = Column(String)  # PRESENT, ABSENT, LATE, HALF_DAY
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    worker = relationship("Worker", back_populates="attendance_records")

# Loan model for employee loans
class Loan(Base):
    __tablename__ = "loans"
    
    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"))
    loan_amount = Column(Numeric(15, 2), default=0.0)
    remaining_amount = Column(Numeric(15, 2), default=0.0)
    monthly_installment = Column(Numeric(15, 2), default=0.0)
    total_installments = Column(Integer, default=0)
    paid_installments = Column(Integer, default=0)
    start_date = Column(Date)
    end_date = Column(Date)
    status = Column(String, default="ACTIVE")  # ACTIVE, COMPLETED, CANCELLED
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    worker = relationship("Worker")

# Salary Advance model
class SalaryAdvance(Base):
    __tablename__ = "salary_advances"
    
    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"))
    advance_amount = Column(Numeric(15, 2), default=0.0)
    remaining_amount = Column(Numeric(15, 2), default=0.0)
    month = Column(Integer)
    year = Column(Integer)
    status = Column(String, default="PENDING")  # PENDING, DEDUCTED, CANCELLED
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    worker = relationship("Worker")

# Payroll Report model
class PayrollReport(Base):
    __tablename__ = "payroll_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    period_id = Column(Integer, ForeignKey("payroll_periods.id"))
    report_type = Column(String)  # MONTHLY, EMPLOYEE, CLIENT, BRANCH, OVERTIME, DEDUCTIONS
    report_name = Column(String)
    file_path = Column(String, nullable=True)
    filters = Column(Text, nullable=True)  # JSON string of filters used
    total_employees = Column(Integer, default=0)
    total_payroll_cost = Column(Numeric(15, 2), default=0.0)
    generated_by = Column(Integer, ForeignKey("users.id"))
    generated_at = Column(DateTime, default=datetime.utcnow)
    
    period = relationship("PayrollPeriod")