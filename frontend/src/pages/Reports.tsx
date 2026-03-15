import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { TrendingUp, TrendingDown, DollarSign, Download, Calendar, ArrowUpRight, ArrowDownRight, PieChart, BarChart3, List, Scale, MoveRight, Receipt, Printer, FileText, Settings, Filter, Database } from 'lucide-react';
import { printWithLang } from '../utils/printLang';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Cell, PieChart as RePieChart, Pie } from 'recharts';
import { AdvancedReportBuilder } from '../components/reports/AdvancedReportBuilder';
import { EgyptianReportBuilder } from '../components/reports/EgyptianReportBuilder';

type TabType = 'overview' | 'pl' | 'balance' | 'cashflow' | 'insights' | 'advanced' | 'egyptian';

export default function Reports() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    revenue: 0,
    expenses: 0,
    profit: 0,
    timeline: [],
    pl: null,
    balance: null,
    cashflow: null,
    insights: { workers: [], companies: [] }
  });
  const [exporting, setExporting] = useState<string | null>(null);

  // Date Filter State
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const handleExport = async (format: 'excel' | 'csv' = 'excel') => {
    setExporting(format);
    try {
      const resp = await api.get(`/reports/export?format=${format}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `Golden_Noura_Report_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert(t('common.exportError'));
    } finally {
      setExporting(null);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const [sumResp, lineResp] = await Promise.all([
          api.get('/reports/summary'),
          api.get('/reports/timeline')
        ]);
        setData((prev: any) => ({ ...prev, ...sumResp.data, timeline: lineResp.data }));
      } else if (activeTab === 'pl') {
        const resp = await api.get(`/reports/profit-loss?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`);
        setData((prev: any) => ({ ...prev, pl: resp.data }));
      } else if (activeTab === 'balance') {
        const resp = await api.get(`/reports/balance-sheet?as_of_date=${dateRange.endDate}`);
        setData((prev: any) => ({ ...prev, balance: resp.data }));
      } else if (activeTab === 'cashflow') {
        const resp = await api.get('/reports/cash-flow');
        setData((prev: any) => ({ ...prev, cashflow: resp.data }));
      } else if (activeTab === 'insights') {
        const [wResp, cResp] = await Promise.all([
          api.get('/reports/profit-per-worker'),
          api.get('/reports/profit-per-company')
        ]);
        setData((prev: any) => ({ ...prev, insights: { workers: wResp.data, companies: cResp.data } }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, dateRange]);

  const renderOverview = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard title={t('reports.totalRevenue')} amount={data.revenue} icon={<TrendingUp className="w-8 h-8 text-gn-gold" />} trend="+12%" color="gold" />
        <SummaryCard title={t('reports.totalExpenses')} amount={data.expenses} icon={<TrendingDown className="w-8 h-8 text-red-500" />} trend="+5%" color="red" />
        <SummaryCard title={t('reports.netProfit')} amount={data.profit} icon={<TrendingUp className="w-8 h-8 text-green-500" />} trend="+8%" color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gn-surface/50 border border-gn-surface p-6 rounded-2xl h-[400px]">
          <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
             <BarChart3 className="w-5 h-5 text-gn-gold" /> {t('reports.revenueVsExpenses')}
          </h4>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.timeline}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f87171" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
              <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `SAR ${val}`} />
              <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="revenue" stroke="#D4AF37" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
              <Area type="monotone" dataKey="expenses" stroke="#f87171" fillOpacity={1} fill="url(#colorExp)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gn-surface/50 border border-gn-surface p-6 rounded-2xl h-[400px]">
          <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
             <PieChart className="w-5 h-5 text-gn-gold" /> {t('reports.revenueDistribution')}
          </h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
              <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }} />
              <Bar dataKey="revenue" fill="#D4AF37" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderPL = () => {
    if (!data.pl) return <LoadingSpinner />;
    return (
      <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
        <div className="flex justify-end gap-4 mb-4">
            <input 
                type="date" 
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                className="bg-gn-blackLight border border-gn-surface text-white px-4 py-2 rounded-lg"
            />
            <span className="text-white self-center">{t('common.to')}</span>
            <input 
                type="date" 
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                className="bg-gn-blackLight border border-gn-surface text-white px-4 py-2 rounded-lg"
            />
        </div>
        <div className="bg-gn-surface/50 border border-gn-surface rounded-2xl p-8 overflow-hidden">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-2xl font-bold text-white">{t('reports.profitLoss')}</h3>
              <p className="text-gray-400 text-sm mt-1">{t('reports.period')}: {dateRange.startDate} - {dateRange.endDate}</p>
            </div>
            <div className={`px-6 py-2 rounded-full font-bold text-lg ${data.pl.net_profit >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
              {t('reports.netProfit')}: SAR {data.pl.net_profit.toLocaleString()}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <section className="space-y-4">
              <h4 className="text-gn-gold font-bold flex items-center gap-2 border-b border-gn-surface pb-2">
                <TrendingUp className="w-5 h-5" /> {t('accounting.revenue')}
              </h4>
              <div className="space-y-3">
                {data.pl.revenue_items.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center group">
                    <span className="text-gray-300 group-hover:text-white transition">{item.category}</span>
                    <span className="text-white font-medium">SAR {item.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-4 border-t border-gn-surface font-bold text-white">
                  <span>{t('accounting.totalRevenue')}</span>
                  <span>SAR {data.pl.total_revenue.toLocaleString()}</span>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h4 className="text-red-400 font-bold flex items-center gap-2 border-b border-gn-surface pb-2">
                <TrendingDown className="w-5 h-5" /> {t('accounting.expenses')}
              </h4>
              <div className="space-y-3">
                {data.pl.expense_items.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center group">
                    <span className="text-gray-300 group-hover:text-white transition">{item.category}</span>
                    <span className="text-white font-medium">SAR {item.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-4 border-t border-gn-surface font-bold text-white">
                  <span>{t('reports.totalExpenses')}</span>
                  <span>SAR {data.pl.total_expenses.toLocaleString()}</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  };

  const renderBalanceSheet = () => {
    if (!data.balance) return <LoadingSpinner />;
    const { assets, liabilities, equity } = data.balance;
    return (
      <div className="space-y-6 animate-in slide-in-from-left duration-500">
        <div className="flex justify-end gap-4 mb-4">
            <span className="text-white self-center">{t('reports.asOf')}:</span>
            <input 
                type="date" 
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                className="bg-gn-blackLight border border-gn-surface text-white px-4 py-2 rounded-lg"
            />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gn-surface/50 border border-gn-surface rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Scale className="w-6 h-6 text-gn-gold" /> {t('accounting.assets')}
            </h3>
            <div className="space-y-4">
                {assets.accounts.map((item: any, i: number) => (
                <div key={i} className="flex justify-between p-3 bg-gn-blackLight/30 rounded-lg hover:bg-gn-blackLight/50 transition">
                    <span className="text-gray-400">{item.name} <span className="text-xs ml-2 opacity-50">({item.code})</span></span>
                    <span className="text-white font-bold">SAR {item.balance.toLocaleString()}</span>
                </div>
                ))}
                <div className="flex justify-between p-4 bg-gn-gold/10 border border-gn-gold/20 rounded-xl font-bold text-white mt-8">
                <span>{t('accounting.totalAssets')}</span>
                <span>SAR {assets.total.toLocaleString()}</span>
                </div>
            </div>
            </div>

            <div className="space-y-6">
            <div className="bg-gn-surface/50 border border-gn-surface rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Receipt className="w-6 h-6 text-red-400" /> {t('accounting.liabilities')}
                </h3>
                <div className="space-y-4">
                {liabilities.accounts.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between p-3 bg-gn-blackLight/30 rounded-lg hover:bg-gn-blackLight/50 transition">
                    <span className="text-gray-400">{item.name} <span className="text-xs ml-2 opacity-50">({item.code})</span></span>
                    <span className="text-white font-bold">SAR {item.balance.toLocaleString()}</span>
                    </div>
                ))}
                <div className="flex justify-between p-3 font-bold text-white border-t border-gn-surface mt-2">
                    <span>{t('accounting.totalLiabilities')}</span>
                    <span>SAR {liabilities.total.toLocaleString()}</span>
                </div>
                </div>
            </div>

            <div className="bg-gn-surface/50 border border-gn-surface rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <MoveRight className="w-6 h-6 text-green-400" /> {t('accounting.equity')}
                </h3>
                <div className="space-y-4">
                {equity.accounts.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between p-3 bg-gn-blackLight/30 rounded-lg hover:bg-gn-blackLight/50 transition">
                    <span className="text-gray-400">{item.name} <span className="text-xs ml-2 opacity-50">({item.code})</span></span>
                    <span className="text-white font-bold">SAR {item.balance.toLocaleString()}</span>
                    </div>
                ))}
                
                {/* Explicit Retained Earnings Display */}
                <div className="flex justify-between p-3 bg-gn-blackLight/30 rounded-lg border-l-2 border-green-500">
                    <span className="text-gray-300">{t('accounting.retainedEarnings')}</span>
                    <span className="text-white font-bold">SAR {equity.retained_earnings.toLocaleString()}</span>
                </div>

                <div className="flex justify-between p-3 font-bold text-white border-t border-gn-surface mt-2">
                    <span>{t('accounting.totalEquity')}</span>
                    <span>SAR {equity.total.toLocaleString()}</span>
                </div>
                </div>
            </div>
            </div>
        </div>
      </div>
    );
  };

  const renderCashFlow = () => {
    if (!data.cashflow) return <LoadingSpinner />;
    return (
      <div className="bg-gn-surface/50 border border-gn-surface rounded-2xl p-8 animate-in zoom-in duration-500">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 bg-gn-gold/20 rounded-xl">
             <DollarSign className="w-8 h-8 text-gn-gold" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">{t('reports.cashFlow')}</h3>
            <p className="text-gray-400 text-sm">{t('reports.trackingCash')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
           <div className="space-y-6">
              <h4 className="text-green-400 font-bold flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5" /> {t('reports.cashInflows')}
              </h4>
              <div className="space-y-4">
                {data.cashflow.inflow.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-green-500/5 border border-green-500/10 rounded-xl">
                    <span className="text-gray-300">{item.category}</span>
                    <span className="text-green-400 font-bold">+ SAR {item.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
           </div>

           <div className="space-y-6">
              <h4 className="text-red-400 font-bold flex items-center gap-2">
                <ArrowDownRight className="w-5 h-5" /> {t('reports.cashOutflows')}
              </h4>
              <div className="space-y-4">
                {data.cashflow.outflow.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
                    <span className="text-gray-300">{item.category}</span>
                    <span className="text-red-400 font-bold">- SAR {item.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
           </div>
        </div>

        <div className="mt-12 p-6 bg-gn-blackLight/50 rounded-2xl border border-gn-surface flex justify-between items-center">
            <span className="text-lg text-gray-400">{t('reports.netCashChange')}</span>
            <span className={`text-2xl font-black ${data.cashflow.net_cash_flow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              SAR {data.cashflow.net_cash_flow.toLocaleString()}
            </span>
        </div>
      </div>
    );
  };

  const renderInsights = () => {
    if (!data.insights) return <LoadingSpinner />;
    return (
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gn-surface/50 border border-gn-surface rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <PieChart className="w-6 h-6 text-gn-gold" /> {t('reports.profitPerWorker')}
            </h3>
            <div className="space-y-4">
              {data.insights.workers.slice(0, 5).map((w: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-4 bg-gn-blackLight/30 rounded-xl hover:bg-gn-gold/5 transition group">
                  <div>
                    <p className="text-white font-bold group-hover:text-gn-gold flex items-center gap-2">
                       <ArrowUpRight className="w-4 h-4 text-green-500" /> {w.worker_name}
                    </p>
                    <p className="text-gray-500 text-xs">{t('common.revenue')}: SAR {w.revenue} | {t('common.cost')}: SAR {w.cost}</p>
                  </div>
                  <span className="text-green-400 font-bold">SAR {w.profit.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gn-surface/50 border border-gn-surface rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-400" /> {t('reports.profitPerClient')}
            </h3>
            <div className="space-y-4">
              {data.insights.companies.slice(0, 5).map((c: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-4 bg-gn-blackLight/30 rounded-xl hover:bg-gn-white/5 transition">
                  <div>
                    <p className="text-white font-bold">{c.company_name}</p>
                    <p className="text-gray-500 text-xs">{c.active_workers} {t('dashboard.stats.activeWorkers')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gn-gold font-bold">SAR {c.profit.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-500">{t('common.margin')}: {((c.profit/c.revenue)*100).toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{t('reports.financialIntelligence')}</h2>
          <p className="text-gray-400 text-xs mt-1">{t('reports.realTimeInsights')}</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <button
            onClick={() => printWithLang('bn')}
            className="flex items-center gap-2 px-6 py-2 bg-gn-white/10 text-white hover:bg-gn-white/20 font-bold rounded-xl transition border border-gn-surface"
          >
            <Printer className="w-4 h-4" /> {t('common.print')} (BN)
          </button>
          <button 
            onClick={() => handleExport('excel')}
            disabled={!!exporting}
            className={`flex items-center gap-2 px-6 py-2 ${exporting === 'excel' ? 'bg-gn-surface text-gray-400' : 'bg-gn-gold hover:bg-gn-gold/90 text-gn-black'} font-bold rounded-xl transition shadow-lg shadow-gn-gold/20`}
          >
            <Download className="w-4 h-4" />
            {exporting === 'excel' ? t('common.loading') : t('reports.exportToExcel')}
          </button>
          <button 
            onClick={() => handleExport('csv')}
            disabled={!!exporting}
            className={`flex items-center gap-2 px-6 py-2 ${exporting === 'csv' ? 'bg-gn-surface text-gray-400' : 'bg-gn-white/10 text-white hover:bg-gn-white/20'} font-bold rounded-xl transition border border-gn-surface`}
          >
            <Download className="w-4 h-4" />
            {exporting === 'csv' ? t('common.loading') : t('reports.exportToCsv')}
          </button>
          <div className="flex bg-gn-surface/50 p-1 rounded-xl border border-gn-surface">
            <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<TrendingUp className="w-4 h-4" />} label={t('dashboard.overview')} />
            <TabButton active={activeTab === 'pl'} onClick={() => setActiveTab('pl')} icon={<Receipt className="w-4 h-4" />} label="P&L" />
            <TabButton active={activeTab === 'balance'} onClick={() => setActiveTab('balance')} icon={<Scale className="w-4 h-4" />} label={t('accounting.balanceSheet')} />
            <TabButton active={activeTab === 'cashflow'} onClick={() => setActiveTab('cashflow')} icon={<MoveRight className="w-4 h-4" />} label={t('accounting.cashFlow')} />
            <TabButton active={activeTab === 'insights'} onClick={() => setActiveTab('insights')} icon={<PieChart className="w-4 h-4" />} label={t('reports.insights')} />
            <TabButton active={activeTab === 'advanced'} onClick={() => setActiveTab('advanced')} icon={<Settings className="w-4 h-4" />} label={t('reports.advanced')} />
            <TabButton active={activeTab === 'egyptian'} onClick={() => setActiveTab('egyptian')} icon={<Database className="w-4 h-4" />} label="مصري" />
          </div>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'pl' && renderPL()}
          {activeTab === 'balance' && renderBalanceSheet()}
          {activeTab === 'cashflow' && renderCashFlow()}
          {activeTab === 'insights' && renderInsights()}
          {activeTab === 'advanced' && <AdvancedReportBuilder />}
          {activeTab === 'egyptian' && <EgyptianReportBuilder />}
        </>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active 
          ? 'bg-gn-gold text-gn-black shadow-lg' 
          : 'text-gray-400 hover:text-white hover:bg-gn-white/5'
      }`}
    >
      {icon} {label}
    </button>
  );
}

function SummaryCard({ title, amount, icon, trend, color }: any) {
  const colorMap: any = {
    gold: 'hover:border-gn-gold/30',
    red: 'hover:border-red-500/30',
    green: 'hover:border-green-500/30'
  };
  return (
    <div className={`bg-gn-surface/50 border border-gn-surface p-6 rounded-2xl relative overflow-hidden group transition-all ${colorMap[color]}`}>
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        {icon}
      </div>
      <p className="text-gray-400 text-sm font-medium">{title}</p>
      <div className="flex items-end gap-2 mt-2">
        <h3 className="text-3xl font-bold text-white">SAR {amount.toLocaleString()}</h3>
        <span className={`text-sm flex items-center mb-1 ${color === 'red' ? 'text-red-400' : 'text-green-400'}`}>
          <ArrowUpRight className="w-4 h-4" /> {trend}
        </span>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
      <div className="w-12 h-12 border-4 border-gn-gold border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-500">{t('common.loading')}</p>
    </div>
  );
}
