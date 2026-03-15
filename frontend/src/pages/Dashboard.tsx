import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import api, { getApiBaseUrl } from '../api';
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
import UserAvatar from '../components/common/UserAvatar';

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
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Initialize from localStorage immediately
  useEffect(() => {
    const storedFullName = localStorage.getItem('full_name') || '';
    const storedRole = localStorage.getItem('role') || '';
    const storedAvatar = localStorage.getItem('avatar_url');
    
    console.log('Initial localStorage data:', { storedFullName, storedRole, storedAvatar });
    
    setFullName(storedFullName);
    setRole(storedRole);
    setAvatarUrl(storedAvatar);
    
    // Immediately fetch fresh data from server
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        console.log('Fetching fresh user data from server...');
        const me = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const name = me?.data?.full_name || '';
        const avatar = me?.data?.avatar_url || '';
        const roleFromServer = me?.data?.role || '';
        
        console.log('Fresh data from server:', { name, avatar, roleFromServer });
        
        if (name) {
          localStorage.setItem('full_name', name);
          setFullName(name);
          console.log('Updated full name from server:', name);
        } else {
          console.log('No full name found in server response');
        }
        if (roleFromServer) {
          localStorage.setItem('role', roleFromServer);
          setRole(roleFromServer);
        }
        if (avatar) {
          const apiRoot = getApiBaseUrl();
          const src = avatar.startsWith('http') ? avatar : `${apiRoot}${avatar}`;
          setAvatarUrl(src);
          try { localStorage.setItem('avatar_url', src); } catch {}
        } else {
          setAvatarUrl(null);
          localStorage.removeItem('avatar_url');
        }
      } catch (error) {
        console.log('Failed to fetch user data from server:', error);
      }
    }
  };

  // Simulation data for 2026 visualization
  const data = [
    { name: '01', value: 400 },
    { name: '08', value: 800 },
    { name: '15', value: 600 },
    { name: '22', value: 1100 },
    { name: '29', value: 950 },
  ];

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'full_name') {
        setFullName(localStorage.getItem('full_name') || '');
      }
    };
    const onFocus = () => {
      fetchUserData();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);
    const onProfileUpdated = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      if (typeof detail?.full_name === 'string') {
        setFullName(detail.full_name);
      }
      if (typeof detail?.avatar_url === 'string') {
        setAvatarUrl(detail.avatar_url);
      }
    };
    window.addEventListener('profile-updated', onProfileUpdated as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('profile-updated', onProfileUpdated as EventListener);
    };
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [wResp, cResp, conResp, sumResp] = await Promise.all([
          api.get('/workers/'),
          api.get('/clients/'),
          api.get('/contracts/'),
          api.get('/reports/summary')
        ]);

        const workers = wResp.data || [];
        const clients = cResp.data || [];
        const contracts = conResp.data || [];
        const summary = sumResp.data || { revenue: 0, expenses: 0, profit: 0 };

        setStats({
          workers: workers.length,
          activeWorkers: workers.filter((w: any) => w.status === 'ACTIVE').length || workers.length,
          clients: clients.length,
          contracts: contracts.length,
          revenue: summary.revenue,
          netProfit: summary.profit
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
      labelKey: 'dashboard.stats.totalWorkers', 
      value: stats.workers, 
      icon: Users, 
      color: 'text-blue-400',
      bg: 'bg-blue-500/10' 
    },
    { 
      labelKey: 'dashboard.stats.activeWorkers', 
      value: stats.activeWorkers, 
      icon: Activity, 
      color: 'text-green-400',
      bg: 'bg-green-500/10' 
    },
    { 
      labelKey: 'dashboard.stats.monthlyRevenue', 
      value: `SAR ${stats.revenue.toLocaleString()}`, 
      icon: DollarSign, 
      color: 'text-gn-gold',
      bg: 'bg-gn-gold/10' 
    },
    { 
      labelKey: 'dashboard.stats.netProfit', 
      value: `SAR ${stats.netProfit.toLocaleString()}`, 
      icon: TrendingUp, 
      color: 'text-purple-400',
      bg: 'bg-purple-500/10' 
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gn-surface/30 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <UserAvatar size="lg" />
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                {t('auth.welcomeName', { name: (fullName?.trim() || localStorage.getItem('full_name') || localStorage.getItem('username') || t('common.name')) })}
              </h1>
              {role && (
                <span className="inline-block mt-2 px-3 py-1 text-sm bg-gn-gold/20 text-gn-gold rounded-md border border-gn-gold/30">
                  {role === 'ADMIN' ? 'مدير النظام' : role === 'DATA_ENTRY' ? 'مدخل بيانات' : role === 'REPORT_VIEWER' ? 'مشاهد تقارير' : role}
                </span>
              )}
            </div>
          </div>
          <p className="text-gray-400 mt-4 font-medium">{t('dashboard.happeningToday')}</p>
          <p className="text-sm text-gn-goldLight mt-2">
            {new Date().toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : i18n.language === 'bn' ? 'bn-BD' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-gn-surface border border-gn-surface px-6 py-3 rounded-2xl text-sm text-gray-300 shadow-lg">
          <Calendar className="w-5 h-5 text-gn-gold" />
          <span className="font-semibold">{new Date().toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : i18n.language === 'bn' ? 'bn-BD' : 'en-US')}</span>
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
            <p className="text-gray-400 text-sm font-medium relative z-10">{t(card.labelKey)}</p>
            <h3 className="text-2xl font-bold text-white mt-1 relative z-10">{loading ? '...' : card.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-gn-surface/40 border border-gn-surface p-8 rounded-3xl shadow-2xl relative overflow-hidden h-[450px]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gn-gold/0 via-gn-gold/50 to-gn-gold/0"></div>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-gn-gold" /> {t('dashboard.financialPerformance')}
            </h2>
            <select className="bg-gn-blackLight border border-gn-surface text-gray-400 text-xs px-3 py-1 rounded-lg outline-none focus:border-gn-gold">
              <option>{t('common.date', { days: 30 })}</option>
              <option>{t('common.date', { days: 90 })}</option>
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
            <FileText className="w-5 h-5 text-gn-gold" /> {t('dashboard.recentActivity')}
          </h2>
          <div className="space-y-6">
            {[1, 2, 3, 4].map((_, i) => (
              <div key={i} className="flex gap-4 group cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-gn-blackLight border border-gn-surface flex items-center justify-center shrink-0 group-hover:border-gn-gold transition-colors">
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gn-gold" />
                </div>
                <div className="border-b border-gn-surface pb-4 w-full group-hover:border-gn-gold/20 transition-colors">
                  <p className="text-sm font-medium text-white">{t('contracts.contractNumber')}: CON-9283{i}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('common.updated')}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-3 bg-gn-blackLight border border-gn-surface hover:border-gn-gold/50 text-white rounded-xl text-sm font-medium transition-all">
            {t('dashboard.viewAll')}
          </button>
        </div>
      </div>
    </div>
  );
}
