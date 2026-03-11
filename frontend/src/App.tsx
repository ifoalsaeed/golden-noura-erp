import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Workers from './pages/Workers';
import Clients from './pages/Clients';
import Contracts from './pages/Contracts';
import Layout from './components/layout/Layout';
import './i18n';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="workers" element={<Workers />} />
          <Route path="clients" element={<Clients />} />
          <Route path="contracts" element={<Contracts />} />
          <Route path="payroll" element={<div className="p-6">Payroll Logic Built In Backend... UI in progress</div>} />
          <Route path="expenses" element={<div className="p-6">Expenses Module... UI in progress</div>} />
          <Route path="reports" element={<div className="p-6">Reports... UI in progress</div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
