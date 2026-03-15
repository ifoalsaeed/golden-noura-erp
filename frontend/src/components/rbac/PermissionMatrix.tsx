import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Button,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Security as SecurityIcon
} from '@mui/icons-material';

interface Permission {
  id: number;
  module: string;
  level: string;
  name: string;
  description: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
  level: string;
  is_system_role: boolean;
}

interface RolePermission {
  role_id: number;
  permission_id: number;
  is_granted: boolean;
}

const PermissionMatrix: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Group permissions by module
  const modules = ['DASHBOARD', 'EMPLOYEES', 'PAYROLL', 'ATTENDANCE', 'EXPENSES', 'PROJECTS', 'REPORTS', 'SETTINGS', 'USERS', 'ROLES'];
  const levels = ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE', 'EXPORT', 'PRINT'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Fetch roles
      const rolesResponse = await fetch('/api/rbac/roles');
      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        setRoles(rolesData.filter((role: Role) => !role.is_system_role));
      }

      // Fetch permissions
      const permissionsResponse = await fetch('/api/rbac/permissions');
      if (permissionsResponse.ok) {
        const permissionsData = await permissionsResponse.json();
        setPermissions(permissionsData);
      }

      // Fetch role permissions for each role
      const rolePermissionsPromises = roles.map(role => 
        fetch(`/api/rbac/roles/${role.id}`).then(res => res.json())
      );
      
      const rolesWithPermissions = await Promise.all(rolePermissionsPromises);
      const allRolePermissions: RolePermission[] = [];
      
      rolesWithPermissions.forEach(roleData => {
        if (roleData.permissions) {
          roleData.permissions.forEach((perm: Permission) => {
            allRolePermissions.push({
              role_id: roleData.id,
              permission_id: perm.id,
              is_granted: true
            });
          });
        }
      });
      
      setRolePermissions(allRolePermissions);

    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (roleId: number, permissionId: number): boolean => {
    return rolePermissions.some(
      rp => rp.role_id === roleId && rp.permission_id === permissionId && rp.is_granted
    );
  };

  const togglePermission = (roleId: number, permissionId: number) => {
    const existing = rolePermissions.find(
      rp => rp.role_id === roleId && rp.permission_id === permissionId
    );

    if (existing) {
      setRolePermissions(prev => 
        prev.map(rp => 
          rp.role_id === roleId && rp.permission_id === permissionId
            ? { ...rp, is_granted: !rp.is_granted }
            : rp
        )
      );
    } else {
      setRolePermissions(prev => [
        ...prev,
        { role_id: roleId, permission_id: permissionId, is_granted: true }
      ]);
    }
  };

  const getPermissionId = (module: string, level: string): number | null => {
    const permission = permissions.find(p => p.module === module && p.level === level);
    return permission ? permission.id : null;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Prepare bulk update data
      const bulkUpdates = roles.map(role => ({
        role_id: role.id,
        permissions: levels.map(level => {
          const permissionId = getPermissionId('DASHBOARD', level); // This needs to be fixed
          if (!permissionId) return null;
          
          return {
            permission_id: permissionId,
            is_granted: hasPermission(role.id, permissionId)
          };
        }).filter(Boolean)
      }));

      // Save each role's permissions
      for (const roleUpdate of bulkUpdates) {
        const response = await fetch(`/api/rbac/roles/${roleUpdate.role_id}/permissions/bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            role_id: roleUpdate.role_id,
            permissions: roleUpdate.permissions,
            created_by: 1 // This should be the current user ID
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to update role ${roleUpdate.role_id}`);
        }
      }

      setSuccess('Permissions updated successfully');
      
    } catch (err) {
      setError('Failed to save permissions');
      console.error('Error saving permissions:', err);
    } finally {
      setSaving(false);
    }
  };

  const getRoleLevelColor = (level: string) => {
    switch (level) {
      case 'SUPER_ADMIN': return 'error';
      case 'ADMIN': return 'warning';
      case 'ACCOUNTANT': return 'info';
      case 'MANAGER': return 'success';
      case 'HR': return 'primary';
      case 'VIEWER': return 'default';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Permission Matrix
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Role Permission Matrix</Typography>
            <Box>
              <Button
                startIcon={<RefreshIcon />}
                onClick={fetchData}
                sx={{ mr: 1 }}
                disabled={saving}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Box>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            Click on checkboxes to grant/revoke permissions for each role
          </Typography>

          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Module / Permission</TableCell>
                  {roles.map((role) => (
                    <TableCell key={role.id} align="center" sx={{ fontWeight: 'bold', minWidth: 120 }}>
                      <Box>
                        <Typography variant="subtitle2">{role.name}</Typography>
                        <Chip
                          label={role.level.replace('_', ' ')}
                          color={getRoleLevelColor(role.level) as any}
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {modules.map((module) => (
                  <React.Fragment key={module}>
                    <TableRow sx={{ backgroundColor: 'action.hover' }}>
                      <TableCell colSpan={roles.length + 1} sx={{ fontWeight: 'bold' }}>
                        {module.replace('_', ' ')}
                      </TableCell>
                    </TableRow>
                    {levels.map((level) => {
                      const permissionId = getPermissionId(module, level);
                      if (!permissionId) return null;
                      
                      return (
                        <TableRow key={`${module}-${level}`}>
                          <TableCell sx={{ pl: 4 }}>
                            {level}
                          </TableCell>
                          {roles.map((role) => (
                            <TableCell key={`${role.id}-${permissionId}`} align="center">
                              <Tooltip title={`${role.name} - ${module}.${level}`}>
                                <Checkbox
                                  checked={hasPermission(role.id, permissionId)}
                                  onChange={() => togglePermission(role.id, permissionId)}
                                  disabled={role.is_system_role}
                                  icon={<CancelIcon color="disabled" />}
                                  checkedIcon={<CheckCircleIcon color="success" />}
                                />
                              </Tooltip>
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Legend:
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              <Box display="flex" alignItems="center" gap={1}>
                <CheckCircleIcon color="success" />
                <Typography variant="caption">Granted</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <CancelIcon color="disabled" />
                <Typography variant="caption">Denied</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="caption">• Grayed checkboxes indicate system roles (cannot be modified)</Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PermissionMatrix;