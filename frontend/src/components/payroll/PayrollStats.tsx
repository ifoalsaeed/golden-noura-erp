import { useState } from 'react';
import { BarChart3, Users, DollarSign, Clock, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PayrollStatsProps {
  statistics: {
    total_employees: number;
    total_payroll_cost: number;
    average_salary: number;
    total_overtime: number;
    total_deductions: number;
    total_company_profit: number;
    by_status: Record<string, number>;
    by_branch: Record<string, number>;
    by_department: Record<string, number>;
  };
  selectedPeriod: any;
}

export function PayrollStats({ statistics, selectedPeriod }: PayrollStatsProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'overview' | 'status' | 'breakdown'>('overview');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'text-gn-gold' }: any) => (
    <div className="bg-gn-blackLight border border-gn-surface rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-gn-gold/10 ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{value}</div>
          <div className="text-sm text-gray-400">{subtitle}</div>
        </div>
      </div>
      <div className="text-sm font-medium text-gray-300">{title}</div>
    </div>
  );

  return (
    <div className="bg-gn-surface/50 border border-gn-surface rounded-xl p-6 shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-white">{t('Payroll Statistics')}</h3>
        <div className="flex bg-gn-blackLight rounded-lg p-1">
          {[
            { key: 'overview', label: t('Overview') },
            { key: 'status', label: t('By Status') },
            { key: 'breakdown', label: t('Breakdown') }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                activeTab === tab.key
                  ? 'bg-gn-gold text-gn-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Users}
            title={t('Total Employees')}
            value={statistics.total_employees}
            subtitle={t('Active employees')}
            color="text-blue-400"
          />
          
          <StatCard
            icon={DollarSign}
            title={t('Total Payroll Cost')}
            value={formatCurrency(statistics.total_payroll_cost)}
            subtitle={t('For selected period')}
            color="text-green-400"
          />
          
          <StatCard
            icon={TrendingUp}
            title={t('Average Salary')}
            value={formatCurrency(statistics.average_salary)}
            subtitle={t('Per employee')}
            color="text-purple-400"
          />
          
          <StatCard
            icon={Clock}
            title={t('Total Overtime')}
            value={formatCurrency(statistics.total_overtime)}
            subtitle={t('Overtime payments')}
            color="text-orange-400"
          />
        </div>
      )}

      {/* Status Tab */}
      {activeTab === 'status' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(statistics.by_status).map(([status, count]) => (
              <div key={status} className="bg-gn-blackLight border border-gn-surface rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white mb-2">{count}</div>
                <div className="text-sm text-gray-400">{t(status)}</div>
                <div className="mt-2 h-2 bg-gn-surface rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      status === 'DRAFT' ? 'bg-yellow-400' :
                      status === 'CALCULATED' ? 'bg-blue-400' :
                      status === 'APPROVED' ? 'bg-green-400' :
                      status === 'LOCKED' ? 'bg-purple-400' :
                      status === 'PAID' ? 'bg-emerald-400' : 'bg-gray-400'
                    }`}
                    style={{ width: `${Math.min(100, (count / Math.max(1, statistics.total_employees)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Breakdown Tab */}
      {activeTab === 'breakdown' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By Branch */}
          <div className="bg-gn-blackLight border border-gn-surface rounded-lg p-6">
            <h4 className="text-lg font-bold text-white mb-4">{t('By Branch')}</h4>
            <div className="space-y-3">
              {Object.entries(statistics.by_branch).map(([branch, amount]) => (
                <div key={branch} className="flex justify-between items-center">
                  <span className="text-gray-300">{branch}</span>
                  <span className="text-white font-medium">{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* By Department */}
          <div className="bg-gn-blackLight border border-gn-surface rounded-lg p-6">
            <h4 className="text-lg font-bold text-white mb-4">{t('By Department')}</h4>
            <div className="space-y-3">
              {Object.entries(statistics.by_department).map(([department, amount]) => (
                <div key={department} className="flex justify-between items-center">
                  <span className="text-gray-300">{department}</span>
                  <span className="text-white font-medium">{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-gn-surface">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400 mb-2">
              {formatCurrency(statistics.total_payroll_cost - statistics.total_deductions)}
            </div>
            <div className="text-sm text-gray-400">{t('Net Payroll Cost')}</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400 mb-2">
              {formatCurrency(statistics.total_company_profit)}
            </div>
            <div className="text-sm text-gray-400">{t('Company Profit')}</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400 mb-2">
              {((statistics.total_company_profit / Math.max(1, statistics.total_payroll_cost)) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-400">{t('Profit Margin')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}