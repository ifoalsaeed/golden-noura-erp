import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Users, UserSquare2, FileText, DollarSign, Wallet, FileBarChart2 } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Workers', path: '/workers', icon: Users },
  { name: 'Clients', path: '/clients', icon: UserSquare2 },
  { name: 'Contracts', path: '/contracts', icon: FileText },
  { name: 'Payroll', path: '/payroll', icon: DollarSign },
  { name: 'Expenses', path: '/expenses', icon: Wallet },
  { name: 'Reports', path: '/reports', icon: FileBarChart2 },
];

export default function Sidebar() {
  const { t, i18n } = useTranslation();

  return (
    <div className="w-64 bg-gn-black border-l border-r border-gn-surface/50 h-full flex flex-col shadow-xl shrink-0">
      <div className="h-20 flex items-center justify-center border-b border-gn-surface/50">
        <h1 className="text-2xl font-bold text-gn-gold">LOGO</h1>
      </div>
      <div className="p-4 border-b border-gn-surface/50">
        <p className="text-sm font-semibold tracking-wider text-center text-gn-goldLight uppercase">
          {t('Golden Noura ERP')}
        </p>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-gn-gold/10 text-gn-gold border border-gn-gold/30'
                    : 'text-gray-400 hover:bg-gn-surface hover:text-white'
                )
              }
            >
              <Icon className={clsx("w-5 h-5", i18n.language === 'ar' ? 'ml-3' : 'mr-3')} />
              {t(item.name)}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}