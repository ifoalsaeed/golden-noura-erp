from typing import List, Optional
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func
from db.models import Account, JournalEntry

class AccountingService:
    def __init__(self, db: Session):
        self.db = db

    def get_account_by_code(self, code: str) -> Optional[Account]:
        return self.db.query(Account).filter(Account.code == code).first()

    def create_account(self, code: str, name: str, account_type: str) -> Account:
        account = Account(code=code, name=name, account_type=account_type)
        self.db.add(account)
        self.db.commit()
        self.db.refresh(account)
        return account

    def create_journal_entry(self, date: date, description: str, entries: List[dict], header_id: Optional[int] = None) -> List[JournalEntry]:
        total_debit = sum(e['debit'] for e in entries)
        total_credit = sum(e['credit'] for e in entries)

        if abs(total_debit - total_credit) > 0.01:
            raise ValueError(f"Journal Entry is not balanced: Debit {total_debit} != Credit {total_credit}")

        journal_entries = []
        for idx, entry in enumerate(entries, start=1):
            account = self.get_account_by_code(entry['account_code'])
            if not account:
                raise ValueError(f"Account with code {entry['account_code']} not found")

            je = JournalEntry(
                date=date,
                description=description,
                account_id=account.id,
                debit=entry['debit'],
                credit=entry['credit'],
                header_id=header_id,
                line_number=idx
            )
            self.db.add(je)
            journal_entries.append(je)
            if account.account_type in ["ASSET", "EXPENSE"]:
                account.balance += (entry['debit'] - entry['credit'])
            else:
                account.balance += (entry['credit'] - entry['debit'])

        self.db.commit()
        return journal_entries
