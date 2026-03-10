from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Enum, Date
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .database import Base

class RoleEnum(str, enum.Enum):
    ADMIN = "ADMIN"
    DATA_ENTRY = "DATA_ENTRY"
    EDITOR = "EDITOR"
    REPORT_VIEWER = "REPORT_VIEWER"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(Enum(RoleEnum), default=RoleEnum.DATA_ENTRY)
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime, nullable=True)

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
    salary = Column(Float)
    housing_cost = Column(Float, default=0.0)
    transport_cost = Column(Float, default=0.0)
    visa_status = Column(String)
    medical_status = Column(String)
    contract_status = Column(String)
    status = Column(Enum(WorkerStatus), default=WorkerStatus.ACTIVE)
    photo_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    contracts = relationship("Contract", back_populates="worker")
    payrolls = relationship("Payroll", back_populates="worker")

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

    client = relationship("Client", back_populates="contracts")
    worker = relationship("Worker", back_populates="contracts")

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

    worker = relationship("Worker", back_populates="payrolls")

class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String)
    amount = Column(Float)
    description = Column(String)
    date = Column(Date)
    receipt_url = Column(String, nullable=True)

class Account(Base):
    __tablename__ = "accounts"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    name = Column(String)
    account_type = Column(String)
    balance = Column(Float, default=0.0)

class JournalEntry(Base):
    __tablename__ = "journal_entries"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date)
    description = Column(String)
    account_id = Column(Integer, ForeignKey("accounts.id"))
    debit = Column(Float, default=0.0)
    credit = Column(Float, default=0.0)
