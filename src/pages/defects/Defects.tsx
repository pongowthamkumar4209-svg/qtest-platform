import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Attachments from '@/components/Attachments';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { Plus, Search, ChevronRight, X, Loader2, Edit2, Save, Trash2, ArrowLeft } from 'lucide-react';

const STATUSES = ['New','Open','In Progress','Fixed','Reopen','Closed','Rejected','Deferred'];
const PRIORITIES = ['Critical','High','Medium','Low'];
const SEVERITIES = ['Critical','Major','Minor','Trivial'];
const CATEGORIES = ['Functional','UI','Performance','Security','Integration','Regression','Other'];

function statusClass(s: string) {
  const m: Record<string,string> = { New:'badge-new', Open:'badge-open', 'In Progress':'badge-inprogress', Fixed:'badge-passed', Reopen:'badge-open', Closed:'badge-closed', Rejected:'badge-closed', Deferred:'badge-draft' };
  return m[s] || 'badge-draft';
}
function priorityColor(p: string) {
  const m: Record<string,string> = { Critical:'#ef4444', High:'#f97316', Medium:'#f59e0b', Low:'#22c55e' };
  return m[p] || '#64748b';
}

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name:'', description:'', status:'New', priority:'Medium', severity:'Minor', category:'Functional', assigned_to:'' });
  const [loading, setLoading] = useState(false);
  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try { await api.defects.create(form); onCreated(); onClose(); }
    catch (err: any) { alert(err.message); }
    finally { setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:15, color:'var(--text)' }}>Log Defect</h3>
          <button onClick={onClose} className="btn-ghost p-1"><X size={14} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div className="space-y-1">
              <label style={{ fontSize:10, fontFamily:'JetBrains Mono', color:'var(--text3)', textTransform:'uppercase' }}>Summary *</label>
              <input required className="field-input" value={form.name} onChange={e => set('name')(e.target.value)} placeholder="Defect summary" />
            </div>
            <div className="space-y-1">
              <label style={{ fontSize:10, fontFamily:'JetBrains Mono', color:'var(--text3)', textTransform:'uppercase' }}>Description</label>
              <textarea className="field-input" rows={4} value={form.description} onChange={e => set('description')(e.target.value)} placeholder="Steps to reproduce, expected vs actual..." style={{ resize:'vertical' }} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[['status',STATUSES],['priority',PRIORITIES],['severity',SEVERITIES],['category',CATEGORIES]].map(([k,opts]) => (
                <div key={k as string} className="space-y-1">
                  <label style={{ fontSize:10, fontFamily:'JetBrains Mono', color:'var(--text3)', textTransform:'uppercase' }}>{k as string}</label>
                  <select className="field-input" value={(form as any)[k as string]} onChange={e => set(k as string)(e.target.value)}>
                    {(opts as string[]).map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div className="space-y-1">
                <label style={{ fontSize:10, fontFamily:'JetBrains Mono', color:'var(--text3)', textTransform:'uppercase' }}>Assigned To</label>
                <input className="field-input" value={form.assigned_to} onChange={e => set('assigned_to')(e.target.value)} placeholder="Username" />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Log Defect
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Defects() {
  const { isTester, isLead } = useAuth();
  const [defects, setDefects] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showCreate, setShowCreate] = useState(false);

  const load = () => api.defects.list().then(setDefects).catch(() => {});
  useEffect(() => { load(); }, []);

  const filtered = defects.filter(d =>
    (statusFilter === 'All' || d.status === statusFilter) &&
    (d.name.toLowerCase().includes(search.toLowerCase()) || d.defect_id?.includes(search))
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily:'Syne', fontWeight:800, fontSize:20, color:'var(--text)' }}>Defects</h1>
          <p style={{ fontFamily:'JetBrains Mono', fontSize:10, color:'var(--text3)', letterSpacing:'0.1em', textTransform:'uppercase', marginTop:2 }}>{defects.length} total</p>
        </div>
        {isTester && <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={13} /> Log Defect</button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-2.5" style={{ color:'var(--text3)' }} />
          <input className="field-input" style={{ paddingLeft:32 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search defects..." />
        </div>
      </div>

      <div className="flex gap-1 flex-wrap">
        {['All','New','Open','In Progress','Fixed','Closed'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={statusFilter === s ? 'btn-primary' : 'btn-ghost'}
            style={{ padding:'6px 12px', fontSize:11 }}>{s}</button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr><th>ID</th><th>Summary</th><th>Status</th><th>Priority</th><th>Severity</th><th>Category</th><th>Reported By</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign:'center', color:'var(--text3)', fontFamily:'JetBrains Mono', fontSize:12, padding:32 }}>No defects found</td></tr>
            )}
            {filtered.map(d => (
              <tr key={d.id}>
                <td className="mono" style={{ fontSize:11, color:'var(--text3)' }}>{d.defect_id}</td>
                <td style={{ fontWeight:600, maxWidth:200 }}>{d.name}</td>
                <td><span className={`badge ${statusClass(d.status)}`}>{d.status}</span></td>
                <td style={{ fontFamily:'JetBrains Mono', fontSize:11, fontWeight:600, color: priorityColor(d.priority) }}>{d.priority}</td>
                <td style={{ fontFamily:'JetBrains Mono', fontSize:11 }}>{d.severity}</td>
                <td style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--text3)' }}>{d.category}</td>
                <td style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--text3)' }}>{d.reported_by}</td>
                <td>
                  <Link to={`/defects/${d.id}`} className="flex items-center gap-1" style={{ color:'var(--text3)', fontSize:12 }}
                    onMouseEnter={e => ((e.currentTarget as any).style.color = '#e03030')}
                    onMouseLeave={e => ((e.currentTarget as any).style.color = 'var(--text3)')}>
                    View <ChevronRight size={12} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={load} />}
    </div>
  );
}

export function DefectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [defect, setDefect] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const load = () => api.defects.get(id!).then(d => { setDefect(d); setForm({ name:d.name, description:d.description, status:d.status, priority:d.priority, severity:d.severity, category:d.category, assigned_to:d.assigned_to||'' }); });
  useEffect(() => { load(); }, [id]);

  const handleSave = async () => {
    setLoading(true);
    try { await api.defects.update(id!, form); load(); setEditing(false); }
    catch (err: any) { alert(err.message); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this defect?')) return;
    await api.defects.delete(id!);
    navigate('/defects');
  };

  const set = (k: string) => (v: string) => setForm((f: any) => ({ ...f, [k]: v }));
  if (!defect) return <div className="p-6" style={{ color:'var(--text3)', fontFamily:'JetBrains Mono', fontSize:12 }}>Loading...</div>;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/defects" className="btn-ghost p-1.5"><ArrowLeft size={13} /></Link>
          <div>
            <div style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--text3)' }}>{defect.defect_id}</div>
            <h1 style={{ fontFamily:'Syne', fontWeight:800, fontSize:18, color:'var(--text)' }}>{defect.name}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} className="btn-ghost"><X size={12} /> Cancel</button>
              <button onClick={handleSave} disabled={loading} className="btn-primary">
                {loading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="btn-ghost"><Edit2 size={12} /> Edit</button>
              <button onClick={handleDelete} className="btn-danger"><Trash2 size={12} /> Delete</button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 card p-5 space-y-4">
          {editing ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <label style={{ fontSize:10, fontFamily:'JetBrains Mono', color:'var(--text3)', textTransform:'uppercase' }}>Summary</label>
                <input className="field-input" value={form.name} onChange={e => set('name')(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label style={{ fontSize:10, fontFamily:'JetBrains Mono', color:'var(--text3)', textTransform:'uppercase' }}>Description</label>
                <textarea className="field-input" rows={5} value={form.description} onChange={e => set('description')(e.target.value)} style={{ resize:'vertical' }} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[['status',STATUSES],['priority',PRIORITIES],['severity',SEVERITIES],['category',CATEGORIES]].map(([k,opts]) => (
                  <div key={k as string} className="space-y-1">
                    <label style={{ fontSize:10, fontFamily:'JetBrains Mono', color:'var(--text3)', textTransform:'uppercase' }}>{k as string}</label>
                    <select className="field-input" value={form[k as string]} onChange={e => set(k as string)(e.target.value)}>
                      {(opts as string[]).map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
                <div className="space-y-1">
                  <label style={{ fontSize:10, fontFamily:'JetBrains Mono', color:'var(--text3)', textTransform:'uppercase' }}>Assigned To</label>
                  <input className="field-input" value={form.assigned_to} onChange={e => set('assigned_to')(e.target.value)} />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p style={{ fontSize:14, color:'var(--text)', lineHeight:1.7, whiteSpace:'pre-wrap' }}>{defect.description || <span style={{ color:'var(--text3)' }}>No description</span>}</p>
              <div className="flex gap-4 flex-wrap">
                {[['Status',defect.status],['Priority',defect.priority],['Severity',defect.severity],['Category',defect.category],['Assigned To',defect.assigned_to||'—']].map(([k,v]) => (
                  <div key={k}>
                    <div style={{ fontFamily:'JetBrains Mono', fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.1em' }}>{k}</div>
                    <div style={{ fontFamily:'JetBrains Mono', fontSize:12, color:'var(--text)', fontWeight:600, marginTop:2 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Attachments entityType="defect" entityId={defect.id} readonly={false} />
        <div className="card p-4 space-y-3">
          <h3 style={{ fontFamily:'JetBrains Mono', fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.12em' }}>Metadata</h3>
          {[['Bug ID',defect.defect_id],['Reported By',defect.reported_by],['Created',defect.created_at?.slice(0,10)],['Updated',defect.updated_at?.slice(0,10)]].map(([k,v]) => (
            <div key={k}>
              <div style={{ fontFamily:'JetBrains Mono', fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.1em' }}>{k}</div>
              <div style={{ fontFamily:'JetBrains Mono', fontSize:12, color:'var(--text)', marginTop:2 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
