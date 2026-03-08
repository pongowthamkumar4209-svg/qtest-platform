import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/services/api';
import { DEMO_USER } from '@/demo/demoData';

interface User { username: string; role: string; full_name: string; user_id: string; }
interface AuthCtx {
  user: User | null;
  login: (u: User, token: string) => void;
  loginDemo: () => void;
  logout: () => void;
  loading: boolean;
  isViewer: boolean;
  isTester: boolean;
  isLead: boolean;
  isAdmin: boolean;
  canWrite: boolean;
  canExecute: boolean;
}

const ROLE_LEVEL: Record<string, number> = { viewer: 1, tester: 2, lead: 3, admin: 4 };
const Ctx = createContext<AuthCtx>({} as AuthCtx);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check demo mode first
    if (localStorage.getItem('qtest_demo') === 'true') {
      setUser(DEMO_USER);
      setLoading(false);
      return;
    }
    const token = localStorage.getItem('qtest_token');
    if (!token) { setLoading(false); return; }
    api.auth.me().then(u => { setUser(u); setLoading(false); })
      .catch(() => { localStorage.removeItem('qtest_token'); setLoading(false); });
  }, []);

  const login = (u: User, token: string) => {
    localStorage.setItem('qtest_token', token);
    setUser(u);
  };

  const loginDemo = () => {
    localStorage.setItem('qtest_demo', 'true');
    setUser(DEMO_USER);
  };

  const logout = async () => {
    if (localStorage.getItem('qtest_demo') === 'true') {
      localStorage.removeItem('qtest_demo');
      setUser(null);
      return;
    }
    await api.auth.logout().catch(() => {});
    localStorage.removeItem('qtest_token');
    setUser(null);
  };

  const level = ROLE_LEVEL[user?.role || 'viewer'] || 1;

  return <Ctx.Provider value={{
    user, login, loginDemo, logout, loading,
    isViewer:   level >= 1,
    isTester:   level >= 2,
    isLead:     level >= 3,
    isAdmin:    level >= 4,
    canWrite:   level >= 3,
    canExecute: level >= 2,
  }}>{children}</Ctx.Provider>;
}
