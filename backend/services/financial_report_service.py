
from typing import Dict, Any, List
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from db.models import Account, JournalEntry

class FinancialReportService:
    def __init__(self, db: Session):
        self.db = db

    def get_balance_sheet(self, as_of_date: date) -> Dict[str, Any]:
        """
        Generates Balance Sheet as of a specific date.
        Assets = Liabilities + Equity
        """
        
        # Helper to get balance for a specific account type
        def get_type_balance(account_type: str, is_debit_normal: bool = True) -> float:
            # Query sum of debits and credits for accounts of this type up to as_of_date
            query = self.db.query(
                func.sum(JournalEntry.debit).label("total_debit"),
                func.sum(JournalEntry.credit).label("total_credit")
            ).join(Account).filter(
                Account.account_type == account_type,
                JournalEntry.date <= as_of_date
            )
            
            result = query.first()
            if not result:
                return 0.0
                
            debit = result.total_debit or 0.0
            credit = result.total_credit or 0.0
            
            if is_debit_normal:
                return debit - credit
            else:
                return credit - debit

        # 1. Assets
        total_assets = get_type_balance("ASSET", is_debit_normal=True)
        
        # Breakdown of Assets
        asset_accounts = self._get_account_balances("ASSET", as_of_date, is_debit_normal=True)

        # 2. Liabilities
        total_liabilities = get_type_balance("LIABILITY", is_debit_normal=False)
        
        # Breakdown of Liabilities
        liability_accounts = self._get_account_balances("LIABILITY", as_of_date, is_debit_normal=False)

        # 3. Equity
        total_equity = get_type_balance("EQUITY", is_debit_normal=False)
        
        # Breakdown of Equity
        equity_accounts = self._get_account_balances("EQUITY", as_of_date, is_debit_normal=False)

        # 4. Retained Earnings (Net Income for all time up to as_of_date)
        # Revenue (Credit - Debit) - Expenses (Debit - Credit)
        total_revenue = get_type_balance("REVENUE", is_debit_normal=False)
        total_expenses = get_type_balance("EXPENSE", is_debit_normal=True)
        retained_earnings = total_revenue - total_expenses

        # Add Retained Earnings to Equity
        total_equity_with_retained = total_equity + retained_earnings
        
        # Balance Check
        is_balanced = abs(total_assets - (total_liabilities + total_equity_with_retained)) < 0.01

        return {
            "as_of_date": as_of_date,
            "assets": {
                "total": total_assets,
                "accounts": asset_accounts
            },
            "liabilities": {
                "total": total_liabilities,
                "accounts": liability_accounts
            },
            "equity": {
                "total": total_equity_with_retained,
                "accounts": equity_accounts,
                "retained_earnings": retained_earnings
            },
            "is_balanced": is_balanced,
            "check_diff": total_assets - (total_liabilities + total_equity_with_retained)
        }

    def get_profit_and_loss(self, start_date: date, end_date: date) -> Dict[str, Any]:
        """
        Generates Profit & Loss Statement for a specific period.
        Net Profit = Revenue - Expenses
        """
        
        # Helper to get balances
        def get_period_balance(account_type: str, is_debit_normal: bool) -> float:
            query = self.db.query(
                func.sum(JournalEntry.debit).label("total_debit"),
                func.sum(JournalEntry.credit).label("total_credit")
            ).join(Account).filter(
                Account.account_type == account_type,
                JournalEntry.date >= start_date,
                JournalEntry.date <= end_date
            )
            
            result = query.first()
            if not result:
                return 0.0
                
            debit = result.total_debit or 0.0
            credit = result.total_credit or 0.0
            
            if is_debit_normal:
                return debit - credit
            else:
                return credit - debit

        # 1. Revenue
        total_revenue = get_period_balance("REVENUE", is_debit_normal=False)
        revenue_accounts = self._get_account_balances("REVENUE", end_date, start_date, is_debit_normal=False)

        # 2. Expenses
        total_expenses = get_period_balance("EXPENSE", is_debit_normal=True)
        expense_accounts = self._get_account_balances("EXPENSE", end_date, start_date, is_debit_normal=True)

        # 3. Net Profit
        net_profit = total_revenue - total_expenses

        return {
            "start_date": start_date,
            "end_date": end_date,
            "revenue": {
                "total": total_revenue,
                "accounts": revenue_accounts
            },
            "expenses": {
                "total": total_expenses,
                "accounts": expense_accounts
            },
            "net_profit": net_profit
        }

    def _get_account_balances(self, account_type: str, end_date: date, start_date: date = None, is_debit_normal: bool = True) -> List[Dict[str, Any]]:
        """
        Get individual account balances for a type.
        If start_date is provided, calculates movement in that period (for P&L).
        If start_date is None, calculates cumulative balance (for BS).
        """
        query = self.db.query(
            Account.code,
            Account.name,
            func.sum(JournalEntry.debit).label("debit"),
            func.sum(JournalEntry.credit).label("credit")
        ).join(JournalEntry).filter(
            Account.account_type == account_type,
            JournalEntry.date <= end_date
        )

        if start_date:
            query = query.filter(JournalEntry.date >= start_date)

        query = query.group_by(Account.id, Account.code, Account.name)
        results = query.all()

        accounts = []
        for r in results:
            debit = r.debit or 0.0
            credit = r.credit or 0.0
            
            if is_debit_normal:
                balance = debit - credit
            else:
                balance = credit - debit
            
            # Only include non-zero balances or movements
            if abs(balance) > 0.001:
                accounts.append({
                    "code": r.code,
                    "name": r.name,
                    "balance": balance
                })
        
        return sorted(accounts, key=lambda x: x['code'])
