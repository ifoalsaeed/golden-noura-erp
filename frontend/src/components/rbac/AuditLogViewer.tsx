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
  Chip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  FilterList as FilterIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  Computer as ComputerIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  module: string;
  resource_type: string;
  resource_id: number | null;
  old_values: string | null;
  new_values: string | null;
  ip_address: string;
  user_agent: string;
  timestamp: string;
  status: string;
  error_message: string | null;
  user: {
    username: string;
    full_name: string;
  };
}

const AuditLogViewer: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [filters, setFilters] = useState({
    user_id: '',
    module: '',
    action: '',
    status: '',
    date_from: '',
    date_to: ''
  });
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0
  });
  
  // Detail dialog
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Available options for filters
  const modules = ['DASHBOARD', 'EMPLOYEES', 'PAYROLL', 'ATTENDANCE', 'EXPENSES', 'PROJECTS', 'REPORTS', 'SETTINGS', 'USERS', 'ROLES'];
  const actions = ['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'APPROVE', 'EXPORT', 'LOGIN', 'LOGOUT', 'ASSIGN_ROLE', 'GRANT_PERMISSION', 'REVOKE_PERMISSION'];
  const statuses = ['SUCCESS', 'FAILED', 'DENIED'];

  useEffect(() => {
    fetchAuditLogs();
  }, [filters, pagination.page, pagination.limit]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (filters.user_id) params.append('user_id', filters.user_id);
      if (filters.module) params.append('module', filters.module);
      if (filters.action) params.append('action', filters.action);
      if (filters.status) params.append('status', filters.status);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      params.append('limit', pagination.limit.toString());
      params.append('offset', ((pagination.page - 1) * pagination.limit).toString());

      const response = await fetch(`/api/rbac/audit-logs?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data);
        // In a real implementation, you would get the total count from the response
        setPagination(prev => ({ ...prev, total: data.length * 2 })); // Mock total
      } else {
        throw new Error('Failed to fetch audit logs');
      }

    } catch (err) {
      setError('Failed to fetch audit logs');
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const clearFilters = () => {
    setFilters({
      user_id: '',
      module: '',
      action: '',
      status: '',
      date_from: '',
      date_to: ''
    });
  };

  const viewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'success';
      case 'FAILED': return 'error';
      case 'DENIED': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS': return <CheckCircleIcon fontSize="small" />;
      case 'FAILED': return <CancelIcon fontSize="small" />;
      case 'DENIED': return <WarningIcon fontSize="small" />;
      default: return null;
    }
  };

  const formatJson = (jsonString: string | null) => {
    if (!jsonString) return null;
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
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
        <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Audit Logs
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <FilterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Filters
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="User ID"
                type="number"
                value={filters.user_id}
                onChange={(e) => handleFilterChange('user_id', e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Module</InputLabel>
                <Select
                  value={filters.module}
                  onChange={(e) => handleFilterChange('module', e.target.value)}
                >
                  <MenuItem value="">All Modules</MenuItem>
                  {modules.map(module => (
                    <MenuItem key={module} value={module}>{module.replace('_', ' ')}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Action</InputLabel>
                <Select
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                >
                  <MenuItem value="">All Actions</MenuItem>
                  {actions.map(action => (
                    <MenuItem key={action} value={action}>{action}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  {statuses.map(status => (
                    <MenuItem key={status} value={status}>{status}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="From Date"
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="To Date"
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
          
          <Box display="flex" justifyContent="flex-end" mt={2} gap={1}>
            <Button
              variant="outlined"
              onClick={clearFilters}
              startIcon={<FilterIcon />}
            >
              Clear Filters
            </Button>
            <Button
              variant="contained"
              onClick={fetchAuditLogs}
              startIcon={<RefreshIcon />}
            >
              Apply Filters
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Audit Logs ({auditLogs.length})
            </Typography>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchAuditLogs}
            >
              Refresh
            </Button>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Module</TableCell>
                  <TableCell>Resource</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{formatTimestamp(log.timestamp)}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <PersonIcon fontSize="small" />
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {log.user.full_name || log.user.username}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {log.user_id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.action}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{log.module.replace('_', ' ')}</TableCell>
                    <TableCell>
                      {log.resource_type}
                      {log.resource_id && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          ID: {log.resource_id}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.status}
                        size="small"
                        color={getStatusColor(log.status) as any}
                        icon={getStatusIcon(log.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <ComputerIcon fontSize="small" />
                        <Typography variant="body2">{log.ip_address}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => viewDetails(log)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {auditLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No audit logs found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Audit Log Details
        </DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Log ID"
                        secondary={selectedLog.id}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Timestamp"
                        secondary={formatTimestamp(selectedLog.timestamp)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="User"
                        secondary={`${selectedLog.user.full_name || selectedLog.user.username} (ID: ${selectedLog.user_id})`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Action"
                        secondary={selectedLog.action}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Module"
                        secondary={selectedLog.module.replace('_', ' ')}
                      />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Resource Type"
                        secondary={selectedLog.resource_type}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Resource ID"
                        secondary={selectedLog.resource_id || 'N/A'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Status"
                        secondary={
                          <Chip
                            label={selectedLog.status}
                            size="small"
                            color={getStatusColor(selectedLog.status) as any}
                            icon={getStatusIcon(selectedLog.status)}
                          />
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="IP Address"
                        secondary={selectedLog.ip_address}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="User Agent"
                        secondary={selectedLog.user_agent}
                      />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>

              {selectedLog.error_message && (
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Error Message:
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'error.light' }}>
                    <Typography variant="body2" color="error.dark">
                      {selectedLog.error_message}
                    </Typography>
                  </Paper>
                </Box>
              )}

              {(selectedLog.old_values || selectedLog.new_values) && (
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Changes:
                  </Typography>
                  <Grid container spacing={2}>
                    {selectedLog.old_values && (
                      <Grid item xs={12} md={6}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Old Values:
                          </Typography>
                          <pre style={{ margin: 0, fontSize: '0.8rem' }}>
                            {formatJson(selectedLog.old_values)}
                          </pre>
                        </Paper>
                      </Grid>
                    )}
                    {selectedLog.new_values && (
                      <Grid item xs={12} md={6}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            New Values:
                          </Typography>
                          <pre style={{ margin: 0, fontSize: '0.8rem' }}>
                            {formatJson(selectedLog.new_values)}
                          </pre>
                        </Paper>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuditLogViewer;