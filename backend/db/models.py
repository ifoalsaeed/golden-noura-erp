from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Enum, Date, Text, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .database import Base
from sqlalchemy.dialects.sqlite import JSON as SQLITE_JSON

class RoleEnum(str, enum.Enum):
    ADMIN = "ADMIN"
    DATA_ENTRY = "DATA_ENTRY"
    EDITOR = "EDITOR"
    REPORT_VIEWER = "REPORT_VIEWER"

class PayrollStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    CALCULATED = "CALCULATED"
    APPROVED = "APPROVED"
    LOCKED = "LOCKED"
    PAID = "PAID"

class AllowanceType(str, enum.Enum):
    HOUSING = "HOUSING"
    TRANSPORTATION = "TRANSPORTATION"
    FOOD = "FOOD"
    MOBILE = "MOBILE"
    MEDICAL = "MEDICAL"
    OTHER = "OTHER"

class DeductionType(str, enum.Enum):
    ABSENCE = "ABSENCE"
    LATE = "LATE"
    LOAN = "LOAN"
    ADVANCE = "ADVANCE"
    PENALTY = "PENALTY"
    GOSI = "GOSI"
    TAX = "TAX"
    OTHER = "OTHER"

class ExpenseAllocationType(str, enum.Enum):
    VISA = "VISA"
    ACCOMMODATION = "ACCOMMODATION"
    TRANSPORTATION = "TRANSPORTATION"
    MEDICAL_INSURANCE = "MEDICAL_INSURANCE"
    UNIFORM = "UNIFORM"
    TRAINING = "TRAINING"
    OTHER = "OTHER"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String, nullable=True)
    role = Column(Enum(RoleEnum), default=RoleEnum.DATA_ENTRY)
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime, nullable=True)
    avatar_url = Column(String, nullable=True)

class WorkerStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    ON_LEAVE = "ON_LEAVE"
    CONTRACT_FINISHED = "CONTRACT_FINISHED"
    TRANSFERRED = "TRANSFERRED"

class Worker(Base):
    __tablename__ = "workers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    nationality = Column(String)
    passport_number = Column(String, unique=True, index=True)
    iqama_number = Column(String, unique=True, index=True)
    profession = Column(String)
    salary = Column(Float)  # Basic salary
    housing_cost = Column(Float, default=0.0)
    transport_cost = Column(Float, default=0.0)
    visa_status = Column(String)
    medical_status = Column(String)
    contract_status = Column(String)
    status = Column(Enum(WorkerStatus), default=WorkerStatus.ACTIVE)
    photo_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Payroll-specific fields
    employee_id = Column(String, unique=True, index=True)
    job_title = Column(String)
    branch = Column(String)
    department = Column(String)
    contract_type = Column(String)  # FULL_TIME, PART_TIME, CONTRACT
    employment_status = Column(String)  # ACTIVE, TERMINATED, RESIGNED
    hire_date = Column(Date)
    termination_date = Column(Date, nullable=True)
    bank_name = Column(String)
    bank_account_number = Column(String)
    iban = Column(String)
    
    # Relationships
    contracts = relationship("Contract", back_populates="worker")
    payrolls = relationship("Payroll", back_populates="worker")
    expenses = relationship("Expense", back_populates="worker")

class Client(Base):
    __tablename__ = "clients"
    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, index=True)
    contact_person = Column(String)
    phone = Column(String)
    email = Column(String)
    city = Column(String)
    address = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    contracts = relationship("Contract", back_populates="client")
    invoices = relationship("Invoice", back_populates="client")
    # expenses = relationship("Expense", back_populates="client")

class Contract(Base):
    __tablename__ = "contracts"
    
    id = Column(Integer, primary_key=True, index=True)
    contract_number = Column(String, unique=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"))
    worker_id = Column(Integer, ForeignKey("workers.id"))
    monthly_rental_price = Column(Float)
    start_date = Column(Date)
    end_date = Column(Date)
    duration_months = Column(Integer)
    billing_cycle = Column(String)
    status = Column(String, default="ACTIVE")
    
    # Enhanced fields
    contract_file_url = Column(String, nullable=True)
    terms_and_conditions = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = relationship("Client", back_populates="contracts")
    worker = relationship("Worker", back_populates="contracts")
    invoices = relationship("Invoice", back_populates="contract")
    # expenses = relationship("Expense", back_populates="contract")

class InvoiceStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ISSUED = "ISSUED"
    PAID = "PAID"
    CANCELLED = "CANCELLED"
    OVERDUE = "OVERDUE"

class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, unique=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"))
    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=True) # Optional link to contract
    
    issue_date = Column(Date, default=datetime.utcnow)
    due_date = Column(Date)
    
    amount = Column(Numeric(15, 2), default=0.0)
    tax_amount = Column(Numeric(15, 2), default=0.0)
    total_amount = Column(Numeric(15, 2), default=0.0)
    
    status = Column(Enum(InvoiceStatus), default=InvoiceStatus.DRAFT)
    
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    client = relationship("Client", back_populates="invoices")
    contract = relationship("Contract", back_populates="invoices")


