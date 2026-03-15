import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Users, UserSquare2, FileText, DollarSign, Wallet, FileBarChart2, Shield, Receipt, Menu, X } from 'lucide-react';
import clsx from 'clsx';
import { getUserRole, Role } from '../../utils/auth';
import UserAvatar from '../common/UserAvatar';
import { useState, useEffect } from 'react';

const navItems = [
  { nameKey: 'nav.dashboard', path: '/dashboard', icon: LayoutDashboard, roles: [Role.ADMIN, Role.DATA_ENTRY, Role.REPORT_VIEWER] },
  { nameKey: 'nav.workers', path: '/workers', icon: Users, roles: [Role.ADMIN, Role.DATA_ENTRY] },
  { nameKey: 'nav.clients', path: '/clients', icon: UserSquare2, roles: [Role.ADMIN, Role.DATA_ENTRY] },
  { nameKey: 'nav.contracts', path: '/contracts', icon: FileText, roles: [Role.ADMIN, Role.DATA_ENTRY] },
  { nameKey: 'nav.invoices', path: '/invoices', icon: Receipt, roles: [Role.ADMIN, Role.DATA_ENTRY] },
  { nameKey: 'nav.payroll', path: '/payroll', icon: DollarSign, roles: [Role.ADMIN, Role.DATA_ENTRY] },
  { nameKey: 'nav.rbac', path: '/rbac', icon: Shield, roles: [Role.ADMIN] },
  { nameKey: 'nav.expenses', path: '/expenses', icon: Wallet, roles: [Role.ADMIN, Role.DATA_ENTRY] },
  { nameKey: 'nav.accounting', path: '/accounting', icon: FileBarChart2, roles: [Role.ADMIN, Role.DATA_ENTRY, Role.REPORT_VIEWER] },
  { nameKey: 'nav.approvals', path: '/approvals', icon: Shield, roles: [Role.ADMIN] },
  { nameKey: 'nav.reports', path: '/reports', icon: FileBarChart2, roles: [Role.ADMIN, Role.DATA_ENTRY, Role.REPORT_VIEWER] },
];

export default function Sidebar() {
  const { t, i18n } = useTranslation();
  const userRole = getUserRole();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.gn-sidebar') && !target.closest('.gn-mobile-menu-btn')) {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  const filteredNavItems = navItems.filter(item => {
    if (!userRole) return false;
    return item.roles.includes(userRole);
  });

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="gn-mobile-menu-btn fixed top-4 left-4 z-50 md:hidden p-2 bg-gn-surface border border-gn-gold/30 rounded-lg shadow-lg"
        aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6 text-gn-gold" />
        ) : (
          <Menu className="w-6 h-6 text-gn-gold" />
        )}
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop & Mobile */}
      <div
        className={clsx(
          'gn-sidebar bg-gn-black border-r border-gn-surface/50 h-full flex flex-col shadow-xl shrink-0 z-50',
          'fixed md:relative transition-transform duration-300 ease-in-out',
          'w-64 md:w-64 lg:w-64 xl:w-64',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          i18n.language === 'ar' ? 'md:border-l md:border-r-0 right-0 md:right-auto' : 'left-0'
        )}
      >
        <div className="h-20 md:h-24 flex flex-col items-center justify-center border-b border-gn-surface/50 p-2">
          <img
            src="/logo.png"
            alt="Golden Noura Logo"
            className="h-8 md:h-10 w-auto mb-2"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
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
                key={item.nameKey}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-gn-gold/10 text-gn-gold border border-gn-gold/30'
                      : 'text-gray-400 hover:bg-gn-surface hover:text-white'
                  )
                }
              >
                <Icon className={clsx('w-5 h-5 flex-shrink-0', i18n.language === 'ar' ? 'ml-3' : 'mr-3')} />
                <span className="truncate">{t(item.nameKey)}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </>
  );
}
