import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FileText, 
  Download, 
  Printer, 
  Filter, 
  Calendar,
  Users,
  Building2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Settings,
  Eye,
  Save,
  Share2,
  Mail,
  FileSpreadsheet,
  FileImage,
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  Edit3,
  Trash2,
  Copy,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { DateRangePicker } from './DateRangePicker';
import { ReportTemplate } from './ReportTemplate';
import { ReportFilters } from './ReportFilters';
import { PrintPreview } from './PrintPreview';

interface ReportConfig {
  id: string;
  name: string;
  type: 'financial' | 'operational' | 'analytical' | 'compliance';
  category: string;
  description: string;
  icon: React.ReactNode;
  metrics: string[];
  filters: string[];
  charts: string[];
  exportFormats: ('pdf' | 'excel' | 'csv' | 'word')[];
  schedule?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
  };
}

interface ReportData {
  summary: any;
  details: any[];
  charts: any[];
  metadata: {
    generatedAt: string;
    period: string;
    generatedBy: string;
    totalRecords: number;
  };
}

const REPORT_TEMPLATES: ReportConfig[] = [
  {
    id: 'financial-overview',
    name: 'Financial Overview',
    type: 'financial',
    category: 'Financial Reports',
    description: 'Comprehensive financial performance summary',
    icon: <TrendingUp className="w-5 h-5" />,
    metrics: ['revenue', 'expenses', 'profit', 'cash_flow', 'growth_rate'],
    filters: ['date_range', 'department', 'project'],
    charts: ['revenue_trend', 'expense_breakdown', 'profit_margin'],
    exportFormats: ['pdf', 'excel', 'csv']
  },
  {
    id: 'worker-performance',
    name: 'Worker Performance Analysis',
    type: 'operational',
    category: 'Operational Reports',
    description: 'Detailed worker productivity and performance metrics',
    icon: <Users className="w-5 h-5" />,
    metrics: ['productivity', 'attendance', 'performance_score', 'revenue_per_worker'],
    filters: ['date_range', 'department', 'worker_status', 'nationality'],
    charts: ['performance_distribution', 'attendance_trend', 'revenue_contribution'],
    exportFormats: ['pdf', 'excel', 'csv']
  },
  {
    id: 'client-profitability',
    name: 'Client Profitability Analysis',
    type: 'analytical',
    category: 'Business Intelligence',
    description: 'Profitability analysis per client and contract',
    icon: <Building2 className="w-5 h-5" />,
    metrics: ['revenue_per_client', 'profit_margin', 'contract_value', 'retention_rate'],
    filters: ['date_range', 'client_type', 'contract_status'],
    charts: ['client_contribution', 'profitability_trend', 'contract_distribution'],
    exportFormats: ['pdf', 'excel', 'csv']
  },
  {
    id: 'cash-flow-statement',
    name: 'Cash Flow Statement',
    type: 'financial',
    category: 'Financial Reports',
    description: 'Detailed cash flow analysis and projections',
    icon: <DollarSign className="w-5 h-5" />,
    metrics: ['cash_inflow', 'cash_outflow', 'net_cash_flow', 'cash_balance'],
    filters: ['date_range', 'transaction_type', 'account'],
    charts: ['cash_flow_trend', 'source_breakdown', 'projection'],
    exportFormats: ['pdf', 'excel', 'word']
  },
  {
    id: 'compliance-audit',
    name: 'Compliance & Audit Report',
    type: 'compliance',
    category: 'Compliance Reports',
    description: 'Regulatory compliance and internal audit findings',
    icon: <CheckCircle className="w-5 h-5" />,
    metrics: ['compliance_score', 'audit_findings', 'risk_assessment', 'remediation_status'],
    filters: ['date_range', 'compliance_type', 'risk_level'],
    charts: ['compliance_trend', 'risk_distribution', 'audit_coverage'],
    exportFormats: ['pdf', 'excel']
  }
];

