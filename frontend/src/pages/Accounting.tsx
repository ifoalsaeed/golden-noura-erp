import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Landmark, ArrowUpRight, ArrowDownRight, Search, FileText, Plus, Printer, Calendar } from 'lucide-react';
import api from '../api';

interface BalanceSheetItem {
    name: string;
    code: string;
    balance: number;
}

interface BalanceSheetData {
    year: number;
    assets: { items: BalanceSheetItem[], total: number };
    liabilities: { items: BalanceSheetItem[], total: number };
    equity: { items: BalanceSheetItem[], total: number };
    total_liabilities_and_equity: number;
}

export default function Accounting() {
    const { t } = useTranslation();
    const [view, setView] = useState<'journal' | 'balanceSheet' | 'pdf'>('journal');
    const [balanceSheet, setBalanceSheet] = useState<BalanceSheetData | null>(null);
    const [year, setYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [pdfError, setPdfError] = useState<string | null>(null);
    const [checkingPdf, setCheckingPdf] = useState(false);

    const [transactions] = useState([
        { id: 1, date: '2026-03-09', desc: 'استحقاق رواتب شهر مارس', account: 'الرواتب والأجور', debit: 45000, credit: 0 },
        { id: 2, date: '2026-03-08', desc: 'دفعة من شركة المقاولات الحديثة', account: 'بنك الراجحي', debit: 0, credit: 15500 },
        { id: 3, date: '2026-03-05', desc: 'سداد فواتير سكن العمال', account: 'الصندوق الرئيسي', debit: 8000, credit: 0 },
    ]);

    useEffect(() => {
        if (view === 'balanceSheet') {
            fetchBalanceSheet();
        }
        if (view === 'pdf') {
            checkPdf();
        }
    }, [view, year]);

    const fetchBalanceSheet = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/accounting/balance-sheet?year=${year}`);
            setBalanceSheet(response.data);
        } catch (error) {
            console.error('Error fetching balance sheet:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const checkPdf = async () => {
        try {
            setCheckingPdf(true);
            setPdfError(null);
            setPdfUrl(null);
            const res = await api.get(`/accounting/balance-sheet/pdf`, {
                params: { year },
                responseType: 'blob'
            });
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setPdfUrl(url);
        } catch (e: any) {
            try {
                const fallback = `${(import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1')}/accounting/balance-sheet/pdf?year=${year}`;
                const resp = await fetch(fallback);
                if (!resp.ok) throw new Error('fallback failed');
                const blob = await resp.blob();
                const url = URL.createObjectURL(blob);
                setPdfUrl(url);
                setPdfError(null);
            } catch {
                setPdfError(t('common.serverUnreachable'));
            }
        } finally {
            setCheckingPdf(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center no-print">
                <h2 className="text-2xl font-bold text-white flex items-center">
                    <Landmark className="w-8 h-8 ml-3 text-gn-gold" />
                    {t('accounting.title')}
                </h2>
                <div className="flex gap-3">
                    <button
                        onClick={() => setView('journal')}
                        className={`px-6 py-2 rounded-xl font-bold transition-all ${view === 'journal' ? 'bg-gn-gold text-gn-black' : 'bg-gn-surface text-gray-400 hover:text-white'}`}
                    >
                        {t('accounting.journalEntries')}
                    </button>
                    <button
                        onClick={() => setView('balanceSheet')}
                        className={`px-6 py-2 rounded-xl font-bold transition-all ${view === 'balanceSheet' ? 'bg-gn-gold text-gn-black' : 'bg-gn-surface text-gray-400 hover:text-white'}`}
                    >
                        {t('accounting.balanceSheet')}
                    </button>
                    <button
                        onClick={() => setView('pdf')}
                        className={`px-6 py-2 rounded-xl font-bold transition-all ${view === 'pdf' ? 'bg-gn-gold text-gn-black' : 'bg-gn-surface text-gray-400 hover:text-white'}`}
                    >
                        {t('accounting.balanceSheetPdf')}
                    </button>
                </div>
            </div>

            {view === 'journal' ? (
                <div className="space-y-6">
                    <div className="bg-gn-surface/50 border border-gn-surface rounded-xl p-6 shadow-lg overflow-hidden">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-white">{t('accounting.latestEntries')}</h3>
                            <button className="bg-gn-gold hover:bg-gn-goldDark text-gn-black font-black py-2 px-6 rounded-xl flex items-center transition shadow-lg gap-2">
                                <Plus className="w-4 h-4" /> {t('accounting.newEntry')}
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-gray-300">
                                <thead className="text-[10px] font-black text-gn-gold uppercase tracking-widest bg-gn-blackLight/80 border-b border-gn-surface">
                                    <tr>
                                        <th className="px-5 py-4">{t('accounting.date')}</th>
                                        <th className="px-5 py-4">{t('accounting.description')}</th>
                                        <th className="px-5 py-4">{t('accounting.accountRef')}</th>
                                        <th className="px-5 py-4 text-center">{t('accounting.debit')}</th>
                                        <th className="px-5 py-4 text-center text-green-400">{t('accounting.credit')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gn-surface">
                                    {transactions.map((t) => (
                                        <tr key={t.id} className="hover:bg-gn-blackLight/30 transition-colors">
                                            <td className="px-5 py-4 font-bold text-xs text-gray-400">{t.date}</td>
                                            <td className="px-5 py-4 font-bold text-white">{t.desc}</td>
                                            <td className="px-5 py-4">
                                                <span className="bg-gn-surface border border-gn-gold/10 px-3 py-1 rounded-full text-[10px] text-gn-gold font-black">{t.account}</span>
                                            </td>
                                            <td className="px-5 py-4 font-black text-red-400 text-center">
                                                {t.debit > 0 ? t.debit.toLocaleString() : '-'}
                                            </td>
                                            <td className="px-5 py-4 font-black text-green-400 text-center">
                                                {t.credit > 0 ? t.credit.toLocaleString() : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : view === 'balanceSheet' ? (
                <div className="space-y-6">
                    <div className="flex justify-between items-center no-print">
                        <div className="flex items-center gap-4 bg-gn-surface/50 p-2 rounded-xl border border-gn-surface">
                            <button onClick={() => setYear(y => y - 1)} className="p-2 hover:bg-gn-gold/10 rounded-lg text-gn-gold"><ArrowDownRight className="w-4 h-4 rotate-90" /></button>
                            <span className="text-xl font-black text-white px-4">{year}</span>
                            <button onClick={() => setYear(y => y + 1)} className="p-2 hover:bg-gn-gold/10 rounded-lg text-gn-gold"><ArrowUpRight className="w-4 h-4 -rotate-90" /></button>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handlePrint} className="bg-gn-surface border border-gn-gold/20 text-gn-gold font-black py-2 px-6 rounded-xl flex items-center transition shadow-lg gap-2 hover:bg-gn-gold hover:text-gn-black">
                                <Printer className="w-5 h-5" /> {t('accounting.printStatement')}
                            </button>
                            <a
                              href={`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/accounting/balance-sheet/export?year=${year}&format=excel`}
                              className="bg-gn-gold text-gn-black font-black py-2 px-6 rounded-xl flex items-center transition shadow-lg gap-2 hover:bg-gn-goldDark"
                            >
                              {t('accounting.exportExcel')}
                            </a>
                        </div>
                    </div>

                    <div className="bg-white text-black p-10 rounded-2xl shadow-2xl balance-sheet-print min-h-[1000px]">
                        <div className="text-center mb-10 border-b-2 border-gn-gold pb-6">
                            <img src="/logo.png" alt="Logo" className="w-24 mx-auto mb-4 grayscale contrast-125" />
                            <h1 className="text-3xl font-black uppercase tracking-widest">{t('Golden Noura ERP')}</h1>
                            <h2 className="text-xl font-bold text-gray-600 mt-2">{t('Balance Sheet')} - {year}</h2>
                            <p className="text-sm text-gray-500 mt-1 uppercase tracking-tighter">As of December 31, {year}</p>
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center py-20 text-gn-gold font-bold">{t('accounting.generatingStatement')}</div>
                        ) : balanceSheet ? (
                            <div className="grid grid-cols-2 gap-10">
                                {/* ASSETS COL */}
                                <div className="space-y-6">
                                    <h3 className="text-lg font-black bg-gray-100 p-2 border-l-4 border-gn-gold uppercase">{t('accounting.assets')}</h3>
                                    <div className="space-y-2">
                                        {balanceSheet.assets.items.map((item, i) => (
                                            <div key={i} className="flex justify-between border-b border-gray-100 pb-1">
                                                <span className="font-medium">{item.name}</span>
                                                <span className="font-mono">{item.balance.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between font-black text-lg pt-4 border-t-2 border-black">
                                        <span>{t('accounting.totalAssets')}</span>
                                        <span className="underline decoration-double">{balanceSheet.assets.total.toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* LIABILITIES & EQUITY COL */}
                                <div className="space-y-6">
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-black bg-gray-100 p-2 border-l-4 border-gn-gold uppercase">{t('accounting.liabilities')}</h3>
                                        <div className="space-y-2">
                                            {balanceSheet.liabilities.items.map((item, i) => (
                                                <div key={i} className="flex justify-between border-b border-gray-100 pb-1">
                                                    <span className="font-medium">{item.name}</span>
                                                    <span className="font-mono">{item.balance.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-between font-bold pt-2 border-t border-gray-200 uppercase text-sm">
                                            <span>{t('accounting.totalLiabilities')}</span>
                                            <span>{balanceSheet.liabilities.total.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-6 pt-6">
                                        <h3 className="text-lg font-black bg-gray-100 p-2 border-l-4 border-gn-gold uppercase">{t('accounting.equity')}</h3>
                                        <div className="space-y-2">
                                            {balanceSheet.equity.items.map((item, i) => (
                                                <div key={i} className={`flex justify-between border-b border-gray-100 pb-1 ${item.code === 'INC' ? 'text-gn-goldDark font-bold italic' : ''}`}>
                                                    <span>{item.name}</span>
                                                    <span className="font-mono">{item.balance.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-between font-bold pt-2 border-t border-gray-200 uppercase text-sm">
                                            <span>{t('accounting.totalEquity')}</span>
                                            <span>{balanceSheet.equity.total.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between font-black text-lg pt-4 border-t-2 border-black mt-10">
                                        <span className="text-sm">{t('accounting.totalLiabilitiesEquity')}</span>
                                        <span className="underline decoration-double">{balanceSheet.total_liabilities_and_equity.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-20 text-gray-400">{t('accounting.noDataForYear')}</div>
                        )}

                        <div className="mt-20 border-t pt-6 flex justify-between text-[10px] text-gray-400 uppercase tracking-widest font-black">
                            <span>{t('accounting.confidentialStatement')}</span>
                            <span>{t('accounting.generatedBy')}</span>
                            <span>{new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex justify-between items-center no-print">
                        <div className="flex items-center gap-4 bg-gn-surface/50 p-2 rounded-xl border border-gn-surface">
                            <button onClick={() => setYear(y => y - 1)} className="p-2 hover:bg-gn-gold/10 rounded-lg text-gn-gold"><ArrowDownRight className="w-4 h-4 rotate-90" /></button>
                            <span className="text-xl font-black text-white px-4">{year}</span>
                            <button onClick={() => setYear(y => y + 1)} className="p-2 hover:bg-gn-gold/10 rounded-lg text-gn-gold"><ArrowUpRight className="w-4 h-4 -rotate-90" /></button>
                        </div>
                        <div className="flex gap-2">
                            {pdfUrl && (
                              <>
                                <a
                                  href={pdfUrl}
                                  target="_blank"
                                  className="bg-gn-gold text-gn-black font-black py-2 px-6 rounded-xl flex items-center transition shadow-lg gap-2 hover:bg-gn-goldDark"
                                >
                                  {t('accounting.openInNewTab')}
                                </a>
                                <a
                                  href={pdfUrl}
                                  download={`balance_sheet_${year}.pdf`}
                                  className="bg-gn-surface border border-gn-gold/20 text-gn-gold font-black py-2 px-6 rounded-xl flex items-center transition shadow-lg gap-2 hover:bg-gn-gold hover:text-gn-black"
                                >
                                  {t('common.downloadPdf')}
                                </a>
                              </>
                            )}
                            <button
                              onClick={checkPdf}
                              className="bg-gn-surface border border-gn-gold/20 text-gn-gold font-black py-2 px-6 rounded-xl flex items-center transition shadow-lg gap-2 hover:bg-gn-gold hover:text-gn-black"
                            >
                              {t('common.refresh')}
                            </button>
                        </div>
                    </div>
                    {checkingPdf && (
                        <div className="bg-gn-surface/50 border border-gn-surface rounded-xl p-8 text-center text-gn-gold font-bold">
                            {t('common.checkingServer')}
                        </div>
                    )}
                    {pdfError && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center text-red-400 font-bold">
                            {pdfError}
                        </div>
                    )}
                    {pdfUrl && !checkingPdf && !pdfError && (
                        <div className="bg-gn-surface/50 border border-gn-surface rounded-xl p-2 h-[80vh]">
                            <iframe
                                title="Balance Sheet PDF"
                                src={pdfUrl}
                                className="w-full h-full rounded-lg bg-black"
                            />
                        </div>
                    )}
                </div>
            )}

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; padding: 0 !important; }
                    .balance-sheet-print { 
                        box-shadow: none !important; 
                        border: none !important; 
                        margin: 0 !important; 
                        padding: 20px !important;
                        width: 100% !important;
                    }
                }
                .balance-sheet-print {
                   font-family: 'Inter', sans-serif;
                   color: #1a1a1a;
                }
            `}</style>
        </div>
    );
}
