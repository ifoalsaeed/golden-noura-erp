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
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Grid,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface Role {
  id: number;
  name: string;
  description: string;
  level: string;
  is_active: boolean;
  is_system_role: boolean;
  created_at: string;
  user_count?: number;
}

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

const RBACManager: React.FC = () => {
  const { t } = useTranslation();
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    level: 'ADMIN'
  });

  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    full_name: '',
    role_id: '',
    password: '',
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch roles
      const rolesResponse = await fetch('/api/rbac/roles');
      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        setRoles(rolesData);
      }

      // Fetch users
      const usersResponse = await fetch('/api/rbac/users');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      }
    } catch (err) {
      setError(t('Failed to fetch RBAC data'));
      console.error('Error fetching RBAC data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = () => {
    setEditingRole(null);
    setRoleForm({ name: '', description: '', level: 'ADMIN' });
    setRoleDialogOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      description: role.description,
      level: role.level
    });
    setRoleDialogOpen(true);
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setUserForm({
      username: '',
      email: '',
      full_name: '',
      role_id: '',
      password: '',
      is_active: true
    });
    setUserDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role_id: user.role.id.toString(),
      password: '',
      is_active: user.is_active
    });
    setUserDialogOpen(true);
  };

  const handleRoleSubmit = async () => {
    try {
      const method = editingRole ? 'PUT' : 'POST';
      const url = editingRole 
        ? `/api/rbac/roles/${editingRole.id}`
        : '/api/rbac/roles';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleForm)
      });

      if (response.ok) {
        setRoleDialogOpen(false);
        fetchData();
      } else {
        const error = await response.json();
        setError(error.detail || t('Failed to save role'));
      }
    } catch (err) {
      setError(t('Failed to save role'));
      console.error('Error saving role:', err);
    }
  };

  const handleUserSubmit = async () => {
    try {
      const method = editingUser ? 'PUT' : 'POST';
      const url = editingUser
        ? `/api/rbac/users/${editingUser.id}`
        : '/api/rbac/users';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm)
      });

      if (response.ok) {
        setUserDialogOpen(false);
        fetchData();
      } else {
        const error = await response.json();
        setError(error.detail || t('Failed to save user'));
      }
    } catch (err) {
      setError(t('Failed to save user'));
      console.error('Error saving user:', err);
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (window.confirm(t('Are you sure you want to delete this role?'))) {
      try {
        const response = await fetch(`/api/rbac/roles/${roleId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          fetchData();
        } else {
          const error = await response.json();
          setError(error.detail || t('Failed to delete role'));
        }
      } catch (err) {
        setError(t('Failed to delete role'));
        console.error('Error deleting role:', err);
      }
    }
  };

  const getRoleLevelColor = (level: string) => {
    const colors = {
      SUPER_ADMIN: 'error',
      ADMIN: 'warning',
      ACCOUNTANT: 'info',
      MANAGER: 'success',
      VIEWER: 'default',
      HR: 'secondary'
    };
    return colors[level as keyof typeof colors] || 'default';
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
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Roles Management */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" component="h2">
              <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              {t('Role Management')}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateRole}
            >
              {t('Create Role')}
            </Button>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('Name')}</TableCell>
                  <TableCell>{t('Description')}</TableCell>
                  <TableCell>{t('Level')}</TableCell>
                  <TableCell>{t('Status')}</TableCell>
                  <TableCell>{t('Users')}</TableCell>
                  <TableCell>{t('Actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>{role.name}</TableCell>
                    <TableCell>{role.description}</TableCell>
                    <TableCell>
                      <Chip
                        label={role.level}
                        color={getRoleLevelColor(role.level) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={role.is_active ? t('Active') : t('Inactive')}
                        color={role.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{role.user_count || 0}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleEditRole(role)}
                        disabled={role.is_system_role}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteRole(role.id)}
                        disabled={role.is_system_role}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Users Management */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" component="h2">
              <PeopleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              {t('User Management')}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateUser}
            >
              {t('Create User')}
            </Button>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('Username')}</TableCell>
                  <TableCell>{t('Email')}</TableCell>
                  <TableCell>{t('Full Name')}</TableCell>
                  <TableCell>{t('Role')}</TableCell>
                  <TableCell>{t('Status')}</TableCell>
                  <TableCell>{t('Created')}</TableCell>
                  <TableCell>{t('Actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.full_name}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role.name}
                        color={getRoleLevelColor(user.role.level) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.is_active ? t('Active') : t('Inactive')}
                        color={user.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleEditUser(user)}
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Role Dialog */}
      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingRole ? t('Edit Role') : t('Create Role')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label={t('Role Name')}
              value={roleForm.name}
              onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label={t('Description')}
              value={roleForm.description}
              onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth>
              <InputLabel>{t('Role Level')}</InputLabel>
              <Select
                value={roleForm.level}
                onChange={(e) => setRoleForm({ ...roleForm, level: e.target.value })}
              >
                <MenuItem value="SUPER_ADMIN">{t('Super Admin')}</MenuItem>
                <MenuItem value="ADMIN">{t('Admin')}</MenuItem>
                <MenuItem value="ACCOUNTANT">{t('Accountant')}</MenuItem>
                <MenuItem value="MANAGER">{t('Manager')}</MenuItem>
                <MenuItem value="HR">{t('HR')}</MenuItem>
                <MenuItem value="VIEWER">{t('Viewer')}</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)}>
            {t('Cancel')}
          </Button>
          <Button onClick={handleRoleSubmit} variant="contained">
            {editingRole ? t('Update') : t('Create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Dialog */}
      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? t('Edit User') : t('Create User')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label={t('Full Name')}
              value={userForm.full_name}
              onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label={t('Username')}
              value={userForm.username}
              onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label={t('Email')}
              type="email"
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>{t('Role')}</InputLabel>
              <Select
                value={userForm.role_id}
                onChange={(e) => setUserForm({ ...userForm, role_id: e.target.value })}
              >
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {!editingUser && (
              <TextField
                fullWidth
                label={t('Password')}
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                sx={{ mb: 2 }}
              />
            )}
            <FormControlLabel
              control={
                <Switch
                  checked={userForm.is_active}
                  onChange={(e) => setUserForm({ ...userForm, is_active: e.target.checked })}
                />
              }
              label={t('Active')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialogOpen(false)}>
            {t('Cancel')}
          </Button>
          <Button onClick={handleUserSubmit} variant="contained">
            {editingUser ? t('Update') : t('Create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RBACManager;
