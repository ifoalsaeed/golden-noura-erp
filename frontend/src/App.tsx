import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Workers from './pages/Workers';
import Clients from './pages/Clients';
import Contracts from './pages/Contracts';
import Accounting from './pages/Accounting';
import Reports from './pages/Reports';
import Layout from './components/layout/Layout';
import './i18n';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="workers" element={<Workers />} />
          <Route path="clients" element={<Clients />} />
          <Route path="contracts" element={<Contracts />} />
          <Route path="payroll" element={<div className="p-6">Payroll Logic Built In Backend... UI in progress</div>} />
          <Route path="expenses" element={<div className="p-6">Expenses Module... UI in progress</div>} />
          <Route path="accounting" element={<Accounting />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
