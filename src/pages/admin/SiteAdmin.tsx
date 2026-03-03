import { useState, useEffect, useRef } from 'react';
import { api } from '@/services/api';
import {
  Shield, User, Trash2, Loader2, Edit2, Save, X,
  Database, Terminal, BarChart3, Table, Play, ChevronLeft,
  ChevronRight, RefreshCw, Activity, Clock, CheckCircle,
  XCircle, Users, Bug, FlaskConical, BookOpen, Zap, HardDrive,
  AlertTriangle, Copy, Check
} from 'lucide-react';

const ROLES = ['viewer', 'tester', 'lead', 'admin'];
function roleColor(r: string) {
  const m: Record<string, string> = { admin: '#fbbf24', lead: '#8b5cf6', tester: '#3b82f6', viewer: '#64748b' };
  return m[r] || '#64748b';
}
type Tab = 'overview' | 'users' | 'database' | 'sql';

function TabBtn({ id, active, icon: Icon, label, onClick }: any) {
  return (
    <button onClick={() => onClick(id)} className="flex items-center gap-2 px-4 transition-all"
      style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 12, letterSpacing: '0.05em', paddingBottom: 10, paddingTop: 8,
        borderBottom: active ? '2px solid #c00000' : '2px solid transparent',
        color: active ? 'var(--text)' : 'var(--text3)', background: 'none', border: 'none',
        borderBottom: active ? '2px solid #c00000' : '2px solid transparent', cursor: 'pointer' }}>
      <Icon size={13} style={{ color: active ? '#e03030' : 'var(--text3)' }} />{label}
    </button>
  );
}

