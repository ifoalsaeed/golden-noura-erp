import { useTranslation } from 'react-i18next';
import { FileBarChart2, TrendingUp, TrendingDown, Users, Download, Calendar } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Reports() {
    const { t } = useTranslation();

    const revenueData = [
        { month: 'يناير', revenue: 45000, expenses: 32000, profit: 13000 },
        { month: 'فبراير', revenue: 52000, expenses: 34000, profit: 18000 },
        { month: 'مارس', revenue: 48000, expenses: 31000, profit: 17000 },
        { month: 'أبريل', revenue: 61000, expenses: 38000, profit: 23000 },
        { month: 'مايو', revenue: 59000, expenses: 37000, profit: 22000 },
        { month: 'يونيو', revenue: 65000, expenses: 40000, profit: 25000 },
    ];

    const nationalityData = [
        { name: 'بنغالي', value: 45 },
        { name: 'هندي', value: 30 },
        { name: 'باكستاني', value: 15 },
        { name: 'نيبالي', value: 10 },
    ];

    const COLORS = ['#D4AF37', '#F3E5AB', '#996515', '#1e1e1e'];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center">
                    <FileBarChart2 className="w-8 h-8 ml-3 text-gn-gold" />
                    {t('Reports')}
                </h2>
                <div className="flex gap-3">
                    <button className="bg-gn-blackLight border border-gn-surface text-gray-300 px-4 py-2 rounded-lg flex items-center hover:border-gn-gold transition">
                        <Calendar className="w-4 h-4 ml-2" /> الفترة: آخر 6 شهور
                    </button>
                    <button onClick={() => window.print()} className="bg-gn-gold hover:bg-gn-goldDark text-gn-black font-bold py-2 px-4 rounded-lg flex items-center transition shadow-lg">
                        <Download className="w-4 h-4 ml-2" /> تصدير PDF
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-gn-surface/50 border border-gn-surface rounded-xl p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-6">منحنى الإيرادات والأرباح</h3>
                    <div className="h-80 w-full" style={{ direction: 'ltr' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="month" stroke="#888" />
                                <YAxis stroke="#888" />
                                <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '8px' }} />
                                <Area type="monotone" dataKey="revenue" stroke="#D4AF37" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                                <Area type="monotone" dataKey="profit" stroke="#10b981" fillOpacity={0} strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-gn-surface/50 border border-gn-surface rounded-xl p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-6">توزيع العمال حسب الجنسية</h3>
                    <div className="h-64 w-full" style={{ direction: 'ltr' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={nationalityData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {nationalityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-2">
                        {nationalityData.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                                <div className="flex items-center">
                                    <div className="w-3 h-3 rounded-full ml-2" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                    <span className="text-gray-400">{item.name}</span>
                                </div>
                                <span className="text-white font-medium">{item.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gn-surface/30 border border-gn-surface p-6 rounded-xl">
                    <TrendingUp className="w-8 h-8 text-green-400 mb-4" />
                    <p className="text-gray-400 text-sm">متوسط دخل النقطة</p>
                    <p className="text-2xl font-bold text-white">4,200 ريال</p>
                    <p className="text-xs text-green-400 mt-2">+12% عن الشهر الماضي</p>
                </div>
                <div className="bg-gn-surface/30 border border-gn-surface p-6 rounded-xl">
                    <TrendingDown className="w-8 h-8 text-red-400 mb-4" />
                    <p className="text-gray-400 text-sm">إجمالي المصروفات التشغيلية</p>
                    <p className="text-2xl font-bold text-white">145,000 ريال</p>
                    <p className="text-xs text-red-400 mt-2">+5% ارتفاع في الرسوم</p>
                </div>
                <div className="bg-gn-surface/30 border border-gn-surface p-6 rounded-xl">
                    <Users className="w-8 h-8 text-blue-400 mb-4" />
                    <p className="text-gray-400 text-sm">كفاءة استغلال السكن</p>
                    <p className="text-2xl font-bold text-white">92%</p>
                    <p className="text-xs text-blue-400 mt-2">ممتاز - تقارب الحجز الكامل</p>
                </div>
                <div className="bg-gn-surface/30 border border-gn-surface p-6 rounded-xl">
                    <TrendingUp className="w-8 h-8 text-gn-gold mb-4" />
                    <p className="text-gray-400 text-sm">صافي أرباح السنة الحالية</p>
                    <p className="text-2xl font-bold text-white">840,000 ريال</p>
                    <p className="text-xs text-gn-gold mt-2">مستهدف السنة: 1.2 مليون</p>
                </div>
            </div>
        </div>
    );
}
