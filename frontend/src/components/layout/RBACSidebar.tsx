import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Users, UserSquare2, FileText, DollarSign, Wallet, FileBarChart2, Shield, Settings, UserCog } from 'lucide-react';
import clsx from 'clsx';
import { useRBAC, PermissionGuard } from '../contexts/RBACContext';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
  requiredPermission?: { module: string; level: string };
  requiredRole?: string[];
  subItems?: NavItem[];
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { 
    name: 'Workers', 
    path: '/workers', 
    icon: Users,
    requiredPermission: { module: 'EMPLOYEES', level: 'VIEW' }
  },
  { 
    name: 'Clients', 
    path: '/clients', 
    icon: UserSquare2,
    requiredPermission: { module: 'EMPLOYEES', level: 'VIEW' }
  },
  { 
    name: 'Contracts', 
    path: '/contracts', 
    icon: FileText,
    requiredPermission: { module: 'EMPLOYEES', level: 'VIEW' }
  },
  { 
    name: 'Payroll', 
    path: '/payroll', 
    icon: DollarSign,
    requiredPermission: { module: 'PAYROLL', level: 'VIEW' }
  },
  { 
    name: 'الصلاحيات', 
    path: '/rbac', 
    icon: Shield,
    requiredRole: ['SUPER_ADMIN', 'ADMIN']
  },
  { 
    name: 'Expenses', 
    path: '/expenses', 
    icon: Wallet,
    requiredPermission: { module: 'EXPENSES', level: 'VIEW' }
  },
  { 
    name: 'Reports', 
    path: '/reports', 
    icon: FileBarChart2,
    requiredPermission: { module: 'REPORTS', level: 'VIEW' }
  },
  { 
    name: 'Settings', 
    path: '/settings', 
    icon: Settings,
    requiredPermission: { module: 'SETTINGS', level: 'VIEW' }
  },
];

export default function RBACSidebar() {
  const { t, i18n } = useTranslation();
  const { checkPermission, permissions } = useRBAC();

  const hasPermission = (module: string, level: string): boolean => {
    return checkPermission(module, level);
  };

  const hasRole = (allowedRoles: string[]): boolean => {
    if (!permissions) return false;
    return allowedRoles.includes(permissions.role);
  };

  const shouldShowItem = (item: NavItem): boolean => {
    // Check role requirement first
    if (item.requiredRole && !hasRole(item.requiredRole)) {
      return false;
    }
    
    // Check permission requirement
    if (item.requiredPermission && !hasPermission(item.requiredPermission.module, item.requiredPermission.level)) {
      return false;
    }
    
    return true;
  };

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
          if (!shouldShowItem(item)) return null;
          
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
      
      {/* User Info Section */}
      <div className="p-4 border-t border-gn-surface/50">
        {permissions && (
          <div className="text-xs text-gray-400">
            <div className="flex items-center gap-2 mb-2">
              <UserCog className="w-4 h-4" />
              <span>{permissions.username}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="text-gn-goldLight">{permissions.role}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
