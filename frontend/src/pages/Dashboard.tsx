import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  Building2, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Activity,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function Dashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    workers: 0,
    clients: 0,
    contracts: 0,
    revenue: 0,
    activeWorkers: 0,
    netProfit: 0
  });
  const [loading, setLoading] = useState(true);

  // Simulation data for 2026 visualization
  const data = [
    { name: '01', value: 400 },
    { name: '08', value: 800 },
    { name: '15', value: 600 },
    { name: '22', value: 1100 },
    { name: '29', value: 950 },
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [wResp, cResp, conResp, pResp] = await Promise.all([
          fetch(`${API_URL}/api/v1/workers/`),
          fetch(`${API_URL}/api/v1/clients/`),
          fetch(`${API_URL}/api/v1/contracts/`),
          fetch(`${API_URL}/api/v1/payroll/`)
        ]);

        const workers = wResp.ok ? await wResp.json() : [];
        const clients = cResp.ok ? await cResp.json() : [];
        const contracts = conResp.ok ? await conResp.json() : [];
        const payroll = pResp.ok ? await pResp.json() : [];

        const totalPayroll = payroll.reduce((acc: number, curr: any) => acc + curr.net_salary, 0);
        const estimatedRevenue = (totalPayroll * 1.3) + 15000;

        setStats({
          workers: workers.length,
          activeWorkers: workers.filter((w: any) => w.status === 'ACTIVE').length || workers.length,
          clients: clients.length,
          contracts: contracts.length,
          revenue: estimatedRevenue,
          netProfit: estimatedRevenue * 0.2
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { 
      label: 'Total Workers', 
      value: stats.workers, 
      icon: Users, 
      color: 'text-blue-400',
      bg: 'bg-blue-500/10' 
    },
    { 
      label: 'Active Workers', 
      value: stats.activeWorkers, 
      icon: Activity, 
      color: 'text-green-400',
      bg: 'bg-green-500/10' 
    },
    { 
      label: 'Monthly Revenue', 
      value: `SAR ${stats.revenue.toLocaleString()}`, 
      icon: DollarSign, 
      color: 'text-gn-gold',
      bg: 'bg-gn-gold/10' 
    },
    { 
      label: 'Net Profit', 
      value: `SAR ${stats.netProfit.toLocaleString()}`, 
      icon: TrendingUp, 
      color: 'text-purple-400',
      bg: 'bg-purple-500/10' 
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{t('Welcome back')}</h1>
          <p className="text-gray-400 mt-1">{t('Here is what is happening with Golden Noura ERP today.')}</p>
        </div>
        <div className="flex items-center gap-2 bg-gn-surface/50 border border-gn-surface px-4 py-2 rounded-xl text-sm text-gray-300">
          <Calendar className="w-4 h-4 text-gn-gold" />
          {new Date().toLocaleDateString('ar-SA')}
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-gn-surface/40 border border-gn-surface hover:border-gn-gold/30 p-6 rounded-2xl transition-all group overflow-hidden relative">
            <div className={`absolute top-0 right-0 w-24 h-24 ${card.bg} rounded-bl-full opacity-50 -mr-8 -mt-8 blur-2xl group-hover:opacity-100 transition-opacity`}></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
                <card.icon className="w-6 h-6" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-gray-400 text-sm font-medium relative z-10">{t(card.label)}</p>
            <h3 className="text-2xl font-bold text-white mt-1 relative z-10">{loading ? '...' : card.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-gn-surface/40 border border-gn-surface p-8 rounded-3xl shadow-2xl relative overflow-hidden h-[450px]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gn-gold/0 via-gn-gold/50 to-gn-gold/0"></div>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-gn-gold" /> {t('Financial Performance')}
            </h2>
            <select className="bg-gn-blackLight border border-gn-surface text-gray-400 text-xs px-3 py-1 rounded-lg outline-none focus:border-gn-gold">
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
            </select>
          </div>
          <div className="h-full pb-12">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px', boxShadow: '0 10px 30px #000000aa' }}
                  cursor={{ stroke: '#D4AF37', strokeWidth: 1 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#D4AF37" 
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  strokeWidth={4}
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gn-surface/40 border border-gn-surface p-8 rounded-3xl shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gn-gold" /> {t('Recent Activity')}
          </h2>
          <div className="space-y-6">
            {[1, 2, 3, 4].map((_, i) => (
              <div key={i} className="flex gap-4 group cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-gn-blackLight border border-gn-surface flex items-center justify-center shrink-0 group-hover:border-gn-gold transition-colors">
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gn-gold" />
                </div>
                <div className="border-b border-gn-surface pb-4 w-full group-hover:border-gn-gold/20 transition-colors">
                  <p className="text-sm font-medium text-white">{t('Contract #')} CON-9283{i}</p>
                  <p className="text-xs text-gray-500 mt-1">2 hours ago • {t('Updated')}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-3 bg-gn-blackLight border border-gn-surface hover:border-gn-gold/50 text-white rounded-xl text-sm font-medium transition-all">
            {t('View All Activity')}
          </button>
        </div>
      </div>
    </div>
  );
}