import { printWithLang } from './printLang';

interface PrintOptions {
  title?: string;
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'A4' | 'A3' | 'Letter';
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  scale?: number;
  quality?: 'normal' | 'high';
  colors?: boolean;
  background?: boolean;
}

interface ReportData {
  title: string;
  subtitle?: string;
  metadata: {
    generatedAt: string;
    period: string;
    generatedBy: string;
    totalRecords: number;
  };
  sections: Array<{
    title: string;
    type: 'summary' | 'table' | 'chart' | 'insights' | 'text';
    content: any;
  }>;
}

class PrintService {
  private static instance: PrintService;
  private printStylesLoaded = false;

  static getInstance(): PrintService {
    if (!PrintService.instance) {
      PrintService.instance = new PrintService();
    }
    return PrintService.instance;
  }

  async loadPrintStyles(): Promise<void> {
    if (this.printStylesLoaded) return;

    try {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = '/src/utils/printStyles.css';
      link.media = 'print';
      document.head.appendChild(link);
      this.printStylesLoaded = true;
    } catch (error) {
      console.warn('Failed to load print styles:', error);
    }
  }

  async printReport(reportData: ReportData, options: PrintOptions = {}): Promise<void> {
    await this.loadPrintStyles();

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      throw new Error('Failed to open print window. Please allow popups.');
    }

    const defaultOptions: PrintOptions = {
      title: reportData.title,
      orientation: 'portrait',
      pageSize: 'A4',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      scale: 1,
      quality: 'high',
      colors: true,
      background: true,
      ...options
    };

    const html = this.generatePrintHTML(reportData, defaultOptions);
    
    printWindow.document.write(html);
    printWindow.document.close();

