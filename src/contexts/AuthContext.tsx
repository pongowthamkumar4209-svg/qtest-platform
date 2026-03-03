import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/services/api';

interface User { username: string; role: string; full_name: string; user_id: string; }
interface AuthCtx { user: User | null; login: (u: User, token: string) => void; logout: () => void; loading: boolean; }

const Ctx = createContext<AuthCtx>({} as AuthCtx);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('qtest_token');
    if (!token) { setLoading(false); return; }
    api.auth.me().then(u => { setUser(u); setLoading(false); })
      .catch(() => { localStorage.removeItem('qtest_token'); setLoading(false); });
  }, []);

  const login = (u: User, token: string) => {
    localStorage.setItem('qtest_token', token);
    setUser(u);
  };

  const logout = async () => {
    await api.auth.logout().catch(() => {});
    localStorage.removeItem('qtest_token');
    setUser(null);
  };

  return <Ctx.Provider value={{ user, login, logout, loading }}>{children}</Ctx.Provider>;
}
