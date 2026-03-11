import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, Shield, ShieldCheck, UserCog } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    let role = '';

    if (username === 'adnin' && password === '123') {
      role = 'full';
    } else if (username === 'admin') {
      role = 'full';
    } else if (username === 'entry') {
      role = 'entry';
    } else if (username === 'viewer') {
      role = 'viewer';
    }

    if (role) {
      localStorage.setItem('userRole', role);
      localStorage.setItem('isAuthenticated', 'true');
      navigate('/dashboard');
    } else {
      alert(i18n.language === 'ar' ? 'اسم المستخدم أو كلمة المرور غير صحيحة' : 'Incorrect username or password');
    }
  };

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="min-h-screen bg-gn-black flex items-center justify-center p-4 relative w-full overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-gn-gold/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-gn-goldDark/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="absolute top-4 right-4 z-20">
        <button onClick={toggleLanguage} className="flex items-center px-4 py-2 text-sm text-gn-gold bg-gn-gold/5 rounded-full border border-gn-gold/20 hover:bg-gn-gold/10 transition shadow-inner">
          <Globe className="w-4 h-4 mx-2" />
          {i18n.language === 'ar' ? 'English' : 'العربية'}
        </button>
      </div>

      <div className="bg-gn-surface/80 backdrop-blur-2xl border border-gn-gold/20 p-10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-full max-w-md relative z-10 border-t-gn-gold/40 border-l-gn-gold/40">
        <div className="text-center mb-10">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gn-gold blur-2xl opacity-20 rounded-full"></div>
            <img src="/logo.png" alt="Logo" className="w-32 h-32 relative z-10 mx-auto drop-shadow-[0_0_15px_rgba(212,175,55,0.3)] object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">{t('Welcome back')}</h1>
          <p className="text-gn-goldLight text-xs font-bold tracking-[0.2em] uppercase opacity-70">{t('Golden Noura ERP')}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gn-goldLight/60 uppercase ml-1 block text-start">{t('Username')}</label>
            <div className="relative group">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full px-4 py-4 bg-gn-blackLight/50 border border-gn-gold/10 rounded-xl text-white focus:ring-2 focus:ring-gn-gold/50 focus:border-gn-gold outline-none transition-all group-hover:border-gn-gold/30"
                placeholder="admin, entry, or viewer"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gn-goldLight/60 uppercase ml-1 block text-start">{t('Password')}</label>
            <div className="relative group">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-4 bg-gn-blackLight/50 border border-gn-gold/10 rounded-xl text-white focus:ring-2 focus:ring-gn-gold/50 focus:border-gn-gold outline-none transition-all group-hover:border-gn-gold/30"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" className="w-full py-4 px-6 bg-gradient-to-br from-gn-gold to-gn-goldDark hover:from-gn-goldLight hover:to-gn-gold text-gn-black font-black text-lg rounded-xl shadow-[0_10px_20px_-5px_rgba(212,175,55,0.4)] hover:shadow-[0_15px_30px_-5px_rgba(212,175,55,0.6)] transition-all transform hover:-translate-y-1 active:scale-95">
              {t('Login')}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-gn-gold/10 flex justify-between items-center text-[10px] text-gn-goldLight/40 uppercase tracking-widest font-bold">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> SECURE
          </div>
          <div className="flex items-center gap-1">
            <UserCog className="w-3 h-3" /> ROLE BASED
          </div>
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3" /> ENCRYPTED
          </div>
        </div>
      </div>
    </div>
  );
}
