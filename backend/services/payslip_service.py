from typing import Optional, Dict, Any
from datetime import datetime
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import and_

from db.payroll_models import Payroll, Worker, PayrollPeriod, Allowance, Deduction
from schemas.payroll_schemas import PayslipData, PayslipRequest, AllowanceBase, DeductionBase

class PayslipService:
    """Service class for generating employee payslips"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def generate_payslip(self, payroll_id: int, include_company_logo: bool = True, format: str = "PDF") -> PayslipData:
        """Generate employee payslip"""
        
        # Get payroll data
        payroll = self.db.query(Payroll).filter(Payroll.id == payroll_id).first()
        if not payroll:
            raise ValueError("Payroll not found")
        
        # Get worker data
        worker = payroll.worker
        if not worker:
            raise ValueError("Worker not found")
        
        # Get period data
        period = payroll.period
        if not period:
            raise ValueError("Payroll period not found")
        
        # Get detailed allowances and deductions
        allowances = self._get_allowances(payroll_id)
        deductions = self._get_deductions(payroll_id)
        
        # Create payslip data
        payslip_data = PayslipData(
            company_name="Golden Noura Manpower Supply",
            company_address="Saudi Arabia",
            company_logo="/assets/company-logo.png" if include_company_logo else None,
            
            employee_info={
                'id': worker.id,
                'name': worker.name,
                'employee_id': worker.employee_id,
                'nationality': worker.nationality,
                'job_title': worker.job_title,
                'profession': worker.profession,
                'branch': worker.branch,
                'department': worker.department,
                'contract_type': worker.contract_type,
                'employment_status': worker.employment_status,
                'hire_date': worker.hire_date
            },
            
            payroll_period=f"{period.month}/{period.year}",
            
            # Salary breakdown
            basic_salary=payroll.basic_salary,
            allowances=allowances,
            total_allowances=payroll.total_allowances,
            gross_salary=payroll.gross_salary,
            
            # Deductions
            deductions=deductions,
            total_deductions=payroll.total_deductions,
            
            # Net salary
            net_salary=payroll.net_salary,
            
            # Additional info
            working_days=payroll.working_days,
            present_days=payroll.present_days,
            absent_days=payroll.absent_days,
            overtime_hours=payroll.overtime_hours,
            
            generated_date=datetime.now()
        )
        
        return payslip_data
    
    def generate_payslip_html(self, payroll_id: int, include_company_logo: bool = True) -> str:
        """Generate HTML payslip"""
        
        payslip_data = self.generate_payslip(payroll_id, include_company_logo, "HTML")
        
        # Generate HTML content
        html_content = self._generate_html_payslip(payslip_data)
        
        return html_content
    
    def generate_payslip_pdf(self, payroll_id: int, include_company_logo: bool = True) -> bytes:
        """Generate PDF payslip"""
        
        # For now, generate HTML and convert to PDF
        # In a real implementation, you'd use a proper PDF library like ReportLab or WeasyPrint
        html_content = self.generate_payslip_html(payroll_id, include_company_logo)
        
        # This is a placeholder - in reality, you'd convert HTML to PDF
        # For now, return HTML content as bytes
        return html_content.encode('utf-8')
    
    def _get_allowances(self, payroll_id: int) -> list:
        """Get detailed allowances for payroll"""
        
        allowances = self.db.query(Allowance).filter(
            Allowance.payroll_id == payroll_id
        ).all()
        
        return [
            AllowanceBase(
                allowance_type=allowance.allowance_type,
                amount=allowance.amount,
                description=allowance.description,
                is_taxable=allowance.is_taxable
            ) for allowance in allowances
        ]
    
    def _get_deductions(self, payroll_id: int) -> list:
        """Get detailed deductions for payroll"""
        
        deductions = self.db.query(Deduction).filter(
            Deduction.payroll_id == payroll_id
        ).all()
        
        return [
            DeductionBase(
                deduction_type=deduction.deduction_type,
                amount=deduction.amount,
                description=deduction.description,
                reference_number=deduction.reference_number
            ) for deduction in deductions
        ]
    
    def _generate_html_payslip(self, payslip_data: PayslipData) -> str:
        """Generate HTML payslip content"""
        
        html_template = f"""
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>قسيمة الراتب - {payslip_data.employee_info['name']}</title>
            <style>
                body {{
                    font-family: 'Arial', sans-serif;
                    margin: 0;
                    padding: 20px;
                    background-color: #f5f5f5;
                    direction: rtl;
                }}
                .payslip-container {{
                    max-width: 800px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 10px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                }}
                .header {{
                    background: linear-gradient(135deg, #1e3c72, #2a5298);
                    color: white;
                    padding: 30px;
                    text-align: center;
                }}
                .company-info h1 {{
                    margin: 0 0 10px 0;
                    font-size: 24px;
                    font-weight: bold;
                }}
                .company-info p {{
                    margin: 0;
                    opacity: 0.9;
                }}
                .payslip-title {{
                    font-size: 20px;
                    margin: 20px 0 10px 0;
                    font-weight: bold;
                }}
                .employee-section, .salary-section, .deductions-section, .summary-section {{
                    padding: 25px 30px;
                    border-bottom: 1px solid #eee;
                }}
                .section-title {{
                    font-size: 18px;
                    font-weight: bold;
                    color: #2a5298;
                    margin-bottom: 20px;
                    border-bottom: 2px solid #2a5298;
                    padding-bottom: 10px;
                }}
                .info-grid {{
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 15px;
                }}
                .info-item {{
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 1px solid #f0f0f0;
                }}
                .info-label {{
                    font-weight: bold;
                    color: #555;
                }}
                .info-value {{
                    color: #333;
                    font-weight: 500;
                }}
                .table-container {{
                    overflow-x: auto;
                    margin: 20px 0;
                }}
                table {{
                    width: 100%;
                    border-collapse: collapse;
                    background: white;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                }}
                th, td {{
                    padding: 12px 15px;
                    text-align: right;
                    border-bottom: 1px solid #eee;
                }}
                th {{
                    background: #f8f9fa;
                    font-weight: bold;
                    color: #2a5298;
                }}
                .amount {{
                    font-family: 'Courier New', monospace;
                    font-weight: bold;
                }}
                .total-row {{
                    background: #e8f4f8;
                    font-weight: bold;
                }}
                .net-salary {{
                    background: linear-gradient(135deg, #28a745, #20c997);
                    color: white;
                    font-size: 18px;
                    font-weight: bold;
                }}
                .footer {{
                    background: #f8f9fa;
                    padding: 20px 30px;
                    text-align: center;
                    color: #666;
                    font-size: 12px;
                }}
                .attendance-info {{
                    display: flex;
                    justify-content: space-around;
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    margin: 15px 0;
                }}
                .attendance-item {{
                    text-align: center;
                }}
                .attendance-number {{
                    font-size: 24px;
                    font-weight: bold;
                    color: #2a5298;
                }}
                .attendance-label {{
                    font-size: 12px;
                    color: #666;
                    margin-top: 5px;
                }}
                @media print {{
                    body {{ background: white; }}
                    .payslip-container {{ box-shadow: none; }}
                }}
            </style>
        </head>
        <body>
            <div class="payslip-container">
                <!-- Header -->
                <div class="header">
                    <div class="company-info">
                        <h1>{payslip_data.company_name}</h1>
                        <p>{payslip_data.company_address}</p>
                    </div>
                    <div class="payslip-title">قسيمة الراتب</div>
                    <p>الفترة: {payslip_data.payroll_period}</p>
                </div>

                <!-- Employee Information -->
                <div class="employee-section">
                    <div class="section-title">معلومات الموظف</div>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">اسم الموظف:</span>
                            <span class="info-value">{payslip_data.employee_info['name']}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">رقم الموظف:</span>
                            <span class="info-value">{payslip_data.employee_info['employee_id']}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">الجنسية:</span>
                            <span class="info-value">{payslip_data.employee_info['nationality']}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">المهنة:</span>
                            <span class="info-value">{payslip_data.employee_info['job_title']}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">الفرع:</span>
                            <span class="info-value">{payslip_data.employee_info['branch'] or 'غير محدد'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">القسم:</span>
                            <span class="info-value">{payslip_data.employee_info['department'] or 'غير محدد'}</span>
                        </div>
                    </div>
                </div>

                <!-- Attendance Information -->
                <div class="employee-section">
                    <div class="section-title">معلومات الحضور</div>
                    <div class="attendance-info">
                        <div class="attendance-item">
                            <div class="attendance-number">{payslip_data.working_days}</div>
                            <div class="attendance-label">أيام العمل</div>
                        </div>
                        <div class="attendance-item">
                            <div class="attendance-number">{payslip_data.present_days}</div>
                            <div class="attendance-label">أيام الحضور</div>
                        </div>
                        <div class="attendance-item">
                            <div class="attendance-number">{payslip_data.absent_days}</div>
                            <div class="attendance-label">أيام الغياب</div>
                        </div>
                        <div class="attendance-item">
                            <div class="attendance-number">{float(payslip_data.overtime_hours):.1f}</div>
                            <div class="attendance-label">ساعات العمل الإضافي</div>
                        </div>
                    </div>
                </div>

                <!-- Salary Details -->
                <div class="salary-section">
                    <div class="section-title">تفاصيل الراتب</div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>البند</th>
                                    <th>الوصف</th>
                                    <th>المبلغ (ريال)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><strong>الراتب الأساسي</strong></td>
                                    <td>الراتب الأساسي الشهري</td>
                                    <td class="amount">{float(payslip_data.basic_salary):,.2f}</td>
                                </tr>
                                """
        
        # Add allowances
        for allowance in payslip_data.allowances:
            html_template += f"""
                                <tr>
                                    <td>البدلات</td>
                                    <td>{allowance.allowance_type.value} - {allowance.description or ''}</td>
                                    <td class="amount">{float(allowance.amount):,.2f}</td>
                                </tr>
                                """
        
        # Add overtime if exists
        if payslip_data.overtime_hours > 0:
            overtime_amount = sum(float(allowance.amount) for allowance in payslip_data.allowances 
                                if allowance.allowance_type.value == "OVERTIME")
            html_template += f"""
                                <tr>
                                    <td>العمل الإضافي</td>
                                    <td>{float(payslip_data.overtime_hours):.1f} ساعة</td>
                                    <td class="amount">{overtime_amount:,.2f}</td>
                                </tr>
                                """
        
        html_template += f"""
                                <tr class="total-row">
                                    <td colspan="2"><strong>إجمالي المستحقات</strong></td>
                                    <td class="amount"><strong>{float(payslip_data.gross_salary):,.2f}</strong></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Deductions -->
                <div class="deductions-section">
                    <div class="section-title">الخصومات</div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>البند</th>
                                    <th>الوصف</th>
                                    <th>المبلغ (ريال)</th>
                                </tr>
                            </thead>
                            <tbody>
                                """
        
        # Add deductions
        for deduction in payslip_data.deductions:
            html_template += f"""
                                <tr>
                                    <td>{deduction.deduction_type.value}</td>
                                    <td>{deduction.description or ''} {deduction.reference_number or ''}</td>
                                    <td class="amount">{float(deduction.amount):,.2f}</td>
                                </tr>
                                """
        
        html_template += f"""
                                <tr class="total-row">
                                    <td colspan="2"><strong>إجمالي الخصومات</strong></td>
                                    <td class="amount"><strong>{float(payslip_data.total_deductions):,.2f}</strong></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Summary -->
                <div class="summary-section">
                    <div class="section-title">الملخص</div>
                    <div class="table-container">
                        <table>
                            <tbody>
                                <tr>
                                    <td><strong>إجمالي المستحقات</strong></td>
                                    <td class="amount"><strong>{float(payslip_data.gross_salary):,.2f}</strong></td>
                                </tr>
                                <tr>
                                    <td><strong>إجمالي الخصومات</strong></td>
                                    <td class="amount"><strong>{float(payslip_data.total_deductions):,.2f}</strong></td>
                                </tr>
                                <tr class="net-salary">
                                    <td><strong>صافي الراتب</strong></td>
                                    <td class="amount"><strong>{float(payslip_data.net_salary):,.2f}</strong></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Footer -->
                <div class="footer">
                    <p>تم إصدار هذه القسيمة في {payslip_data.generated_date.strftime('%Y-%m-%d %H:%M:%S')}</p>
                    <p>هذه القسيمة صادرة من نظام نور الذهبي للموارد البشرية</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html_template