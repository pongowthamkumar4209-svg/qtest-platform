import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import BackendStatus from '@/components/BackendStatus';
import { Zap, LayoutDashboard, BookOpen, FlaskConical, TestTube, Bug, Settings, LogOut, Shield, Menu, X } from 'lucide-react';

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
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const roleColor = isDemo ? '#f59e0b' : user?.role === 'admin' ? '#fbbf24' : user?.role === 'lead' ? '#8b5cf6' : user?.role === 'tester' ? '#3b82f6' : '#64748b';
  const roleBg   = isDemo ? 'rgba(245,158,11,0.1)' : user?.role === 'admin' ? 'rgba(251,191,36,0.1)' : user?.role === 'lead' ? 'rgba(139,92,246,0.1)' : user?.role === 'tester' ? 'rgba(59,130,246,0.1)' : 'rgba(100,116,139,0.1)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* Demo banner */}
      {isDemo && (
        <div style={{ background: 'linear-gradient(90deg,rgba(192,0,0,0.92),rgba(139,92,246,0.92))', padding: '5px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, zIndex: 50 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={11} style={{ color: 'white' }} />
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'white', fontWeight: 700 }}>PREVIEW MODE</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'rgba(255,255,255,0.7)' }} className="hidden sm:inline">— Read-only demo data. Backend not required.</span>
          </div>
          <button onClick={handleLogout} style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'white', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 3, padding: '2px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Exit Preview
          </button>
        </div>
      )}

      {/* ── MOBILE TOPBAR ── */}
      <div className="flex sm:hidden items-center justify-between px-4 py-3 flex-shrink-0" style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 4, background: 'rgba(192,0,0,0.15)', border: '1px solid rgba(192,0,0,0.3)' }}>
            <Shield size={14} style={{ color: '#e03030' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 14, color: 'var(--text)', lineHeight: 1 }}>QTest</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: 'var(--text3)', letterSpacing: '0.1em' }}>PLATFORM</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: roleColor, background: roleBg, border: `1px solid ${roleColor}40`, borderRadius: 3, padding: '2px 6px' }}>
            {isDemo ? 'preview' : user?.role}
          </span>
          <button onClick={() => setMenuOpen(o => !o)} style={{ color: 'var(--text2)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* ── MOBILE SLIDE-DOWN MENU ── */}
      {menuOpen && (
        <div className="flex sm:hidden flex-col flex-shrink-0" style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', zIndex: 40 }}>
          {nav.map(({ to, icon: Icon, label, exact }) => (
            <NavLink key={to} to={to} end={exact}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-5 py-3 text-sm font-semibold ${isActive ? 'text-white' : 'text-[var(--text3)]'}`}
              style={({ isActive }) => isActive ? { background: 'rgba(192,0,0,0.1)', borderLeft: '3px solid #c00000' } : { borderLeft: '3px solid transparent' }}>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
          {user?.role === 'admin' && !isDemo && (
            <NavLink to="/admin" onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-5 py-3 text-sm font-semibold ${isActive ? 'text-yellow-400' : 'text-[var(--text3)]'}`}
              style={{ borderLeft: '3px solid transparent' }}>
              <Settings size={16} />
              Site Admin
            </NavLink>
          )}
          <button onClick={handleLogout} className="flex items-center gap-3 px-5 py-3 text-sm font-semibold text-left" style={{ color: '#f87171', borderLeft: '3px solid transparent', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}>
            <LogOut size={16} />
            {isDemo ? 'Exit Preview' : 'Logout'}
          </button>
        </div>
      )}

      {/* ── DESKTOP + MOBILE MAIN AREA ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Desktop sidebar */}
        <aside className="hidden sm:flex flex-col w-52 flex-shrink-0" style={{ background: 'var(--bg2)', borderRight: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 4, background: 'rgba(192,0,0,0.15)', border: '1px solid rgba(192,0,0,0.3)' }}>
              <Shield size={14} style={{ color: '#e03030' }} />
            </div>
            <div>
              <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 14, color: 'var(--text)', lineHeight: 1 }}>QTest</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text3)', letterSpacing: '0.1em' }}>PLATFORM</div>
            </div>
          </div>
          <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {nav.map(({ to, icon: Icon, label, exact }) => (
              <NavLink key={to} to={to} end={exact}
                className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs font-semibold transition-all ${isActive ? 'text-white' : 'text-[var(--text3)] hover:text-[var(--text)]'}`}
                style={({ isActive }) => isActive ? { background: 'rgba(192,0,0,0.12)', borderLeft: '2px solid #c00000' } : { borderLeft: '2px solid transparent' }}>
                <Icon size={14} />
                {label}
              </NavLink>
            ))}
          </nav>
          <div style={{ borderTop: '1px solid var(--border)' }}>
            {user?.role === 'admin' && !isDemo && (
              <NavLink to="/admin"
                className={({ isActive }) => `flex items-center gap-2.5 px-5 py-3 text-xs font-semibold transition-all ${isActive ? 'text-yellow-400' : 'text-[var(--text3)] hover:text-yellow-400'}`}>
                <Settings size={13} />
                Site Admin
              </NavLink>
            )}
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{user?.full_name || user?.username}</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: roleColor, background: roleBg, border: `1px solid ${roleColor}40`, borderRadius: 3, padding: '1px 7px', marginTop: 3, display: 'inline-block' }}>
                  {isDemo ? 'preview' : user?.role}
                </div>
              </div>
              <button onClick={handleLogout} title={isDemo ? 'Exit Preview' : 'Logout'}
                style={{ padding: 6, borderRadius: 4, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}>
                <LogOut size={13} />
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <BackendStatus />
          <Outlet />
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="flex sm:hidden flex-shrink-0" style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border)', zIndex: 30 }}>
        {nav.map(({ to, icon: Icon, label, exact }) => (
          <NavLink key={to} to={to} end={exact}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5"
            style={({ isActive }) => ({ color: isActive ? '#e03030' : 'var(--text3)', background: 'none', border: 'none', fontSize: 9, fontFamily: 'JetBrains Mono', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' })}>
            <Icon size={18} />
            <span style={{ fontSize: 8 }}>{label.replace('Test ', '')}</span>
          </NavLink>
        ))}
      </nav>

    </div>
  );
}
