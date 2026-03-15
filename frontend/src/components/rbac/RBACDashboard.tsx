import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Security as SecurityIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';

interface RBACStats {
  total_users: number;
  total_roles: number;
  total_permissions: number;
  active_sessions: number;
  recent_audit_logs: number;
  permission_usage: Record<string, number>;
  role_distribution: Record<string, number>;
  recent_activities: Array<{
    id: number;
    user: string;
    action: string;
    module: string;
    timestamp: string;
    status: string;
  }>;
}

interface RBACDashboardProps {
  onNavigate?: (section: string) => void;
}

const RBACDashboard: React.FC<RBACDashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<RBACStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard statistics
      const response = await fetch('/api/rbac/dashboard-stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        throw new Error('Failed to fetch dashboard data');
      }

    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
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

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchDashboardData}>
          Retry
        </Button>
      </Box>
    );
  }

  if (!stats) {
    return (
      <Alert severity="info">
        No dashboard data available
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          RBAC Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {/* Key Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Users
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats.total_users}
                  </Typography>
                </Box>
                <PeopleIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
              <Box display="flex" alignItems="center" mt={2}>
                <TrendingUpIcon color="success" fontSize="small" />
                <Typography variant="caption" color="success.main" sx={{ ml: 0.5 }}>
                  {stats.active_sessions} active sessions
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Roles
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats.total_roles}
                  </Typography>
                </Box>
                <AssignmentIcon color="secondary" sx={{ fontSize: 40 }} />
              </Box>
              <Box display="flex" alignItems="center" mt={2}>
                <Typography variant="caption" color="text.secondary">
                  {Object.keys(stats.role_distribution).length} different levels
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Permissions
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats.total_permissions}
                  </Typography>
                </Box>
                <SecurityIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
              <Box display="flex" alignItems="center" mt={2}>
                <Typography variant="caption" color="text.secondary">
                  Across all modules
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Recent Activities
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats.recent_audit_logs}
                  </Typography>
                </Box>
                <HistoryIcon color="warning" sx={{ fontSize: 40 }} />
              </Box>
              <Box display="flex" alignItems="center" mt={2}>
                <Typography variant="caption" color="text.secondary">
                  Last 24 hours
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Role Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Role Distribution
              </Typography>
              <List dense>
                {Object.entries(stats.role_distribution).map(([role, count]) => (
                  <ListItem key={role} divider>
                    <ListItemText
                      primary={role.replace('_', ' ')}
                      secondary={`${count} users`}
                    />
                    <Box sx={{ minWidth: 120 }}>
                      <LinearProgress
                        variant="determinate"
                        value={(count / stats.total_users) * 100}
                        sx={{ mb: 0.5 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {Math.round((count / stats.total_users) * 100)}%
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Permission Usage */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Most Used Permissions
              </Typography>
              <List dense>
                {Object.entries(stats.permission_usage)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([permission, count]) => (
                    <ListItem key={permission} divider>
                      <ListItemText
                        primary={permission.replace('_', ' ')}
                        secondary={`${count} times used`}
                      />
                      <Chip
                        label={count}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </ListItem>
                  ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Recent Activities
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<VisibilityIcon />}
                  onClick={() => onNavigate?.('audit-logs')}
                >
                  View All
                </Button>
              </Box>
              
              <List dense>
                {stats.recent_activities.slice(0, 8).map((activity) => (
                  <ListItem key={activity.id} divider>
                    <ListItemIcon>
                      {getStatusIcon(activity.status)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" fontWeight="medium">
                            {activity.user}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {activity.action.toLowerCase()} {activity.module.toLowerCase()}
                          </Typography>
                          <Chip
                            label={activity.status}
                            size="small"
                            color={getStatusColor(activity.status) as any}
                          />
                        </Box>
                      }
                      secondary={formatTimestamp(activity.timestamp)}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Box mt={3}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<PeopleIcon />}
              onClick={() => onNavigate?.('users')}
            >
              Manage Users
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<AssignmentIcon />}
              onClick={() => onNavigate?.('roles')}
            >
              Manage Roles
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<SecurityIcon />}
              onClick={() => onNavigate?.('permissions')}
            >
              Manage Permissions
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<HistoryIcon />}
              onClick={() => onNavigate?.('audit-logs')}
            >
              View Audit Logs
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default RBACDashboard;