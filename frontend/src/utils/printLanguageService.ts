import i18n from 'i18next';

/**
 * PrintLanguageService
 * Service to handle special printing language rules:
 * - Bengali UI → English print for invoices/contracts
 * - Arabic UI → Arabic print for everything
 * - English UI → English print for everything
 */

export type PrintDocumentType = 'invoice' | 'contract' | 'payslip' | 'report' | 'receipt' | 'general';

export interface PrintLanguageConfig {
  currentLanguage: string;
  documentType: PrintDocumentType;
  forceLanguage?: string;
}

class PrintLanguageService {
  /**
   * Determine the print language based on rules:
   * - If document is invoice/contract and current language is Bengali (bn) → return English (en)
   * - Otherwise, return current language
   */
  getPrintLanguage(config: PrintLanguageConfig): string {
    const { currentLanguage, documentType, forceLanguage } = config;

    // If language is forced, use it
    if (forceLanguage) {
      return forceLanguage;
    }

    // Special rule: Bengali UI + Invoice/Contract → English print
    if (currentLanguage === 'bn' && (documentType === 'invoice' || documentType === 'contract')) {
      return 'en';
    }

    // Default: use current language
    return currentLanguage;
  }

  /**
   * Check if current printing should use English template
   */
  shouldUseEnglishTemplate(documentType: PrintDocumentType): boolean {
    const currentLang = i18n.language;
    
    // Bengali UI + Invoice/Contract → use English template
    if (currentLang === 'bn' && (documentType === 'invoice' || documentType === 'contract')) {
      return true;
    }
    
    return false;
  }

  /**
   * Get print-specific translations
   * This loads the appropriate translation file for printing
   */
  async getPrintTranslations(documentType: PrintDocumentType): Promise<any> {
    const targetLang = this.getPrintLanguage({
      currentLanguage: i18n.language,
      documentType
    });

    try {
      // Dynamically load the translation file for printing
      const translations = await import(`../../public/locales/${targetLang}/translation.json`);
      return translations;
    } catch (error) {
      console.error('Failed to load print translations:', error);
      // Fallback to current i18n translations
      return i18n.getResourceBundle(targetLang, 'translation');
    }
  }

  /**
   * Get print text direction
   */
  getPrintDirection(language: string): 'rtl' | 'ltr' {
    return language === 'ar' ? 'rtl' : 'ltr';
  }

  /**
   * Format date for printing based on language
   */
  formatPrintDate(date: Date, language: string): string {
    const locale = language === 'ar' ? 'ar-SA' : language === 'bn' ? 'bn-BD' : 'en-US';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Get currency format for printing
   */
  formatPrintCurrency(amount: number, language: string): string {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : language === 'bn' ? 'bn-BD' : 'en-US', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  }

  /**
   * Generate print HTML with correct language
   */
  async generatePrintHTML(
    content: string, 
    documentType: PrintDocumentType,
    title?: string
  ): Promise<string> {
    const targetLang = this.getPrintLanguage({
      currentLanguage: i18n.language,
      documentType
    });
    
    const direction = this.getPrintDirection(targetLang);
    const pageTitle = title || this.getDocumentTitle(documentType, targetLang);

    return `
      <!DOCTYPE html>
      <html lang="${targetLang}" dir="${direction}">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${pageTitle}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: ${targetLang === 'ar' ? 'Arial, sans-serif' : 'Arial, sans-serif'};
              font-size: 12pt;
              line-height: 1.5;
              color: #333;
              background: white;
              padding: 20px;
              direction: ${direction};
            }
            .print-container {
              max-width: 800px;
              margin: 0 auto;
            }
            @media print {
              body {
                padding: 0;
              }
              .no-print {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${content}
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Get document title based on type and language
   */
  private getDocumentTitle(documentType: PrintDocumentType, language: string): string {
    const titles: Record<string, Record<PrintDocumentType, string>> = {
      ar: {
        invoice: 'فاتورة',
        contract: 'عقد',
        payslip: 'قسيمة راتب',
        report: 'تقرير',
        receipt: 'إيصال',
        general: 'مستند'
      },
      bn: {
        invoice: 'ইনভয়েস',
        contract: 'চুক্তি',
        payslip: 'পেসলিপ',
        report: 'রিপোর্ট',
        receipt: 'রসিদ',
        general: 'নথি'
      },
      en: {
        invoice: 'Invoice',
        contract: 'Contract',
        payslip: 'Payslip',
        report: 'Report',
        receipt: 'Receipt',
        general: 'Document'
      }
    };

    return titles[language]?.[documentType] || titles['en'][documentType];
  }

  /**
   * Print with specific language handling
   */
  async printWithLanguage(
    printContent: string,
    documentType: PrintDocumentType,
    title?: string
  ): Promise<void> {
    const targetLang = this.getPrintLanguage({
      currentLanguage: i18n.language,
      documentType
    });

    const direction = this.getPrintDirection(targetLang);
    
    // Create print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      console.error('Failed to open print window');
      return;
    }

    // Generate full HTML
    const fullHTML = await this.generatePrintHTML(printContent, documentType, title);
    
    printWindow.document.write(fullHTML);
    printWindow.document.close();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      // Close window after print (optional)
      // printWindow.close();
    }, 500);
  }
}

export const printLanguageService = new PrintLanguageService();
export default printLanguageService;
