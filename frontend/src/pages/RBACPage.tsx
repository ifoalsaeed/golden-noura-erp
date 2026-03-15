import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  Security as SecurityIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  History as HistoryIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

// Import components
import RBACDashboard from '../components/rbac/RBACDashboard';
import RBACManager from '../components/rbac/RBACManager';
import PermissionMatrix from '../components/rbac/PermissionMatrix';
import RolePermissionsEditor from '../components/rbac/RolePermissionsEditor';
import AuditLogViewer from '../components/rbac/AuditLogViewer';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`rbac-tabpanel-${index}`}
      aria-labelledby={`rbac-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `rbac-tab-${index}`,
    'aria-controls': `rbac-tabpanel-${index}`,
  };
}

const RBACPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('dashboard');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setSelectedSection(['dashboard', 'roles', 'permissions', 'audit'][newValue]);
  };

  const handleNavigate = (section: string) => {
    const sectionMap: Record<string, number> = {
      'dashboard': 0,
      'roles': 1,
      'permissions': 2,
      'audit-logs': 3
    };
    
    const tabIndex = sectionMap[section] || 0;
    setActiveTab(tabIndex);
    setSelectedSection(section);
  };

  const handleRoleSelect = (roleId: number) => {
    setSelectedRoleId(roleId);
    setSelectedSection('role-editor');
  };

  const handleBackToRoles = () => {
    setSelectedRoleId(null);
    setSelectedSection('roles');
  };

  const getBreadcrumbItems = () => {
    const items = [
      { label: 'Dashboard', section: 'dashboard', icon: <DashboardIcon fontSize="small" /> },
      { label: 'الصلاحيات', section: 'rbac', icon: <SecurityIcon fontSize="small" /> }
    ];

    if (selectedSection === 'role-editor' && selectedRoleId) {
      items.push({ 
        label: 'Roles', 
        section: 'roles', 
        icon: <PeopleIcon fontSize="small" />,
        onClick: handleBackToRoles
      });
      items.push({ 
        label: `Role ${selectedRoleId}`, 
        section: 'role-editor', 
        icon: <AssignmentIcon fontSize="small" />
      });
    } else if (selectedSection !== 'dashboard') {
      const sectionLabels: Record<string, string> = {
        'roles': 'Role Management',
        'permissions': 'Permission Management',
        'audit-logs': 'Audit Logs'
      };
      items.push({ 
        label: sectionLabels[selectedSection] || 'Unknown', 
        section: selectedSection,
        icon: selectedSection === 'roles' ? <PeopleIcon fontSize="small" /> :
              selectedSection === 'permissions' ? <SettingsIcon fontSize="small" /> :
              <HistoryIcon fontSize="small" />
      });
    }

    return items;
  };

  return (
    <Box>
      {/* Header with Breadcrumbs */}
      <Box mb={3}>
        <Breadcrumbs aria-label="breadcrumb">
          {getBreadcrumbItems().map((item, index) => (
            <Link
              key={item.section}
              component="button"
              variant={index === getBreadcrumbItems().length - 1 ? 'h6' : 'body1'}
              onClick={item.onClick || (() => item.section !== 'rbac' && handleNavigate(item.section))}
              sx={{ 
                cursor: item.section === 'rbac' ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5
              }}
              color={index === getBreadcrumbItems().length - 1 ? 'text.primary' : 'inherit'}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </Breadcrumbs>
      </Box>

      {/* Main Content */}
      {selectedSection === 'role-editor' && selectedRoleId ? (
        <RolePermissionsEditor 
          roleId={selectedRoleId} 
          onBack={handleBackToRoles}
        />
      ) : (
        <>
          {/* Tab Navigation */}
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab 
              icon={<DashboardIcon />} 
              label="Dashboard" 
              {...a11yProps(0)} 
            />
            <Tab 
              icon={<PeopleIcon />} 
              label="Roles & Users" 
              {...a11yProps(1)} 
            />
            <Tab 
              icon={<SettingsIcon />} 
              label="Permissions" 
              {...a11yProps(2)} 
            />
            <Tab 
              icon={<HistoryIcon />} 
              label="Audit Logs" 
              {...a11yProps(3)} 
            />
          </Tabs>

          {/* Tab Panels */}
          <TabPanel value={activeTab} index={0}>
            <RBACDashboard onNavigate={handleNavigate} />
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <RBACManager />
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <PermissionMatrix />
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            <AuditLogViewer />
          </TabPanel>
        </>
      )}
    </Box>
  );
};

export default RBACPage;
