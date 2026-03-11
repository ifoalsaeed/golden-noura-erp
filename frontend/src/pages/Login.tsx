import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    // If already logged in, go to dashboard
    if (localStorage.getItem('isLoggedIn') === 'true') {
      navigate('/dashboard');
    }
  }, [i18n.language, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Demo login - works even if backend is down
    if (username === 'admin' && password === 'admin123') {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('token', 'demo-token');
      navigate('/dashboard');
      setLoading(false);
      return;
    }

    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('token', data.access_token || '');
        navigate('/dashboard');
      } else {
        setError(t('Invalid username or password'));
      }
    } catch {
      setError(t('Connection error. Use admin / admin123 to login.'));
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'bn' : 'ar';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="min-h-screen bg-gn-black flex items-center justify-center p-4 relative w-full">
      <div className="absolute top-4 right-4 z-20">
        <button onClick={toggleLanguage} className="flex items-center px-4 py-2 text-sm text-gn-gold bg-gn-gold/5 rounded-md border border-gn-gold/20 hover:bg-gn-gold/10 transition">
          <Globe className="w-4 h-4 mr-2 ml-2" />
          {i18n.language === 'ar' ? 'বাংলা' : 'العربية'}
        </button>
      </div>

      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-gn-gold/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-gn-goldLight/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="bg-gn-surface/80 backdrop-blur-xl border border-gn-gold/20 p-8 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-gn-gold to-gn-goldDark rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(212,175,55,0.3)] border-2 border-gn-black">
            <span className="text-gn-black font-extrabold text-2xl">GN</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{t('Welcome back')}</h1>
          <p className="text-gn-goldLight text-sm font-medium tracking-wider uppercase">{t('Golden Noura ERP')}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 block text-start">{t('Username')}</label>
            <div className="relative">
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="block w-full px-4 py-3 bg-gn-blackLight border border-gn-surface rounded-lg text-white focus:ring-1 focus:ring-gn-gold focus:border-gn-gold" required />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 block text-start">{t('Password')}</label>
            <div className="relative">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full px-4 py-3 bg-gn-blackLight border border-gn-surface rounded-lg text-white focus:ring-1 focus:ring-gn-gold focus:border-gn-gold" required />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full mt-8 py-3 px-4 bg-gradient-to-r from-gn-gold to-gn-goldDark hover:from-gn-goldLight hover:to-gn-gold text-gn-black font-bold text-lg rounded-lg shadow-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all disabled:opacity-50">
            {loading ? '...' : t('Login')}
          </button>
        </form>
      </div>
    </div>
  );
}