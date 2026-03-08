import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import Login from '@/pages/auth/Login';
import Signup from '@/pages/auth/Signup';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import Dashboard from '@/pages/Dashboard';
import Requirements from '@/pages/requirements/Requirements';
import RequirementDetail from '@/pages/requirements/RequirementDetail';
import TestPlan from '@/pages/testplan/TestPlan';
import TestCaseDetail from '@/pages/testplan/TestCaseDetail';
import TestLab from '@/pages/testlab/TestLab';
import TestExecution from '@/pages/testlab/TestExecution';
import Defects from '@/pages/defects/Defects';
import DefectDetail from '@/pages/defects/DefectDetail';
import SiteAdmin from '@/pages/admin/SiteAdmin';

function Guard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div style={{ color: 'var(--text3)', fontFamily: 'JetBrains Mono', fontSize: 13 }}>Loading...</div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/" element={<Guard><AppLayout /></Guard>}>
          <Route index element={<Dashboard />} />
          <Route path="requirements" element={<Requirements />} />
          <Route path="requirements/:id" element={<RequirementDetail />} />
          <Route path="test-plan" element={<TestPlan />} />
          <Route path="test-plan/:id" element={<TestCaseDetail />} />
          <Route path="test-lab" element={<TestLab />} />
          <Route path="test-lab/:suiteId/execute/:instanceId" element={<TestExecution />} />
          <Route path="defects" element={<Defects />} />
          <Route path="defects/:id" element={<DefectDetail />} />
          <Route path="admin" element={<AdminGuard><SiteAdmin /></AdminGuard>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
