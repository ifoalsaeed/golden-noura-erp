import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Users, UserSquare2, FileText, DollarSign, Wallet, FileBarChart2, Shield, Receipt, Menu, X } from 'lucide-react';
import clsx from 'clsx';
import { getUserRole, Role } from '../../utils/auth';
import { useState } from 'react';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: [Role.ADMIN, Role.DATA_ENTRY, Role.REPORT_VIEWER] },
  { name: 'Workers', path: '/workers', icon: Users, roles: [Role.ADMIN, Role.DATA_ENTRY] },
  { name: 'Clients', path: '/clients', icon: UserSquare2, roles: [Role.ADMIN, Role.DATA_ENTRY] },
  { name: 'Contracts', path: '/contracts', icon: FileText, roles: [Role.ADMIN, Role.DATA_ENTRY] },
  { name: 'Invoices', path: '/invoices', icon: Receipt, roles: [Role.ADMIN, Role.DATA_ENTRY] },
  { name: 'Payroll', path: '/payroll', icon: DollarSign, roles: [Role.ADMIN, Role.DATA_ENTRY] },
  { name: 'Expenses', path: '/expenses', icon: Wallet, roles: [Role.ADMIN, Role.DATA_ENTRY] },
  { name: 'Accounting', path: '/accounting', icon: FileBarChart2, roles: [Role.ADMIN, Role.DATA_ENTRY, Role.REPORT_VIEWER] },
  { name: 'Reports', path: '/reports', icon: FileBarChart2, roles: [Role.ADMIN, Role.DATA_ENTRY, Role.REPORT_VIEWER] },
  { name: 'RBAC', path: '/rbac', icon: Shield, roles: [Role.ADMIN] },
];

export default function MobileNav() {
  const { t, i18n } = useTranslation();
  const userRole = getUserRole();
  const [showMore, setShowMore] = useState(false);

  const filteredNavItems = navItems.filter(item => {
    if (!userRole) return false;
    return item.roles.includes(userRole);
  });

  // Show first 5 items in bottom nav, rest in "More" menu
  const mainItems = filteredNavItems.slice(0, 5);
  const moreItems = filteredNavItems.slice(5);

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="gn-nav-mobile md:hidden">
        {mainItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'gn-nav-mobile-item',
                  isActive ? 'active' : ''
                )
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{t(item.name)}</span>
            </NavLink>
          );
        })}
        
        {/* More button if there are additional items */}
        {moreItems.length > 0 && (
          <button
            onClick={() => setShowMore(true)}
            className="gn-nav-mobile-item"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px]">{t('More')}</span>
          </button>
        )}
      </nav>

      {/* More Menu Modal */}
      {showMore && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end">
          <div className="bg-gn-surface w-full rounded-t-2xl p-4 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-gn-surface pb-3">
              <h3 className="text-lg font-bold text-white">{t('More Options')}</h3>
              <button 
                onClick={() => setShowMore(false)}
                className="p-2 text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={() => setShowMore(false)}
                    className={({ isActive }) =>
                      clsx(
                        'flex flex-col items-center gap-2 p-4 rounded-xl transition-colors',
                        isActive
                          ? 'bg-gn-gold/20 text-gn-gold'
                          : 'bg-gn-blackLight text-gray-400 hover:bg-gn-surface'
                      )
                    }
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-xs text-center">{t(item.name)}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
