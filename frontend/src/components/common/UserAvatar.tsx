import { useState, useEffect } from 'react';
import { User as UserIcon } from 'lucide-react';

interface UserAvatarProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

export default function UserAvatar({ className = '', size = 'md', showName = false }: UserAvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  // حالة لتحديد إذا كانت الصورة فشلت في التحميل
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Load user data from localStorage
    const savedAvatar = localStorage.getItem('avatar_url');
    const savedFullName = localStorage.getItem('full_name');
    const savedUsername = localStorage.getItem('username');
    
    setAvatarUrl(savedAvatar);
    setFullName(savedFullName);
    setUsername(savedUsername);
    setImageError(false);

    // Listen for profile updates
    const handleProfileUpdate = (event: CustomEvent) => {
      if (event.detail.full_name) {
        setFullName(event.detail.full_name);
      }
    };

    const handleAvatarUpdate = (event: CustomEvent) => {
      if (event.detail.avatar_url) {
        setAvatarUrl(event.detail.avatar_url);
        setImageError(false);
      }
    };

    window.addEventListener('profile-updated', handleProfileUpdate as EventListener);
    window.addEventListener('avatar-updated', handleAvatarUpdate as EventListener);

    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdate as EventListener);
      window.removeEventListener('avatar-updated', handleAvatarUpdate as EventListener);
    };
  }, []);

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const displayName = fullName || username || 'User';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {avatarUrl && !imageError ? (
        <img
          src={avatarUrl}
          alt="User Avatar"
          className={`${sizeClasses[size]} object-cover rounded-full border border-gn-gold/50`}
          onError={() => setImageError(true)}
        />
      ) : (
        <div className={`${sizeClasses[size]} bg-gn-gold/20 rounded-full flex items-center justify-center border border-gn-gold/30`}>
          <UserIcon className={`${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-6 h-6'} text-gn-gold`} />
        </div>
      )}
      {showName && (
        <span className="text-gn-gold font-medium text-sm">
          {displayName}
        </span>
      )}
    </div>
  );
}
