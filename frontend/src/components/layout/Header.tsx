import { useTranslation } from 'react-i18next';
import { LogOut, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'bn' : 'ar';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <header className="h-20 shrink-0 bg-gn-black/80 backdrop-blur-sm border-b border-gn-surface/50 flex items-center justify-between px-6 z-10 w-full shadow-sm">
      <div className="flex items-center"></div>
      <div className="flex items-center justify-center space-x-4 gap-4">
        <button 
          onClick={toggleLanguage}
          className="flex items-center px-4 py-2 text-sm text-gn-gold bg-gn-gold/5 rounded-md border border-gn-gold/20 hover:bg-gn-gold/10 transition"
        >
          <Globe className="w-4 h-4 mr-2 ml-2" />
          {i18n.language === 'ar' ? 'বাংলা (Bengali)' : 'العربية (Arabic)'}
        </button>
        <button 
          onClick={() => navigate('/login')}
          className="flex items-center px-4 py-2 text-sm text-red-400 bg-red-400/5 border border-red-400/20 rounded-md hover:bg-red-400/10 transition"
        >
          <LogOut className="w-4 h-4 mr-2 ml-2" />
          {t('Logout')}
        </button>
      </div>
    </header>
  );
}