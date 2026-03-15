import { useState } from 'react';
import { BarChart3, Download, RefreshCw, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PayrollActionsProps {
  selectedRecords: number[];
  onApprove: (ids: number[]) => void;
  onGenerateReport: (type: string) => void;
  onSyncAttendance: () => void;
}

export function PayrollActions({ selectedRecords, onApprove, onGenerateReport, onSyncAttendance }: PayrollActionsProps) {
  const { t } = useTranslation();
  const [isReportDropdownOpen, setIsReportDropdownOpen] = useState(false);

  const reportTypes = [
    { key: 'MONTHLY', label: 'Monthly Payroll Report' },
    { key: 'EMPLOYEE', label: 'Employee Salary Report' },
    { key: 'CLIENT', label: 'Client/Project Payroll Cost' },
    { key: 'BRANCH', label: 'Branch Payroll Report' },
    { key: 'OVERTIME', label: 'Overtime Report' },
    { key: 'DEDUCTIONS', label: 'Deductions Report' }
  ];

  return (
    <div className="bg-gn-surface/50 border border-gn-surface rounded-xl p-6 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-white">{t('Payroll Actions')}</h3>
        <div className="text-sm text-gray-400">
          {selectedRecords.length} {t('selected records')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Approve Selected */}
        <button
          onClick={() => onApprove(selectedRecords)}
          disabled={selectedRecords.length === 0}
          className="bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg px-4 py-3 text-sm font-medium hover:bg-green-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          {t('Approve Selected')} ({selectedRecords.length})
        </button>

        {/* Generate Reports */}
        <div className="relative">
          <button
            onClick={() => setIsReportDropdownOpen(!isReportDropdownOpen)}
            className="w-full bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg px-4 py-3 text-sm font-medium hover:bg-blue-500/30 transition flex items-center justify-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            {t('Generate Report')}
          </button>

          {isReportDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-gn-blackLight border border-gn-surface rounded-lg shadow-lg z-10">
              {reportTypes.map((reportType) => (
                <button
                  key={reportType.key}
                  onClick={() => {
                    onGenerateReport(reportType.key);
                    setIsReportDropdownOpen(false);
                  }}
                  className="w-full px-4 py-3 text-right text-white hover:bg-gn-surface/30 transition text-sm"
                >
                  {t(reportType.label)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sync Attendance */}
        <button
          onClick={onSyncAttendance}
          className="bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg px-4 py-3 text-sm font-medium hover:bg-purple-500/30 transition flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {t('Sync Attendance')}
        </button>

        {/* Export Data */}
        <button
          onClick={() => onGenerateReport('MONTHLY')}
          className="bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg px-4 py-3 text-sm font-medium hover:bg-orange-500/30 transition flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          {t('Export Data')}
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gn-surface">
        <div className="text-center">
          <div className="text-2xl font-bold text-gn-gold">0</div>
          <div className="text-sm text-gray-400">{t('Draft')}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">0</div>
          <div className="text-sm text-gray-400">{t('Calculated')}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">0</div>
          <div className="text-sm text-gray-400">{t('Approved')}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-400">0</div>
          <div className="text-sm text-gray-400">{t('Paid')}</div>
        </div>
      </div>
    </div>
  );
}