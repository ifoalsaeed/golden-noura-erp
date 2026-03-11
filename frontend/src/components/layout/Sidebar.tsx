import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Users, UserSquare2, FileText, DollarSign, Wallet, FileBarChart2, Landmark } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['full', 'entry', 'viewer'] },
  { name: 'Workers', path: '/workers', icon: Users, roles: ['full', 'entry'] },
  { name: 'Clients', path: '/clients', icon: UserSquare2, roles: ['full', 'entry'] },
  { name: 'Contracts', path: '/contracts', icon: FileText, roles: ['full', 'entry'] },
  { name: 'Payroll', path: '/payroll', icon: DollarSign, roles: ['full'] },
  { name: 'Expenses', path: '/expenses', icon: Wallet, roles: ['full'] },
  { name: 'Accounting', path: '/accounting', icon: Landmark, roles: ['full'] },
  { name: 'Reports', path: '/reports', icon: FileBarChart2, roles: ['full', 'viewer'] },
];

export default function Sidebar() {
  const { t, i18n } = useTranslation();
  const role = localStorage.getItem('userRole') || 'viewer';

  const filteredItems = navItems.filter(item => item.roles.includes(role));

  return (
    <div className="w-64 bg-gn-black border-l border-r border-gn-surface/50 h-full flex flex-col shadow-2xl shrink-0 z-20">
      <div className="h-32 flex flex-col items-center justify-center border-b border-gn-surface/50 bg-gradient-to-b from-gn-surface/30 to-transparent">
        <img src="/logo.png" alt="Logo" className="h-20 w-auto object-contain mb-2 drop-shadow-[0_0_10px_rgba(212,175,55,0.2)]" />
      </div>
      <div className="p-4 border-b border-gn-surface/50 bg-gn-blackLight/30">
        <div className="text-[10px] font-black tracking-[0.3em] text-center text-gn-gold/50 uppercase mb-1">
          {t('Current Role')}
        </div>
        <p className="text-sm font-bold tracking-wider text-center text-gn-goldLight uppercase">
          {role === 'full' ? t('Full Permissions') : role === 'entry' ? t('Data Entry') : t('Viewer Only')}
        </p>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'flex items-center px-4 py-4 text-sm font-bold rounded-xl transition-all duration-300 group relative overflow-hidden',
                  isActive
                    ? 'bg-gradient-to-r from-gn-gold/20 to-transparent text-gn-gold border border-gn-gold/20 shadow-[0_0_20px_rgba(212,175,55,0.1)]'
                    : 'text-gray-400 hover:bg-gn-surface/50 hover:text-white'
                )
              }
            >
              <div className={clsx(
                "p-2 rounded-lg transition-colors duration-300",
                "group-hover:bg-gn-gold/10"
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={clsx("transition-transform duration-300 group-hover:translate-x-1 mx-3")}>
                {t(item.name)}
              </span>
              <div className={clsx(
                "absolute bottom-0 right-0 top-0 w-1 bg-gn-gold transition-transform duration-300",
                "scale-y-0 active:scale-y-100"
              )}></div>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
