import { useTranslation } from 'react-i18next';
import { LogOut, Globe, User, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const role = localStorage.getItem('userRole') || 'viewer';

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  return (
    <header className="h-20 shrink-0 bg-gn-black/40 backdrop-blur-xl border-b border-gn-surface/50 flex items-center justify-between px-8 z-10 w-full shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gn-gold/10 border border-gn-gold/20 flex items-center justify-center text-gn-gold">
          <User className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-black text-gn-gold/30 tracking-widest uppercase">{t('Logged in as')}</p>
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-gn-gold" />
            <p className="text-sm font-bold text-white uppercase tracking-wider">
              {role === 'full' ? t('Administrator') : role === 'entry' ? t('Data Entry') : t('Viewer')}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleLanguage}
          className="flex items-center px-4 py-2 text-xs font-bold text-gn-gold bg-gn-gold/5 rounded-full border border-gn-gold/20 hover:bg-gn-gold/10 transition shadow-inner uppercase tracking-widest gap-2"
        >
          <Globe className="w-4 h-4" />
          {i18n.language === 'ar' ? 'English' : 'العربية'}
        </button>

        <div className="w-px h-6 bg-gn-surface/50 mx-2"></div>

        <button
          onClick={handleLogout}
          className="flex items-center px-4 py-2 text-xs font-bold text-red-500 bg-red-500/5 border border-red-500/20 rounded-full hover:bg-red-500/10 transition gap-2 uppercase tracking-widest"
        >
          <LogOut className="w-4 h-4" />
          {t('Logout')}
        </button>
      </div>
    </header>
  );
}