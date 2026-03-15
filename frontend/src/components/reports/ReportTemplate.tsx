import React from 'react';
import { FileText, TrendingUp, Users, Building2, DollarSign, CheckCircle, AlertTriangle } from 'lucide-react';

interface ReportTemplateProps {
  template: {
    id: string;
    name: string;
    type: string;
    description: string;
    icon: React.ReactNode;
    metrics: string[];
    charts: string[];
  };
  data: any;
  isPreview?: boolean;
}

export function ReportTemplate({ template, data, isPreview = false }: ReportTemplateProps) {
  const getIconForType = (type: string) => {
    switch (type) {
      case 'financial': return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case 'operational': return <Users className="w-5 h-5 text-green-500" />;
      case 'analytical': return <Building2 className="w-5 h-5 text-purple-500" />;
      case 'compliance': return <CheckCircle className="w-5 h-5 text-orange-500" />;
      default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const renderMetricCard = (title: string, value: number, change: number, unit: string = 'SAR') => (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="text-sm text-gray-600 mb-1">{title}</div>
      <div className="text-2xl font-bold text-gray-800">
        {unit === 'SAR' ? `${unit} ` : ''}{value.toLocaleString()}
      </div>
      <div className={`text-sm flex items-center gap-1 mt-2 ${
        change >= 0 ? 'text-green-600' : 'text-red-600'
      }`}>
        {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
      </div>
    </div>
  );

  const renderChart = (type: string, data: any[], title: string) => {
    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">{title}</h4>
        <div className="h-48 flex items-center justify-center bg-gray-50 rounded border border-gray-200">
          <div className="text-gray-500 text-center">
            <div className="w-16 h-16 mx-auto mb-2 bg-gray-200 rounded-full"></div>
            <p className="text-sm">{type.charAt(0).toUpperCase() + type.slice(1)} Chart</p>
            <p className="text-xs">{data.length} data points</p>
          </div>
        </div>
      </div>
    );
  };

  const renderTable = (headers: string[], rows: any[][], title: string) => (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <h4 className="text-sm font-medium text-gray-700 mb-3">{title}</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {headers.map((header, index) => (
                <th key={index} className="text-left py-2 px-3 font-medium text-gray-700">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-gray-100 hover:bg-gray-50">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="py-2 px-3 text-gray-600">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderFinancialTemplate = () => (
    <div className="space-y-6">
      {/* Executive Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Executive Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {renderMetricCard('Total Revenue', data.summary.totalRevenue, 12.5)}
          {renderMetricCard('Total Expenses', data.summary.totalExpenses, 5.2)}
          {renderMetricCard('Net Profit', data.summary.netProfit, 8.7)}
          {renderMetricCard('Growth Rate', data.summary.growthRate, 2.3, '%')}
        </div>
      </div>

      {/* Revenue Analysis */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Revenue Analysis</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {renderChart('bar', data.charts[0]?.data || [], 'Revenue by Period')}
          {renderChart('pie', data.charts[1]?.data || [], 'Revenue Distribution')}
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Detailed Breakdown</h3>
        {renderTable(
          ['Revenue Stream', 'Amount', 'Change', 'Status'],
          data.details.map((item: any) => [
            item.name,
            `SAR ${item.value.toLocaleString()}`,
            `${item.change >= 0 ? '+' : ''}${item.change}%`,
            item.change >= 0 ? 'Growing' : 'Declining'
          ]),
          'Revenue Streams'
        )}
      </div>
    </div>
  );

  const renderOperationalTemplate = () => (
    <div className="space-y-6">
      {/* Worker Performance */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Worker Performance Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {renderMetricCard('Total Workers', data.summary.totalWorkers, 5.2)}
          {renderMetricCard('Active Workers', Math.floor(data.summary.totalWorkers * 0.85), 3.1)}
          {renderMetricCard('Productivity Score', 87.5, 2.8, '%')}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Performance Metrics</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {renderChart('line', [], 'Performance Trend')}
          {renderChart('bar', [], 'Department Comparison')}
        </div>
      </div>

      {/* Worker Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Worker Details</h3>
        {renderTable(
          ['Worker Name', 'Department', 'Performance', 'Status'],
          data.details.slice(0, 5).map((item: any, index: number) => [
            item.name,
            ['Operations', 'Finance', 'HR', 'Sales'][index % 4],
            `${85 + Math.floor(Math.random() * 15)}%`,
            item.change >= 0 ? 'Excellent' : 'Good'
          ]),
          'Top Performers'
        )}
      </div>
    </div>
  );

  const renderAnalyticalTemplate = () => (
    <div className="space-y-6">
      {/* Client Analysis */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Client Profitability Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {renderMetricCard('Total Clients', 89, 12.1)}
          {renderMetricCard('Active Contracts', data.summary.activeContracts, 8.3)}
          {renderMetricCard('Avg Contract Value', 45200, 5.7)}
          {renderMetricCard('Retention Rate', 94.5, 2.2, '%')}
        </div>
      </div>

      {/* Client Insights */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Client Insights</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {renderChart('pie', [], 'Client Distribution')}
          {renderChart('bar', [], 'Profitability by Client')}
        </div>
      </div>

      {/* Client Rankings */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Client Rankings</h3>
        {renderTable(
          ['Client Name', 'Contracts', 'Revenue', 'Profit Margin'],
          data.details.map((item: any, index: number) => [
            `Client ${index + 1}`,
            Math.floor(Math.random() * 10) + 1,
            `SAR ${(item.value * (0.8 + Math.random() * 0.4)).toLocaleString()}`,
            `${(15 + Math.random() * 25).toFixed(1)}%`
          ]),
          'Top Clients by Revenue'
        )}
      </div>
    </div>
  );

  const renderComplianceTemplate = () => (
    <div className="space-y-6">
      {/* Compliance Overview */}
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-6 border border-orange-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Compliance Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {renderMetricCard('Compliance Score', 92.5, 3.2, '%')}
          {renderMetricCard('Audit Findings', 12, -15.3)}
          {renderMetricCard('Risk Level', 3.2, -8.7)}
          {renderMetricCard('Remediation Rate', 88.9, 5.1, '%')}
        </div>
      </div>

      {/* Compliance Metrics */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Compliance Metrics</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {renderChart('line', [], 'Compliance Trend')}
          {renderChart('pie', [], 'Risk Distribution')}
        </div>
      </div>

      {/* Compliance Issues */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Compliance Issues</h3>
        {renderTable(
          ['Issue Type', 'Severity', 'Status', 'Due Date'],
          [
            ['Documentation', 'Medium', 'In Progress', '2024-02-15'],
            ['Training', 'Low', 'Resolved', '2024-01-30'],
            ['Safety Protocol', 'High', 'Open', '2024-02-28'],
            ['Financial Reporting', 'Critical', 'In Review', '2024-02-10']
          ],
          'Active Compliance Issues'
        )}
      </div>
    </div>
  );

  const renderTemplate = () => {
    switch (template.type) {
      case 'financial': return renderFinancialTemplate();
      case 'operational': return renderOperationalTemplate();
      case 'analytical': return renderAnalyticalTemplate();
      case 'compliance': return renderComplianceTemplate();
      default: return renderFinancialTemplate();
    }
  };

  return (
    <div className={`${isPreview ? 'scale-90 origin-top' : ''}`}>
      {/* Report Header */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {getIconForType(template.type)}
              <h1 className="text-2xl font-bold text-gray-800">{template.name}</h1>
            </div>
            <p className="text-gray-600">{template.description}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span>Generated: {new Date().toLocaleDateString()}</span>
              <span>Period: Q1 2024</span>
              <span>ID: {template.id}-{Date.now()}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Golden Noura ERP</div>
            <div className="text-xs text-gray-400">Advanced Reporting System</div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {renderTemplate()}

      {/* Report Footer */}
      <div className="bg-white rounded-lg p-4 border border-gray-200 mt-6">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div>
            <p>Generated by Golden Noura ERP System</p>
            <p>© 2024 Golden Noura Manpower Supply. All rights reserved.</p>
          </div>
          <div className="text-right">
            <p>Page 1 of 1</p>
            <p>Confidential - For Internal Use Only</p>
          </div>
        </div>
      </div>
    </div>
  );
}
