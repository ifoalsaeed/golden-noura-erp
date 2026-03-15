import { useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PayrollPeriod {
  id: number;
  month: number;
  year: number;
  status: string;
  total_employees: number;
  total_payroll_cost: number;
}

interface PayrollPeriodSelectorProps {
  periods: PayrollPeriod[];
  selectedPeriod: PayrollPeriod | null;
  onPeriodChange: (period: PayrollPeriod) => void;
  onRefresh: () => void;
}

export function PayrollPeriodSelector({ periods, selectedPeriod, onPeriodChange, onRefresh }: PayrollPeriodSelectorProps) {
  const { t } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

  return (
    <div className="bg-gn-surface/50 border border-gn-surface rounded-xl p-6 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-white">{t('Payroll Period')}</h3>
        <button
          onClick={onRefresh}
          className="p-2 text-gray-400 hover:text-gn-gold transition"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center justify-between mb-4">
        {/* Previous Period */}
        <button
          onClick={() => {
            if (selectedPeriod && periods.length > 0) {
              const currentIndex = periods.findIndex(p => p.id === selectedPeriod.id);
              if (currentIndex > 0) {
                onPeriodChange(periods[currentIndex - 1]);
              }
            }
          }}
          disabled={!selectedPeriod || periods.findIndex(p => p.id === selectedPeriod?.id) === 0}
          className="p-2 text-gray-400 hover:text-gn-gold transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Current Period Display */}
        <div className="flex-1 mx-4">
          {selectedPeriod ? (
            <div className="bg-gn-blackLight rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gn-gold mb-2">
                {selectedPeriod.month}/{selectedPeriod.year}
              </div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedPeriod.status)}`}>
                  {t(selectedPeriod.status)}
                </span>
              </div>
              <div className="text-sm text-gray-400">
                {selectedPeriod.total_employees} {t('employees')} - 
                {t('Total')}: {selectedPeriod.total_payroll_cost.toLocaleString()} {t('SAR')}
              </div>
            </div>
          ) : (
            <div className="bg-gn-blackLight rounded-lg p-4 text-center text-gray-400">
              {t('No period selected')}
            </div>
          )}
        </div>

        {/* Next Period */}
        <button
          onClick={() => {
            if (selectedPeriod && periods.length > 0) {
              const currentIndex = periods.findIndex(p => p.id === selectedPeriod.id);
              if (currentIndex < periods.length - 1) {
                onPeriodChange(periods[currentIndex + 1]);
              }
            }
          }}
          disabled={!selectedPeriod || periods.findIndex(p => p.id === selectedPeriod?.id) === periods.length - 1}
          className="p-2 text-gray-400 hover:text-gn-gold transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Period Selector Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full bg-gn-blackLight border border-gn-surface rounded-lg px-4 py-3 text-white hover:border-gn-gold transition flex items-center justify-between"
        >
          <span>{selectedPeriod ? `${selectedPeriod.month}/${selectedPeriod.year}` : t('Select Period')}</span>
          <ChevronRight className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-90' : ''}`} />
        </button>

        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-gn-blackLight border border-gn-surface rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
            {periods.map((period) => (
              <button
                key={period.id}
                onClick={() => {
                  onPeriodChange(period);
                  setIsDropdownOpen(false);
                }}
                className={`w-full px-4 py-3 text-right hover:bg-gn-surface/30 transition flex items-center justify-between ${
                  selectedPeriod?.id === period.id ? 'bg-gn-gold/20 text-gn-gold' : 'text-white'
                }`}
              >
                <div>
                  <div className="font-medium">{period.month}/{period.year}</div>
                  <div className="text-sm text-gray-400">
                    {period.total_employees} {t('employees')} - {period.total_payroll_cost.toLocaleString()} {t('SAR')}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(period.status)}`}>
                  {t(period.status)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <button className="bg-gn-gold/20 text-gn-gold border border-gn-gold/30 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gn-gold/30 transition">
          {t('New Period')}
        </button>
        <button className="bg-gn-surface text-white border border-gn-surface rounded-lg px-4 py-2 text-sm font-medium hover:bg-gn-surface/80 transition">
          {t('View History')}
        </button>
      </div>
    </div>
  );
}