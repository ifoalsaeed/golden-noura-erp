export type Role = 'full' | 'entry' | 'viewer';

export const hasPermission = (module: string, action: 'view' | 'edit' | 'delete' | 'report'): boolean => {
    const role = (localStorage.getItem('userRole') as Role) || 'viewer';

    if (role === 'full') return true;

    if (role === 'entry') {
        if (['workers', 'clients', 'contracts', 'expenses'].includes(module)) {
            return ['view', 'edit'].includes(action);
        }
        if (module === 'dashboard') return action === 'view';
        return false;
    }

    if (role === 'viewer') {
        if (module === 'reports') return true;
        if (module === 'dashboard') return action === 'view';
        return action === 'view'; // Viewer can view everything but not edit/delete
    }

    return false;
};
