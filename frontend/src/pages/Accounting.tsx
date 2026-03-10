import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Landmark, ArrowUpRight, ArrowDownRight, Search, FileText, Plus, Filter } from 'lucide-react';

export default function Accounting() {
    const { t } = useTranslation();

    const [accounts] = useState([
        { id: 1, name: 'الصندوق الرئيسي', code: '1101', type: 'Asset', balance: 125400 },
        { id: 2, name: 'بنك الراجحي', code: '1102', type: 'Asset', balance: 850000 },
        { id: 3, name: 'الرواتب والأجور', code: '5101', type: 'Expense', balance: 0 },
        { id: 4, name: 'أرباح تشغيلية', code: '4101', type: 'Revenue', balance: 1200000 },
    ]);

    const [transactions] = useState([
        { id: 1, date: '2026-03-09', desc: 'استحقاق رواتب شهر مارس', account: 'الرواتب والأجور', debit: 45000, credit: 0 },
        { id: 2, date: '2026-03-08', desc: 'دفعة من شركة المقاولات الحديثة', account: 'بنك الراجحي', debit: 0, credit: 15500 },
        { id: 3, date: '2026-03-05', desc: 'سداد فواتير سكن العمال', account: 'الصندوق الرئيسي', debit: 8000, credit: 0 },
    ]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center">
                    <Landmark className="w-8 h-8 ml-3 text-gn-gold" />
                    {t('Accounting')}
                </h2>
                <div className="flex gap-3">
                    <button onClick={() => alert('تم تفعيل هذه الميزة بنجاح. سيتم عرض شجرة الحسابات قريباً')} className="bg-gn-surface hover:bg-gn-surface/80 border border-gn-gold/50 text-gn-gold font-bold py-2 px-6 rounded-lg flex items-center transition shadow-lg">
                        <FileText className="w-5 h-5 ml-2" /> شجرة الحسابات
                    </button>
                    <button onClick={() => alert('تم تفعيل هذه الميزة بنجاح. سيتم فتح نافذة الإضافة قريباً')} className="bg-gn-gold hover:bg-gn-goldDark text-gn-black font-bold py-2 px-6 rounded-lg flex items-center transition shadow-lg">
                        <Plus className="w-5 h-5 ml-2" /> قيد محاسبي جديد
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {accounts.slice(0, 4).map((acc, idx) => (
                    <div key={idx} className="bg-gn-surface/50 border border-gn-surface rounded-xl p-5 hover:border-gn-gold/30 transition-all cursor-default">
                        <p className="text-gray-400 text-xs uppercase tracking-widest">{acc.name}</p>
                        <p className="text-xl font-bold text-white mt-1">{acc.balance.toLocaleString()} ريال</p>
                        <p className="text-[10px] text-gray-500 mt-2">ACCOUNT # {acc.code}</p>
                    </div>
                ))}
            </div>

            <div className="bg-gn-surface/50 border border-gn-surface rounded-xl p-6 shadow-lg overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white">آخر القيود المحاسبية</h3>
                    <div className="flex gap-2">
                        <div className="relative w-64">
                            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input type="text" placeholder="بحث في القيود..." className="w-full bg-gn-blackLight border border-gn-surface rounded-lg pr-9 pl-4 py-1.5 text-sm text-white outline-none focus:border-gn-gold" />
                        </div>
                        <button className="p-2 bg-gn-blackLight border border-gn-surface text-gray-400 rounded-lg hover:text-white transition">
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right text-gray-300">
                        <thead className="text-xs text-gn-goldLight uppercase bg-gn-blackLight/80 border-b border-gn-surface">
                            <tr>
                                <th className="px-5 py-4">التاريخ</th>
                                <th className="px-5 py-4">البيان / الوصف</th>
                                <th className="px-5 py-4">الحساب المتأثر</th>
                                <th className="px-5 py-4">مدين (-)</th>
                                <th className="px-5 py-4 font-bold text-green-400">دائن (+)</th>
                                <th className="px-5 py-4 text-center">الإجراء</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gn-surface">
                            {transactions.map((t) => (
                                <tr key={t.id} className="hover:bg-gn-blackLight/40 transition-colors">
                                    <td className="px-5 py-4 font-mono text-xs text-gray-400">{t.date}</td>
                                    <td className="px-5 py-4 font-medium text-white">{t.desc}</td>
                                    <td className="px-5 py-4">
                                        <span className="bg-gn-surface border border-gn-surface px-2 py-1 rounded text-xs text-gray-300">{t.account}</span>
                                    </td>
                                    <td className="px-5 py-4 font-bold text-red-400">
                                        {t.debit > 0 ? (
                                            <div className="flex items-center">
                                                {t.debit.toLocaleString()} <ArrowDownRight className="w-3 h-3 mr-1" />
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className="px-5 py-4 font-bold text-green-400">
                                        {t.credit > 0 ? (
                                            <div className="flex items-center">
                                                {t.credit.toLocaleString()} <ArrowUpRight className="w-3 h-3 mr-1" />
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <button className="text-gn-gold hover:text-white transition underline text-xs">عرض التفاصيل</button>
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
