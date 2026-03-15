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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Role, isAuthenticated, getUserRole } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const API_URL = '';

interface User {
  id: number;
  username: string;
  full_name?: string | null;
  role: Role;
  is_active: boolean;
  last_login: string | null;
  avatar_url?: string | null;
}

const SimpleRBACPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(Role.DATA_ENTRY);

  const fetchUsers = async () => {
    try {
      if (!isAuthenticated() || getUserRole() !== Role.ADMIN) {
        setUsers([]);
        return;
      }
      const token = localStorage.getItem('token') || '';
      const response = await api.get('/users/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenCreate = () => {
    if (!isAuthenticated()) {
      alert(t('You must login as admin to perform this action'));
      return;
    }
    if (getUserRole() !== Role.ADMIN) {
      alert(t('Admin role required'));
      return;
    }
    setEditUser(null);
    setFullName('');
    setUsername('');
    setPassword('');
    setRole(Role.DATA_ENTRY);
    setOpenDialog(true);
  };

  const handleOpenEdit = (user: User) => {
    if (!isAuthenticated()) {
      alert(t('You must login as admin to perform this action'));
      return;
    }
    if (getUserRole() !== Role.ADMIN) {
      alert(t('Admin role required'));
      return;
    }
    setEditUser(user);
    setFullName(user.full_name || '');
    setUsername(user.username);
    setPassword('');
    setRole(user.role);
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    if (!isAuthenticated() || getUserRole() !== Role.ADMIN) {
      alert(t('Admin role required'));
      return;
    }
    try {
      if (editUser) {
        const token = localStorage.getItem('token') || '';
        await api.put(`/users/${editUser.id}/profile`, { full_name: fullName, role }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchUsers();
        setOpenDialog(false);
      } else {
        const token = localStorage.getItem('token') || '';
        await api.post(`/users/`, { username, password, full_name: fullName, role }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchUsers();
        setOpenDialog(false);
      }
    } catch (error) {
      console.error('Error saving user:', error);
      const resp = (error as any)?.response;
      const message = resp?.data?.detail || t('An error occurred while saving');
      if (resp?.status === 401 || message === 'Could not validate credentials') {
        try {
          localStorage.setItem('isLoggedIn', 'false');
          localStorage.removeItem('token');
        } catch {}
        alert(t('You must login as admin to perform this action'));
        navigate('/login');
        return;
      }
      alert(message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('Are you sure you want to delete this user?'))) return;

    try {
      const token = localStorage.getItem('token') || '';
      await api.delete(`/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ color: 'white' }}>
          {t('User Management')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{
            bgcolor: '#D4AF37',
            color: '#000',
            '&:hover': { bgcolor: '#B5952F' }
          }}
        >
          {t('Add User')}
        </Button>
      </Box>

      <Card sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: 'white' }}>
        <CardContent>
          <TableContainer component={Paper} sx={{ bgcolor: 'transparent' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#D4AF37' }}>{t('Username')}</TableCell>
                  <TableCell sx={{ color: '#D4AF37' }}>{t('Full Name')}</TableCell>
                  <TableCell sx={{ color: '#D4AF37' }}>{t('Role')}</TableCell>
                  <TableCell sx={{ color: '#D4AF37' }}>{t('Status')}</TableCell>
                  <TableCell sx={{ color: '#D4AF37' }}>{t('Last Login')}</TableCell>
                  <TableCell sx={{ color: '#D4AF37' }}>{t('Actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell sx={{ color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
                      {user.avatar_url ? (
                        (() => {
                          const apiRoot = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace(/\/api\/v1$/, '');
                          const src = user.avatar_url?.startsWith('http') ? user.avatar_url : `${apiRoot}${user.avatar_url}`;
                          return <img src={src} alt="avatar" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />;
                        })()
                      ) : null}
                      <span>{user.username}</span>
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      {user.full_name || '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        size="small"
                        sx={{
                          bgcolor: user.role === Role.ADMIN ? '#D4AF37' : 'rgba(255,255,255,0.1)',
                          color: user.role === Role.ADMIN ? '#000' : 'white'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      {user.is_active ? t('Active') : t('Inactive')}
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      {user.last_login ? new Date(user.last_login).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenEdit(user)} sx={{ color: '#D4AF37' }}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(user.id)} sx={{ color: '#ef4444' }}>
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

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>{editUser ? t('Edit User') : t('Create User')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label={t('Username')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              disabled={!!editUser}
            />
            <TextField
              label={t('Full Name')}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              fullWidth
            />
            {!editUser && (
              <TextField
                label={t('Password')}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
              />
            )}
            <TextField
              select
              label={t('Role')}
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              fullWidth
            >
              <MenuItem value={Role.ADMIN}>{Role.ADMIN}</MenuItem>
              <MenuItem value={Role.DATA_ENTRY}>{Role.DATA_ENTRY}</MenuItem>
              <MenuItem value={Role.EDITOR}>{Role.EDITOR}</MenuItem>
              <MenuItem value={Role.REPORT_VIEWER}>{Role.REPORT_VIEWER}</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>{t('Cancel')}</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ bgcolor: '#D4AF37', color: '#000' }}>
            {t('Save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SimpleRBACPage;
