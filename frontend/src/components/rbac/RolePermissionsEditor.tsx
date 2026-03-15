import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Grid,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Edit as EditIcon
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
  permissions: Permission[];
  permission_summary: Record<string, string[]>;
}

interface RolePermissionsEditorProps {
  roleId: number;
  onBack?: () => void;
}

const RolePermissionsEditor: React.FC<RolePermissionsEditorProps> = ({ roleId, onBack }) => {
  const [role, setRole] = useState<Role | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Permission levels and modules
  const levels = ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE', 'EXPORT', 'PRINT'];
  const modules = ['DASHBOARD', 'EMPLOYEES', 'PAYROLL', 'ATTENDANCE', 'EXPENSES', 'PROJECTS', 'REPORTS', 'SETTINGS', 'USERS', 'ROLES'];

  useEffect(() => {
    fetchData();
  }, [roleId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Fetch role details with permissions
      const roleResponse = await fetch(`/api/rbac/roles/${roleId}`);
      if (roleResponse.ok) {
        const roleData = await roleResponse.json();
        setRole(roleData);
        setRolePermissions(roleData.permissions || []);
      }

      // Fetch all available permissions
      const permissionsResponse = await fetch('/api/rbac/permissions');
      if (permissionsResponse.ok) {
        const permissionsData = await permissionsResponse.json();
        setAllPermissions(permissionsData);
      }

    } catch (err) {
      setError('Failed to fetch role data');
      console.error('Error fetching role data:', err);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (module: string, level: string): boolean => {
    return rolePermissions.some(permission => 
      permission.module === module && permission.level === level
    );
  };

  const togglePermission = (module: string, level: string) => {
    const permission = allPermissions.find(p => p.module === module && p.level === level);
    if (!permission) return;

    if (hasPermission(module, level)) {
      // Remove permission
      setRolePermissions(prev => 
        prev.filter(p => !(p.module === module && p.level === level))
      );
    } else {
      // Add permission
      setRolePermissions(prev => [...prev, permission]);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Prepare permission IDs
      const permissionIds = rolePermissions.map(p => p.id);

      // Save role permissions
      const response = await fetch(`/api/rbac/roles/${roleId}/permissions/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role_id: roleId,
          permissions: permissionIds.map(id => ({ permission_id: id, is_granted: true })),
          created_by: 1 // This should be the current user ID
        }),
      });

      if (response.ok) {
        setSuccess('Role permissions updated successfully');
        fetchData(); // Refresh data
      } else {
        const error = await response.json();
        setError(error.detail || 'Failed to save permissions');
      }

    } catch (err) {
      setError('Failed to save permissions');
      console.error('Error saving permissions:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleRoleUpdate = async (updates: Partial<Role>) => {
    try {
      const response = await fetch(`/api/rbac/roles/${roleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        fetchData();
        setSuccess('Role updated successfully');
      } else {
        const error = await response.json();
        setError(error.detail || 'Failed to update role');
      }
    } catch (err) {
      setError('Failed to update role');
      console.error('Error updating role:', err);
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

  const getModulePermissions = (module: string) => {
    return levels.map(level => ({
      module,
      level,
      hasPermission: hasPermission(module, level),
      permission: allPermissions.find(p => p.module === module && p.level === level)
    }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!role) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error">Role not found</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        {onBack && (
          <IconButton onClick={onBack} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
        )}
        <Breadcrumbs aria-label="breadcrumb">
          <Link
            component="button"
            variant="body1"
            onClick={onBack}
            sx={{ cursor: 'pointer' }}
          >
            Roles & Permissions
          </Link>
          <Typography color="text.primary">{role.name}</Typography>
        </Breadcrumbs>
      </Box>

      <Typography variant="h4" gutterBottom>
        <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Role Permissions: {role.name}
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

      {/* Role Information Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Role Information
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {role.description}
              </Typography>
              <Box display="flex" gap={1} mt={1}>
                <Chip
                  label={role.level.replace('_', ' ')}
                  color={getRoleLevelColor(role.level) as any}
                  size="small"
                />
                <Chip
                  label={role.is_active ? 'Active' : 'Inactive'}
                  color={role.is_active ? 'success' : 'default'}
                  size="small"
                />
                {role.is_system_role && (
                  <Chip
                    label="System Role"
                    color="info"
                    size="small"
                  />
                )}
              </Box>
            </Box>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setEditDialogOpen(true)}
              disabled={role.is_system_role}
            >
              Edit Role
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Permission Matrix */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Permission Matrix</Typography>
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
                disabled={saving || role.is_system_role}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Box>

          {role.is_system_role && (
            <Alert severity="info" sx={{ mb: 2 }}>
              This is a system role. Permissions cannot be modified.
            </Alert>
          )}

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Module</TableCell>
                  {levels.map(level => (
                    <TableCell key={level} align="center" sx={{ fontWeight: 'bold', minWidth: 100 }}>
                      {level}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {modules.map(module => (
                  <TableRow key={module}>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      {module.replace('_', ' ')}
                    </TableCell>
                    {getModulePermissions(module).map(({ module: mod, level, hasPermission, permission }) => (
                      <TableCell key={`${mod}-${level}`} align="center">
                        <Tooltip 
                          title={
                            permission?.description || `${mod} - ${level}`
                          }
                        >
                          <Checkbox
                            checked={hasPermission}
                            onChange={() => togglePermission(mod, level)}
                            disabled={role.is_system_role}
                            icon={<CancelIcon color="disabled" />}
                            checkedIcon={<CheckCircleIcon color="success" />}
                          />
                        </Tooltip>
                      </TableCell>
                    ))}
                  </TableRow>
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
                <Typography variant="caption">• Hover over checkboxes to see permission descriptions</Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Role</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Role Name"
              defaultValue={role.name}
              margin="normal"
              disabled={role.is_system_role}
            />
            <TextField
              fullWidth
              label="Description"
              defaultValue={role.description}
              margin="normal"
              multiline
              rows={3}
              disabled={role.is_system_role}
            />
            <FormControl fullWidth margin="normal" disabled={role.is_system_role}>
              <InputLabel>Role Level</InputLabel>
              <Select defaultValue={role.level}>
                <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
                <MenuItem value="ACCOUNTANT">Accountant</MenuItem>
                <MenuItem value="MANAGER">Manager</MenuItem>
                <MenuItem value="HR">HR</MenuItem>
                <MenuItem value="VIEWER">Viewer</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch defaultChecked={role.is_active} disabled={role.is_system_role} />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              // Handle role update
              setEditDialogOpen(false);
            }}
            disabled={role.is_system_role}
          >
            Update Role
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RolePermissionsEditor;