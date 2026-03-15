import React from 'react';
import { X, Printer, Download, Share2, Mail } from 'lucide-react';

interface PrintPreviewProps {
  report: any;
  template: any;
  onClose: () => void;
  onPrint: () => void;
}

export function PrintPreview({ report, template, onClose, onPrint }: PrintPreviewProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gn-black rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-gn-surface">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gn-surface">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Report Preview: {template.name}
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Generated on {formatDate(report.metadata.generatedAt)}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-gn-gold text-gn-black rounded-lg font-medium hover:bg-gn-gold/90 transition"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gn-surface rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)] bg-white">
          <div id="printable-content" className="max-w-4xl mx-auto">
            {/* Report Header */}
            <div className="text-center mb-8 border-b-2 border-gray-200 pb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {template.name}
              </h1>
              <p className="text-gray-600 mb-4">
                {template.description}
              </p>
              <div className="flex justify-center items-center gap-6 text-sm text-gray-500">
                <span>Period: {report.metadata.period}</span>
                <span>Generated: {formatDate(report.metadata.generatedAt)}</span>
                <span>By: {report.metadata.generatedBy}</span>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                Executive Summary
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    SAR {report.summary.totalRevenue.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Total Revenue</div>
                  <div className="text-xs text-green-600 mt-2">↑ 12.5%</div>
                </div>
                
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">
                    SAR {report.summary.totalExpenses.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Total Expenses</div>
                  <div className="text-xs text-red-600 mt-2">↑ 5.2%</div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    SAR {report.summary.netProfit.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Net Profit</div>
                  <div className="text-xs text-green-600 mt-2">↑ 8.7%</div>
                </div>
                
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {report.summary.growthRate}%
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Growth Rate</div>
                  <div className="text-xs text-gray-600 mt-2">Stable</div>
                </div>
              </div>
            </div>

            {/* Detailed Analysis */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                Detailed Analysis
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                        Revenue Stream
                      </th>
                      <th className="border border-gray-200 px-4 py-3 text-right font-semibold text-gray-700">
                        Value (SAR)
                      </th>
                      <th className="border border-gray-200 px-4 py-3 text-right font-semibold text-gray-700">
                        Change (%)
                      </th>
                      <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">
                        Performance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.details.map((item: any, index: number) => (
                      <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-200 px-4 py-3 text-gray-800">
                          {item.name}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-right font-medium text-gray-800">
                          {item.value.toLocaleString()}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-right">
                          <span className={`inline-flex items-center gap-1 ${
                            item.change >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {item.change >= 0 ? '↑' : '↓'} {Math.abs(item.change)}%
                          </span>
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            item.change >= 0 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {item.change >= 0 ? 'Excellent' : 'Needs Attention'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Key Insights */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                Key Insights & Recommendations
              </h2>
              <div className="space-y-4">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <h3 className="font-semibold text-blue-800 mb-2">Revenue Growth</h3>
                  <p className="text-gray-700">
                    Overall revenue has increased by 12.5% compared to the previous period. 
                    Revenue Stream 2 shows the highest growth at 15.3%, indicating successful market expansion.
                  </p>
                </div>
                
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                  <h3 className="font-semibold text-yellow-800 mb-2">Expense Management</h3>
                  <p className="text-gray-700">
                    While expenses have increased by 5.2%, they remain well below revenue growth, 
                    resulting in improved profit margins. Consider optimizing operational efficiency.
                  </p>
                </div>
                
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                  <h3 className="font-semibold text-green-800 mb-2">Profitability</h3>
                  <p className="text-gray-700">
                    Net profit margin stands at 30%, showing healthy profitability. 
                    Focus on maintaining this margin while pursuing growth opportunities.
                  </p>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                Visual Analytics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Revenue Distribution</h3>
                  <div className="h-48 flex items-center justify-center bg-white rounded border border-gray-200">
                    <div className="text-gray-500 text-center">
                      <div className="w-16 h-16 mx-auto mb-2 bg-gray-200 rounded-full"></div>
                      <p className="text-sm">Pie Chart Placeholder</p>
                      <p className="text-xs">Revenue by category</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Performance Trends</h3>
                  <div className="h-48 flex items-center justify-center bg-white rounded border border-gray-200">
                    <div className="text-gray-500 text-center">
                      <div className="w-16 h-16 mx-auto mb-2 bg-gray-200 rounded-full"></div>
                      <p className="text-sm">Line Chart Placeholder</p>
                      <p className="text-xs">Monthly performance</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
              <p>This report was generated by Golden Noura ERP System</p>
              <p>Report ID: {template.id}-{Date.now()}</p>
              <p>Page 1 of 1</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
