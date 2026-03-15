from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from db.database import get_db
from db.models import Account, JournalEntry, Account as AccountModel, JournalHeader
from datetime import date
from typing import List, Optional
from schemas.accounting import JournalCreate, AccountCreate, JournalHeaderUpdate, JournalLineCreate, JournalLineUpdate
from services.accounting_service import AccountingService
import io
import pandas as pd
from fastapi.responses import StreamingResponse
import datetime

router = APIRouter()

@router.get("/balance-sheet")
def get_balance_sheet(year: int = Query(default=date.today().year), db: Session = Depends(get_db)):
    """
    Generates a Balance Sheet for the specified year.
    Assets = Liabilities + Equity
    """
    # Start and end date for the year
    start_date = date(year, 1, 1)
    end_date = date(year, 12, 31)

    # 1. Assets
    assets = db.query(AccountModel).filter(AccountModel.account_type == "ASSET").all()
    asset_data = []
    total_assets = 0
    for acc in assets:
        # Balance = Summerize journals up to end_date
        debit_sum = db.query(func.sum(JournalEntry.debit)).filter(JournalEntry.account_id == acc.id, JournalEntry.date <= end_date).scalar() or 0
        credit_sum = db.query(func.sum(JournalEntry.credit)).filter(JournalEntry.account_id == acc.id, JournalEntry.date <= end_date).scalar() or 0
        balance = debit_sum - credit_sum
        asset_data.append({"name": acc.name, "code": acc.code, "balance": balance})
        total_assets += balance

    # 2. Liabilities
    liabilities = db.query(AccountModel).filter(AccountModel.account_type == "LIABILITY").all()
    liability_data = []
    total_liabilities = 0
    for acc in liabilities:
        debit_sum = db.query(func.sum(JournalEntry.debit)).filter(JournalEntry.account_id == acc.id, JournalEntry.date <= end_date).scalar() or 0
        credit_sum = db.query(func.sum(JournalEntry.credit)).filter(JournalEntry.account_id == acc.id, JournalEntry.date <= end_date).scalar() or 0
        balance = credit_sum - debit_sum  # Normal balance for liabilities is credit
        liability_data.append({"name": acc.name, "code": acc.code, "balance": balance})
        total_liabilities += balance

    # 3. Equity & Net Income
    # We need to calculate Net Income for the year (Revenue - Expenses)
    revenues = db.query(AccountModel).filter(AccountModel.account_type == "REVENUE").all()
    total_revenue = 0
    for acc in revenues:
        debit_sum = db.query(func.sum(JournalEntry.debit)).filter(JournalEntry.account_id == acc.id, JournalEntry.date <= end_date).scalar() or 0
        credit_sum = db.query(func.sum(JournalEntry.credit)).filter(JournalEntry.account_id == acc.id, JournalEntry.date <= end_date).scalar() or 0
        total_revenue += (credit_sum - debit_sum)

    expenses = db.query(AccountModel).filter(AccountModel.account_type == "EXPENSE").all()
    total_expenses = 0
    for acc in expenses:
        debit_sum = db.query(func.sum(JournalEntry.debit)).filter(JournalEntry.account_id == acc.id, JournalEntry.date <= end_date).scalar() or 0
        credit_sum = db.query(func.sum(JournalEntry.credit)).filter(JournalEntry.account_id == acc.id, JournalEntry.date <= end_date).scalar() or 0
        total_expenses += (debit_sum - credit_sum)

    net_income = total_revenue - total_expenses

    equities = db.query(AccountModel).filter(AccountModel.account_type == "EQUITY").all()
    equity_data = []
    total_equity = 0
    for acc in equities:
        debit_sum = db.query(func.sum(JournalEntry.debit)).filter(JournalEntry.account_id == acc.id, JournalEntry.date <= end_date).scalar() or 0
        credit_sum = db.query(func.sum(JournalEntry.credit)).filter(JournalEntry.account_id == acc.id, JournalEntry.date <= end_date).scalar() or 0
        balance = credit_sum - debit_sum
        equity_data.append({"name": acc.name, "code": acc.code, "balance": balance})
        total_equity += balance

    # Add Net Income to Equity
    equity_data.append({"name": "Net Income (Current Year)", "code": "INC", "balance": net_income})
    total_equity += net_income

    return {
        "year": year,
        "assets": {
            "items": asset_data,
            "total": total_assets
        },
        "liabilities": {
            "items": liability_data,
            "total": total_liabilities
        },
        "equity": {
            "items": equity_data,
            "total": total_equity
        },
        "total_liabilities_and_equity": total_liabilities + total_equity
    }

@router.get("/accounts")
def get_accounts(db: Session = Depends(get_db)):
    return db.query(AccountModel).all()

