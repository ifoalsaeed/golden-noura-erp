from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, timedelta
from db.database import get_db
from db.models import Invoice, InvoiceStatus, Contract, Client, JournalHeader
from schemas.invoice import InvoiceCreate, InvoiceResponse, InvoiceUpdate
from services.accounting_service import AccountingService
from api.deps import get_current_user

router = APIRouter()

@router.post("/", response_model=InvoiceResponse)
def create_invoice(
    invoice_in: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new invoice and journal entry"""
    
    # Check if client exists
    client = db.query(Client).filter(Client.id == invoice_in.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Generate Invoice Number (Simple Auto-increment logic)
    count = db.query(Invoice).count()
    invoice_number = f"INV-{date.today().year}-{count + 1:04d}"
    
    new_invoice = Invoice(
        **invoice_in.dict(),
        invoice_number=invoice_number,
        status=InvoiceStatus.ISSUED # Assume issued immediately for simplicity
    )
    db.add(new_invoice)
    db.commit()
    db.refresh(new_invoice)
    
    # Create Accounting Entry (Revenue Recognition)
    accounting_service = AccountingService(db)
    header = JournalHeader(
        date=new_invoice.issue_date,
        description=f"Invoice Issued - {invoice_number}",
        source_type="Invoice",
        source_id=new_invoice.id
    )
    db.add(header)
    db.commit()
    db.refresh(header)
    
    entries = [
        # Debit Accounts Receivable
        {
            "account_code": "1100",
            "debit": float(new_invoice.total_amount),
            "credit": 0
        },
        # Credit Revenue
        {
            "account_code": "4010", # Manpower Rental Revenue
            "debit": 0,
            "credit": float(new_invoice.amount)
        }
    ]
    
    # Credit VAT Payable if applicable
    if new_invoice.tax_amount > 0:
        entries.append({
            "account_code": "2120", # VAT Payable
            "debit": 0,
            "credit": float(new_invoice.tax_amount)
        })
        
    accounting_service.create_journal_entry(
        date=new_invoice.issue_date,
        description=f"Invoice Issued - {new_invoice.invoice_number} - {client.company_name}",
        entries=entries,
        header_id=header.id
    )
    
    return new_invoice

@router.post("/generate-bulk", response_model=List[InvoiceResponse])
def generate_monthly_invoices(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Generate invoices for all active contracts for the current month"""
    
    active_contracts = db.query(Contract).filter(Contract.status == "ACTIVE").all()
    generated_invoices = []
    
    for contract in active_contracts:
        # Check if invoice already generated for this month (simplified check)
        # In a real app, we'd check invoice date vs current month
        # skipping detailed check for MVP
        
        amount = contract.monthly_rental_price
        tax_rate = 0.15 # 15% VAT
        tax_amount = amount * tax_rate
        total_amount = amount + tax_amount
        
        invoice_in = InvoiceCreate(
            client_id=contract.client_id,
            contract_id=contract.id,
            issue_date=date.today(),
            due_date=date.today() + timedelta(days=30),
            amount=amount,
            tax_amount=tax_amount,
            total_amount=total_amount,
            notes=f"Monthly Rental - {contract.contract_number}"
        )
        
        # Call create_invoice logic (refactor if needed, here just calling logically)
        # But we can't call the route handler directly easily. 
        # So I'll duplicate the logic or extract it to a service. 
        # For speed, I'll extract to a helper function within this file later or just do it inline.
        
        # Inline creation
        count = db.query(Invoice).count() + len(generated_invoices)
        invoice_number = f"INV-{date.today().year}-{count + 1:04d}"
        
        new_invoice = Invoice(
            **invoice_in.dict(),
            invoice_number=invoice_number,
            status=InvoiceStatus.ISSUED
        )
        db.add(new_invoice)
        generated_invoices.append(new_invoice)
        
        # Add to session but commit later? No, need ID for Journal Entry.
        db.commit()
        db.refresh(new_invoice)
        
        # Journal Entry + Header
        accounting_service = AccountingService(db)
        header = JournalHeader(
            date=date.today(),
            description=f"Invoice Generated - {invoice_number}",
            source_type="Invoice",
            source_id=new_invoice.id
        )
        db.add(header)
        db.commit()
        db.refresh(header)
        entries = [
            {"account_code": "1100", "debit": float(total_amount), "credit": 0},
            {"account_code": "4010", "debit": 0, "credit": float(amount)},
            {"account_code": "2120", "debit": 0, "credit": float(tax_amount)}
        ]
        accounting_service.create_journal_entry(
            date=date.today(),
            description=f"Invoice Generated - {invoice_number}",
            entries=entries,
            header_id=header.id
        )
        
    return generated_invoices

@router.post("/{invoice_id}/pay", response_model=InvoiceResponse)
def pay_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Mark invoice as paid and create receipt journal entry"""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    if invoice.status == InvoiceStatus.PAID:
        raise HTTPException(status_code=400, detail="Invoice already paid")
        
    invoice.status = InvoiceStatus.PAID
    db.commit()
    db.refresh(invoice)
    
    # Create Accounting Entry (Receipt) + Header
    accounting_service = AccountingService(db)
    header = JournalHeader(
        date=date.today(),
        description=f"Payment Received - {invoice.invoice_number}",
        source_type="InvoicePayment",
        source_id=invoice.id
    )
    db.add(header)
    db.commit()
    db.refresh(header)
    
    entries = [
        # Debit Bank
        {
            "account_code": "1020", # Bank Al-Rajhi
            "debit": float(invoice.total_amount),
            "credit": 0
        },
        # Credit Accounts Receivable
        {
            "account_code": "1100",
            "debit": 0,
            "credit": float(invoice.total_amount)
        }
    ]
    
    accounting_service.create_journal_entry(
        date=date.today(),
        description=f"Payment Received - {invoice.invoice_number}",
        entries=entries,
        header_id=header.id
    )
    
    return invoice

@router.get("/", response_model=List[InvoiceResponse])
def get_invoices(
    skip: int = 0,
    limit: int = 100,
    status: Optional[InvoiceStatus] = None,
    client_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(Invoice)
    if status:
        query = query.filter(Invoice.status == status)
    if client_id:
        query = query.filter(Invoice.client_id == client_id)
        
    return query.offset(skip).limit(limit).all()