export function AdvancedReportBuilder() {
  const { t } = useTranslation();
  const [selectedTemplate, setSelectedTemplate] = useState<ReportConfig | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1),
    end: new Date()
  });

  const generateReport = async (template: ReportConfig) => {
    setIsGenerating(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockData: ReportData = {
        summary: {
          totalRevenue: 1250000,
          totalExpenses: 875000,
          netProfit: 375000,
          growthRate: 12.5,
          totalWorkers: 245,
          activeContracts: 89
        },
        details: [
          { id: 1, name: 'Revenue Stream 1', value: 450000, change: 8.2 },
          { id: 2, name: 'Revenue Stream 2', value: 380000, change: 15.3 },
          { id: 3, name: 'Revenue Stream 3', value: 420000, change: -2.1 }
        ],
        charts: [
          { type: 'bar', data: [450000, 380000, 420000], labels: ['Q1', 'Q2', 'Q3'] },
          { type: 'pie', data: [45, 30, 25], labels: ['Product A', 'Product B', 'Product C'] }
        ],
        metadata: {
          generatedAt: new Date().toISOString(),
          period: `${dateRange.start.toISOString().split('T')[0]} to ${dateRange.end.toISOString().split('T')[0]}`,
          generatedBy: localStorage.getItem('full_name') || 'System Admin',
          totalRecords: 156
        }
      };
      
      setReportData(mockData);
      setSelectedTemplate(template);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const exportReport = async (format: string) => {
    if (!reportData || !selectedTemplate) return;
    
    try {
      // Simulate export
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const filename = `${selectedTemplate.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${format}`;
      
      // Create download
      const blob = new Blob(['Mock report data'], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const printReport = () => {
    if (!reportData || !selectedTemplate) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${selectedTemplate.name}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { border-bottom: 2px solid #D4AF37; padding-bottom: 20px; margin-bottom: 30px; }
              .title { font-size: 24px; font-weight: bold; color: #333; }
              .subtitle { color: #666; margin-top: 5px; }
              .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .metric { display: inline-block; margin: 10px 20px; }
              .metric-label { font-size: 12px; color: #666; }
              .metric-value { font-size: 18px; font-weight: bold; color: #333; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: bold; }
              .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">${selectedTemplate.name}</div>
              <div class="subtitle">${selectedTemplate.description}</div>
              <div class="subtitle">Generated: ${new Date().toLocaleString()}</div>
            </div>
            
            <div class="summary">
              <div class="metric">
                <div class="metric-label">Total Revenue</div>
                <div class="metric-value">SAR ${reportData.summary.totalRevenue.toLocaleString()}</div>
              </div>
              <div class="metric">
                <div class="metric-label">Total Expenses</div>
                <div class="metric-value">SAR ${reportData.summary.totalExpenses.toLocaleString()}</div>
              </div>
              <div class="metric">
                <div class="metric-label">Net Profit</div>
                <div class="metric-value">SAR ${reportData.summary.netProfit.toLocaleString()}</div>
              </div>
              <div class="metric">
                <div class="metric-label">Growth Rate</div>
                <div class="metric-value">${reportData.summary.growthRate}%</div>
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Value</th>
                  <th>Change</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.details.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>SAR ${item.value.toLocaleString()}</td>
                    <td style="color: ${item.change >= 0 ? 'green' : 'red'}">${item.change}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="footer">
              <p>Generated by Golden Noura ERP System</p>
              <p>Period: ${reportData.metadata.period}</p>
              <p>Total Records: ${reportData.metadata.totalRecords}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const saveReport = () => {
    if (!reportData || !selectedTemplate) return;
    
    const savedReport = {
      id: Date.now().toString(),
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      generatedAt: new Date().toISOString(),
      data: reportData,
      filters: activeFilters
    };
    
    setSavedReports(prev => [savedReport, ...prev]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-gn-gold" />
            Advanced Report Builder
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Create, customize, and generate comprehensive business reports
          </p>
        </div>
        
        <div className="flex gap-3">
          {selectedTemplate && (
            <>
              <button
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gn-surface/50 text-white hover:bg-gn-surface/70 rounded-lg transition border border-gn-surface"
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
              <button
                onClick={printReport}
                className="flex items-center gap-2 px-4 py-2 bg-gn-white/10 text-white hover:bg-gn-white/20 rounded-lg transition border border-gn-surface"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={saveReport}
                className="flex items-center gap-2 px-4 py-2 bg-gn-gold/20 text-gn-gold hover:bg-gn-gold/30 rounded-lg transition border border-gn-gold/30"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </>
          )}
        </div>
      </div>

      {/* Report Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORT_TEMPLATES.map((template) => (
          <div
            key={template.id}
            className={`bg-gn-surface/50 border border-gn-surface rounded-xl p-6 cursor-pointer transition-all hover:border-gn-gold/50 hover:shadow-lg hover:shadow-gn-gold/10 ${
              selectedTemplate?.id === template.id ? 'border-gn-gold shadow-lg shadow-gn-gold/20' : ''
            }`}
            onClick={() => generateReport(template)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-gn-gold/20 rounded-lg text-gn-gold">
                {template.icon}
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                template.type === 'financial' ? 'bg-blue-500/20 text-blue-400' :
                template.type === 'operational' ? 'bg-green-500/20 text-green-400' :
                template.type === 'analytical' ? 'bg-purple-500/20 text-purple-400' :
                'bg-orange-500/20 text-orange-400'
              }`}>
                {template.type}
              </span>
            </div>
            
            <h3 className="text-lg font-bold text-white mb-2">{template.name}</h3>
            <p className="text-gray-400 text-sm mb-4">{template.description}</p>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{template.metrics.length} metrics</span>
              <span>{template.charts.length} charts</span>
              <div className="flex gap-1">
                {template.exportFormats.slice(0, 3).map((format, i) => (
                  <span key={i} className="uppercase">{format[0]}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Loading State */}
      {isGenerating && (
        <div className="flex flex-col items-center justify-center py-20 bg-gn-surface/30 rounded-xl border border-gn-surface">
          <div className="w-12 h-12 border-4 border-gn-gold border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400">Generating report...</p>
        </div>
      )}

      {/* Report Data */}
      {reportData && selectedTemplate && !isGenerating && (
        <div className="space-y-6">
          {/* Report Summary */}
          <div className="bg-gn-surface/50 border border-gn-surface rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  {selectedTemplate.icon}
                  {selectedTemplate.name}
                </h3>
                <p className="text-gray-400 text-sm mt-1">
                  {reportData.metadata.period} • {reportData.metadata.totalRecords} records
                </p>
              </div>
              
              <div className="flex gap-2">
                {selectedTemplate.exportFormats.map((format) => (
                  <button
                    key={format}
                    onClick={() => exportReport(format)}
                    className="flex items-center gap-1 px-3 py-1 bg-gn-blackLight/50 text-gray-300 hover:text-white hover:bg-gn-blackLight/70 rounded-lg transition text-sm"
                  >
                    {format === 'pdf' && <FileText className="w-3 h-3" />}
                    {format === 'excel' && <FileSpreadsheet className="w-3 h-3" />}
                    {format === 'csv' && <FileText className="w-3 h-3" />}
                    {format === 'word' && <FileText className="w-3 h-3" />}
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gn-blackLight/30 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Total Revenue</div>
                <div className="text-2xl font-bold text-white">SAR {reportData.summary.totalRevenue.toLocaleString()}</div>
                <div className="text-green-400 text-sm flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" /> +12.5%
                </div>
              </div>
              
              <div className="bg-gn-blackLight/30 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Total Expenses</div>
                <div className="text-2xl font-bold text-white">SAR {reportData.summary.totalExpenses.toLocaleString()}</div>
                <div className="text-red-400 text-sm flex items-center gap-1 mt-1">
                  <TrendingDown className="w-3 h-3" /> +5.2%
                </div>
              </div>
              
              <div className="bg-gn-blackLight/30 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Net Profit</div>
                <div className="text-2xl font-bold text-green-400">SAR {reportData.summary.netProfit.toLocaleString()}</div>
                <div className="text-green-400 text-sm flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" /> +8.7%
                </div>
              </div>
              
              <div className="bg-gn-blackLight/30 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Growth Rate</div>
                <div className="text-2xl font-bold text-gn-gold">{reportData.summary.growthRate}%</div>
                <div className="text-gn-gold text-sm flex items-center gap-1 mt-1">
                  <Activity className="w-3 h-3" /> Stable
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Data Table */}
          <div className="bg-gn-surface/50 border border-gn-surface rounded-xl p-6">
            <h4 className="text-lg font-bold text-white mb-4">Detailed Breakdown</h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gn-surface">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Name</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Value</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Change</th>
                    <th className="text-center py-3 px-4 text-gray-400 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.details.map((item, index) => (
                    <tr key={item.id} className="border-b border-gn-surface/50 hover:bg-gn-blackLight/20 transition">
                      <td className="py-3 px-4 text-white">{item.name}</td>
                      <td className="py-3 px-4 text-right text-white font-medium">
                        SAR {item.value.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`flex items-center justify-end gap-1 ${
                          item.change >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {item.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {Math.abs(item.change)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.change >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {item.change >= 0 ? 'Growing' : 'Declining'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && reportData && (
        <PrintPreview
          report={reportData}
          template={selectedTemplate}
          onClose={() => setShowPreview(false)}
          onPrint={printReport}
        />
      )}
    </div>
  );
}