    // Wait for images and styles to load
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
  }

  private generatePrintHTML(reportData: ReportData, options: PrintOptions): string {
    const { title, subtitle, metadata, sections } = reportData;
    const { orientation, pageSize, margins, scale, colors, background } = options;

    return `
      <!DOCTYPE html>
      <html lang="${document.documentElement.lang || 'en'}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          @page {
            size: ${pageSize} ${orientation};
            margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
          }
          
          * {
            -webkit-print-color-adjust: ${colors ? 'exact' : 'economy'};
            color-adjust: ${colors ? 'exact' : 'economy'};
          }
          
          body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            background: ${background ? 'white' : 'none'};
            margin: 0;
            padding: 0;
            transform: scale(${scale});
            transform-origin: top left;
          }
          
          .report-header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #D4AF37;
            padding-bottom: 20px;
          }
          
          .report-title {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
          }
          
          .report-subtitle {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
          }
          
          .report-meta {
            font-size: 11px;
            color: #888;
          }
          
          .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin: 30px 0 15px 0;
            border-bottom: 1px solid #dee2e6;
            padding-bottom: 8px;
            page-break-inside: avoid;
          }
          
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 15px 0;
            page-break-inside: avoid;
          }
          
          .summary-card {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            padding: 15px;
            text-align: center;
          }
          
          .summary-label {
            font-size: 11px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
          }
          
          .summary-value {
            font-size: 20px;
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
          }
          
          .summary-change {
            font-size: 12px;
            font-weight: 500;
          }
          
          .summary-change.positive {
            color: #28a745;
          }
          
          .summary-change.negative {
            color: #dc3545;
          }
          
          .report-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 11px;
            page-break-inside: avoid;
          }
          
          .report-table th,
          .report-table td {
            border: 1px solid #dee2e6;
            padding: 8px 12px;
            text-align: left;
            vertical-align: top;
          }
          
          .report-table th {
            background-color: #f8f9fa;
            font-weight: 600;
            color: #495057;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .report-table tbody tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          
          .chart-container {
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            page-break-inside: avoid;
          }
          
          .chart-placeholder {
            height: 200px;
            background: #f8f9fa;
            border: 1px dashed #dee2e6;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6c757d;
            font-size: 12px;
          }
          
          .insight-box {
            background: #f8f9fa;
            border-left: 4px solid #007bff;
            padding: 15px;
            margin: 15px 0;
            border-radius: 0 4px 4px 0;
            page-break-inside: avoid;
          }
          
          .insight-box.warning {
            border-left-color: #ffc107;
            background: #fff8e1;
          }
          
          .insight-box.success {
            border-left-color: #28a745;
            background: #f1f8f9;
          }
          
          .insight-box.danger {
            border-left-color: #dc3545;
            background: #f8d7da;
          }
          
          .insight-title {
            font-weight: 600;
            color: #333;
            margin-bottom: 5px;
          }
          
          .insight-content {
            color: #666;
            font-size: 11px;
            line-height: 1.5;
          }
          
          .report-footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            text-align: center;
            font-size: 10px;
            color: #6c757d;
          }
          
          .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 100px;
            color: #f0f0f0;
            z-index: -1;
            pointer-events: none;
          }
          
          .page-break {
            page-break-before: always;
          }
          
          .avoid-break {
            page-break-inside: avoid;
          }
        </style>
      </head>
      <body>
        <div class="watermark">Golden Noura ERP</div>
        
        <div class="report-header">
          <div class="report-title">${title}</div>
          ${subtitle ? `<div class="report-subtitle">${subtitle}</div>` : ''}
          <div class="report-meta">
            Generated: ${new Date(metadata.generatedAt).toLocaleString()} • 
            Period: ${metadata.period} • 
            By: ${metadata.generatedBy} • 
            Records: ${metadata.totalRecords}
          </div>
        </div>

        ${sections.map((section, index) => this.renderSection(section, index)).join('')}

        <div class="report-footer">
          <p>Generated by Golden Noura ERP System</p>
          <p>© 2024 Golden Noura Manpower Supply. All rights reserved.</p>
          <p>Page 1 of 1 • Confidential - For Internal Use Only</p>
        </div>
      </body>
      </html>
    `;
  }

  private renderSection(section: any, index: number): string {
    switch (section.type) {
      case 'summary':
        return this.renderSummarySection(section.content);
      case 'table':
        return this.renderTableSection(section.content);
      case 'chart':
        return this.renderChartSection(section.content);
      case 'insights':
        return this.renderInsightsSection(section.content);
      case 'text':
        return this.renderTextSection(section.content);
      default:
        return '';
    }
  }

  private renderSummarySection(content: any): string {
    const { title, metrics } = content;
    
    return `
      <div class="section-title">${title}</div>
      <div class="summary-grid">
        ${metrics.map((metric: any) => `
          <div class="summary-card">
            <div class="summary-label">${metric.label}</div>
            <div class="summary-value">${metric.value}</div>
            <div class="summary-change ${metric.change >= 0 ? 'positive' : 'negative'}">
              ${metric.change >= 0 ? '↑' : '↓'} ${Math.abs(metric.change)}%
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  private renderTableSection(content: any): string {
    const { title, headers, rows } = content;
    
    return `
      <div class="section-title">${title}</div>
      <table class="report-table">
        <thead>
          <tr>
            ${headers.map((header: string) => `<th>${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map((row: any[]) => `
            <tr>
              ${row.map((cell: any) => `<td>${cell}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  private renderChartSection(content: any): string {
    const { title, type, data } = content;
    
    return `
      <div class="section-title">${title}</div>
      <div class="chart-container">
        <div class="chart-placeholder">
          <div>
            <div style="font-size: 16px; margin-bottom: 10px;">${type.charAt(0).toUpperCase() + type.slice(1)} Chart</div>
            <div style="font-size: 12px;">${data.length} data points</div>
          </div>
        </div>
      </div>
    `;
  }

  private renderInsightsSection(content: any): string {
    const { title, insights } = content;
    
    return `
      <div class="section-title">${title}</div>
      ${insights.map((insight: any) => `
        <div class="insight-box ${insight.type}">
          <div class="insight-title">${insight.title}</div>
          <div class="insight-content">${insight.content}</div>
        </div>
      `).join('')}
    `;
  }

  private renderTextSection(content: any): string {
    const { title, text } = content;
    
    return `
      <div class="section-title">${title}</div>
      <div style="line-height: 1.6; color: #666; margin: 20px 0;">
        ${text}
      </div>
    `;
  }

  async printWithLanguage(content: string, lang: 'ar' | 'en' = 'en'): Promise<void> {
    await printWithLang(lang as any, () => {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
      }
    });
  }

  async exportToPDF(reportData: ReportData, options: PrintOptions = {}): Promise<Blob> {
    // This would integrate with a PDF library like jsPDF or puppeteer
    // For now, we'll return a mock PDF blob
    const content = this.generatePrintHTML(reportData, options);
    return new Blob([content], { type: 'application/pdf' });
  }

  async exportToWord(reportData: ReportData): Promise<Blob> {
    // This would integrate with a Word document generation library
    // For now, we'll return a mock Word blob
    const content = this.generatePrintHTML(reportData);
    return new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }
}

export const printService = PrintService.getInstance();
export { PrintService, type PrintOptions, type ReportData };
