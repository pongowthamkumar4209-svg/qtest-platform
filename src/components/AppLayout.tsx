import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Zap, LayoutDashboard, BookOpen, FlaskConical, TestTube, Bug, Settings, LogOut, Shield } from 'lucide-react';

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/requirements', icon: BookOpen, label: 'Requirements' },
  { to: '/test-plan', icon: FlaskConical, label: 'Test Plan' },
  { to: '/test-lab', icon: TestTube, label: 'Test Lab' },
  { to: '/defects', icon: Bug, label: 'Defects' },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isDemo = localStorage.getItem('qtest_demo') === 'true';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* Demo banner */}
      {isDemo && (
        <div style={{ background: 'linear-gradient(90deg,rgba(192,0,0,0.92),rgba(139,92,246,0.92))', padding: '5px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={11} style={{ color: 'white' }} />
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'white', fontWeight: 700 }}>PREVIEW MODE</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>— Read-only demo data. Backend not required.</span>
          </div>
          <button onClick={handleLogout} style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'white', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 3, padding: '2px 10px', cursor: 'pointer' }}>
            Exit Preview
          </button>
        </div>
      )}

      {/* Main layout row */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className="flex flex-col w-52 flex-shrink-0" style={{ background: 'var(--bg2)', borderRight: '1px solid var(--border)' }}>
          {/* Logo */}
          <div className="flex items-center gap-2 px-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center justify-center w-7 h-7 rounded"
              style={{ background: 'rgba(192,0,0,0.15)', border: '1px solid rgba(192,0,0,0.3)' }}>
              <Shield size={14} style={{ color: '#e03030' }} />
            </div>
            <div>
              <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 14, color: 'var(--text)', lineHeight: 1 }}>QTest</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text3)', letterSpacing: '0.1em' }}>PLATFORM</div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 py-3 px-2 space-y-0.5">
            {nav.map(({ to, icon: Icon, label, exact }) => (
              <NavLink key={to} to={to} end={exact}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs font-semibold transition-all ${
                    isActive ? 'text-white' : 'text-[var(--text3)] hover:text-[var(--text)]'
                  }`}
                style={({ isActive }) => isActive ? {
                  background: 'rgba(192,0,0,0.12)',
                  borderLeft: '2px solid #c00000',
                  color: '#fff'
                } : { borderLeft: '2px solid transparent' }}>
                <Icon size={14} />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Bottom */}
          <div style={{ borderTop: '1px solid var(--border)' }}>
            {user?.role === 'admin' && !isDemo && (
              <NavLink to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-5 py-3 text-xs font-semibold transition-all ${
                    isActive ? 'text-yellow-400' : 'text-[var(--text3)] hover:text-yellow-400'
                  }`}>
                <Settings size={13} />
                Site Admin
              </NavLink>
            )}
            <div className="px-4 py-3 flex items-center justify-between">
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{user?.full_name || user?.username}</div>
                <div style={{
                  fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  color: isDemo ? '#f59e0b' : user?.role === 'admin' ? '#fbbf24' : user?.role === 'lead' ? '#8b5cf6' : user?.role === 'tester' ? '#3b82f6' : '#64748b',
                  background: isDemo ? 'rgba(245,158,11,0.1)' : user?.role === 'admin' ? 'rgba(251,191,36,0.1)' : user?.role === 'lead' ? 'rgba(139,92,246,0.1)' : user?.role === 'tester' ? 'rgba(59,130,246,0.1)' : 'rgba(100,116,139,0.1)',
                  border: `1px solid ${isDemo ? 'rgba(245,158,11,0.25)' : user?.role === 'admin' ? 'rgba(251,191,36,0.25)' : user?.role === 'lead' ? 'rgba(139,92,246,0.25)' : user?.role === 'tester' ? 'rgba(59,130,246,0.25)' : 'rgba(100,116,139,0.25)'}`,
                  borderRadius: 3, padding: '1px 7px', marginTop: 3
                }}>{isDemo ? 'preview' : user?.role}</div>
              </div>
              <button onClick={handleLogout} title={isDemo ? 'Exit Preview' : 'Logout'}
                className="p-1.5 rounded transition-colors"
                style={{ color: 'var(--text3)' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}>
                <LogOut size={13} />
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

      </div>
    </div>
  );
}
