import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, Plus, Search, Calculator } from 'lucide-react';

export default function Payroll() {
    const { t } = useTranslation();

    // بيانات تجريبية مؤقتة عشان تشوف الشكل النهائي لنظام الرواتب
    const [payrolls] = useState([
        { id: 1, workerName: 'أحمد علي', base: 3000, overtime: 200, allowances: 500, deductions: 100, advances: 0, net: 3600, profit: 800 },
        { id: 2, workerName: 'محمد كبير (بنغالي)', base: 2500, overtime: 0, allowances: 300, deductions: 0, advances: 500, net: 2300, profit: 1200 },
    ]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center">
                    <DollarSign className="w-8 h-8 ml-3 text-gn-gold" />
                    {t('Payroll')}
                </h2>
                <div className="flex gap-4">
                    <button onClick={() => alert('تم تفعيل الحساب الأوتوماتيكي! جاري جلب البيانات...')} className="bg-gn-surface hover:bg-gn-surface/80 border border-gn-gold/50 text-gn-gold font-bold py-2 px-4 rounded-lg flex items-center transition">
                        <Calculator className="w-5 h-5 ml-2" /> حساب أوتوماتيكي
                    </button>
                    <button onClick={() => alert('تم تفعيل هذه الميزة بنجاح. سيتم فتح نافذة الإضافة قريباً')} className="bg-gn-gold hover:bg-gn-goldDark text-gn-black font-bold py-2 px-4 rounded-lg flex items-center transition">
                        <Plus className="w-5 h-5 ml-2" /> سجل جديد
                    </button>
                </div>
            </div>

            <div className="bg-gn-surface/50 border border-gn-surface rounded-xl p-6 shadow-lg">
                <div className="flex justify-between items-center mb-6">
                    <div className="relative w-72">
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input type="text" placeholder="ابحث باسم العامل..." className="w-full bg-gn-blackLight border border-gn-surface rounded-lg pr-10 pl-4 py-2 text-white focus:outline-none focus:border-gn-gold" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right text-gray-300">
                        <thead className="text-xs text-gn-goldLight uppercase bg-gn-blackLight/50 border-b border-gn-surface">
                            <tr>
                                <th className="px-4 py-4">اسم العامل</th>
                                <th className="px-4 py-4">الراتب الأساسي</th>
                                <th className="px-4 py-4 text-green-400">+ إضافي وبدلات</th>
                                <th className="px-4 py-4 text-red-400">- خصومات وسلف</th>
                                <th className="px-4 py-4 font-bold text-gn-gold">صافي الراتب المستحق</th>
                                <th className="px-4 py-4 text-blue-400">أرباح الشركة (تلقائي)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payrolls.map((row) => (
                                <tr key={row.id} className="border-b border-gn-surface hover:bg-gn-blackLight/30 transition-colors">
                                    <td className="px-4 py-4 font-medium text-white">{row.workerName}</td>
                                    <td className="px-4 py-4">{row.base} ريال</td>
                                    <td className="px-4 py-4 text-green-400">{row.overtime + row.allowances} ريال</td>
                                    <td className="px-4 py-4 text-red-400">{row.deductions + row.advances} ريال</td>
                                    <td className="px-4 py-4 font-bold text-gn-gold">{row.net} ريال</td>
                                    <td className="px-4 py-4 text-blue-400 whitespace-nowrap">{row.profit} ريال</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
