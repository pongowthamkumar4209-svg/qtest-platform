import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, BookOpen, FlaskConical, TestTube, Bug,
  Settings, LogOut, Shield, ChevronRight
} from 'lucide-react';

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

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
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
                `flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs font-semibold transition-all group ${
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
          {user?.role === 'admin' && (
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
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: user?.role === 'admin' ? '#fbbf24' : 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{user?.role}</div>
            </div>
            <button onClick={handleLogout} title="Logout"
              className="p-1.5 rounded transition-colors hover:bg-red-500/10"
              style={{ color: 'var(--text3)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}>
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
