import { useState, useEffect } from 'react';
import { DEMO_STATS, DEMO_DEFECTS, DEMO_INSTANCES } from '@/demo/demoData';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { BookOpen, FlaskConical, TestTube, Bug, CheckCircle, XCircle, Circle, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);

  const isDemo = localStorage.getItem('qtest_demo') === 'true';
  useEffect(() => {
    if (isDemo) {
      setStats({ requirements: DEMO_STATS.total_requirements, test_cases: DEMO_STATS.total_test_cases,
        defects: DEMO_STATS.total_defects, test_suites: DEMO_STATS.total_suites,
        passed: DEMO_STATS.passed, failed: DEMO_STATS.failed, not_run: DEMO_STATS.not_run });
      return;
    }
    api.dashboard.stats().then(setStats).catch(() => {});
  }, [isDemo]);

  const cards = stats ? [
    { label: 'Requirements', value: stats.requirements, icon: BookOpen, to: '/requirements', color: '#3b82f6' },
    { label: 'Test Cases', value: stats.test_cases, icon: FlaskConical, to: '/test-plan', color: '#8b5cf6' },
    { label: 'Test Suites', value: stats.test_suites, icon: TestTube, to: '/test-lab', color: '#10b981' },
    { label: 'Total Defects', value: stats.defects, icon: Bug, to: '/defects', color: '#f59e0b' },
    { label: 'Open Defects', value: stats.open_defects, icon: AlertTriangle, to: '/defects', color: '#ef4444' },
  ] : [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, color: 'var(--text)' }}>Operations Dashboard</h1>
        <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>
          Welcome back, {user?.full_name || user?.username}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {cards.map(({ label, value, icon: Icon, to, color }) => (
          <Link key={label} to={to} className="card p-4 hover:border-[var(--border2)] transition-colors"
            style={{ borderTop: `2px solid ${color}20` }}>
            <div className="flex items-center justify-between mb-2">
              <Icon size={14} style={{ color }} />
            </div>
            <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 28, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>{label}</div>
          </Link>
        ))}
      </div>

      {/* Execution summary */}
      {stats && (
        <div className="card p-5">
          <h3 style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>Test Execution Summary</h3>
          <div className="flex gap-6">
            {[
              { label: 'Passed', value: stats.passed, icon: CheckCircle, color: '#22c55e' },
              { label: 'Failed', value: stats.failed, icon: XCircle, color: '#ef4444' },
              { label: 'Not Run', value: stats.not_run, icon: Circle, color: '#64748b' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon size={16} style={{ color }} />
                <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 20, color: 'var(--text)' }}>{value}</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { to: '/requirements', label: 'New Requirement', icon: BookOpen },
          { to: '/test-plan', label: 'New Test Case', icon: FlaskConical },
          { to: '/test-lab', label: 'New Test Suite', icon: TestTube },
          { to: '/defects', label: 'Log Defect', icon: Bug },
        ].map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="card p-3 flex items-center gap-2 hover:border-[var(--red)] transition-colors group">
            <Icon size={13} style={{ color: 'var(--red2)' }} />
            <span style={{ fontSize: 12, fontFamily: 'Syne', fontWeight: 600, color: 'var(--text2)' }}>{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
