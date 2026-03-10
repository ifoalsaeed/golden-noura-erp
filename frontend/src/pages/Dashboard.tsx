import { useTranslation } from 'react-i18next';
import { Users, Briefcase, Wallet, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { t } = useTranslation();

  const stats = [
    { title: 'Total Workers', value: '1,240', icon: Users, color: 'text-blue-400' },
    { title: 'Active Workers', value: '1,100', icon: Briefcase, color: 'text-green-400' },
    { title: 'Monthly Revenue', value: 'SAR 450,000', icon: TrendingUp, color: 'text-gn-gold' },
    { title: 'Net Profit', value: 'SAR 120,000', icon: Wallet, color: 'text-gn-goldLight' },
  ];

  const chartData = [
    { name: 'Jan', revenue: 4000, expenses: 2400 },
    { name: 'Feb', revenue: 3000, expenses: 1398 },
    { name: 'Mar', revenue: 2000, expenses: 9800 },
    { name: 'Apr', revenue: 2780, expenses: 3908 },
    { name: 'May', revenue: 1890, expenses: 4800 },
    { name: 'Jun', revenue: 2390, expenses: 3800 },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">{t('Dashboard')}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-gn-surface/50 border border-gn-surface rounded-xl p-6 shadow-lg relative overflow-hidden group hover:border-gn-gold/30 transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-gn-gold/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">{t(stat.title)}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-gn-black shadow-inner ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-gn-surface/50 border border-gn-surface rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-4">{t('Financial Overview')}</h3>
          <div className="h-80 w-full" style={{ direction: 'ltr' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" />
                <RechartsTooltip contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#333' }} />
                <Bar dataKey="revenue" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#121212" stroke="#333" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}