@router.post("/accounts")
def create_account(account: AccountCreate, db: Session = Depends(get_db)):
    new_acc = AccountModel(code=account.code, name=account.name, account_type=account.account_type)
    db.add(new_acc)
    db.commit()
    db.refresh(new_acc)
    return new_acc

@router.post("/journal")
def create_journal(journal: JournalCreate, db: Session = Depends(get_db)):
    acc_service = AccountingService(db)
    if not journal.entries or len(journal.entries) < 2:
        raise HTTPException(status_code=400, detail="Journal must have at least two lines")
    total_debit = sum(e.debit for e in journal.entries)
    total_credit = sum(e.credit for e in journal.entries)
    if round(total_debit - total_credit, 2) != 0.0:
        raise HTTPException(status_code=400, detail=f"Unbalanced journal: debit {total_debit} != credit {total_credit}")
    try:
        header = JournalHeader(
            date=journal.date,
            description=journal.description,
            source_type=journal.source_type,
            source_id=journal.source_id
        )
        db.add(header)
        db.commit()
        db.refresh(header)
        created = acc_service.create_journal_entry(
            date=journal.date,
            description=journal.description,
            entries=[e.dict() for e in journal.entries],
            header_id=header.id
        )
        return {
            "header_id": header.id,
            "lines": [
                {"id": je.id, "account_id": je.account_id, "debit": je.debit, "credit": je.credit, "line_number": je.line_number}
                for je in created
            ]
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/balance-sheet/export")
def export_balance_sheet(year: int = Query(default=date.today().year), db: Session = Depends(get_db), format: str = "excel"):
    """
    Export Balance Sheet to Excel (and CSV fallback).
    """
    bs = get_balance_sheet(year, db)
    # Build DataFrames
    assets = pd.DataFrame(bs["assets"]["items"])
    liabilities = pd.DataFrame(bs["liabilities"]["items"])
    equity = pd.DataFrame(bs["equity"]["items"])
    summary = pd.DataFrame([{
        "Total Assets": bs["assets"]["total"],
        "Total Liabilities": bs["liabilities"]["total"],
        "Total Equity": bs["equity"]["total"],
        "Liabilities + Equity": bs["total_liabilities_and_equity"]
    }])
    if format == "csv":
        assets["Section"] = "Assets"
        liabilities["Section"] = "Liabilities"
        equity["Section"] = "Equity"
        combined = pd.concat([assets, liabilities, equity], ignore_index=True)
        content = combined.to_csv(index=False)
        return StreamingResponse(io.StringIO(content), media_type="text/csv", headers={"Content-Disposition": f'attachment; filename="balance_sheet_{year}.csv"'})
    # Excel
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        assets.to_excel(writer, sheet_name="Assets", index=False)
        liabilities.to_excel(writer, sheet_name="Liabilities", index=False)
        equity.to_excel(writer, sheet_name="Equity", index=False)
        summary.to_excel(writer, sheet_name="Summary", index=False)
    output.seek(0)
    return StreamingResponse(output, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": f'attachment; filename="balance_sheet_{year}.xlsx"'})

def _make_simple_pdf(title: str, subtitle: str, sections: list) -> bytes:
    # Minimal PDF generator (single page, built-in font)
    lines = []
    lines.append("%PDF-1.4\n")
    objects = []
    xref = []
    def add_object(obj_str: str):
        offset = sum(len(s.encode('latin-1')) for s in lines)
        xref.append(offset)
        lines.append(obj_str)
    # 1 Font object
    add_object("1 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n")
    # 2 Pages placeholder (will link page later)
    # 3 Content stream
    content = []
    content.append("BT\n/F1 16 Tf 50 780 Td (%s) Tj\n" % title.replace("(", "\\(").replace(")", "\\)"))
    content.append("0 -24 Td /F1 12 Tf (%s) Tj\n" % subtitle.replace("(", "\\(").replace(")", "\\)"))
    y_offset = -24
    content.append("0 -18 Td /F1 11 Tf (-----------------------------------------------) Tj\n")
    y_offset -= 18
    for sec_title, items in sections:
        content.append("0 -22 Td /F1 12 Tf (%s) Tj\n" % sec_title.replace("(", "\\(").replace(")", "\\)"))
        y_offset -= 22
        for name, amount in items:
            safe_name = name.replace("(", "\\(").replace(")", "\\)")
            content.append("0 -16 Td /F1 10 Tf (%s) Tj\n" % f"{safe_name}: {amount:,.2f}")
            y_offset -= 16
        content.append("0 -10 Td /F1 10 Tf ( ) Tj\n")
        y_offset -= 10
    content.append("ET\n")
    content_bytes = "".join(content).encode("latin-1", errors="ignore")
    add_object(f"3 0 obj\n<< /Length {len(content_bytes)} >>\nstream\n".encode("latin-1").decode("latin-1"))
    lines.append(content_bytes.decode("latin-1"))
    lines.append("endstream\nendobj\n")
    # 4 Page object
    add_object("4 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 1 0 R >> >> /Contents 3 0 R >>\nendobj\n")
    # 2 Pages object (after knowing kids)
    add_object("2 0 obj\n<< /Type /Pages /Kids [4 0 R] /Count 1 >>\nendobj\n")
    # 5 Catalog
    add_object("5 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")
    xref_start = sum(len(s.encode('latin-1')) for s in lines)
    lines.append("xref\n0 %d\n" % (len(xref)+1))
    lines.append("0000000000 65535 f \n")
    for off in xref:
        lines.append(f"{off:010} 00000 n \n")
    lines.append("trailer\n<< /Size %d /Root 5 0 R >>\n" % (len(xref)+1))
    lines.append("startxref\n%d\n%%%%EOF" % xref_start)
    return "".join(lines).encode("latin-1", errors="ignore")

@router.get("/balance-sheet/pdf")
def balance_sheet_pdf(year: int = Query(default=date.today().year), db: Session = Depends(get_db)):
    bs = get_balance_sheet(year, db)
    title = f"Balance Sheet {year}"
    subtitle = f"Generated {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}"
    sections = []
    sections.append(("Assets", [(i["name"], i["balance"]) for i in bs["assets"]["items"]] + [("Total Assets", bs["assets"]["total"])]))
    sections.append(("Liabilities", [(i["name"], i["balance"]) for i in bs["liabilities"]["items"]] + [("Total Liabilities", bs["liabilities"]["total"])]))
    sections.append(("Equity", [(i["name"], i["balance"]) for i in bs["equity"]["items"]] + [("Total Equity", bs["equity"]["total"]), ("Liabilities + Equity", bs["total_liabilities_and_equity"])]))
    pdf_bytes = _make_simple_pdf(title, subtitle, sections)
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers={"Content-Disposition": f'inline; filename=\"balance_sheet_{year}.pdf\"'})

@router.get("/journal-headers")
def list_journal_headers(
    from_date: date = Query(None),
    to_date: date = Query(None),
    source_type: Optional[str] = None,
    source_id: Optional[int] = None,
    account_code: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(JournalHeader)
    if from_date:
        q = q.filter(JournalHeader.date >= from_date)
    if to_date:
        q = q.filter(JournalHeader.date <= to_date)
    if source_type:
        q = q.filter(JournalHeader.source_type == source_type)
    if source_id:
        q = q.filter(JournalHeader.source_id == source_id)
    if account_code:
        # Join عبر القيود والحسابات لتصفية الرؤوس التي تحتوي على هذا الحساب
        q = q.join(JournalEntry, JournalEntry.header_id == JournalHeader.id)\
             .join(Account, JournalEntry.account_id == Account.id)\
             .filter(Account.code == account_code)\
             .distinct()
    headers = q.order_by(JournalHeader.date.desc(), JournalHeader.id.desc()).all()
    results = []
    for h in headers:
        debit = db.query(func.sum(JournalEntry.debit)).filter(JournalEntry.header_id == h.id).scalar() or 0.0
        credit = db.query(func.sum(JournalEntry.credit)).filter(JournalEntry.header_id == h.id).scalar() or 0.0
        results.append({
            "id": h.id,
            "date": h.date,
            "description": h.description,
            "source_type": h.source_type,
            "source_id": h.source_id,
            "reference": h.reference,
            "total_debit": debit,
            "total_credit": credit,
            "line_count": db.query(JournalEntry).filter(JournalEntry.header_id == h.id).count()
        })
    return results

@router.get("/journal-headers/{header_id}")
def get_journal_header(header_id: int, db: Session = Depends(get_db)):
    h = db.query(JournalHeader).filter(JournalHeader.id == header_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Header not found")
    lines = db.query(JournalEntry, Account).join(Account, JournalEntry.account_id == Account.id).filter(JournalEntry.header_id == header_id).order_by(JournalEntry.line_number.asc()).all()
    line_items = []
    for je, acc in lines:
        line_items.append({
            "id": je.id,
            "line_number": je.line_number,
            "account_id": acc.id,
            "account_code": acc.code,
            "account_name": acc.name,
            "debit": je.debit,
            "credit": je.credit
        })
    return {
        "id": h.id,
        "date": h.date,
        "description": h.description,
        "source_type": h.source_type,
        "source_id": h.source_id,
        "reference": h.reference,
        "created_at": h.created_at,
        "lines": line_items
    }

def _apply_account_balance_delta(account: Account, debit_delta: float, credit_delta: float):
    if account.account_type in ["ASSET", "EXPENSE"]:
        account.balance += (debit_delta - credit_delta)
    else:
        account.balance += (credit_delta - debit_delta)

def _assert_header_balanced(db: Session, header_id: int):
    debit = db.query(func.sum(JournalEntry.debit)).filter(JournalEntry.header_id == header_id).scalar() or 0.0
    credit = db.query(func.sum(JournalEntry.credit)).filter(JournalEntry.header_id == header_id).scalar() or 0.0
    if round(debit - credit, 2) != 0.0:
        raise HTTPException(status_code=400, detail=f"Journal not balanced: debit {debit} != credit {credit}")

@router.put("/journal-headers/{header_id}")
def update_journal_header(header_id: int, payload: JournalHeaderUpdate, db: Session = Depends(get_db)):
    h = db.query(JournalHeader).filter(JournalHeader.id == header_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Header not found")
    if payload.date is not None:
        h.date = payload.date
    if payload.description is not None:
        h.description = payload.description
    if payload.reference is not None:
        h.reference = payload.reference
    db.commit()
    return {"ok": True, "id": h.id}

@router.delete("/journal-headers/{header_id}")
def delete_journal_header(header_id: int, db: Session = Depends(get_db)):
    h = db.query(JournalHeader).filter(JournalHeader.id == header_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Header not found")
    db.query(JournalEntry).filter(JournalEntry.header_id == header_id).delete()
    db.delete(h)
    db.commit()
    return {"ok": True}

@router.post("/journal-headers/{header_id}/lines")
def add_journal_line(header_id: int, line: JournalLineCreate, db: Session = Depends(get_db)):
    h = db.query(JournalHeader).filter(JournalHeader.id == header_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Header not found")
    acc = db.query(Account).filter(Account.code == line.account_code).first()
    if not acc:
        raise HTTPException(status_code=400, detail="Account code not found")
    max_ln = db.query(func.max(JournalEntry.line_number)).filter(JournalEntry.header_id == header_id).scalar() or 0
    je = JournalEntry(
        date=h.date,
        description=h.description,
        account_id=acc.id,
        debit=line.debit,
        credit=line.credit,
        header_id=header_id,
        line_number=max_ln + 1
    )
    db.add(je)
    _apply_account_balance_delta(acc, line.debit, line.credit)
    db.commit()
    try:
        _assert_header_balanced(db, header_id)
    except HTTPException as e:
        # rollback effect on balance by reversing delta then delete line
        _apply_account_balance_delta(acc, -line.debit, -line.credit)
        db.delete(je)
        db.commit()
        raise e
    return {"id": je.id, "line_number": je.line_number}

@router.put("/journal-headers/{header_id}/lines/{line_id}")
def update_journal_line(header_id: int, line_id: int, payload: JournalLineUpdate, db: Session = Depends(get_db)):
    je = db.query(JournalEntry).filter(JournalEntry.id == line_id, JournalEntry.header_id == header_id).first()
    if not je:
        raise HTTPException(status_code=404, detail="Line not found")
    old_acc = db.query(Account).filter(Account.id == je.account_id).first()
    old_debit, old_credit = je.debit, je.credit
    # reverse old effect
    _apply_account_balance_delta(old_acc, -old_debit, -old_credit)
    # update fields
    if payload.account_code:
        new_acc = db.query(Account).filter(Account.code == payload.account_code).first()
        if not new_acc:
            raise HTTPException(status_code=400, detail="Account code not found")
        je.account_id = new_acc.id
        acc_for_apply = new_acc
    else:
        acc_for_apply = old_acc
    if payload.debit is not None:
        je.debit = payload.debit
    if payload.credit is not None:
        je.credit = payload.credit
    # apply new effect
    _apply_account_balance_delta(acc_for_apply, je.debit, je.credit)
    db.commit()
    try:
        _assert_header_balanced(db, header_id)
    except HTTPException as e:
        # rollback: restore previous values and balances
        _apply_account_balance_delta(acc_for_apply, -je.debit, -je.credit)
        je.debit, je.credit = old_debit, old_credit
        je.account_id = old_acc.id
        _apply_account_balance_delta(old_acc, old_debit, old_credit)
        db.commit()
        raise e
    return {"ok": True}

@router.delete("/journal-headers/{header_id}/lines/{line_id}")
def delete_journal_line(header_id: int, line_id: int, db: Session = Depends(get_db)):
    je = db.query(JournalEntry).filter(JournalEntry.id == line_id, JournalEntry.header_id == header_id).first()
    if not je:
        raise HTTPException(status_code=404, detail="Line not found")
    acc = db.query(Account).filter(Account.id == je.account_id).first()
    # reverse effect
    _apply_account_balance_delta(acc, -je.debit, -je.credit)
    db.delete(je)
    db.commit()
    try:
        _assert_header_balanced(db, header_id)
    except HTTPException as e:
        # undo deletion by re-adding
        db.add(je)
        _apply_account_balance_delta(acc, je.debit, je.credit)
        db.commit()
        raise e
    return {"ok": True}
