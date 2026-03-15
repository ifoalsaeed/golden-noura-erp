import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PayrollFiltersProps {
  filters: {
    month: number;
    year: number;
    status: string;
    employee_name: string;
    employee_id: string;
    branch: string;
    department: string;
    project: string;
  };
  onFiltersChange: (filters: any) => void;
  onClose: () => void;
}

export function PayrollFilters({ filters, onFiltersChange, onClose }: PayrollFiltersProps) {
  const { t } = useTranslation();
  const [localFilters, setLocalFilters] = useState(filters);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange(localFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      status: '',
      employee_name: '',
      employee_id: '',
      branch: '',
      department: '',
      project: ''
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  return (
    <div className="bg-gn-surface/50 border border-gn-surface rounded-xl p-6 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-white">{t('Filters')}</h3>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Month and Year */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t('Month')}
            </label>
            <select
              value={localFilters.month}
              onChange={(e) => setLocalFilters({...localFilters, month: parseInt(e.target.value)})}
              className="w-full bg-gn-blackLight border border-gn-surface rounded-lg px-4 py-3 text-white focus:border-gn-gold outline-none"
            >
              {Array.from({length: 12}, (_, i) => (
                <option key={i + 1} value={i + 1}>{t(`month.${i}`)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t('Year')}
            </label>
            <select
              value={localFilters.year}
              onChange={(e) => setLocalFilters({...localFilters, year: parseInt(e.target.value)})}
              className="w-full bg-gn-blackLight border border-gn-surface rounded-lg px-4 py-3 text-white focus:border-gn-gold outline-none"
            >
              {Array.from({length: 10}, (_, i) => {
                const year = new Date().getFullYear() - 5 + i;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t('Status')}
            </label>
            <select
              value={localFilters.status}
              onChange={(e) => setLocalFilters({...localFilters, status: e.target.value})}
              className="w-full bg-gn-blackLight border border-gn-surface rounded-lg px-4 py-3 text-white focus:border-gn-gold outline-none"
            >
              <option value="">{t('All Statuses')}</option>
              <option value="DRAFT">{t('Draft')}</option>
              <option value="CALCULATED">{t('Calculated')}</option>
              <option value="APPROVED">{t('Approved')}</option>
              <option value="LOCKED">{t('Locked')}</option>
              <option value="PAID">{t('Paid')}</option>
            </select>
          </div>

          {/* Payment Status */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t('Payment Status')}
            </label>
            <select
              value={localFilters.is_paid ? 'paid' : localFilters.is_paid === false ? 'unpaid' : ''}
              onChange={(e) => {
                const value = e.target.value;
                setLocalFilters({
                  ...localFilters, 
                  is_paid: value === '' ? undefined : value === 'paid'
                });
              }}
              className="w-full bg-gn-blackLight border border-gn-surface rounded-lg px-4 py-3 text-white focus:border-gn-gold outline-none"
            >
              <option value="">{t('All')}</option>
              <option value="paid">{t('Paid')}</option>
              <option value="unpaid">{t('Unpaid')}</option>
            </select>
          </div>
        </div>

        {/* Search Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t('Employee Name')}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={localFilters.employee_name}
                onChange={(e) => setLocalFilters({...localFilters, employee_name: e.target.value})}
                placeholder={t('Search by employee name')}
                className="w-full bg-gn-blackLight border border-gn-surface rounded-lg pl-10 pr-4 py-3 text-white focus:border-gn-gold outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t('Employee ID')}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={localFilters.employee_id}
                onChange={(e) => setLocalFilters({...localFilters, employee_id: e.target.value})}
                placeholder={t('Search by employee ID')}
                className="w-full bg-gn-blackLight border border-gn-surface rounded-lg pl-10 pr-4 py-3 text-white focus:border-gn-gold outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t('Branch')}
            </label>
            <input
              type="text"
              value={localFilters.branch}
              onChange={(e) => setLocalFilters({...localFilters, branch: e.target.value})}
              placeholder={t('Filter by branch')}
              className="w-full bg-gn-blackLight border border-gn-surface rounded-lg px-4 py-3 text-white focus:border-gn-gold outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t('Department')}
            </label>
            <input
              type="text"
              value={localFilters.department}
              onChange={(e) => setLocalFilters({...localFilters, department: e.target.value})}
              placeholder={t('Filter by department')}
              className="w-full bg-gn-blackLight border border-gn-surface rounded-lg px-4 py-3 text-white focus:border-gn-gold outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t('Project')}
            </label>
            <input
              type="text"
              value={localFilters.project}
              onChange={(e) => setLocalFilters({...localFilters, project: e.target.value})}
              placeholder={t('Filter by project')}
              className="w-full bg-gn-blackLight border border-gn-surface rounded-lg px-4 py-3 text-white focus:border-gn-gold outline-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={handleReset}
            className="px-6 py-2 border border-gray-500 text-gray-400 rounded-lg hover:bg-gray-700 transition"
          >
            {t('Reset')}
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-gn-gold text-gn-black font-bold rounded-lg hover:bg-gn-goldDark transition"
          >
            {t('Apply Filters')}
          </button>
        </div>
      </form>
    </div>
  );
}