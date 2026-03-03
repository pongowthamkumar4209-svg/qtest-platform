import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Shield, Loader2, Eye, EyeOff } from 'lucide-react';

function AuthShell({ children, title, sub }: { children: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(192,0,0,0.08) 0%, transparent 60%), var(--bg)' }}>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded"
            style={{ background: 'rgba(192,0,0,0.12)', border: '1px solid rgba(192,0,0,0.3)', boxShadow: '0 0 20px rgba(192,0,0,0.15)' }}>
            <Shield size={22} style={{ color: '#e03030' }} />
          </div>
          <div>
            <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 20, color: 'var(--text)' }}>QTest Platform</h1>
            <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 4 }}>{sub}</p>
          </div>
        </div>
        <div className="card p-6 space-y-4">
          <h2 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{title}</h2>
          {children}
        </div>
      </div>
    </div>
  );
}

function Field({ label, type, value, onChange, placeholder }: any) {
  const [show, setShow] = useState(false);
  const isPass = type === 'password';
  return (
    <div className="space-y-1">
      <label style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: 'var(--text3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</label>
      <div className="relative">
        <input type={isPass && show ? 'text' : type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} className="field-input" style={{ paddingRight: isPass ? 36 : 12 }} />
        {isPass && (
          <button type="button" onClick={() => setShow(!show)}
            className="absolute right-3 top-2.5" style={{ color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}>
            {show ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.auth.login({ username, password });
      login({ username: res.username, role: res.role, full_name: res.full_name, user_id: res.user_id }, res.token);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <AuthShell title="Sign In" sub="Test Management Platform">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div style={{ background: 'rgba(192,0,0,0.1)', border: '1px solid rgba(192,0,0,0.3)', color: '#f87171', padding: '8px 12px', borderRadius: 3, fontSize: 12, fontFamily: 'JetBrains Mono' }}>{error}</div>}
        <Field label="Username" type="text" value={username} onChange={setUsername} placeholder="Enter username" />
        <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
        <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
          {loading ? <Loader2 size={13} className="animate-spin" /> : null}
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        <div className="flex justify-between text-xs" style={{ color: 'var(--text3)' }}>
          <Link to="/signup" style={{ color: 'var(--text3)' }} onMouseEnter={e => ((e.target as any).style.color = '#e03030')} onMouseLeave={e => ((e.target as any).style.color = 'var(--text3)')}>Create account</Link>
          <Link to="/forgot-password" style={{ color: 'var(--text3)' }} onMouseEnter={e => ((e.target as any).style.color = '#e03030')} onMouseLeave={e => ((e.target as any).style.color = 'var(--text3)')}>Forgot password?</Link>
        </div>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <p style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: 'var(--text3)', textAlign: 'center' }}>Default admin: <span style={{ color: '#fbbf24' }}>admin</span> / <span style={{ color: '#fbbf24' }}>Admin@123</span></p>
        </div>
      </form>
    </AuthShell>
  );
}

export function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username:'', email:'', full_name:'', password:'', confirm:'' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    setError(''); setLoading(true);
    try {
      await api.auth.signup(form);
      setSuccess('Account created! You have viewer access. Please sign in.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  return (
    <AuthShell title="Create Account" sub="New User Registration">
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && <div style={{ background: 'rgba(192,0,0,0.1)', border: '1px solid rgba(192,0,0,0.3)', color: '#f87171', padding: '8px 12px', borderRadius: 3, fontSize: 12 }}>{error}</div>}
        {success && <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', padding: '8px 12px', borderRadius: 3, fontSize: 12 }}>{success}</div>}
        <Field label="Full Name" type="text" value={form.full_name} onChange={set('full_name')} placeholder="Your full name" />
        <Field label="Username" type="text" value={form.username} onChange={set('username')} placeholder="Choose username" />
        <Field label="Email" type="email" value={form.email} onChange={set('email')} placeholder="your@email.com" />
        <Field label="Password" type="password" value={form.password} onChange={set('password')} placeholder="Min 6 characters" />
        <Field label="Confirm Password" type="password" value={form.confirm} onChange={set('confirm')} placeholder="Repeat password" />
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', padding: '8px 12px', borderRadius: 3 }}>
          <p style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: '#fbbf24' }}>New accounts start with Viewer access. Contact admin to upgrade role.</p>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
          {loading ? <Loader2 size={13} className="animate-spin" /> : null}
          {loading ? 'Creating...' : 'Create Account'}
        </button>
        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text3)' }}>
          Already have an account? <Link to="/login" style={{ color: '#e03030' }}>Sign in</Link>
        </p>
      </form>
    </AuthShell>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPw, setNewPw] = useState('');
  const [step, setStep] = useState<'email'|'reset'>('email');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res = await api.auth.forgotPassword(email);
      setToken(res.token || '');
      setMsg(`Reset token: ${res.token} (in production this would be emailed)`);
      setStep('reset');
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      await api.auth.resetPassword({ token, password: newPw });
      setMsg('Password reset! Redirecting...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <AuthShell title="Reset Password" sub="Account Recovery">
      {step === 'email' ? (
        <form onSubmit={handleForgot} className="space-y-4">
          {error && <div style={{ color: '#f87171', fontSize: 12 }}>{error}</div>}
          {msg && <div style={{ color: '#4ade80', fontSize: 12 }}>{msg}</div>}
          <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="your@email.com" />
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
            {loading ? <Loader2 size={13} className="animate-spin" /> : null} Send Reset Token
          </button>
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text3)' }}>
            <Link to="/login" style={{ color: '#e03030' }}>Back to sign in</Link>
          </p>
        </form>
      ) : (
        <form onSubmit={handleReset} className="space-y-4">
          {error && <div style={{ color: '#f87171', fontSize: 12 }}>{error}</div>}
          {msg && <div style={{ color: '#4ade80', fontSize: 12, fontFamily: 'JetBrains Mono' }}>{msg}</div>}
          <Field label="Reset Token" type="text" value={token} onChange={setToken} placeholder="Enter token" />
          <Field label="New Password" type="password" value={newPw} onChange={setNewPw} placeholder="New password" />
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
            {loading ? <Loader2 size={13} className="animate-spin" /> : null} Reset Password
          </button>
        </form>
      )}
    </AuthShell>
  );
}
