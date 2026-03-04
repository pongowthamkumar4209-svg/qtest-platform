const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// ─── Retry-aware fetch ────────────────────────────────────────────────────────
// Render free/starter tier cold-starts can take 10-30s on first request.
// We retry up to 3 times with exponential backoff and a longer timeout.

async function req<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = 3,
  timeoutMs = 30000
): Promise<T> {
  const token = localStorage.getItem('qtest_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(`${BASE}${endpoint}`, { ...options, headers, signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return res.json();
    } catch (e: any) {
      clearTimeout(timer);
      const isTimeout = e.name === 'AbortError';
      const isNetwork = e.message === 'Failed to fetch';
      // Only retry on timeout or network errors, not on auth/validation errors
      if ((isTimeout || isNetwork) && attempt < retries) {
        const delay = attempt * 2000; // 2s, 4s between retries
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      if (isTimeout) throw new Error('Backend is waking up, please wait a moment and try again...');
      throw e;
    }
  }
  throw new Error('Unable to reach backend after multiple attempts');
}

export const api = {
  health: () => req('/health', {}, 5, 35000), // extra retries for health check
  auth: {
    login:         (d: any) => req<any>('/auth/login',          { method: 'POST', body: JSON.stringify(d) }),
    signup:        (d: any) => req<any>('/auth/signup',         { method: 'POST', body: JSON.stringify(d) }),
    logout:        ()       => req('/auth/logout',              { method: 'POST' }),
    forgotPassword:(email: string) => req<any>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword: (d: any) => req<any>('/auth/reset-password', { method: 'POST', body: JSON.stringify(d) }),
    me:            ()       => req<any>('/auth/me'),
  },
  admin: {
    listUsers:  ()              => req<any[]>('/admin/users'),
    updateUser: (id: string, d: any) => req<any>(`/admin/users/${id}`, { method: 'PUT',    body: JSON.stringify(d) }),
    deleteUser: (id: string)    => req<any>(`/admin/users/${id}`,      { method: 'DELETE' }),
  },
  requirements: {
    list:        ()              => req<any[]>('/requirements'),
    get:         (id: string)    => req<any>(`/requirements/${id}`),
    create:      (d: any)        => req<any>('/requirements',          { method: 'POST', body: JSON.stringify(d) }),
    update:      (id: string, d: any) => req<any>(`/requirements/${id}`, { method: 'PUT',  body: JSON.stringify(d) }),
    delete:      (id: string)    => req<any>(`/requirements/${id}`,    { method: 'DELETE' }),
    addCoverage: (id: string, tc_id: string) => req<any>(`/requirements/${id}/coverage`, { method: 'POST', body: JSON.stringify({ test_case_id: tc_id }) }),
  },
  testcases: {
    list:   ()              => req<any[]>('/testcases'),
    get:    (id: string)    => req<any>(`/testcases/${id}`),
    create: (d: any)        => req<any>('/testcases',          { method: 'POST', body: JSON.stringify(d) }),
    update: (id: string, d: any) => req<any>(`/testcases/${id}`, { method: 'PUT',  body: JSON.stringify(d) }),
    delete: (id: string)    => req<any>(`/testcases/${id}`,    { method: 'DELETE' }),
  },
  suites: {
    list:          ()              => req<any[]>('/testsuites'),
    create:        (d: any)        => req<any>('/testsuites',          { method: 'POST', body: JSON.stringify(d) }),
    listInstances: (sid: string)   => req<any[]>(`/testsuites/${sid}/instances`),
    addInstance:   (sid: string, d: any) => req<any>(`/testsuites/${sid}/instances`, { method: 'POST', body: JSON.stringify(d) }),
  },
  instances: {
    get:          (id: string)             => req<any>(`/instances/${id}`),
    updateStep:   (iid: string, sid: string, d: any) => req<any>(`/instances/${iid}/steps/${sid}`, { method: 'PUT', body: JSON.stringify(d) }),
    updateStatus: (iid: string, d: any)    => req<any>(`/instances/${iid}/status`,  { method: 'PUT', body: JSON.stringify(d) }),
    execute:      (iid: string)            => req<any>(`/instances/${iid}/execute`, { method: 'POST' }),
    pollExec:     (exec_id: string)        => req<any>(`/execute/poll/${exec_id}`),
  },
  defects: {
    list:   ()              => req<any[]>('/defects'),
    get:    (id: string)    => req<any>(`/defects/${id}`),
    create: (d: any)        => req<any>('/defects',          { method: 'POST', body: JSON.stringify(d) }),
    update: (id: string, d: any) => req<any>(`/defects/${id}`, { method: 'PUT',  body: JSON.stringify(d) }),
    delete: (id: string)    => req<any>(`/defects/${id}`,    { method: 'DELETE' }),
    link:   (d: any)        => req<any>('/defects/link',     { method: 'POST', body: JSON.stringify(d) }),
  },
  dashboard: {
    stats: () => req<any>('/dashboard/stats'),
  },
  adminDb: {
    tables:      ()              => req<any[]>('/admin/tables'),
    tableData:   (name: string, page = 1) => req<any>(`/admin/tables/${name}?page=${page}&limit=50`),
    query:       (sql: string)   => req<any>('/admin/query',       { method: 'POST', body: JSON.stringify({ sql }) }),
    systemStats: ()              => req<any>('/admin/system-stats'),
  },
};

export const STREAM_BASE = BASE.replace('/api', '');
