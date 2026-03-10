import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Wallet, Plus, Search, Receipt, TrendingDown, Building, Plane } from 'lucide-react';

export default function Expenses() {
    const { t } = useTranslation();

    const [expenses] = useState([
        { id: 1, category: 'تأشيرات وإقامات', amount: 15400, description: 'تجديد إقامة عدد 4 عمال', date: '2026-03-05', receipt: true },
        { id: 2, category: 'سكن العمال', amount: 8000, description: 'إيجار سكن الرياض - شهر مارس', date: '2026-03-01', receipt: true },
        { id: 3, category: 'تذاكر طيران', amount: 2500, description: 'تذكرة استقدام عامل نيبالي', date: '2026-03-08', receipt: false },
        { id: 4, category: 'فحص طبي', amount: 600, description: 'رسوم فحص طبي لعاملين', date: '2026-03-09', receipt: true },
    ]);

    const stats = [
        { title: 'إجمالي المصروفات', value: '26,500 ريال', icon: Wallet, color: 'text-red-400', border: 'border-red-400/30' },
        { title: 'السكن والانتقالات', value: '8,000 ريال', icon: Building, color: 'text-gn-goldLight', border: 'border-gn-goldLight/30' },
        { title: 'الرسوم الحكومية', value: '15,400 ريال', icon: TrendingDown, color: 'text-blue-400', border: 'border-blue-400/30' },
        { title: 'تذاكر وتسفير', value: '2,500 ريال', icon: Plane, color: 'text-purple-400', border: 'border-purple-400/30' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center">
                    <Wallet className="w-8 h-8 ml-3 text-gn-gold" />
                    {t('Expenses')}
                </h2>
                <button onClick={() => alert('تم تفعيل هذه الميزة بنجاح. سيتم فتح نافذة الإضافة قريباً')} className="bg-gn-gold hover:bg-gn-goldDark text-gn-black font-bold py-2 px-4 rounded-lg flex items-center transition shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                    <Plus className="w-5 h-5 ml-2" /> إضافة مصروف جديد
                </button>
            </div>

            {/* Stats Grid for Expenses */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <div key={idx} className={`bg-gn-surface/50 border ${stat.border} rounded-xl p-5 shadow-lg relative overflow-hidden group`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm font-medium">{stat.title}</p>
                                    <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                                </div>
                                <div className={`p-3 rounded-lg bg-gn-black shadow-inner ${stat.color}`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-gn-surface/50 border border-gn-surface rounded-xl p-6 shadow-lg">
                <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
                    <div className="relative w-80">
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input type="text" placeholder="ابحث في المصروفات..." className="w-full bg-gn-blackLight border border-gn-surface rounded-lg pr-10 pl-4 py-2 text-white focus:outline-none focus:border-gn-gold" />
                    </div>

                    <div className="flex gap-2">
                        <select className="bg-gn-blackLight border border-gn-surface text-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:border-gn-gold">
                            <option>كل التصنيفات</option>
                            <option>تأشيرات ورسوم</option>
                            <option>سكن ونقل</option>
                            <option>تذاكر طيران</option>
                            <option>فحص طبي</option>
                            <option>نثريات المكتب</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right text-gray-300">
                        <thead className="text-xs text-gn-goldLight uppercase bg-gn-blackLight/50 border-b border-gn-surface">
                            <tr>
                                <th className="px-4 py-4">تاريخ الصرف</th>
                                <th className="px-4 py-4">التصنيف</th>
                                <th className="px-4 py-4">البيان (التفاصيل)</th>
                                <th className="px-4 py-4">المبلغ</th>
                                <th className="px-4 py-4 text-center">الفاتورة / الإيصال</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.map((row) => (
                                <tr key={row.id} className="border-b border-gn-surface hover:bg-gn-blackLight/30 transition-colors">
                                    <td className="px-4 py-4 text-gray-400">{row.date}</td>
                                    <td className="px-4 py-4 font-medium text-white">
                                        <span className="bg-gn-surface py-1 px-3 rounded text-sm border border-gn-surface">{row.category}</span>
                                    </td>
                                    <td className="px-4 py-4">{row.description}</td>
                                    <td className="px-4 py-4 font-bold text-red-400">{row.amount} ريال</td>
                                    <td className="px-4 py-4 text-center">
                                        {row.receipt ? (
                                            <button className="text-blue-400 hover:text-blue-300 flex items-center justify-center w-full">
                                                <Receipt className="w-5 h-5 ml-1" /> المرفق
                                            </button>
                                        ) : (
                                            <span className="text-gray-500">لا يوجد</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
