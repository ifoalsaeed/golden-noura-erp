import { useTranslation } from 'react-i18next';
import { Settings as SettingsIcon, Save, Globe, Shield, Database, Bell } from 'lucide-react';

export default function Settings() {
    const { t, i18n } = useTranslation();

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
                <SettingsIcon className="w-8 h-8 ml-3 text-gn-gold" />
                {t('System Settings')}
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Navigation / List of Settings sections */}
                <div className="space-y-2">
                    <button className="w-full text-right px-4 py-3 bg-gn-gold/10 text-gn-gold border border-gn-gold/30 rounded-lg flex items-center font-bold">
                        <Globe className="w-5 h-5 ml-3" /> اللغة والمنطقة
                    </button>
                    <button className="w-full text-right px-4 py-3 bg-gn-surface/50 text-gray-400 hover:text-white rounded-lg flex items-center transition">
                        <Shield className="w-5 h-5 ml-3" /> صلاحيات المستخدمين
                    </button>
                    <button className="w-full text-right px-4 py-3 bg-gn-surface/50 text-gray-400 hover:text-white rounded-lg flex items-center transition">
                        <Database className="w-5 h-5 ml-3" /> النسخ الاحتياطي
                    </button>
                    <button className="w-full text-right px-4 py-3 bg-gn-surface/50 text-gray-400 hover:text-white rounded-lg flex items-center transition">
                        <Bell className="w-5 h-5 ml-3" /> التنبيهات والإشعارات
                    </button>
                </div>

                {/* Settings Form Column */}
                <div className="lg:col-span-2 bg-gn-surface/50 border border-gn-surface rounded-2xl p-8 shadow-xl">
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-lg font-bold text-white mb-4 border-b border-gn-surface pb-2">إعدادات اللغة</h3>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => i18n.changeLanguage('ar')}
                                    className={`px-6 py-3 rounded-xl border flex-1 transition ${i18n.language === 'ar' ? 'bg-gn-gold/20 border-gn-gold text-gn-gold shadow-[0_0_10px_rgba(212,175,55,0.2)]' : 'bg-gn-blackLight border-gn-surface text-gray-500'}`}
                                >
                                    العربية (السعودية)
                                </button>
                                <button
                                    onClick={() => i18n.changeLanguage('bn')}
                                    className={`px-6 py-3 rounded-xl border flex-1 transition ${i18n.language === 'bn' ? 'bg-gn-gold/20 border-gn-gold text-gn-gold shadow-[0_0_10px_rgba(212,175,55,0.2)]' : 'bg-gn-blackLight border-gn-surface text-gray-500'}`}
                                >
                                    বাংলা (Bengali)
                                </button>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-white mb-4 border-b border-gn-surface pb-2">بيانات الشركة في الفواتير</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400 block">اسم المؤسسة (بالعربي)</label>
                                    <input type="text" defaultValue="نور الذهبي للاستقدام" className="w-full bg-gn-blackLight border border-gn-surface rounded-lg px-4 py-2 text-white focus:border-gn-gold outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400 block">اسم المؤسسة (بالإنجليزي)</label>
                                    <input type="text" defaultValue="Golden Noura Recruitment" className="w-full bg-gn-blackLight border border-gn-surface rounded-lg px-4 py-2 text-white focus:border-gn-gold outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400 block">رقم السجل التجاري</label>
                                    <input type="text" defaultValue="1010345678" className="w-full bg-gn-blackLight border border-gn-surface rounded-lg px-4 py-2 text-white focus:border-gn-gold outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400 block">الرقم الضريبي VAT</label>
                                    <input type="text" defaultValue="310234567800003" className="w-full bg-gn-blackLight border border-gn-surface rounded-lg px-4 py-2 text-white focus:border-gn-gold outline-none" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-white mb-4 border-b border-gn-surface pb-2">إعدادات النظام المالية</h3>
                            <div className="flex items-center justify-between bg-gn-blackLight border border-gn-surface rounded-lg p-5">
                                <div>
                                    <p className="text-white font-medium">تفعيل الحسابات الأوتوماتيكية</p>
                                    <p className="text-xs text-gray-400 mt-1">توليد القيود المحاسبية تلقائياً عند إضافة عقود أو مصروفات جديدة</p>
                                </div>
                                <label className="flex items-center cursor-pointer">
                                    <input type="checkbox" className="w-5 h-5 accent-gn-gold" defaultChecked />
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button className="bg-gn-gold hover:bg-gn-goldDark text-gn-black font-bold py-3 px-8 rounded-xl flex items-center transition shadow-lg">
                                <Save className="w-5 h-5 ml-2" /> حفظ الإعدادات
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