class Payroll(Base):
    __tablename__ = "payrolls"
    
    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"))
    month = Column(Integer)
    year = Column(Integer)
    base_salary = Column(Float)
    overtime = Column(Float, default=0.0)
    bonuses = Column(Float, default=0.0)
    allowances = Column(Float, default=0.0)
    deductions = Column(Float, default=0.0)
    loans = Column(Float, default=0.0)
    salary_advances = Column(Float, default=0.0)
    net_salary = Column(Float)
    company_profit = Column(Float)
    is_paid = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Enhanced fields
    status = Column(Enum(PayrollStatus), default=PayrollStatus.DRAFT)
    payment_date = Column(Date, nullable=True)
    payment_method = Column(String, nullable=True)
    transaction_reference = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    worker = relationship("Worker", back_populates="payrolls")
    # items = relationship("PayrollItem", back_populates="payroll")

class ExpenseStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    PAID = "PAID"

class PaymentMethod(str, enum.Enum):
    CASH = "CASH"
    BANK_TRANSFER = "BANK_TRANSFER"
    CHECK = "CHECK"
    CREDIT_CARD = "CREDIT_CARD"
    OTHER = "OTHER"

class ExpenseCategory(str, enum.Enum):
    OPERATIONAL = "OPERATIONAL" # تشغيلية
    PAYROLL = "PAYROLL" # رواتب
    MARKETING = "MARKETING" # تسويق
    MAINTENANCE = "MAINTENANCE" # صيانة
    GOVERNMENT_FEES = "GOVERNMENT_FEES" # رسوم حكومية
    OFFICE_SUPPLIES = "OFFICE_SUPPLIES" # مستلزمات مكتبية
    RENT = "RENT" # إيجار
    UTILITIES = "UTILITIES" # مرافق (كهرباء/ماء)
    TRAVEL = "TRAVEL" # سفر
    OTHER = "OTHER" # أخرى

class Expense(Base):
    __tablename__ = "expenses"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True) # Short title
    description = Column(Text, nullable=True)
    amount = Column(Numeric(15, 2), nullable=False)
    date = Column(Date, default=datetime.utcnow)
    
    # Classification
    category = Column(Enum(ExpenseCategory), default=ExpenseCategory.OTHER)
    subcategory = Column(String, nullable=True) # Optional text for more detail
    
    # Payment Details
    payment_method = Column(Enum(PaymentMethod), default=PaymentMethod.CASH)
    reference_number = Column(String, nullable=True) # Check number, Transaction ID
    is_paid = Column(Boolean, default=False)
    paid_at = Column(DateTime, nullable=True)
    
    # Links (Polymorphic-like or explicit FKs)
    # Linking to specific entities allows "Accurate Linking" (الربط الدقيق)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True)
    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=True)
    
    # Metadata & Workflow
    status = Column(Enum(ExpenseStatus), default=ExpenseStatus.PENDING)
    receipt_url = Column(String, nullable=True) # File attachment
    
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Tax info
    tax_amount = Column(Numeric(15, 2), default=0.0)
    amount_before_tax = Column(Numeric(15, 2), default=0.0)
    vendor_name = Column(String, nullable=True)
    vendor_tax_number = Column(String, nullable=True)

    # Relationships
    worker = relationship("Worker", back_populates="expenses")
    # client = relationship("Client", back_populates="expenses")
    # contract = relationship("Contract", back_populates="expenses")
    created_by_user = relationship("User", foreign_keys=[created_by])
    approved_by_user = relationship("User", foreign_keys=[approved_by])

class Account(Base):
    __tablename__ = "accounts"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    name = Column(String)
    account_type = Column(String)
    balance = Column(Float, default=0.0)

class JournalHeader(Base):
    __tablename__ = "journal_headers"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date)
    description = Column(String)
    source_type = Column(String, nullable=True)
    source_id = Column(Integer, nullable=True)
    reference = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    lines = relationship("JournalEntry", back_populates="header")

class JournalEntry(Base):
    __tablename__ = "journal_entries"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date)
    description = Column(String)
    account_id = Column(Integer, ForeignKey("accounts.id"))
    debit = Column(Float, default=0.0)
    credit = Column(Float, default=0.0)
    header_id = Column(Integer, ForeignKey("journal_headers.id"), nullable=True)
    line_number = Column(Integer, nullable=True)
    header = relationship("JournalHeader", back_populates="lines")

class ApprovalAction(str, enum.Enum):
    UPDATE = "UPDATE"
    DELETE = "DELETE"

class ApprovalStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class ApprovalRequest(Base):
    __tablename__ = "approval_requests"
    id = Column(Integer, primary_key=True, index=True)
    target_table = Column(String, index=True)
    target_id = Column(Integer, index=True)
    action = Column(Enum(ApprovalAction))
    payload = Column(Text, nullable=True)  # store JSON string of changes
    status = Column(Enum(ApprovalStatus), default=ApprovalStatus.PENDING, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    decision_note = Column(Text, nullable=True)
