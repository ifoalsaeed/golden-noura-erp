import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, DollarSign, Download, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function Reports() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    revenue: 0,
    expenses: 0,
    profit: 0,
    timeline: []
  });

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [sumResp, lineResp] = await Promise.all([
          fetch(`${API_URL}/api/v1/reports/summary`),
          fetch(`${API_URL}/api/v1/reports/timeline`)
        ]);
        
        if (sumResp.ok && lineResp.ok) {
          const sumData = await sumResp.json();
          const lineData = await lineResp.json();
          setData({
            ...sumData,
            timeline: lineData
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">{t('Reports Overview')}</h2>
        <button className="flex items-center gap-2 bg-gn-surface border border-gn-surface hover:border-gn-gold/50 text-white px-4 py-2 rounded-lg transition">
          <Download className="w-5 h-5 text-gn-gold" /> {t('Export to Excel')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gn-surface/50 border border-gn-surface p-6 rounded-2xl relative overflow-hidden group hover:border-gn-gold/30 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-12 h-12 text-gn-gold" />
          </div>
          <p className="text-gray-400 text-sm font-medium">{t('Revenue')}</p>
          <div className="flex items-end gap-2 mt-2">
            <h3 className="text-3xl font-bold text-white">SAR {data.revenue.toLocaleString()}</h3>
            <span className="text-green-400 text-sm flex items-center mb-1">
              <ArrowUpRight className="w-4 h-4" /> +12%
            </span>
          </div>
        </div>

        <div className="bg-gn-surface/50 border border-gn-surface p-6 rounded-2xl relative overflow-hidden group hover:border-red-500/30 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingDown className="w-12 h-12 text-red-500" />
          </div>
          <p className="text-gray-400 text-sm font-medium">{t('Expenses')}</p>
          <div className="flex items-end gap-2 mt-2">
            <h3 className="text-3xl font-bold text-white">SAR {data.expenses.toLocaleString()}</h3>
            <span className="text-red-400 text-sm flex items-center mb-1">
              <ArrowDownRight className="w-4 h-4" /> +5%
            </span>
          </div>
        </div>

        <div className="bg-gn-gold/10 border border-gn-gold/20 p-6 rounded-2xl relative overflow-hidden group hover:bg-gn-gold/20 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity text-gn-gold">
            <TrendingUp className="w-12 h-12" />
          </div>
          <p className="text-gn-goldLight text-sm font-medium">{t('Net Profit')}</p>
          <div className="flex items-end gap-2 mt-2">
            <h3 className="text-3xl font-bold text-white">SAR {data.profit.toLocaleString()}</h3>
            <span className="text-gn-gold text-sm flex items-center mb-1">
              <ArrowUpRight className="w-4 h-4" /> +8%
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gn-surface/50 border border-gn-surface p-6 rounded-2xl shadow-xl h-[400px]">
          <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
             <TrendingUp className="w-5 h-5 text-gn-gold" /> {t('Revenue vs Expenses')}
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
              <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `SAR ${val/1000}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                itemStyle={{ fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#D4AF37" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
              <Area type="monotone" dataKey="expenses" stroke="#f87171" fillOpacity={1} fill="url(#colorExp)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gn-surface/50 border border-gn-surface p-6 rounded-2xl shadow-xl h-[400px]">
          <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
             <TrendingUp className="w-5 h-5 text-gn-gold" /> {t('Profit Growth')}
          </h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
              <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `SAR ${val/1000}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                cursor={{ fill: '#ffffff05' }}
              />
              <Bar dataKey="revenue" fill="#D4AF37" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
