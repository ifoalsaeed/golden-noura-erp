import React, { useState } from 'react';
import { Calendar, Filter, X, ChevronDown, Users, Building2, DollarSign, FileText } from 'lucide-react';

interface ReportFiltersProps {
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
  availableFilters: string[];
}

export function ReportFilters({ filters, onFiltersChange, availableFilters }: ReportFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: filters.dateRange?.start || new Date(new Date().getFullYear(), 0, 1),
    end: filters.dateRange?.end || new Date()
  });

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    onFiltersChange({});
    setDateRange({
      start: new Date(new Date().getFullYear(), 0, 1),
      end: new Date()
    });
  };

  return (
    <div className="bg-gn-surface/50 border border-gn-surface rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gn-gold" />
          <h3 className="text-lg font-bold text-white">Report Filters</h3>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 px-3 py-1 bg-gn-blackLight/50 text-gray-300 hover:text-white rounded-lg transition text-sm"
          >
            Advanced
            <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>
          
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition text-sm"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        </div>
      </div>

      {/* Basic Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Date Range */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Date Range
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={dateRange.start.toISOString().split('T')[0]}
              onChange={(e) => {
                const newStart = new Date(e.target.value);
                setDateRange(prev => ({ ...prev, start: newStart }));
                handleFilterChange('dateRange', { ...dateRange, start: newStart });
              }}
              className="flex-1 bg-gn-blackLight/50 border border-gn-surface text-white px-3 py-2 rounded-lg text-sm"
            />
            <span className="text-gray-500 self-center">to</span>
            <input
              type="date"
              value={dateRange.end.toISOString().split('T')[0]}
              onChange={(e) => {
                const newEnd = new Date(e.target.value);
                setDateRange(prev => ({ ...prev, end: newEnd }));
                handleFilterChange('dateRange', { ...dateRange, end: newEnd });
              }}
              className="flex-1 bg-gn-blackLight/50 border border-gn-surface text-white px-3 py-2 rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Department */}
        {availableFilters.includes('department') && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Department
            </label>
            <select
              value={filters.department || ''}
              onChange={(e) => handleFilterChange('department', e.target.value)}
              className="w-full bg-gn-blackLight/50 border border-gn-surface text-white px-3 py-2 rounded-lg text-sm"
            >
              <option value="">All Departments</option>
              <option value="operations">Operations</option>
              <option value="finance">Finance</option>
              <option value="hr">Human Resources</option>
              <option value="sales">Sales</option>
              <option value="admin">Administration</option>
            </select>
          </div>
        )}

        {/* Worker Status */}
        {availableFilters.includes('worker_status') && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Worker Status
            </label>
            <select
              value={filters.workerStatus || ''}
              onChange={(e) => handleFilterChange('workerStatus', e.target.value)}
              className="w-full bg-gn-blackLight/50 border border-gn-surface text-white px-3 py-2 rounded-lg text-sm"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>
        )}

        {/* Nationality */}
        {availableFilters.includes('nationality') && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Nationality</label>
            <input
              type="text"
              value={filters.nationality || ''}
              onChange={(e) => handleFilterChange('nationality', e.target.value)}
              placeholder="Search nationality..."
              className="w-full bg-gn-blackLight/50 border border-gn-surface text-white px-3 py-2 rounded-lg text-sm"
            />
          </div>
        )}

        {/* Client Type */}
        {availableFilters.includes('client_type') && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Client Type
            </label>
            <select
              value={filters.clientType || ''}
              onChange={(e) => handleFilterChange('clientType', e.target.value)}
              className="w-full bg-gn-blackLight/50 border border-gn-surface text-white px-3 py-2 rounded-lg text-sm"
            >
              <option value="">All Types</option>
              <option value="corporate">Corporate</option>
              <option value="government">Government</option>
              <option value="individual">Individual</option>
              <option value="construction">Construction</option>
            </select>
          </div>
        )}

        {/* Contract Status */}
        {availableFilters.includes('contract_status') && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Contract Status</label>
            <select
              value={filters.contractStatus || ''}
              onChange={(e) => handleFilterChange('contractStatus', e.target.value)}
              className="w-full bg-gn-blackLight/50 border border-gn-surface text-white px-3 py-2 rounded-lg text-sm"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="pending">Pending</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="mt-6 pt-6 border-t border-gn-surface space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Transaction Type */}
            {availableFilters.includes('transaction_type') && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Transaction Type
                </label>
                <select
                  value={filters.transactionType || ''}
                  onChange={(e) => handleFilterChange('transactionType', e.target.value)}
                  className="w-full bg-gn-blackLight/50 border border-gn-surface text-white px-3 py-2 rounded-lg text-sm"
                >
                  <option value="">All Types</option>
                  <option value="revenue">Revenue</option>
                  <option value="expense">Expense</option>
                  <option value="transfer">Transfer</option>
                  <option value="adjustment">Adjustment</option>
                </select>
              </div>
            )}

            {/* Account */}
            {availableFilters.includes('account') && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Account</label>
                <input
                  type="text"
                  value={filters.account || ''}
                  onChange={(e) => handleFilterChange('account', e.target.value)}
                  placeholder="Account code or name..."
                  className="w-full bg-gn-blackLight/50 border border-gn-surface text-white px-3 py-2 rounded-lg text-sm"
                />
              </div>
            )}

            {/* Compliance Type */}
            {availableFilters.includes('compliance_type') && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Compliance Type
                </label>
                <select
                  value={filters.complianceType || ''}
                  onChange={(e) => handleFilterChange('complianceType', e.target.value)}
                  className="w-full bg-gn-blackLight/50 border border-gn-surface text-white px-3 py-2 rounded-lg text-sm"
                >
                  <option value="">All Types</option>
                  <option value="labor">Labor Law</option>
                  <option value="financial">Financial</option>
                  <option value="safety">Safety</option>
                  <option value="immigration">Immigration</option>
                </select>
              </div>
            )}

            {/* Risk Level */}
            {availableFilters.includes('risk_level') && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Risk Level</label>
                <select
                  value={filters.riskLevel || ''}
                  onChange={(e) => handleFilterChange('riskLevel', e.target.value)}
                  className="w-full bg-gn-blackLight/50 border border-gn-surface text-white px-3 py-2 rounded-lg text-sm"
                >
                  <option value="">All Levels</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            )}

            {/* Project */}
            {availableFilters.includes('project') && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Project</label>
                <input
                  type="text"
                  value={filters.project || ''}
                  onChange={(e) => handleFilterChange('project', e.target.value)}
                  placeholder="Project name or ID..."
                  className="w-full bg-gn-blackLight/50 border border-gn-surface text-white px-3 py-2 rounded-lg text-sm"
                />
              </div>
            )}

            {/* Amount Range */}
            {availableFilters.includes('amount_range') && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Amount Range (SAR)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={filters.amountMin || ''}
                    onChange={(e) => handleFilterChange('amountMin', e.target.value)}
                    placeholder="Min"
                    className="flex-1 bg-gn-blackLight/50 border border-gn-surface text-white px-3 py-2 rounded-lg text-sm"
                  />
                  <span className="text-gray-500 self-center">-</span>
                  <input
                    type="number"
                    value={filters.amountMax || ''}
                    onChange={(e) => handleFilterChange('amountMax', e.target.value)}
                    placeholder="Max"
                    className="flex-1 bg-gn-blackLight/50 border border-gn-surface text-white px-3 py-2 rounded-lg text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {Object.keys(filters).length > 0 && (
        <div className="mt-6 pt-6 border-t border-gn-surface">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-400">Active Filters</span>
            <button
              onClick={clearFilters}
              className="text-xs text-red-400 hover:text-red-300 transition"
            >
              Clear All
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {Object.entries(filters).map(([key, value]) => {
              if (!value || (Array.isArray(value) && value.length === 0)) return null;
              
              const formatFilterValue = (k: string, v: any) => {
                if (k === 'dateRange') {
                  return `${new Date(v.start).toLocaleDateString()} - ${new Date(v.end).toLocaleDateString()}`;
                }
                return String(v);
              };
              
              return (
                <div
                  key={key}
                  className="flex items-center gap-1 px-3 py-1 bg-gn-gold/20 text-gn-gold rounded-full text-sm"
                >
                  <span className="font-medium">{key}:</span>
                  <span>{formatFilterValue(key, value)}</span>
                  <button
                    onClick={() => {
                      const newFilters = { ...filters };
                      delete newFilters[key];
                      onFiltersChange(newFilters);
                    }}
                    className="ml-1 hover:text-gn-gold/80 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
