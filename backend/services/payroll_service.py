from typing import List, Optional, Dict, Any
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime, date
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from db.payroll_models import (
    Payroll, PayrollPeriod, Worker, Allowance, Deduction, 
    ExpenseAllocation, Attendance, Loan, SalaryAdvance,
    PayrollStatus, AllowanceType, DeductionType, ExpenseAllocationType
)
from schemas.payroll_schemas import (
    PayrollCreate, PayrollUpdate, SalaryComponents, OvertimeComponents,
    DeductionComponents, AttendanceData, AllowanceBase, DeductionBase,
    ExpenseAllocationBase
)
from services.accounting_service import AccountingService
from db.models import JournalHeader

class PayrollCalculator:
    """Service class for payroll calculations and processing"""
    
    def __init__(self, db: Session):
        self.db = db
        self.accounting_service = AccountingService(db)
        
    def calculate_payroll(self, payroll_data: PayrollCreate) -> Payroll:
        """Calculate complete payroll for a worker"""
        
        # Get worker details
        worker = self.db.query(Worker).filter(Worker.id == payroll_data.worker_id).first()
        if not worker:
            raise ValueError("Worker not found")
        
        # Get period details
        period = self.db.query(PayrollPeriod).filter(PayrollPeriod.id == payroll_data.period_id).first()
        if not period:
            raise ValueError("Payroll period not found")
        
        # Initialize payroll object
        payroll = Payroll(
            worker_id=worker.id,
            period_id=period.id,
            status=PayrollStatus.CALCULATED
        )
        
        # Calculate salary components
        self._calculate_salary_components(payroll, payroll_data.salary_components)
        
        # Calculate overtime
        self._calculate_overtime(payroll, payroll_data.overtime_components)
        
        # Calculate deductions
        self._calculate_deductions(payroll, payroll_data.deduction_components)
        
        # Process attendance data
        self._process_attendance_data(payroll, payroll_data.attendance_data)
        
        # Process allowances
        self._process_allowances(payroll, payroll_data.allowances)
        
        # Process deductions
        self._process_deductions(payroll, payroll_data.deductions)
        
        # Process expense allocations
        self._process_expense_allocations(payroll, payroll_data.expense_allocations)
        
        # Calculate final amounts
        self._calculate_final_amounts(payroll)
        
        # Calculate company profit
        self._calculate_company_profit(payroll, worker)
        
        return payroll
    
    def _calculate_salary_components(self, payroll: Payroll, components: SalaryComponents):
        """Calculate salary components"""
        # Map to 'base_salary' as per models.py
        val = Decimal(str(components.basic_salary))
        payroll.base_salary = float(val)
        payroll.basic_salary = val # Keep for internal logic if needed
        
        # Create Allowance objects for components to ensure persistence
        housing = Decimal(str(components.housing_allowance))
        if housing > 0:
            allow = Allowance(
                payroll=payroll,
                worker_id=payroll.worker_id,
                allowance_type=AllowanceType.HOUSING,
                amount=housing,
                description="Housing Allowance",
                is_taxable=True
            )
            self.db.add(allow)
            
        transport = Decimal(str(components.transportation_allowance))
        if transport > 0:
            allow = Allowance(
                payroll=payroll,
                worker_id=payroll.worker_id,
                allowance_type=AllowanceType.TRANSPORTATION,
                amount=transport,
                description="Transportation Allowance",
                is_taxable=True
            )
            self.db.add(allow)
            
        food = Decimal(str(components.food_allowance))
        if food > 0:
            allow = Allowance(
                payroll=payroll,
                worker_id=payroll.worker_id,
                allowance_type=AllowanceType.FOOD,
                amount=food,
                description="Food Allowance",
                is_taxable=True
            )
            self.db.add(allow)
            
        other = Decimal(str(components.other_allowances))
        if other > 0:
             allow = Allowance(
                payroll=payroll,
                worker_id=payroll.worker_id,
                allowance_type=AllowanceType.OTHER,
                amount=other,
                description="Other Allowances",
                is_taxable=True
            )
             self.db.add(allow)

        payroll.housing_allowance = housing
        payroll.transportation_allowance = transport
        payroll.food_allowance = food
        payroll.other_allowances = other
    
    def _calculate_overtime(self, payroll: Payroll, components: OvertimeComponents):
        """Calculate overtime amounts"""
        payroll.overtime_hours = Decimal(str(components.overtime_hours))
        payroll.overtime_rate = Decimal(str(components.overtime_rate))
        
        # If overtime amount is provided, use it; otherwise calculate
        if components.overtime_amount > 0:
            val = Decimal(str(components.overtime_amount))
        else:
            val = payroll.overtime_hours * payroll.overtime_rate
            
        payroll.overtime_amount = val
        payroll.overtime = float(val) # Map to 'overtime' column in models.py
    
    def _calculate_deductions(self, payroll: Payroll, components: DeductionComponents):
        """Calculate deduction components"""
        # Create Deduction objects for persistence
        gosi = Decimal(str(components.gosi_deduction))
        if gosi > 0:
            ded = Deduction(
                payroll=payroll,
                worker_id=payroll.worker_id,
                deduction_type=DeductionType.GOSI,
                amount=gosi,
                description="GOSI Deduction"
            )
            self.db.add(ded)
            
        absence = Decimal(str(components.absence_deduction))
        if absence > 0:
            ded = Deduction(
                payroll=payroll,
                worker_id=payroll.worker_id,
                deduction_type=DeductionType.ABSENCE,
                amount=absence,
                description="Absence Deduction"
            )
            self.db.add(ded)
            
        # ... Add others if needed, but GOSI is critical for accounting
        
        payroll.absence_deduction = absence
        payroll.late_deduction = Decimal(str(components.late_deduction))
        payroll.loan_deduction = Decimal(str(components.loan_deduction))
        payroll.advance_deduction = Decimal(str(components.advance_deduction))
        payroll.penalty_deduction = Decimal(str(components.penalty_deduction))
        payroll.gosi_deduction = gosi
        payroll.other_deductions = Decimal(str(components.other_deductions))
    
    def _process_attendance_data(self, payroll: Payroll, attendance: AttendanceData):
        """Process attendance data and calculate related amounts"""
        payroll.working_days = attendance.working_days
        payroll.present_days = attendance.present_days
        payroll.absent_days = attendance.absent_days
        payroll.overtime_hours = attendance.overtime_hours
        
        # Calculate absence deduction if not already set
        if payroll.absence_deduction == 0 and payroll.absent_days > 0:
            daily_rate = payroll.basic_salary / Decimal(str(payroll.working_days))
            payroll.absence_deduction = daily_rate * Decimal(str(payroll.absent_days))
    
    def _process_allowances(self, payroll: Payroll, allowances: List[AllowanceBase]):
        """Process detailed allowances"""
        for allowance_data in allowances:
            allowance = Allowance(
                payroll=payroll, # Use relationship to handle ID assignment
                worker_id=payroll.worker_id,
                allowance_type=allowance_data.allowance_type,
                amount=Decimal(str(allowance_data.amount)),
                description=allowance_data.description,
                is_taxable=allowance_data.is_taxable
            )
            self.db.add(allowance)
    
    def _process_deductions(self, payroll: Payroll, deductions: List[DeductionBase]):
        """Process detailed deductions"""
        for deduction_data in deductions:
            deduction = Deduction(
                payroll=payroll, # Use relationship
                worker_id=payroll.worker_id,
                deduction_type=deduction_data.deduction_type,
                amount=Decimal(str(deduction_data.amount)),
                description=deduction_data.description,
                reference_number=deduction_data.reference_number
            )
            self.db.add(deduction)
    
    def _process_expense_allocations(self, payroll: Payroll, allocations: List[ExpenseAllocationBase]):
        """Process expense allocations"""
        for allocation_data in allocations:
            allocation = ExpenseAllocation(
                payroll=payroll, # Use relationship
                worker_id=payroll.worker_id,
                expense_type=allocation_data.expense_type,
                amount=Decimal(str(allocation_data.amount)),
                allocation_method=allocation_data.allocation_method,
                description=allocation_data.description,
                expense_date=allocation_data.expense_date
            )
            self.db.add(allocation)
    
    def _calculate_final_amounts(self, payroll: Payroll):
        """Calculate final payroll amounts"""
        # Total allowances
        payroll.total_allowances = (
            payroll.housing_allowance + 
            payroll.transportation_allowance + 
            payroll.food_allowance + 
            payroll.other_allowances
        )
        
        # Gross salary
        payroll.gross_salary = (
            payroll.basic_salary + 
            payroll.total_allowances + 
            payroll.overtime_amount
        )
        
        # Total deductions
        payroll.total_deductions = (
            payroll.absence_deduction + 
            payroll.late_deduction + 
            payroll.loan_deduction + 
            payroll.advance_deduction + 
            payroll.penalty_deduction + 
            payroll.gosi_deduction + 
            payroll.other_deductions
        )
        
        # Net salary
        payroll.net_salary = payroll.gross_salary - payroll.total_deductions
        
        # Round all amounts to 2 decimal places
        for field in ['total_allowances', 'gross_salary', 'total_deductions', 'net_salary']:
            value = getattr(payroll, field)
            setattr(payroll, field, value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
    
    def _calculate_company_profit(self, payroll: Payroll, worker: Worker):
        """Calculate company profit for this employee"""
        # Get active contract for revenue calculation
        from db.models import Contract
        
        contract = self.db.query(Contract).filter(
            and_(
                Contract.worker_id == worker.id,
                Contract.status == "ACTIVE"
            )
        ).first()
        
        if contract:
            # Use contract monthly rental price as revenue
            payroll.company_revenue = Decimal(str(contract.monthly_rental_price))
        else:
            # Fallback: basic salary + 30% margin + allowances
            payroll.company_revenue = payroll.basic_salary * Decimal('1.3') + payroll.total_allowances
        
        # Company profit = Revenue - Net salary - Expense allocations
        expense_total = sum(
            allocation.amount for allocation in payroll.expense_allocations
        )
        payroll.company_profit = payroll.company_revenue - payroll.net_salary - expense_total
    
    def apply_automation_rules(self, payroll: Payroll, worker: Worker, period: PayrollPeriod):
        """Apply automation rules for payroll calculation"""
        
        # Apply overtime calculation rules
        self._apply_overtime_rules(payroll, worker)
        
        # Apply absence deduction rules
        self._apply_absence_rules(payroll, worker)
        
        # Apply loan deduction rules
        self._apply_loan_rules(payroll, worker)
        
        # Apply advance salary rules
        self._apply_advance_rules(payroll, worker)
        
        # Apply GOSI calculation for Saudi employees
        self._apply_gosi_rules(payroll, worker)
    
    def _apply_overtime_rules(self, payroll: Payroll, worker: Worker):
        """Apply overtime calculation rules"""
        if payroll.overtime_hours > 0 and payroll.overtime_rate == 0:
            # Default overtime rate: 1.5x hourly rate for first 2 hours, 2x after
            hourly_rate = payroll.basic_salary / (30 * 8)  # Assuming 8 hours/day, 30 days/month
            if payroll.overtime_hours <= 2:
                payroll.overtime_rate = hourly_rate * Decimal('1.5')
            else:
                regular_ot = hourly_rate * Decimal('1.5') * 2
                premium_ot = (payroll.overtime_hours - 2) * hourly_rate * Decimal('2')
                payroll.overtime_amount = regular_ot + premium_ot
                payroll.overtime_rate = payroll.overtime_amount / payroll.overtime_hours
    
    def _apply_absence_rules(self, payroll: Payroll, worker: Worker):
        """Apply absence deduction rules"""
        if payroll.absent_days > 0 and payroll.absence_deduction == 0:
            daily_rate = payroll.basic_salary / Decimal('30')
            payroll.absence_deduction = daily_rate * Decimal(str(payroll.absent_days))
    
    def _apply_loan_rules(self, payroll: Payroll, worker: Worker):
        """Apply loan deduction rules"""
        # Check for active loans
        active_loans = self.db.query(Loan).filter(
            and_(
                Loan.worker_id == worker.id,
                Loan.status == "ACTIVE",
                Loan.remaining_amount > 0
            )
        ).all()
        
        for loan in active_loans:
            if loan.monthly_installment > 0 and loan.remaining_amount > 0:
                deduction_amount = min(loan.monthly_installment, loan.remaining_amount)
                payroll.loan_deduction += deduction_amount
                
                # Create deduction record
                deduction = Deduction(
                    payroll_id=payroll.id,
                    worker_id=worker.id,
                    deduction_type=DeductionType.LOAN,
                    amount=deduction_amount,
                    description=f"Loan installment - Reference: {loan.id}",
                    reference_number=str(loan.id)
                )
                self.db.add(deduction)
    
    def _apply_advance_rules(self, payroll: Payroll, worker: Worker):
        """Apply advance salary deduction rules"""
        # Check for pending salary advances
        advances = self.db.query(SalaryAdvance).filter(
            and_(
                SalaryAdvance.worker_id == worker.id,
                SalaryAdvance.status == "PENDING",
                SalaryAdvance.remaining_amount > 0
            )
        ).all()
        
        for advance in advances:
            payroll.advance_deduction += advance.remaining_amount
            
            # Create deduction record
            deduction = Deduction(
                payroll_id=payroll.id,
                worker_id=worker.id,
                deduction_type=DeductionType.ADVANCE,
                amount=advance.remaining_amount,
                description=f"Salary advance - Reference: {advance.id}",
                reference_number=str(advance.id)
            )
            self.db.add(deduction)
    
    def _apply_gosi_rules(self, payroll: Payroll, worker: Worker):
        """Apply GOSI (General Organization for Social Insurance) rules for Saudi employees"""
        if worker.nationality == "Saudi" and payroll.gosi_deduction == 0:
            # GOSI calculation: 9% of basic salary for Saudi employees
            payroll.gosi_deduction = payroll.basic_salary * Decimal('0.09')
    
    def generate_bulk_payroll(self, period_id: int, worker_ids: Optional[List[int]] = None) -> Dict[str, Any]:
        """Generate payroll for multiple workers"""
        
        period = self.db.query(PayrollPeriod).filter(PayrollPeriod.id == period_id).first()
        if not period:
            raise ValueError("Payroll period not found")
        
        # Get workers to process
        query = self.db.query(Worker).filter(Worker.status == "ACTIVE")
        if worker_ids:
            query = query.filter(Worker.id.in_(worker_ids))
        
        workers = query.all()
        
        generated_count = 0
        failed_count = 0
        errors = []
        
        for worker in workers:
            try:
                # Check if payroll already exists for this worker and period
                existing = self.db.query(Payroll).filter(
                    and_(
                        Payroll.worker_id == worker.id,
                        Payroll.period_id == period_id
                    )
                ).first()
                
                if existing:
                    errors.append(f"Payroll already exists for worker {worker.name}")
                    failed_count += 1
                    continue
                
                # Create payroll data
                payroll_data = self._create_default_payroll_data(worker, period)
                
                # Calculate payroll
                payroll = self.calculate_payroll(payroll_data)
                
                # Apply automation rules
                self.apply_automation_rules(payroll, worker, period)
                
                # Save to database
                self.db.add(payroll)
                generated_count += 1
                
            except Exception as e:
                errors.append(f"Failed to generate payroll for worker {worker.name}: {str(e)}")
                failed_count += 1
        
        # Commit all changes
        self.db.commit()
        
        # Update period statistics
        self._update_period_statistics(period)
        
        return {
            "success": True,
            "message": f"Generated {generated_count} payroll records successfully",
            "generated_count": generated_count,
            "failed_count": failed_count,
            "errors": errors
        }
    
    def _create_default_payroll_data(self, worker: Worker, period: PayrollPeriod) -> PayrollCreate:
        """Create default payroll data for a worker"""
        
        # Get attendance data for the period
        attendance_data = self._get_attendance_data(worker.id, period)
        
        # Get loan information
        loan_info = self._get_loan_info(worker.id)
        
        # Get advance information
        advance_info = self._get_advance_info(worker.id)
        
        # Create salary components
        salary_components = SalaryComponents(
            basic_salary=Decimal(str(worker.salary or 0)),
            housing_allowance=Decimal(str(worker.housing_cost or 0)),
            transportation_allowance=Decimal(str(worker.transport_cost or 0)),
            food_allowance=Decimal('300'),  # Default food allowance
            other_allowances=Decimal('0')
        )
        
        # Create deduction components
        deduction_components = DeductionComponents(
            loan_deduction=loan_info['monthly_deduction'],
            advance_deduction=advance_info['total_pending']
        )
        
        return PayrollCreate(
            worker_id=worker.id,
            period_id=period.id,
            salary_components=salary_components,
            deduction_components=deduction_components,
            attendance_data=attendance_data,
            allowances=[],
            deductions=[],
            expense_allocations=[]
        )
    
    def _get_attendance_data(self, worker_id: int, period: PayrollPeriod) -> AttendanceData:
        """Get attendance data for a worker in a specific period"""
        
        # This is a simplified version - in real implementation, 
        # you would query the attendance table for the specific period
        return AttendanceData(
            working_days=30,
            present_days=30,
            absent_days=0,
            overtime_hours=Decimal('0')
        )
    
    def _get_loan_info(self, worker_id: int) -> Dict[str, Any]:
        """Get loan information for a worker"""
        
        active_loans = self.db.query(Loan).filter(
            and_(
                Loan.worker_id == worker_id,
                Loan.status == "ACTIVE",
                Loan.remaining_amount > 0
            )
        ).all()
        
        total_monthly = sum(loan.monthly_installment for loan in active_loans)
        total_remaining = sum(loan.remaining_amount for loan in active_loans)
        
        return {
            'monthly_deduction': Decimal(str(total_monthly)),
            'total_remaining': Decimal(str(total_remaining)),
            'loan_count': len(active_loans)
        }
    
    def _get_advance_info(self, worker_id: int) -> Dict[str, Any]:
        """Get advance salary information for a worker"""
        
        pending_advances = self.db.query(SalaryAdvance).filter(
            and_(
                SalaryAdvance.worker_id == worker_id,
                SalaryAdvance.status == "PENDING",
                SalaryAdvance.remaining_amount > 0
            )
        ).all()
        
        total_pending = sum(advance.remaining_amount for advance in pending_advances)
        
        return {
            'total_pending': Decimal(str(total_pending)),
            'advance_count': len(pending_advances)
        }
    
    def _update_period_statistics(self, period: PayrollPeriod):
        """Update payroll period statistics"""
        
        payrolls = self.db.query(Payroll).filter(Payroll.period_id == period.id).all()
        
        period.total_employees = len(payrolls)
        period.total_payroll_cost = sum(p.net_salary for p in payrolls)
        
        self.db.commit()
    
    def approve_payroll(self, payroll_ids: List[int], user_id: int) -> Dict[str, Any]:
        """Approve payroll records and create accounting entries (Accrual)"""
        
        approved_count = 0
        failed_count = 0
        errors = []
        
        for payroll_id in payroll_ids:
            try:
                payroll = self.db.query(Payroll).filter(Payroll.id == payroll_id).first()
                if not payroll:
                    errors.append(f"Payroll {payroll_id} not found")
                    failed_count += 1
                    continue
                
                if payroll.status != PayrollStatus.CALCULATED:
                    errors.append(f"Payroll {payroll_id} is not in CALCULATED status")
                    failed_count += 1
                    continue
                
                payroll.status = PayrollStatus.APPROVED
                payroll.approved_by = user_id
                
                # Create Accrual Journal Entry
                self._create_payroll_accrual_entry(payroll)
                
                approved_count += 1
                
            except Exception as e:
                errors.append(f"Failed to approve payroll {payroll_id}: {str(e)}")
                failed_count += 1
        
        self.db.commit()
        
        return {
            "success": True,
            "message": f"Approved {approved_count} payroll records successfully",
            "approved_count": approved_count,
            "failed_count": failed_count,
            "errors": errors
        }

    def _create_payroll_accrual_entry(self, payroll: Payroll):
        """Creates GL entries for payroll accrual"""
        # Debit Expenses
        entries = []
        
        # Helper to safely get float value
        def get_val(obj, attr, default=0.0):
            val = getattr(obj, attr, default)
            return float(val) if val is not None else 0.0

        # 1. Salaries Expense (Basic + Overtime + Bonuses)
        # Handle mismatch between 'base_salary' (model) and 'basic_salary' (service logic)
        basic = get_val(payroll, 'base_salary') if hasattr(payroll, 'base_salary') else get_val(payroll, 'basic_salary')
        overtime = get_val(payroll, 'overtime') if hasattr(payroll, 'overtime') else get_val(payroll, 'overtime_amount')
        bonuses = get_val(payroll, 'bonuses')
        
        salaries_expense = basic + overtime + bonuses
        entries.append({
            "account_code": "5010", # Salaries Expense
            "debit": salaries_expense,
            "credit": 0
        })
        
        # Calculate allowances from relationship if available
        housing = 0.0
        transport = 0.0
        other_allow = 0.0
        
        # Check if 'allowances' is iterable (relationship) or float (column)
        # Due to naming conflict in models.py, it's likely the relationship
        allowances_attr = getattr(payroll, 'allowances', None)
        
        try:
            # Try to iterate (relationship)
            for allow in allowances_attr:
                amt = float(allow.amount)
                if allow.allowance_type == "HOUSING":
                    housing += amt
                elif allow.allowance_type == "TRANSPORTATION":
                    transport += amt
                else:
                    other_allow += amt
        except (TypeError, AttributeError):
            # Not iterable, assume it's a float value (column)
            try:
                other_allow = float(allowances_attr) if allowances_attr is not None else 0.0
            except:
                other_allow = 0.0

        # 2. Housing Allowance Expense
        if housing > 0:
            entries.append({
                "account_code": "5020", 
                "debit": housing,
                "credit": 0
            })
            
        # 3. Transportation Allowance Expense
        if transport > 0:
            entries.append({
                "account_code": "5030", 
                "debit": transport,
                "credit": 0
            })
            
        # 4. Other Allowances
        if other_allow > 0:
            entries.append({
                "account_code": "5090", 
                "debit": other_allow,
                "credit": 0
            })
            
        # Credit Liabilities
        
        # 5. Salaries Payable (Net Salary)
        net_salary = get_val(payroll, 'net_salary')
        entries.append({
            "account_code": "2100", # Salaries Payable
            "debit": 0,
            "credit": net_salary
        })
        
        # 6. GOSI Payable (Deduction)
        # GOSI might be in deductions list or a column?
        gosi = 0.0
        other_deductions_total = 0.0
        
        # Try to find GOSI in deductions relationship
        deductions_attr = getattr(payroll, 'deductions', None)
        has_deductions_rel = False
        
        try:
            for ded in deductions_attr:
                has_deductions_rel = True
                amt = float(ded.amount)
                if ded.deduction_type == "GOSI":
                    gosi += amt
                else:
                    other_deductions_total += amt
        except (TypeError, AttributeError):
            pass
        
        # If no relationship iteration occurred, check if we can infer from total deductions value
        if not has_deductions_rel:
            try:
                val = float(deductions_attr) if deductions_attr is not None else 0.0
                if val > 0:
                    other_deductions_total = val
            except:
                pass
            
        if gosi > 0:
            entries.append({
                "account_code": "2110", # GOSI Payable
                "debit": 0,
                "credit": gosi
            })
            
        # 7. Other Deductions (Accounts Payable / Loan)
        if other_deductions_total > 0:
             entries.append({
                "account_code": "2010", # Accounts Payable
                "debit": 0,
                "credit": other_deductions_total
            })
            
        header = JournalHeader(
            date=date.today(),
            description=f"Payroll Accrual - {payroll.worker.name} - {payroll.month}/{payroll.year}",
            source_type="Payroll",
            source_id=payroll.id
        )
        self.db.add(header); self.db.commit(); self.db.refresh(header)
        self.accounting_service.create_journal_entry(
            date=date.today(),
            description=f"Payroll Accrual - {payroll.worker.name} - {payroll.month}/{payroll.year}",
            entries=entries,
            header_id=header.id
        )

    def confirm_payment(self, payroll_id: int, payment_method: str = "Bank Transfer"):
        """Confirm payroll payment and create GL entry"""
        payroll = self.db.query(Payroll).filter(Payroll.id == payroll_id).first()
        if not payroll:
            raise ValueError("Payroll not found")
            
        if payroll.is_paid:
            raise ValueError("Payroll is already paid")
            
        payroll.is_paid = True
        payroll.payment_method = payment_method
        payroll.paid_at = datetime.utcnow() # Assuming this field exists or needs to be added
        if hasattr(payroll, 'status'):
            payroll.status = PayrollStatus.PAID
            
        # Create Payment Journal Entry
        entries = [
            {
                "account_code": "2100", # Debit Salaries Payable
                "debit": float(payroll.net_salary),
                "credit": 0
            },
            {
                "account_code": "1020", # Credit Bank Al-Rajhi
                "debit": 0,
                "credit": float(payroll.net_salary)
            }
        ]
        
        header = JournalHeader(
            date=date.today(),
            description=f"Payroll Payment - {payroll.worker.name} - {payroll.month}/{payroll.year}",
            source_type="PayrollPayment",
            source_id=payroll.id
        )
        self.db.add(header); self.db.commit(); self.db.refresh(header)
        self.accounting_service.create_journal_entry(
            date=date.today(),
            description=f"Payroll Payment - {payroll.worker.name} - {payroll.month}/{payroll.year}",
            entries=entries,
            header_id=header.id
        )
        
        self.db.commit()
        return payroll
    
    def get_payroll_statistics(self, period_id: Optional[int] = None) -> Dict[str, Any]:
        """Get payroll statistics"""
        
        query = self.db.query(Payroll)
        if period_id:
            query = query.filter(Payroll.period_id == period_id)
        
        payrolls = query.all()
        
        if not payrolls:
            return {
                "total_employees": 0,
                "total_payroll_cost": Decimal('0'),
                "average_salary": Decimal('0'),
                "total_overtime": Decimal('0'),
                "total_deductions": Decimal('0'),
                "total_company_profit": Decimal('0'),
                "by_status": {},
                "by_branch": {},
                "by_department": {},
                "by_project": {}
            }
        
        # Calculate basic statistics
        total_cost = sum(p.net_salary for p in payrolls)
        total_overtime = sum(p.overtime_amount for p in payrolls)
        total_deductions = sum(p.total_deductions for p in payrolls)
        total_profit = sum(p.company_profit for p in payrolls)
        
        # Group by status
        by_status = {}
        for status in PayrollStatus:
            count = len([p for p in payrolls if p.status == status])
            by_status[status.value] = count
        
        # Group by branch, department, project (simplified)
        by_branch = {}
        by_department = {}
        by_project = {}
        
        for payroll in payrolls:
            worker = payroll.worker
            
            # By branch
            branch = worker.branch or "Unknown"
            if branch not in by_branch:
                by_branch[branch] = Decimal('0')
            by_branch[branch] += payroll.net_salary
            
            # By department
            department = worker.department or "Unknown"
            if department not in by_department:
                by_department[department] = Decimal('0')
            by_department[department] += payroll.net_salary
        
        return {
            "total_employees": len(payrolls),
            "total_payroll_cost": total_cost,
            "average_salary": total_cost / len(payrolls),
            "total_overtime": total_overtime,
            "total_deductions": total_deductions,
            "total_company_profit": total_profit,
            "by_status": by_status,
            "by_branch": by_branch,
            "by_department": by_department,
            "by_project": by_project
        }
