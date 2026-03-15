import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface Permission {
  module: string;
  level: string;
}

interface UserPermissions {
  user_id: number;
  username: string;
  role: string;
  modules: Array<{
    module: string;
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
    can_approve: boolean;
    can_export: boolean;
    can_print: boolean;
  }>;
}

interface RBACContextType {
  permissions: UserPermissions | null;
  loading: boolean;
  error: string | null;
  checkPermission: (module: string, level: string) => boolean;
  checkModuleAccess: (module: string) => {
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canApprove: boolean;
    canExport: boolean;
    canPrint: boolean;
  };
  refreshPermissions: () => Promise<void>;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

export const useRBAC = () => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  return context;
};

interface RBACProviderProps {
  children: React.ReactNode;
}

export const RBACProvider: React.FC<RBACProviderProps> = ({ children }) => {
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user ID from localStorage or auth context
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('No user ID found');
      }

      const response = await fetch(`/api/rbac/users/${userId}/permissions`);
      if (response.ok) {
        const data = await response.json();
        setPermissions(data);
      } else {
        throw new Error('Failed to fetch permissions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch permissions');
      console.error('Error fetching permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const checkPermission = (module: string, level: string): boolean => {
    if (!permissions) return false;
    
    const modulePermissions = permissions.modules.find(m => m.module === module);
    if (!modulePermissions) return false;

    switch (level.toUpperCase()) {
      case 'VIEW':
        return modulePermissions.can_view;
      case 'CREATE':
        return modulePermissions.can_create;
      case 'EDIT':
        return modulePermissions.can_edit;
      case 'DELETE':
        return modulePermissions.can_delete;
      case 'APPROVE':
        return modulePermissions.can_approve;
      case 'EXPORT':
        return modulePermissions.can_export;
      case 'PRINT':
        return modulePermissions.can_print;
      default:
        return false;
    }
  };

  const checkModuleAccess = (module: string) => {
    if (!permissions) return {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canApprove: false,
      canExport: false,
      canPrint: false
    };

    const modulePermissions = permissions.modules.find(m => m.module === module);
    if (!modulePermissions) return {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canApprove: false,
      canExport: false,
      canPrint: false
    };

    return {
      canView: modulePermissions.can_view,
      canCreate: modulePermissions.can_create,
      canEdit: modulePermissions.can_edit,
      canDelete: modulePermissions.can_delete,
      canApprove: modulePermissions.can_approve,
      canExport: modulePermissions.can_export,
      canPrint: modulePermissions.can_print
    };
  };

  const refreshPermissions = async () => {
    await fetchPermissions();
  };

  const value: RBACContextType = {
    permissions,
    loading,
    error,
    checkPermission,
    checkModuleAccess,
    refreshPermissions
  };

  return (
    <RBACContext.Provider value={value}>
      {children}
    </RBACContext.Provider>
  );
};

// Permission-based component wrapper
interface PermissionGuardProps {
  module: string;
  level: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  module, 
  level, 
  fallback = null, 
  children 
}) => {
  const { checkPermission } = useRBAC();
  
  if (!checkPermission(module, level)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

// Role-based component wrapper
interface RoleGuardProps {
  allowedRoles: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ 
  allowedRoles, 
  fallback = null, 
  children 
}) => {
  const { permissions } = useRBAC();
  
  if (!permissions || !allowedRoles.includes(permissions.role)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

// Hook for checking multiple permissions
export const usePermissions = () => {
  const { checkPermission } = useRBAC();
  
  return {
    canView: (module: string) => checkPermission(module, 'VIEW'),
    canCreate: (module: string) => checkPermission(module, 'CREATE'),
    canEdit: (module: string) => checkPermission(module, 'EDIT'),
    canDelete: (module: string) => checkPermission(module, 'DELETE'),
    canApprove: (module: string) => checkPermission(module, 'APPROVE'),
    canExport: (module: string) => checkPermission(module, 'EXPORT'),
    canPrint: (module: string) => checkPermission(module, 'PRINT')
  };
};