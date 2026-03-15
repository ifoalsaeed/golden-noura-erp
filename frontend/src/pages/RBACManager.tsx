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
  Switch,
  FormControlLabel,
  Grid,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

interface Role {
  id: number;
  name: string;
  description: string;
  level: string;
  is_active: boolean;
  is_system_role: boolean;
  created_at: string;
  permission_summary: Record<string, string[]>;
}

interface Permission {
  id: number;
  module: string;
  level: string;
  name: string;
  description: string;
  is_active: boolean;
}

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: Role | null;
  is_active: boolean;
}

const RBACManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [assignRoleDialogOpen, setAssignRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form states
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    level: 'ADMIN',
    is_active: true
  });
  
  const [permissionForm, setPermissionForm] = useState({
    module: 'DASHBOARD',
    level: 'VIEW',
    name: '',
    description: '',
    is_active: true
  });

  // Permission modules and levels
  const modules = [
    'DASHBOARD', 'EMPLOYEES', 'PAYROLL', 'ATTENDANCE', 
    'EXPENSES', 'PROJECTS', 'REPORTS', 'SETTINGS', 'USERS', 'ROLES'
  ];
  
  const levels = ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE', 'EXPORT', 'PRINT'];
  
  const roleLevels = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'MANAGER', 'HR', 'VIEWER'];

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
      
      // Fetch permissions
      const permissionsResponse = await fetch('/api/rbac/permissions');
      if (permissionsResponse.ok) {
        const permissionsData = await permissionsResponse.json();
        setPermissions(permissionsData);
      }
      
      // Fetch users (you might need to adjust this endpoint)
      const usersResponse = await fetch('/api/users');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      }
      
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    try {
      const response = await fetch('/api/rbac/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roleForm),
      });

      if (response.ok) {
        setRoleDialogOpen(false);
        fetchData();
        // Reset form
        setRoleForm({
          name: '',
          description: '',
          level: 'ADMIN',
          is_active: true
        });
      } else {
        const error = await response.json();
        setError(error.detail || 'Failed to create role');
      }
    } catch (err) {
      setError('Failed to create role');
      console.error('Error creating role:', err);
    }
  };

  const handleUpdateRole = async (roleId: number, updates: Partial<Role>) => {
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
      } else {
        const error = await response.json();
        setError(error.detail || 'Failed to update role');
      }
    } catch (err) {
      setError('Failed to update role');
      console.error('Error updating role:', err);
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (!window.confirm('Are you sure you want to delete this role?')) {
      return;
    }

    try {
      const response = await fetch(`/api/rbac/roles/${roleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchData();
      } else {
        const error = await response.json();
        setError(error.detail || 'Failed to delete role');
      }
    } catch (err) {
      setError('Failed to delete role');
      console.error('Error deleting role:', err);
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

  const getPermissionIcon = (hasPermission: boolean) => {
    return hasPermission ? (
      <CheckCircleIcon color="success" />
    ) : (
      <CancelIcon color="disabled" />
    );
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
        Roles & Permissions Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Tabs
            value={activeTab}
            onChange={(event, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Roles" />
            <Tab label="Permissions" />
            <Tab label="User Assignments" />
            <Tab label="Permission Matrix" />
          </Tabs>

          {/* Roles Tab */}
          {activeTab === 0 && (
            <Box sx={{ mt: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Role Management</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setRoleDialogOpen(true)}
                >
                  Create Role
                </Button>
              </Box>

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Level</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>System Role</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell>{role.name}</TableCell>
                        <TableCell>{role.description}</TableCell>
                        <TableCell>
                          <Chip
                            label={role.level.replace('_', ' ')}
                            color={getRoleLevelColor(role.level) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={role.is_active ? 'Active' : 'Inactive'}
                            color={role.is_active ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {role.is_system_role ? (
                            <CheckCircleIcon color="success" />
                          ) : (
                            <CancelIcon color="disabled" />
                          )}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedRole(role);
                              setRoleDialogOpen(true);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteRole(role.id)}
                            disabled={role.is_system_role}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Permissions Tab */}
          {activeTab === 1 && (
            <Box sx={{ mt: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Permission Management</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setPermissionDialogOpen(true)}
                >
                  Create Permission
                </Button>
              </Box>

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Module</TableCell>
                      <TableCell>Level</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {permissions.map((permission) => (
                      <TableRow key={permission.id}>
                        <TableCell>{permission.module}</TableCell>
                        <TableCell>{permission.level}</TableCell>
                        <TableCell>{permission.name}</TableCell>
                        <TableCell>{permission.description}</TableCell>
                        <TableCell>
                          <Chip
                            label={permission.is_active ? 'Active' : 'Inactive'}
                            color={permission.is_active ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* User Assignments Tab */}
          {activeTab === 2 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" mb={2}>User Role Assignments</Typography>
              
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Username</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Current Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {user.role ? (
                            <Chip
                              label={user.role.name}
                              color={getRoleLevelColor(user.role.level) as any}
                              size="small"
                            />
                          ) : (
                            <Chip label="No Role" size="small" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.is_active ? 'Active' : 'Inactive'}
                            color={user.is_active ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            startIcon={<PersonIcon />}
                            onClick={() => {
                              setSelectedUser(user);
                              setAssignRoleDialogOpen(true);
                            }}
                          >
                            Assign Role
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Permission Matrix Tab */}
          {activeTab === 3 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" mb={2}>Permission Matrix</Typography>
              
              {roles.map((role) => (
                <Accordion key={role.id} sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {role.name}
                      </Typography>
                      <Chip
                        label={role.level.replace('_', ' ')}
                        color={getRoleLevelColor(role.level) as any}
                        size="small"
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {Object.entries(role.permission_summary || {}).map(([module, permissions]) => (
                        <Grid item xs={12} md={6} key={module}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="subtitle2" gutterBottom>
                                {module.replace('_', ' ')}
                              </Typography>
                              <Box display="flex" flexWrap="wrap" gap={1}>
                                {levels.map((level) => (
                                  <Box key={level} display="flex" alignItems="center" gap={0.5}>
                                    {getPermissionIcon(permissions?.includes(level) || false)}
                                    <Typography variant="caption">
                                      {level}
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Role Dialog */}
      <Dialog 
        open={roleDialogOpen} 
        onClose={() => setRoleDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedRole ? 'Edit Role' : 'Create New Role'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Role Name"
              value={roleForm.name}
              onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Description"
              value={roleForm.description}
              onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
              margin="normal"
              multiline
              rows={3}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Role Level</InputLabel>
              <Select
                value={roleForm.level}
                onChange={(e) => setRoleForm({ ...roleForm, level: e.target.value })}
              >
                {roleLevels.map((level) => (
                  <MenuItem key={level} value={level}>
                    {level.replace('_', ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={roleForm.is_active}
                  onChange={(e) => setRoleForm({ ...roleForm, is_active: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateRole} variant="contained">
            {selectedRole ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Permission Dialog */}
      <Dialog 
        open={permissionDialogOpen} 
        onClose={() => setPermissionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Permission</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Module</InputLabel>
              <Select
                value={permissionForm.module}
                onChange={(e) => setPermissionForm({ ...permissionForm, module: e.target.value })}
              >
                {modules.map((module) => (
                  <MenuItem key={module} value={module}>
                    {module.replace('_', ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Permission Level</InputLabel>
              <Select
                value={permissionForm.level}
                onChange={(e) => setPermissionForm({ ...permissionForm, level: e.target.value })}
              >
                {levels.map((level) => (
                  <MenuItem key={level} value={level}>
                    {level}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Permission Name"
              value={permissionForm.name}
              onChange={(e) => setPermissionForm({ ...permissionForm, name: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Description"
              value={permissionForm.description}
              onChange={(e) => setPermissionForm({ ...permissionForm, description: e.target.value })}
              margin="normal"
              multiline
              rows={2}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={permissionForm.is_active}
                  onChange={(e) => setPermissionForm({ ...permissionForm, is_active: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermissionDialogOpen(false)}>Cancel</Button>
          <Button variant="contained">
            Create Permission
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Role Dialog */}
      <Dialog 
        open={assignRoleDialogOpen} 
        onClose={() => setAssignRoleDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Assign Role to User</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              User: {selectedUser?.username}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Email: {selectedUser?.email}
            </Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel>Select Role</InputLabel>
              <Select
                value={selectedUser?.role?.id || ''}
                onChange={(e) => {
                  if (selectedUser) {
                    setSelectedUser({
                      ...selectedUser,
                      role: roles.find(r => r.id === e.target.value) || null
                    });
                  }
                }}
              >
                <MenuItem value="">
                  <em>Remove Role</em>
                </MenuItem>
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name} - {role.level.replace('_', ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignRoleDialogOpen(false)}>Cancel</Button>
          <Button variant="contained">
            Assign Role
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RBACManager;