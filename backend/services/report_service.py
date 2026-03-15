from typing import List, Optional, Dict, Any
from datetime import datetime
from decimal import Decimal
import pandas as pd
import io
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from db.payroll_models import (
    Payroll, PayrollPeriod, PayrollReport, Worker, 
    Allowance, Deduction, ExpenseAllocation
)
from schemas.payroll_schemas import PayrollFilters

class PayrollReportService:
    """Service class for generating payroll reports"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def generate_report(
        self, 
        report_type: str, 
        filters: PayrollFilters, 
        format: str = "PDF",
        generated_by: int = None
    ) -> PayrollReport:
        """Generate payroll report based on type and filters"""
        
        # Get report data
        report_data = self._get_report_data(report_type, filters)
        
        # Generate report file
        file_path = self._generate_report_file(report_type, report_data, format)
        
        # Create report record
        report = PayrollReport(
            report_type=report_type,
            report_name=self._get_report_name(report_type, filters),
            file_path=file_path,
            filters=filters.json(),
            total_employees=len(report_data),
            total_payroll_cost=sum(item.get('net_salary', 0) for item in report_data),
            generated_by=generated_by
        )
        
        self.db.add(report)
        self.db.commit()
        self.db.refresh(report)
        
        return report
    
    def _get_report_data(self, report_type: str, filters: PayrollFilters) -> List[Dict[str, Any]]:
        """Get report data based on report type"""
        
        if report_type == "MONTHLY":
            return self._get_monthly_payroll_data(filters)
        elif report_type == "EMPLOYEE":
            return self._get_employee_payroll_data(filters)
        elif report_type == "CLIENT":
            return self._get_client_payroll_data(filters)
        elif report_type == "BRANCH":
            return self._get_branch_payroll_data(filters)
        elif report_type == "OVERTIME":
            return self._get_overtime_data(filters)
        elif report_type == "DEDUCTIONS":
            return self._get_deductions_data(filters)
        else:
            raise ValueError(f"Unknown report type: {report_type}")
    
    def _get_monthly_payroll_data(self, filters: PayrollFilters) -> List[Dict[str, Any]]:
        """Get monthly payroll summary data"""
        
        query = self.db.query(Payroll).join(Worker).join(PayrollPeriod)
        
        # Apply filters
        query = self._apply_filters(query, filters)
        
        payrolls = query.all()
        
        data = []
        for payroll in payrolls:
            data.append({
                'employee_id': payroll.worker.employee_id,
                'employee_name': payroll.worker.name,
                'nationality': payroll.worker.nationality,
                'job_title': payroll.worker.job_title,
                'branch': payroll.worker.branch,
                'department': payroll.worker.department,
                'basic_salary': float(payroll.basic_salary),
                'housing_allowance': float(payroll.housing_allowance),
                'transportation_allowance': float(payroll.transportation_allowance),
                'food_allowance': float(payroll.food_allowance),
                'other_allowances': float(payroll.other_allowances),
                'total_allowances': float(payroll.total_allowances),
                'overtime_hours': float(payroll.overtime_hours),
                'overtime_amount': float(payroll.overtime_amount),
                'gross_salary': float(payroll.gross_salary),
                'absence_deduction': float(payroll.absence_deduction),
                'late_deduction': float(payroll.late_deduction),
                'loan_deduction': float(payroll.loan_deduction),
                'advance_deduction': float(payroll.advance_deduction),
                'gosi_deduction': float(payroll.gosi_deduction),
                'total_deductions': float(payroll.total_deductions),
                'net_salary': float(payroll.net_salary),
                'company_profit': float(payroll.company_profit),
                'status': payroll.status.value,
                'is_paid': payroll.is_paid
            })
        
        return data
    
    def _get_employee_payroll_data(self, filters: PayrollFilters) -> List[Dict[str, Any]]:
        """Get employee-specific payroll data"""
        
        query = self.db.query(Payroll).join(Worker).join(PayrollPeriod)
        
        # Apply filters
        query = self._apply_filters(query, filters)
        
        payrolls = query.all()
        
        data = []
        for payroll in payrolls:
            data.append({
                'employee_id': payroll.worker.employee_id,
                'employee_name': payroll.worker.name,
                'nationality': payroll.worker.nationality,
                'job_title': payroll.worker.job_title,
                'hire_date': payroll.worker.hire_date,
                'contract_type': payroll.worker.contract_type,
                'period': f"{payroll.period.month}/{payroll.period.year}",
                'basic_salary': float(payroll.basic_salary),
                'total_allowances': float(payroll.total_allowances),
                'total_deductions': float(payroll.total_deductions),
                'net_salary': float(payroll.net_salary),
                'working_days': payroll.working_days,
                'present_days': payroll.present_days,
                'absent_days': payroll.absent_days,
                'status': payroll.status.value
            })
        
        return data
    
    def _get_client_payroll_data(self, filters: PayrollFilters) -> List[Dict[str, Any]]:
        """Get client/project payroll cost data"""
        
        # This would require joining with contracts table
        # For now, using worker profession as project indicator
        query = self.db.query(Payroll).join(Worker).join(PayrollPeriod)
        
        # Apply filters
        query = self._apply_filters(query, filters)
        
        payrolls = query.all()
        
        # Group by project/profession
        project_data = {}
        for payroll in payrolls:
            project = payroll.worker.profession or "Unknown"
            
            if project not in project_data:
                project_data[project] = {
                    'project': project,
                    'total_employees': 0,
                    'total_basic_salary': 0,
                    'total_allowances': 0,
                    'total_deductions': 0,
                    'total_net_salary': 0,
                    'total_company_profit': 0
                }
            
            project_data[project]['total_employees'] += 1
            project_data[project]['total_basic_salary'] += float(payroll.basic_salary)
            project_data[project]['total_allowances'] += float(payroll.total_allowances)
            project_data[project]['total_deductions'] += float(payroll.total_deductions)
            project_data[project]['total_net_salary'] += float(payroll.net_salary)
            project_data[project]['total_company_profit'] += float(payroll.company_profit)
        
        return list(project_data.values())
    
    def _get_branch_payroll_data(self, filters: PayrollFilters) -> List[Dict[str, Any]]:
        """Get branch payroll data"""
        
        query = self.db.query(Payroll).join(Worker).join(PayrollPeriod)
        
        # Apply filters
        query = self._apply_filters(query, filters)
        
        payrolls = query.all()
        
        # Group by branch
        branch_data = {}
        for payroll in payrolls:
            branch = payroll.worker.branch or "Unknown"
            
            if branch not in branch_data:
                branch_data[branch] = {
                    'branch': branch,
                    'total_employees': 0,
                    'total_basic_salary': 0,
                    'total_allowances': 0,
                    'total_deductions': 0,
                    'total_net_salary': 0,
                    'total_company_profit': 0
                }
            
            branch_data[branch]['total_employees'] += 1
            branch_data[branch]['total_basic_salary'] += float(payroll.basic_salary)
            branch_data[branch]['total_allowances'] += float(payroll.total_allowances)
            branch_data[branch]['total_deductions'] += float(payroll.total_deductions)
            branch_data[branch]['total_net_salary'] += float(payroll.net_salary)
            branch_data[branch]['total_company_profit'] += float(payroll.company_profit)
        
        return list(branch_data.values())
    
    def _get_overtime_data(self, filters: PayrollFilters) -> List[Dict[str, Any]]:
        """Get overtime data"""
        
        query = self.db.query(Payroll).join(Worker).join(PayrollPeriod)
        
        # Apply filters
        query = self._apply_filters(query, filters)
        
        # Filter only records with overtime
        query = query.filter(Payroll.overtime_hours > 0)
        
        payrolls = query.all()
        
        data = []
        for payroll in payrolls:
            data.append({
                'employee_id': payroll.worker.employee_id,
                'employee_name': payroll.worker.name,
                'job_title': payroll.worker.job_title,
                'department': payroll.worker.department,
                'period': f"{payroll.period.month}/{payroll.period.year}",
                'overtime_hours': float(payroll.overtime_hours),
                'overtime_rate': float(payroll.overtime_rate),
                'overtime_amount': float(payroll.overtime_amount),
                'basic_salary': float(payroll.basic_salary),
                'total_salary': float(payroll.net_salary)
            })
        
        return data
    
    def _get_deductions_data(self, filters: PayrollFilters) -> List[Dict[str, Any]]:
        """Get deductions data"""
        
        query = self.db.query(Payroll).join(Worker).join(PayrollPeriod)
        
        # Apply filters
        query = self._apply_filters(query, filters)
        
        payrolls = query.all()
        
        data = []
        for payroll in payrolls:
            data.append({
                'employee_id': payroll.worker.employee_id,
                'employee_name': payroll.worker.name,
                'job_title': payroll.worker.job_title,
                'department': payroll.worker.department,
                'period': f"{payroll.period.month}/{payroll.period.year}",
                'basic_salary': float(payroll.basic_salary),
                'absence_deduction': float(payroll.absence_deduction),
                'late_deduction': float(payroll.late_deduction),
                'loan_deduction': float(payroll.loan_deduction),
                'advance_deduction': float(payroll.advance_deduction),
                'gosi_deduction': float(payroll.gosi_deduction),
                'penalty_deduction': float(payroll.penalty_deduction),
                'other_deductions': float(payroll.other_deductions),
                'total_deductions': float(payroll.total_deductions),
                'net_salary': float(payroll.net_salary)
            })
        
        return data
    
    def _apply_filters(self, query, filters: PayrollFilters):
        """Apply filters to query"""
        
        if filters.month:
            query = query.filter(PayrollPeriod.month == filters.month)
        if filters.year:
            query = query.filter(PayrollPeriod.year == filters.year)
        if filters.period_id:
            query = query.filter(Payroll.period_id == filters.period_id)
        if filters.worker_id:
            query = query.filter(Payroll.worker_id == filters.worker_id)
        if filters.employee_name:
            query = query.filter(Worker.name.contains(filters.employee_name))
        if filters.employee_id:
            query = query.filter(Worker.employee_id == filters.employee_id)
        if filters.project:
            query = query.filter(Worker.profession.contains(filters.project))
        if filters.branch:
            query = query.filter(Worker.branch == filters.branch)
        if filters.department:
            query = query.filter(Worker.department == filters.department)
        if filters.status:
            query = query.filter(Payroll.status == filters.status)
        if filters.is_paid is not None:
            query = query.filter(Payroll.is_paid == filters.is_paid)
        
        return query
    
    def _generate_report_file(self, report_type: str, data: List[Dict[str, Any]], format: str) -> str:
        """Generate report file"""
        
        if format == "EXCEL":
            return self._generate_excel_report(report_type, data)
        elif format == "CSV":
            return self._generate_csv_report(report_type, data)
        else:  # PDF
            return self._generate_pdf_report(report_type, data)
    
    def _generate_excel_report(self, report_type: str, data: List[Dict[str, Any]]) -> str:
        """Generate Excel report"""
        
        df = pd.DataFrame(data)
        
        # Create a BytesIO buffer
        output = io.BytesIO()
        
        # Write to Excel
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name=f'{report_type}_Report', index=False)
            
            # Auto-adjust columns width
            worksheet = writer.sheets[f'{report_type}_Report']
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 50)
                worksheet.column_dimensions[column_letter].width = adjusted_width
        
        # Save to file
        file_path = f"reports/payroll_{report_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        with open(file_path, 'wb') as f:
            f.write(output.getvalue())
        
        return file_path
    
    def _generate_csv_report(self, report_type: str, data: List[Dict[str, Any]]) -> str:
        """Generate CSV report"""
        
        df = pd.DataFrame(data)
        
        file_path = f"reports/payroll_{report_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        df.to_csv(file_path, index=False)
        
        return file_path
    
    def _generate_pdf_report(self, report_type: str, data: List[Dict[str, Any]]) -> str:
        """Generate PDF report"""
        
        # For now, generate Excel and convert to PDF
        # In a real implementation, you'd use a PDF library like ReportLab
        excel_path = self._generate_excel_report(report_type, data)
        
        # Convert Excel to PDF (simplified approach)
        pdf_path = excel_path.replace('.xlsx', '.pdf')
        
        # This is a placeholder - in reality, you'd use a proper PDF generation library
        return pdf_path
    
    def _get_report_name(self, report_type: str, filters: PayrollFilters) -> str:
        """Generate report name based on type and filters"""
        
        base_name = f"{report_type.replace('_', ' ').title()} Report"
        
        if filters.month and filters.year:
            base_name += f" - {filters.month}/{filters.year}"
        elif filters.year:
            base_name += f" - {filters.year}"
        
        if filters.branch:
            base_name += f" - Branch: {filters.branch}"
        if filters.department:
            base_name += f" - Dept: {filters.department}"
        
        return base_name