function OverviewTab() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.adminDb.systemStats().then(s => { setStats(s); setLoading(false); }).catch(() => setLoading(false)); }, []);
  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--text3)', fontFamily: 'JetBrains Mono', fontSize: 12 }}>Loading...</div>;
  if (!stats) return null;
  const cards = [
    { label: 'Total Users', value: stats.total_users, sub: `${stats.active_users} active`, icon: Users, color: '#3b82f6' },
    { label: 'Requirements', value: stats.total_requirements, icon: BookOpen, color: '#8b5cf6' },
    { label: 'Test Cases', value: stats.total_test_cases, icon: FlaskConical, color: '#10b981' },
    { label: 'Defects', value: stats.total_defects, icon: Bug, color: '#f59e0b' },
    { label: 'Executions', value: stats.total_executions, sub: `${stats.pass_rate}% pass rate`, icon: Activity, color: '#22c55e' },
    { label: 'Active Sessions', value: stats.active_sessions, icon: Zap, color: '#e03030' },
  ];
  return (
    <div className="space-y-5">
      <div className="card p-3 flex items-center gap-6" style={{ borderLeft: '3px solid #fbbf24' }}>
        {[['DB Size', `${stats.db_size_kb} KB`, HardDrive],['Python', stats.python_version, Terminal],['Pass Rate', `${stats.pass_rate}%`, Activity]].map(([label, val, Icon]: any, i) => (
          <div key={i} className="flex items-center gap-2" style={{ borderRight: i < 2 ? '1px solid var(--border)' : 'none', paddingRight: i < 2 ? 24 : 0 }}>
            <Icon size={13} style={{ color: '#fbbf24' }} />
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text2)' }}>{label}: <strong style={{ color: 'var(--text)' }}>{val}</strong></span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {cards.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="card p-4" style={{ borderTop: `2px solid ${color}25` }}>
            <div className="flex items-start justify-between">
              <div>
                <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 30, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>{label}</div>
                {sub && <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color, marginTop: 2 }}>{sub}</div>}
              </div>
              <div style={{ background: `${color}15`, borderRadius: 6, padding: 8 }}><Icon size={15} style={{ color }} /></div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="card overflow-hidden">
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Recent Executions</span>
          </div>
          {stats.recent_executions?.length === 0 && <p style={{ padding: 16, fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text3)', textAlign: 'center' }}>No executions yet</p>}
          {stats.recent_executions?.map((e: any, i: number) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
              {e.status === 'Passed' ? <CheckCircle size={13} style={{ color: '#22c55e', flexShrink: 0 }} /> : <XCircle size={13} style={{ color: '#ef4444', flexShrink: 0 }} />}
              <div className="flex-1 min-w-0">
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.tc_name}</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text3)' }}>{e.executed_by} · {e.executed_at?.slice(0, 16)}</div>
              </div>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: e.status === 'Passed' ? '#22c55e' : '#ef4444', textTransform: 'uppercase' }}>{e.status}</span>
            </div>
          ))}
        </div>
        <div className="card overflow-hidden">
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Recent Defects</span>
          </div>
          {stats.recent_defects?.length === 0 && <p style={{ padding: 16, fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text3)', textAlign: 'center' }}>No defects yet</p>}
          {stats.recent_defects?.map((d: any, i: number) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <AlertTriangle size={13} style={{ color: '#f59e0b', flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text3)' }}>{d.defect_id} · {d.reported_by} · {d.created_at?.slice(0, 10)}</div>
              </div>
              <span className={`badge ${d.status === 'Closed' ? 'badge-closed' : 'badge-open'}`}>{d.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('');
  const [loading, setLoading] = useState(false);
  const load = () => api.admin.listUsers().then(setUsers).catch(() => {});
  useEffect(() => { load(); }, []);
  const saveRole = async (id: string) => {
    setLoading(true);
    try { await api.admin.updateUser(id, { role: editRole }); load(); setEditId(null); }
    catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {[{role:'viewer',desc:'Read-only access',color:'#64748b'},{role:'tester',desc:'Execute tests & log defects',color:'#3b82f6'},{role:'lead',desc:'Create/edit all entities',color:'#8b5cf6'},{role:'admin',desc:'Full access + admin panel',color:'#fbbf24'}].map(({ role, desc, color }) => (
          <div key={role} className="card p-3" style={{ borderTop: `2px solid ${color}30` }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase' }}>{role}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{desc}</div>
          </div>
        ))}
      </div>
      <div className="card overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>All Users ({users.length})</span>
          <button onClick={load} style={{ color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><RefreshCw size={12} /></button>
        </div>
        <table className="data-table">
          <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Created</th><th>Last Login</th><th>Actions</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${roleColor(u.role)}18`, border: `1px solid ${roleColor(u.role)}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 11, color: roleColor(u.role) }}>{(u.full_name || u.username)[0].toUpperCase()}</span>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{u.full_name || u.username}</div>
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text3)' }}>@{u.username}</div>
                    </div>
                  </div>
                </td>
                <td style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text3)' }}>{u.email}</td>
                <td>
                  {editId === u.id ? (
                    <div className="flex items-center gap-1">
                      <select className="field-input" style={{ width: 100, padding: '4px 8px', fontSize: 11 }} value={editRole} onChange={e => setEditRole(e.target.value)}>
                        {ROLES.map(r => <option key={r}>{r}</option>)}
                      </select>
                      <button onClick={() => saveRole(u.id)} disabled={loading} style={{ color: '#4ade80', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                        {loading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      </button>
                      <button onClick={() => setEditId(null)} style={{ color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={12} /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 700, color: roleColor(u.role), textTransform: 'uppercase' }}>{u.role}</span>
                      {u.username !== 'admin' && <button onClick={() => { setEditId(u.id); setEditRole(u.role); }} style={{ color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}><Edit2 size={11} /></button>}
                    </div>
                  )}
                </td>
                <td>
                  <button onClick={() => u.username !== 'admin' && api.admin.updateUser(u.id, { is_active: u.is_active ? 0 : 1 }).then(load)}
                    className={`badge ${u.is_active ? 'badge-passed' : 'badge-failed'}`}
                    style={{ cursor: u.username === 'admin' ? 'default' : 'pointer', border: 'none' }}>
                    {u.is_active ? 'Active' : 'Disabled'}
                  </button>
                </td>
                <td style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text3)' }}>{u.created_at?.slice(0, 10) || '—'}</td>
                <td style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text3)' }}>{u.last_login?.slice(0, 16) || 'Never'}</td>
                <td>
                  {u.username !== 'admin' && (
                    <button onClick={async () => { if (confirm(`Delete "${u.username}"?`)) { await api.admin.deleteUser(u.id); load(); } }}
                      className="btn-danger" style={{ padding: '3px 10px', fontSize: 11 }}>
                      <Trash2 size={11} /> Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DatabaseTab() {
  const [tables, setTables] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [tableData, setTableData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  useEffect(() => { api.adminDb.tables().then(setTables).catch(() => {}); }, []);
  const selectTable = async (name: string, p = 1) => {
    setSelected(name); setLoading(true); setPage(p);
    try { const d = await api.adminDb.tableData(name, p); setTableData(d); }
    catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };
  const totalPages = tableData ? Math.ceil(tableData.total / tableData.limit) : 1;
  const ICONS: Record<string, any> = { users: Users, requirements: BookOpen, test_cases: FlaskConical, defects: Bug, test_suites: Database, test_instances: Activity };
  return (
    <div className="grid grid-cols-4 gap-4" style={{ minHeight: 500 }}>
      <div className="card overflow-hidden" style={{ height: 'fit-content' }}>
        <div className="px-3 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Tables ({tables.length})</span>
        </div>
        {tables.map(t => {
          const Icon = ICONS[t.name] || Table;
          const isActive = selected === t.name;
          return (
            <button key={t.name} onClick={() => selectTable(t.name)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: isActive ? 'rgba(192,0,0,0.08)' : 'transparent', borderLeft: isActive ? '2px solid #c00000' : '2px solid transparent', borderRight: 'none', borderTop: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
              <div className="flex items-center gap-2">
                <Icon size={11} style={{ color: isActive ? '#e03030' : 'var(--text3)' }} />
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: isActive ? 'var(--text)' : 'var(--text2)', fontWeight: isActive ? 700 : 400 }}>{t.name}</span>
              </div>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text3)', background: 'var(--bg3)', padding: '1px 6px', borderRadius: 2 }}>{t.row_count}</span>
            </button>
          );
        })}
      </div>
      <div className="col-span-3 card overflow-hidden">
        {!selected && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 280, color: 'var(--text3)' }}>
            <Database size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>Select a table to browse data</p>
          </div>
        )}
        {selected && (
          <>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2">
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text)', fontWeight: 700 }}>{selected}</span>
                {tableData && <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text3)' }}>{tableData.total} rows · {tableData.columns?.length} cols</span>}
              </div>
              <div className="flex items-center gap-2">
                {totalPages > 1 && <>
                  <button onClick={() => selectTable(selected, page - 1)} disabled={page === 1} style={{ color: page === 1 ? 'var(--text3)' : 'var(--text)', background: 'none', border: 'none', cursor: page === 1 ? 'default' : 'pointer', padding: 4 }}><ChevronLeft size={13} /></button>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text3)' }}>p{page}/{totalPages}</span>
                  <button onClick={() => selectTable(selected, page + 1)} disabled={page === totalPages} style={{ color: page === totalPages ? 'var(--text3)' : 'var(--text)', background: 'none', border: 'none', cursor: page === totalPages ? 'default' : 'pointer', padding: 4 }}><ChevronRight size={13} /></button>
                </>}
                <button onClick={() => selectTable(selected, page)} style={{ color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><RefreshCw size={11} /></button>
              </div>
            </div>
            {loading ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160 }}><Loader2 size={20} className="animate-spin" style={{ color: 'var(--red)' }} /></div>
              : tableData && (
                <div style={{ overflowX: 'auto', maxHeight: 460, overflowY: 'auto' }}>
                  <table className="data-table" style={{ minWidth: '100%' }}>
                    <thead><tr>{tableData.columns?.map((c: string) => <th key={c}>{c}</th>)}</tr></thead>
                    <tbody>
                      {tableData.rows?.length === 0 && <tr><td colSpan={tableData.columns?.length} style={{ textAlign: 'center', color: 'var(--text3)', padding: 24, fontFamily: 'JetBrains Mono', fontSize: 11 }}>Empty table</td></tr>}
                      {tableData.rows?.map((row: any, i: number) => (
                        <tr key={i}>{tableData.columns?.map((c: string) => (
                          <td key={c} style={{ fontFamily: 'JetBrains Mono', fontSize: 11, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={String(row[c] ?? '')}>
                            {row[c] === null ? <span style={{ color: 'var(--text3)', fontStyle: 'italic' }}>null</span> : String(row[c]).length > 40 ? String(row[c]).slice(0, 40) + '…' : String(row[c])}
                          </td>
                        ))}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </>
        )}
      </div>
    </div>
  );
}

const SQL_TEMPLATES = [
  { label: 'All Users', sql: 'SELECT id, username, email, role, is_active, created_at FROM users;' },
  { label: 'Requirements', sql: 'SELECT req_id, name, type, priority, status, author FROM requirements ORDER BY created_at DESC;' },
  { label: 'Test Cases', sql: 'SELECT tc_id, name, type, priority, status, author FROM test_cases ORDER BY created_at DESC;' },
  { label: 'Defects', sql: 'SELECT defect_id, name, status, priority, severity, reported_by FROM defects ORDER BY created_at DESC;' },
  { label: 'Execution Summary', sql: "SELECT status, COUNT(*) as count FROM test_instances GROUP BY status;" },
  { label: 'Coverage Report', sql: 'SELECT r.req_id, r.name as req_name, COUNT(rtc.test_case_id) as tc_count FROM requirements r LEFT JOIN req_test_coverage rtc ON r.id=rtc.requirement_id GROUP BY r.id;' },
  { label: 'Pass Rate by Suite', sql: "SELECT ts.name as suite, COUNT(*) as total, SUM(CASE WHEN ti.status='Passed' THEN 1 ELSE 0 END) as passed FROM test_suites ts LEFT JOIN test_instances ti ON ts.id=ti.suite_id GROUP BY ts.id;" },
  { label: 'Open Defects', sql: "SELECT defect_id, name, priority, severity, assigned_to FROM defects WHERE status IN ('New','Open','Reopen') ORDER BY priority;" },
];

function SqlConsole() {
  const [sql, setSql] = useState('SELECT * FROM users LIMIT 10;');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const run = async () => {
    if (!sql.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try { const r = await api.adminDb.query(sql); setResult(r); }
    catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };
  const copyResult = () => {
    if (!result?.rows) return;
    const tsv = [result.columns.join('\t'), ...result.rows.map((r: any) => result.columns.map((c: string) => r[c]).join('\t'))].join('\n');
    navigator.clipboard.writeText(tsv);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="space-y-4">
      <div>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Quick Queries</div>
        <div className="flex flex-wrap gap-1.5">
          {SQL_TEMPLATES.map(t => (
            <button key={t.label} onClick={() => { setSql(t.sql); setResult(null); setError(''); }}
              style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: 'var(--text2)', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 3, padding: '3px 10px', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(192,0,0,0.4)'; (e.currentTarget as HTMLElement).style.color = '#e03030'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text2)'; }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
          <div className="flex items-center gap-2">
            <Terminal size={12} style={{ color: '#e03030' }} />
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>SQL Editor</span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text3)' }}>Ctrl+Enter to run</span>
            <button onClick={run} disabled={loading} style={{ background: 'var(--red)', color: 'white', border: 'none', borderRadius: 2, padding: '4px 12px', cursor: loading ? 'default' : 'pointer', fontFamily: 'Syne', fontWeight: 700, fontSize: 11, opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
              {loading ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />}{loading ? 'Running...' : 'Run'}
            </button>
          </div>
        </div>
        <textarea value={sql} onChange={e => setSql(e.target.value)}
          onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); } }}
          rows={5}
          style={{ width: '100%', background: '#080c10', border: 'none', color: '#a8d8a0', fontFamily: 'JetBrains Mono', fontSize: 13, padding: '12px 16px', outline: 'none', resize: 'vertical', lineHeight: 1.6, display: 'block' }}
          placeholder="SELECT * FROM users;" />
        <div className="px-4 py-1.5" style={{ background: 'var(--bg3)', borderTop: '1px solid var(--border)' }}>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text3)' }}>⚠ DROP, TRUNCATE, ALTER, ATTACH blocked · SELECT, INSERT, UPDATE, DELETE allowed · Max 500 rows</span>
        </div>
      </div>
      {error && (
        <div className="card p-3" style={{ borderLeft: '3px solid #ef4444' }}>
          <div className="flex items-center gap-2 mb-1"><XCircle size={12} style={{ color: '#ef4444' }} /><span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#ef4444', textTransform: 'uppercase' }}>Error</span></div>
          <p style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: '#fca5a5', lineHeight: 1.5 }}>{error}</p>
        </div>
      )}
      {result && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3">
              <CheckCircle size={13} style={{ color: '#22c55e' }} />
              {result.type === 'select'
                ? <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text)' }}><strong style={{ color: '#22c55e' }}>{result.row_count}</strong> rows{result.row_count === 500 && <span style={{ color: '#f59e0b' }}> (capped at 500)</span>}</span>
                : <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text)' }}><strong style={{ color: '#22c55e' }}>{result.affected}</strong> rows affected</span>}
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={10} />{result.elapsed_ms}ms</span>
            </div>
            {result.type === 'select' && result.row_count > 0 && (
              <button onClick={copyResult} style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: copied ? '#4ade80' : 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                {copied ? <Check size={11} /> : <Copy size={11} />}{copied ? 'Copied!' : 'Copy TSV'}
              </button>
            )}
          </div>
          {result.type === 'select' && result.rows?.length > 0 && (
            <div style={{ overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }}>
              <table className="data-table">
                <thead><tr>{result.columns?.map((c: string) => <th key={c}>{c}</th>)}</tr></thead>
                <tbody>
                  {result.rows?.map((row: any, i: number) => (
                    <tr key={i}>{result.columns?.map((c: string) => (
                      <td key={c} style={{ fontFamily: 'JetBrains Mono', fontSize: 11, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={String(row[c] ?? '')}>
                        {row[c] === null ? <span style={{ color: 'var(--text3)', fontStyle: 'italic' }}>null</span> : String(row[c]).length > 50 ? String(row[c]).slice(0, 50) + '…' : String(row[c])}
                      </td>
                    ))}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {result.type === 'select' && result.rows?.length === 0 && <p style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text3)', textAlign: 'center', padding: 24 }}>Query returned 0 rows</p>}
        </div>
      )}
    </div>
  );
}

export default function SiteAdmin() {
  const [tab, setTab] = useState<Tab>('overview');
  const tabs = [
    { id: 'overview', icon: BarChart3, label: 'Overview' },
    { id: 'users', icon: Users, label: 'User Management' },
    { id: 'database', icon: Database, label: 'DB Browser' },
    { id: 'sql', icon: Terminal, label: 'SQL Console' },
  ];
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div style={{ width: 40, height: 40, borderRadius: 6, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(251,191,36,0.1)' }}>
          <Shield size={18} style={{ color: '#fbbf24' }} />
        </div>
        <div>
          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, color: 'var(--text)' }}>Site Administration</h1>
          <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>System control panel · Admin access only</p>
        </div>
      </div>
      <div style={{ borderBottom: '1px solid var(--border)', display: 'flex', gap: 4 }}>
        {tabs.map(t => <TabBtn key={t.id} id={t.id} active={tab === t.id} icon={t.icon} label={t.label} onClick={setTab} />)}
      </div>
      {tab === 'overview' && <OverviewTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'database' && <DatabaseTab />}
      {tab === 'sql' && <SqlConsole />}
    </div>
  );
}
