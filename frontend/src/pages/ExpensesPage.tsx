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
  IconButton,
  Grid,
  InputAdornment
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, Send as SendIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { getToken } from '../utils/auth';
import { requestApproval } from '../utils/approval';
import { getUserRole, Role } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || '';

enum ExpenseStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  PAID = "PAID"
}

enum ExpenseCategory {
  OPERATIONAL = "OPERATIONAL",
  PAYROLL = "PAYROLL",
  MARKETING = "MARKETING",
  MAINTENANCE = "MAINTENANCE",
  GOVERNMENT_FEES = "GOVERNMENT_FEES",
  OFFICE_SUPPLIES = "OFFICE_SUPPLIES",
  RENT = "RENT",
  UTILITIES = "UTILITIES",
  TRAVEL = "TRAVEL",
  OTHER = "OTHER"
}

enum PaymentMethod {
  CASH = "CASH",
  BANK_TRANSFER = "BANK_TRANSFER",
  CHECK = "CHECK",
  CREDIT_CARD = "CREDIT_CARD",
  OTHER = "OTHER"
}

interface Expense {
  id: number;
  title: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  status: ExpenseStatus;
  payment_method: PaymentMethod;
  description?: string;
  worker_name?: string;
  created_by_name?: string;
}

const ExpensesPage: React.FC = () => {
  const { t } = useTranslation();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: ExpenseCategory.OTHER,
    payment_method: PaymentMethod.CASH,
    description: '',
    worker_id: ''
  });

  const fetchExpenses = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/v1/expenses/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleOpenCreate = () => {
    setEditExpense(null);
    setFormData({
      title: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category: ExpenseCategory.OTHER,
      payment_method: PaymentMethod.CASH,
      description: '',
      worker_id: ''
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (expense: Expense) => {
    setEditExpense(expense);
    setFormData({
      title: expense.title,
      amount: expense.amount.toString(),
      date: expense.date,
      category: expense.category,
      payment_method: expense.payment_method,
      description: expense.description || '',
      worker_id: '' // Assuming we don't edit worker link for now
    });
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    const token = getToken();
    const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        worker_id: formData.worker_id ? parseInt(formData.worker_id) : null
    };

    try {
      if (editExpense) {
        // Update
        const response = await fetch(`${API_URL}/api/v1/expenses/${editExpense.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          fetchExpenses();
          setOpenDialog(false);
        }
      } else {
        // Create
        const response = await fetch(`${API_URL}/api/v1/expenses/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          fetchExpenses();
          setOpenDialog(false);
        }
      }
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const handleRequestDelete = async (id: number) => {
    if (!confirm(t('Request delete approval for this expense?'))) return;
    try {
      await requestApproval({ target_table: 'expenses', target_id: id, action: 'DELETE' });
      alert(t('Approval request sent to admin'));
    } catch (e) {
      console.error(e);
      alert('Failed to send approval request');
    }
  };

  const getStatusColor = (status: ExpenseStatus) => {
    switch (status) {
      case ExpenseStatus.APPROVED: return '#4caf50';
      case ExpenseStatus.PENDING: return '#ff9800';
      case ExpenseStatus.REJECTED: return '#f44336';
      case ExpenseStatus.PAID: return '#2196f3';
      default: return '#9e9e9e';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ color: 'white' }}>
          {t('Expense Management')}
        </Typography>
        {getUserRole() === Role.ADMIN && (
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
          {t('Add Expense')}
        </Button>
        )}
      </Box>

      <Card sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: 'white' }}>
        <CardContent>
          <TableContainer component={Paper} sx={{ bgcolor: 'transparent' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#D4AF37' }}>{t('Title')}</TableCell>
                  <TableCell sx={{ color: '#D4AF37' }}>{t('Amount')}</TableCell>
                  <TableCell sx={{ color: '#D4AF37' }}>{t('Date')}</TableCell>
                  <TableCell sx={{ color: '#D4AF37' }}>{t('Category')}</TableCell>
                  <TableCell sx={{ color: '#D4AF37' }}>{t('Status')}</TableCell>
                  <TableCell sx={{ color: '#D4AF37' }}>{t('Actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell sx={{ color: 'white' }}>{expense.title}</TableCell>
                    <TableCell sx={{ color: 'white' }}>{expense.amount.toFixed(2)} SAR</TableCell>
                    <TableCell sx={{ color: 'white' }}>{expense.date}</TableCell>
                    <TableCell sx={{ color: 'white' }}>
                        <Chip label={t(expense.category)} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }} />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={t(expense.status)} 
                        size="small"
                        sx={{ 
                          bgcolor: getStatusColor(expense.status),
                          color: 'white'
                        }} 
                      />
                    </TableCell>
                    <TableCell>
                      {getUserRole() === Role.ADMIN && (
                        <>
                          <IconButton onClick={() => handleOpenEdit(expense)} sx={{ color: '#D4AF37' }}>
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => handleRequestDelete(expense.id)} sx={{ color: '#ef4444' }} title={t('Request Delete') as string}>
                            <SendIcon />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {expenses.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ color: 'gray' }}>
                            {t('No expenses found')}
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editExpense ? t('Edit Expense') : t('Create Expense')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
                <TextField
                    label={t('Title')}
                    fullWidth
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
            </Grid>
            <Grid item xs={6}>
                <TextField
                    label={t('Amount')}
                    type="number"
                    fullWidth
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    InputProps={{
                        endAdornment: <InputAdornment position="end">SAR</InputAdornment>,
                    }}
                />
            </Grid>
            <Grid item xs={6}>
                <TextField
                    label={t('Date')}
                    type="date"
                    fullWidth
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                />
            </Grid>
            <Grid item xs={6}>
                <TextField
                    select
                    label={t('Category')}
                    fullWidth
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value as ExpenseCategory})}
                >
                    {Object.values(ExpenseCategory).map((cat) => (
                        <MenuItem key={cat} value={cat}>{t(cat)}</MenuItem>
                    ))}
                </TextField>
            </Grid>
            <Grid item xs={6}>
                <TextField
                    select
                    label={t('Payment Method')}
                    fullWidth
                    value={formData.payment_method}
                    onChange={(e) => setFormData({...formData, payment_method: e.target.value as PaymentMethod})}
                >
                    {Object.values(PaymentMethod).map((method) => (
                        <MenuItem key={method} value={method}>{t(method)}</MenuItem>
                    ))}
                </TextField>
            </Grid>
            <Grid item xs={12}>
                <TextField
                    label={t('Description')}
                    fullWidth
                    multiline
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
            </Grid>
          </Grid>
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

export default ExpensesPage;
