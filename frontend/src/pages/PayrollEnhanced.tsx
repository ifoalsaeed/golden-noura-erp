import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  DollarSign, User, Calendar, Plus, RefreshCw, CheckCircle, Clock, 
  Trash2, Edit, Download, Filter, BarChart3, FileText, Settings,
  Calculator, Lock, Eye, Printer, Search, ChevronDown
} from 'lucide-react';
import DataEntryModal from '../components/common/DataEntryModal';
import { PayrollFilters } from '../components/payroll/PayrollFilters';
import { PayrollTable } from '../components/payroll/PayrollTable';
import { PayrollStats } from '../components/payroll/PayrollStats';
import { PayrollActions } from '../components/payroll/PayrollActions';
import { PayrollPeriodSelector } from '../components/payroll/PayrollPeriodSelector';

const API_URL = import.meta.env.VITE_API_URL || '';

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

interface PayrollPeriod {
  id: number;
  month: number;
  year: number;
  status: string;
  total_employees: number;
  total_payroll_cost: number;
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

interface PayrollStats {
  total_employees: number;
  total_payroll_cost: number;
  average_salary: number;
  total_overtime: number;
  total_deductions: number;
  total_company_profit: number;
  by_status: Record<string, number>;
  by_branch: Record<string, number>;
  by_department: Record<string, number>;
}

export default function Payroll() {
  const { t } = useTranslation();
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
  const [statistics, setStatistics] = useState<PayrollStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    status: '',
    employee_name: '',
    employee_id: '',
    branch: '',
    department: '',
    project: ''
  });

  // Fetch data
  const fetchData = async () => {
    try {
      setFetching(true);
      
      // Fetch payroll records
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      
      const [payrollRes, workersRes, periodsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/payroll-enhanced/?${params}`),
        fetch(`${API_URL}/api/v1/workers/`),
        fetch(`${API_URL}/api/v1/payroll-enhanced/periods/`),
        fetch(`${API_URL}/api/v1/payroll-enhanced/statistics/`)
      ]);
      
      if (payrollRes.ok) {
        const payrollData = await payrollRes.json();
        setRecords(payrollData);
      }
      
      if (workersRes.ok) {
        const workersData = await workersRes.json();
        setWorkers(workersData);
      }
      
      if (periodsRes.ok) {
        const periodsData = await periodsRes.json();
        setPeriods(periodsData);
        
        // Set current period if not selected
        if (!selectedPeriod && periodsData.length > 0) {
          const currentPeriod = periodsData.find(p => 
            p.month === filters.month && p.year === filters.year
          ) || periodsData[0];
          setSelectedPeriod(currentPeriod);
        }
      }
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStatistics(statsData);
      }
      
    } catch (error) {
      console.error('Error fetching payroll data:', error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  // Handle actions
  const handleGeneratePayroll = async () => {
    if (!selectedPeriod) {
      alert(t('Please select a payroll period'));
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/api/v1/payroll-enhanced/generate/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period_id: selectedPeriod.id,
          include_overtime: true,
          include_deductions: true,
          include_expenses: true
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        fetchData();
      } else {
        const error = await response.json();
        alert(error.detail || t('Failed to generate payroll'));
      }
      
    } catch (error) {
      console.error('Error generating payroll:', error);
      alert(t('Error generating payroll'));
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayroll = async (payrollIds: number[]) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/payroll-enhanced/approve/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payroll_ids: payrollIds })
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        fetchData();
      }
      
    } catch (error) {
      console.error('Error approving payroll:', error);
      alert(t('Error approving payroll'));
    }
  };

  const handleCalculatePayroll = async (payrollId: number) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/payroll-enhanced/calculate/${payrollId}/`, {
        method: 'POST'
      });
      
      if (response.ok) {
        alert(t('Payroll calculated successfully'));
        fetchData();
      }
      
    } catch (error) {
      console.error('Error calculating payroll:', error);
      alert(t('Error calculating payroll'));
    }
  };

  const handleLockPayroll = async (payrollId: number) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/payroll-enhanced/lock/${payrollId}/`, {
        method: 'POST'
      });
      
      if (response.ok) {
        alert(t('Payroll locked successfully'));
        fetchData();
      }
      
    } catch (error) {
      console.error('Error locking payroll:', error);
      alert(t('Error locking payroll'));
    }
  };

  const handleMarkAsPaid = async (payrollId: number) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/payroll-enhanced/${payrollId}/pay/`, {
        method: 'POST'
      });
      
      if (response.ok) {
        alert(t('Payroll marked as paid'));
        fetchData();
      }
      
    } catch (error) {
      console.error('Error marking as paid:', error);
      alert(t('Error marking as paid'));
    }
  };

  const handleGeneratePayslip = async (payrollId: number) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/payroll-enhanced/payslip/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payroll_id: payrollId,
          format: 'PDF'
        })
      });
      
      if (response.ok) {
        const payslipData = await response.json();
        
        // Create a new window with the payslip
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(payslipData.html_content || payslipData);
          printWindow.document.close();
          printWindow.print();
        }
      }
      
    } catch (error) {
      console.error('Error generating payslip:', error);
      alert(t('Error generating payslip'));
    }
  };

  const handleGenerateReport = async (reportType: string) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/payroll-enhanced/reports/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_type: reportType,
          filters: filters,
          format: 'EXCEL'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`${t('Report generated')}: ${result.report_name}`);
        
        // Download the report
        if (result.file_path) {
          window.open(`${API_URL}${result.file_path}`, '_blank');
        }
      }
      
    } catch (error) {
      console.error('Error generating report:', error);
      alert(t('Error generating report'));
    }
  };

  const handleEditPayroll = (record: PayrollRecord) => {
    setSelectedRecord(record);
    setIsEditModalOpen(true);
  };

  const handleDeletePayroll = async (payrollId: number) => {
    if (!window.confirm(t('Are you sure you want to delete this payroll record?'))) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/v1/payroll-enhanced/${payrollId}/`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        alert(t('Payroll record deleted successfully'));
        fetchData();
      }
      
    } catch (error) {
      console.error('Error deleting payroll:', error);
      alert(t('Error deleting payroll'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">{t('Payroll Management')}</h2>
        <div className="flex gap-4">
          <button 
            onClick={fetchData}
            className="p-2 bg-gn-surface border border-gn-surface rounded-lg text-gray-400 hover:text-gn-gold transition"
            disabled={fetching}
          >
            <RefreshCw className={`w-5 h-5 ${fetching ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="p-2 bg-gn-surface border border-gn-surface rounded-lg text-gray-400 hover:text-gn-gold transition"
          >
            <Filter className="w-5 h-5" />
          </button>
          <button 
            onClick={handleGeneratePayroll}
            className="bg-gn-gold hover:bg-gn-goldDark text-gn-black font-bold py-2 px-6 rounded-lg flex items-center transition shadow-lg"
            disabled={loading || !selectedPeriod}
          >
            <Calculator className="w-5 h-5 mr-2 ml-2" /> {t('Generate Payroll')}
          </button>
        </div>
      </div>

      {/* Payroll Period Selector */}
      <PayrollPeriodSelector
        periods={periods}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        onRefresh={fetchData}
      />

      {/* Filters */}
      {isFiltersOpen && (
        <PayrollFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClose={() => setIsFiltersOpen(false)}
        />
      )}

      {/* Statistics */}
      {statistics && (
        <PayrollStats
          statistics={statistics}
          selectedPeriod={selectedPeriod}
        />
      )}

      {/* Payroll Actions */}
      <PayrollActions
        selectedRecords={records.filter(r => 
          r.period_id === selectedPeriod?.id && 
          (r.status === 'DRAFT' || r.status === 'CALCULATED')
        ).map(r => r.id)}
        onApprove={handleApprovePayroll}
        onGenerateReport={handleGenerateReport}
        onSyncAttendance={async () => {
          if (selectedPeriod) {
            try {
              await fetch(`${API_URL}/api/v1/payroll-enhanced/sync-attendance/${selectedPeriod.id}/`, {
                method: 'POST'
              });
              alert(t('Attendance data synchronized'));
              fetchData();
            } catch (error) {
              console.error('Error syncing attendance:', error);
              alert(t('Error syncing attendance'));
            }
          }
        }}
      />

      {/* Payroll Table */}
      <PayrollTable
        records={records.filter(r => r.period_id === selectedPeriod?.id)}
        workers={workers}
        loading={fetching}
        onEdit={handleEditPayroll}
        onDelete={handleDeletePayroll}
        onCalculate={handleCalculatePayroll}
        onLock={handleLockPayroll}
        onMarkAsPaid={handleMarkAsPaid}
        onGeneratePayslip={handleGeneratePayslip}
      />

      {/* Edit Modal */}
      {isEditModalOpen && selectedRecord && (
        <PayrollEditModal
          record={selectedRecord}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={async (updatedData) => {
            try {
              const response = await fetch(`${API_URL}/api/v1/payroll-enhanced/${selectedRecord.id}/`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
              });
              
              if (response.ok) {
                alert(t('Payroll updated successfully'));
                setIsEditModalOpen(false);
                fetchData();
              }
              
            } catch (error) {
              console.error('Error updating payroll:', error);
              alert(t('Error updating payroll'));
            }
          }}
        />
      )}
    </div>
  );
}