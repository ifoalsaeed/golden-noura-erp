import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Workers from './pages/Workers';
import Clients from './pages/Clients';
import Contracts from './pages/Contracts';
import PayrollEnhanced from './pages/PayrollEnhanced';
import SimpleRBACPage from './pages/SimpleRBACPage';
import ExpensesPage from './pages/ExpensesPage';
import Invoices from './pages/Invoices';
import Accounting from './pages/Accounting';
import Approvals from './pages/Approvals';
import Reports from './pages/Reports';
import Layout from './components/layout/Layout';
import './i18n';
import { Role, hasRole } from './utils/auth';

function PrivateRoute({ children, roles }: { children: JSX.Element, roles?: Role[] }) {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !hasRole(roles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          <Route path="workers" element={
            <PrivateRoute roles={[Role.ADMIN, Role.DATA_ENTRY]}>
              <Workers />
            </PrivateRoute>
          } />
          
          <Route path="clients" element={
            <PrivateRoute roles={[Role.ADMIN, Role.DATA_ENTRY]}>
              <Clients />
            </PrivateRoute>
          } />
          
          <Route path="contracts" element={
            <PrivateRoute roles={[Role.ADMIN, Role.DATA_ENTRY]}>
              <Contracts />
            </PrivateRoute>
          } />
          
          <Route path="payroll" element={
            <PrivateRoute roles={[Role.ADMIN, Role.DATA_ENTRY]}>
              <PayrollEnhanced />
            </PrivateRoute>
          } />
          
          <Route path="rbac" element={
            <PrivateRoute roles={[Role.ADMIN]}>
              <SimpleRBACPage />
            </PrivateRoute>
          } />
          
          <Route path="expenses" element={
            <PrivateRoute roles={[Role.ADMIN, Role.DATA_ENTRY]}>
              <ExpensesPage />
            </PrivateRoute>
          } />

          <Route path="invoices" element={
            <PrivateRoute roles={[Role.ADMIN, Role.DATA_ENTRY]}>
              <Invoices />
            </PrivateRoute>
          } />
          
          <Route path="accounting" element={
            <PrivateRoute roles={[Role.ADMIN, Role.DATA_ENTRY, Role.REPORT_VIEWER]}>
              <Accounting />
            </PrivateRoute>
          } />
          
          <Route path="reports" element={
            <PrivateRoute roles={[Role.ADMIN, Role.DATA_ENTRY, Role.REPORT_VIEWER]}>
              <Reports />
            </PrivateRoute>
          } />
          <Route path="approvals" element={
            <PrivateRoute roles={[Role.ADMIN]}>
              <Approvals />
            </PrivateRoute>
          } />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
