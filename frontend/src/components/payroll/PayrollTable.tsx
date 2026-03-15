import { useState } from 'react';
import { Edit, Trash2, Calculator, Lock, CheckCircle, Eye, Printer, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Worker {
  id: number;
  name: string;
  employee_id: string;
  nationality: string;
  job_title: string;
  profession: string;
  branch: string;
  department: string;
  contract_type: string;
  employment_status: string;
  hire_date: string;
  salary: number;
}

interface PayrollRecord {
  id: number;
  worker_id: number;
  period_id: number;
  worker: Worker;
  basic_salary: number;
  housing_allowance: number;
  transportation_allowance: number;
  food_allowance: number;
  other_allowances: number;
  total_allowances: number;
  overtime_hours: number;
  overtime_rate: number;
  overtime_amount: number;
  absence_deduction: number;
  late_deduction: number;
  loan_deduction: number;
  advance_deduction: number;
  penalty_deduction: number;
  gosi_deduction: number;
  other_deductions: number;
  total_deductions: number;
  gross_salary: number;
  net_salary: number;
  company_profit: number;
  status: string;
  is_paid: boolean;
  working_days: number;
  present_days: number;
  absent_days: number;
  created_at: string;
  updated_at: string;
}

interface PayrollTableProps {
  records: PayrollRecord[];
  workers: Worker[];
  loading: boolean;
  onEdit: (record: PayrollRecord) => void;
  onDelete: (id: number) => void;
  onCalculate: (id: number) => void;
  onLock: (id: number) => void;
  onMarkAsPaid: (id: number) => void;
  onGeneratePayslip: (id: number) => void;
}

export function PayrollTable({ 
  records, 
  workers, 
  loading, 
  onEdit, 
  onDelete, 
  onCalculate, 
  onLock, 
  onMarkAsPaid, 
  onGeneratePayslip 
}: PayrollTableProps) {
  const { t } = useTranslation();
  const [selectedRecords, setSelectedRecords] = useState<number[]>([]);
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'text-yellow-400';
      case 'CALCULATED': return 'text-blue-400';
      case 'APPROVED': return 'text-green-400';
      case 'LOCKED': return 'text-purple-400';
      case 'PAID': return 'text-emerald-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      'DRAFT': 'bg-yellow-500/20 text-yellow-400',
      'CALCULATED': 'bg-blue-500/20 text-blue-400',
      'APPROVED': 'bg-green-500/20 text-green-400',
      'LOCKED': 'bg-purple-500/20 text-purple-400',
      'PAID': 'bg-emerald-500/20 text-emerald-400'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRecords(records.map(r => r.id));
    } else {
      setSelectedRecords([]);
    }
  };

  const handleSelectRecord = (id: number) => {
    setSelectedRecords(prev => 
      prev.includes(id) 
        ? prev.filter(rid => rid !== id)
        : [...prev, id]
    );
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getActionButtons = (record: PayrollRecord) => {
    const buttons = [];

    // View/Edit button
    buttons.push({
      icon: Eye,
      label: t('View'),
      onClick: () => onEdit(record),
      color: 'text-blue-400 hover:bg-blue-500/10'
    });

    // Calculate button (for draft records)
    if (record.status === 'DRAFT') {
      buttons.push({
        icon: Calculator,
        label: t('Calculate'),
        onClick: () => onCalculate(record.id),
        color: 'text-orange-400 hover:bg-orange-500/10'
      });
    }

    // Lock button (for calculated records)
    if (record.status === 'CALCULATED') {
      buttons.push({
        icon: Lock,
        label: t('Lock'),
        onClick: () => onLock(record.id),
        color: 'text-purple-400 hover:bg-purple-500/10'
      });
    }

    // Mark as Paid button (for locked records)
    if (record.status === 'LOCKED' && !record.is_paid) {
      buttons.push({
        icon: CheckCircle,
        label: t('Mark as Paid'),
        onClick: () => onMarkAsPaid(record.id),
        color: 'text-green-400 hover:bg-green-500/10'
      });
    }

    // Generate Payslip button (for approved/locked/paid records)
    if (['APPROVED', 'LOCKED', 'PAID'].includes(record.status)) {
      buttons.push({
        icon: Printer,
        label: t('Payslip'),
        onClick: () => onGeneratePayslip(record.id),
        color: 'text-indigo-400 hover:bg-indigo-500/10'
      });
    }

    // Delete button (for draft records only)
    if (record.status === 'DRAFT') {
      buttons.push({
        icon: Trash2,
        label: t('Delete'),
        onClick: () => onDelete(record.id),
        color: 'text-red-400 hover:bg-red-500/10'
      });
    }

    return buttons;
  };

  if (loading) {
    return (
      <div className="bg-gn-surface/50 border border-gn-surface rounded-xl p-8 shadow-lg">
        <div className="text-center text-gray-400">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gn-gold mx-auto mb-4"></div>
          <p>{t('Loading payroll data...')}</p>
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="bg-gn-surface/50 border border-gn-surface rounded-xl p-8 shadow-lg">
        <div className="text-center text-gray-400">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-medium mb-2">{t('No payroll records found')}</h3>
          <p>{t('No payroll records match your current filters.')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gn-surface/50 border border-gn-surface rounded-xl shadow-lg overflow-hidden">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gn-surface flex justify-between items-center">
        <h3 className="text-lg font-bold text-white">
          {t('Payroll Records')} ({records.length})
        </h3>
        <div className="text-sm text-gray-400">
          {selectedRecords.length} {t('selected')}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gn-blackLight/50">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={selectedRecords.length === records.length && records.length > 0}
                  className="rounded border-gray-300 text-gn-gold focus:ring-gn-gold"
                />
              </th>
              <th className="px-4 py-3 text-left text-gn-goldLight font-medium cursor-pointer" onClick={() => handleSort('worker.name')}>
                {t('Employee')} {sortField === 'worker.name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 text-left text-gn-goldLight font-medium cursor-pointer" onClick={() => handleSort('worker.employee_id')}>
                {t('Employee ID')} {sortField === 'worker.employee_id' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 text-left text-gn-goldLight font-medium">{t('Branch')}</th>
              <th className="px-4 py-3 text-left text-gn-goldLight font-medium">{t('Department')}</th>
              <th className="px-4 py-3 text-left text-gn-goldLight font-medium cursor-pointer" onClick={() => handleSort('basic_salary')}>
                {t('Basic Salary')} {sortField === 'basic_salary' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 text-left text-gn-goldLight font-medium cursor-pointer" onClick={() => handleSort('net_salary')}>
                {t('Net Salary')} {sortField === 'net_salary' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 text-left text-gn-goldLight font-medium">{t('Status')}</th>
              <th className="px-4 py-3 text-left text-gn-goldLight font-medium">{t('Paid')}</th>
              <th className="px-4 py-3 text-left text-gn-goldLight font-medium">{t('Actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gn-surface">
            {records.map((record) => (
              <tr key={record.id} className="hover:bg-gn-blackLight/30 transition-colors">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedRecords.includes(record.id)}
                    onChange={() => handleSelectRecord(record.id)}
                    className="rounded border-gray-300 text-gn-gold focus:ring-gn-gold"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gn-gold/10 flex items-center justify-center mr-3 text-gn-gold font-bold">
                      {record.worker.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-white">{record.worker.name}</div>
                      <div className="text-sm text-gray-400">{record.worker.job_title}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-white">{record.worker.employee_id}</td>
                <td className="px-4 py-3 text-gray-300">{record.worker.branch || '-'}</td>
                <td className="px-4 py-3 text-gray-300">{record.worker.department || '-'}</td>
                <td className="px-4 py-3 text-white font-medium">{formatCurrency(record.basic_salary)}</td>
                <td className="px-4 py-3 text-green-400 font-bold">{formatCurrency(record.net_salary)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(record.status)}`}>
                    {t(record.status)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {record.is_paid ? (
                    <span className="text-green-400">✓</span>
                  ) : (
                    <span className="text-gray-400">✗</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {getActionButtons(record).map((button, index) => (
                      <button
                        key={index}
                        onClick={button.onClick}
                        className={`p-2 rounded-lg transition ${button.color}`}
                        title={button.label}
                      >
                        <button.icon className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="px-6 py-4 border-t border-gn-surface bg-gn-blackLight/30">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-400">
            {t('Showing')} {records.length} {t('of')} {records.length} {t('records')}
          </div>
          <div className="text-sm text-gray-400">
            {t('Total Net Salary')}: {formatCurrency(records.reduce((sum, record) => sum + record.net_salary, 0))}
          </div>
        </div>
      </div>
    </div>
  );
}