import { useTranslation } from 'react-i18next';
import { LogOut, Globe, KeyRound, User as UserIcon, X, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import api, { getApiBaseUrl } from '../../api';

export default function Header() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);
  const [fullName, setFullName] = useState(localStorage.getItem('full_name') || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNew, setConfirmNew] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(localStorage.getItem('avatar_url') || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleLanguage = () => {
    const order: Array<'ar'|'bn'|'en'> = ['ar','bn','en'];
    const idx = order.indexOf(i18n.language as any);
    const next = order[(idx + 1) % order.length];
    i18n.changeLanguage(next);
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
  };
  
  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage('');
    try {
      if (fullName && fullName !== localStorage.getItem('full_name')) {
        await api.put('/users/me', { full_name: fullName });
        localStorage.setItem('full_name', fullName);
        setMessage(t('auth.profileUpdated') as string);
        window.dispatchEvent(new CustomEvent('profile-updated', { detail: { full_name: fullName } }));
      }
      if (oldPassword || newPassword || confirmNew) {
        if (newPassword !== confirmNew) {
          setMessage(t('auth.passwordMismatch') as string);
        } else {
          await api.post('/auth/change-password', { old_password: oldPassword, new_password: newPassword });
          setMessage(t('auth.passwordUpdated') as string);
          setOldPassword(''); setNewPassword(''); setConfirmNew('');
        }
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || t('auth.error');
      setMessage(String(msg));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSaving(true);
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/users/me/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const newAvatarUrl = response.data.avatar_url;
      if (newAvatarUrl) {
        const apiRoot = getApiBaseUrl();
        const fullAvatarUrl = newAvatarUrl.startsWith('http') ? newAvatarUrl : `${apiRoot}${newAvatarUrl}`;
        localStorage.setItem('avatar_url', fullAvatarUrl);
        setAvatarUrl(fullAvatarUrl);
        setMessage(t('settings.avatarUpdated') as string);
        window.dispatchEvent(new CustomEvent('avatar-updated', { detail: { avatar_url: fullAvatarUrl } }));
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || t('settings.avatarUploadError');
      setMessage(String(msg));
    } finally {
      setSaving(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <header className="gn-header h-16 md:h-20 shrink-0 bg-gn-black/80 backdrop-blur-sm border-b border-gn-surface/50 flex items-center justify-between px-3 md:px-6 z-10 w-full shadow-sm">
      <div className="flex items-center gap-2 md:gap-4">
        <img src="/logo.png" alt="Logo" className="gn-header-logo h-8 md:h-12 w-auto" onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
        }}/>
        <div className="flex flex-col">
            <span className="gn-header-title text-sm md:text-xl font-bold text-gn-gold">شركة جولدن نورا</span>
            <span className="gn-header-subtitle text-[10px] md:text-xs text-gn-goldLight uppercase tracking-widest">Golden Noura Co.</span>
        </div>
      </div>
      <div className="gn-header-actions flex items-center gap-2 md:gap-4">
        {/* User Avatar and Name - Hidden on small mobile */}
        <div className="hidden sm:flex items-center gap-2 md:gap-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="User Avatar"
              className="w-8 h-8 md:w-10 md:h-10 object-cover rounded-full border-2 border-gn-gold/50"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gn-gold/20 rounded-full flex items-center justify-center border border-gn-gold/30">
              <UserIcon className="w-4 h-4 md:w-5 md:h-5 text-gn-gold" />
            </div>
          )}
          <span className="text-gn-gold font-medium text-sm md:text-base">
            {fullName || localStorage.getItem('username') || t('auth.user')}
          </span>
        </div>
        
        <button
          onClick={() => setOpenDialog(true)}
          className="hidden md:flex items-center px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-gn-gold bg-gn-gold/5 rounded-md border border-gn-gold/20 hover:bg-gn-gold/10 transition"
        >
          <KeyRound className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 ml-1 md:ml-2" />
          <span className="hidden lg:inline">{t('auth.changePassword')}</span>
          <span className="lg:hidden">{t('auth.password')}</span>
        </button>
        <button 
          onClick={toggleLanguage}
          className="flex items-center px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-gn-gold bg-gn-gold/5 rounded-md border border-gn-gold/20 hover:bg-gn-gold/10 transition"
        >
          <Globe className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 ml-1 md:ml-2" />
          <span className="hidden sm:inline">
            {i18n.language === 'ar' ? 'বাংলা' : i18n.language === 'bn' ? 'English' : 'العربية'}
          </span>
        </button>
        <button 
          onClick={() => {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('token');
            navigate('/login');
          }}
          className="flex items-center px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-red-400 bg-red-400/5 border border-red-400/20 rounded-md hover:bg-red-400/10 transition"
        >
          <LogOut className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 ml-1 md:ml-2" />
          <span className="hidden sm:inline">{t('nav.logout')}</span>
        </button>
      </div>
      
      {openDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gn-surface/90 border border-gn-surface rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{t('auth.accountSettings')}</h3>
              <button className="text-gray-400 hover:text-white" onClick={() => setOpenDialog(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {/* Avatar Upload Section */}
              <div>
                <label className="text-sm text-gray-300 mb-1 block">{t('settings.avatar')}</label>
                <div className="flex items-center gap-3">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="User Avatar"
                      className="w-16 h-16 object-cover rounded-full border-2 border-gn-gold/50"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gn-gold/20 rounded-full flex items-center justify-center border border-gn-gold/30">
                      <UserIcon className="w-8 h-8 text-gn-gold" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <label
                      htmlFor="avatar-upload"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gn-gold bg-gn-gold/5 rounded-md border border-gn-gold/20 hover:bg-gn-gold/10 transition cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      {t('settings.uploadAvatar')}
                    </label>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-300 mb-1 block">{t('auth.fullName')}</label>
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-gn-gold" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gn-blackLight border border-gn-surface rounded-md text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-1 block">{t('auth.oldPassword')}</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gn-blackLight border border-gn-surface rounded-md text-white"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">{t('auth.newPassword')}</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-gn-blackLight border border-gn-surface rounded-md text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">{t('auth.confirmPassword')}</label>
                  <input
                    type="password"
                    value={confirmNew}
                    onChange={(e) => setConfirmNew(e.target.value)}
                    className="w-full px-3 py-2 bg-gn-blackLight border border-gn-surface rounded-md text-white"
                  />
                </div>
              </div>
              {message && <p className="text-sm text-gn-goldLight">{message}</p>}
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setOpenDialog(false)}
                  className="px-4 py-2 text-sm bg-gn-blackLight border border-gn-surface rounded-md text-white"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="px-4 py-2 text-sm bg-gn-gold text-gn-black rounded-md font-bold disabled:opacity-50"
                >
                  {saving ? '...' : t('common.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
