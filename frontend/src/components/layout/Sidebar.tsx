import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Users, UserSquare2, FileText, DollarSign, Wallet, FileBarChart2, Shield, Receipt } from 'lucide-react';
import clsx from 'clsx';
import { getUserRole, Role } from '../../utils/auth';
import UserAvatar from '../common/UserAvatar';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: [Role.ADMIN, Role.DATA_ENTRY, Role.REPORT_VIEWER] },
  { name: 'Workers', path: '/workers', icon: Users, roles: [Role.ADMIN, Role.DATA_ENTRY] },
  { name: 'Clients', path: '/clients', icon: UserSquare2, roles: [Role.ADMIN, Role.DATA_ENTRY] },
  { name: 'Contracts', path: '/contracts', icon: FileText, roles: [Role.ADMIN, Role.DATA_ENTRY] },
  { name: 'Invoices', path: '/invoices', icon: Receipt, roles: [Role.ADMIN, Role.DATA_ENTRY] },
  { name: 'Payroll', path: '/payroll', icon: DollarSign, roles: [Role.ADMIN, Role.DATA_ENTRY] },
  { name: 'الصلاحيات', path: '/rbac', icon: Shield, roles: [Role.ADMIN] },
  { name: 'Expenses', path: '/expenses', icon: Wallet, roles: [Role.ADMIN, Role.DATA_ENTRY] },
  { name: 'Accounting', path: '/accounting', icon: FileBarChart2, roles: [Role.ADMIN, Role.DATA_ENTRY, Role.REPORT_VIEWER] },
  { name: 'Approvals', path: '/approvals', icon: Shield, roles: [Role.ADMIN] },
  { name: 'Reports', path: '/reports', icon: FileBarChart2, roles: [Role.ADMIN, Role.DATA_ENTRY, Role.REPORT_VIEWER] },
];

export default function Sidebar() {
  const { t, i18n } = useTranslation();
  const userRole = getUserRole();

  const filteredNavItems = navItems.filter(item => {
    if (!userRole) return false;
    return item.roles.includes(userRole);
  });

  return (
    <div className="gn-sidebar w-64 bg-gn-black border-l border-r border-gn-surface/50 h-full flex flex-col shadow-xl shrink-0 hidden md:flex">
      <div className="h-20 md:h-24 flex flex-col items-center justify-center border-b border-gn-surface/50 p-2">
        <img src="/logo.png" alt="Golden Noura Logo" className="h-8 md:h-10 w-auto mb-2" onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
        }}/>
        <h1 className="text-base md:text-xl font-bold text-gn-gold text-center">شركة جولدن نورا</h1>
      </div>
      <div className="p-4 border-b border-gn-surface/50">
        <UserAvatar showName={true} className="justify-center" />
        <p className="text-xs font-semibold tracking-wider text-center text-gn-goldLight uppercase mt-2">
          Golden Noura ERP
        </p>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {filteredNavItems.map((item) => {
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
