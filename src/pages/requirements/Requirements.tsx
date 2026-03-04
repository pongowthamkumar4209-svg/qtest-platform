import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Search, ChevronRight, X, Loader2, Trash2, Edit2, Save } from 'lucide-react';

const REQ_TYPES = ['Functional','Non-Functional','Business','Technical','Security','Performance'];
const PRIORITIES = ['Critical','High','Medium','Low'];
const STATUSES = ['Draft','Review','Approved','Rejected','Implemented'];

function statusClass(s: string) {
  const m: Record<string,string> = { Draft:'badge-draft', Review:'badge-inprogress', Approved:'badge-passed', Rejected:'badge-failed', Implemented:'badge-closed' };
  return m[s] || 'badge-draft';
}
function priorityColor(p: string) {
  const m: Record<string,string> = { Critical:'#ef4444', High:'#f97316', Medium:'#f59e0b', Low:'#22c55e' };
  return m[p] || '#64748b';
}

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name:'', description:'', type:'Functional', priority:'Medium', status:'Draft' });
  const [loading, setLoading] = useState(false);
  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try { await api.requirements.create(form); onCreated(); onClose(); }
    catch (err: any) { alert(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>New Requirement</h3>
          <button onClick={onClose} className="btn-ghost p-1"><X size={14} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div className="space-y-1">
              <label style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: 'var(--text3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Name *</label>
              <input required className="field-input" value={form.name} onChange={e => set('name')(e.target.value)} placeholder="Requirement name" />
            </div>
            <div className="space-y-1">
              <label style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: 'var(--text3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Description</label>
              <textarea className="field-input" rows={3} value={form.description} onChange={e => set('description')(e.target.value)} placeholder="Detailed description" style={{ resize: 'vertical' }} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[['type', REQ_TYPES], ['priority', PRIORITIES], ['status', STATUSES]].map(([k, opts]) => (
                <div key={k as string} className="space-y-1">
                  <label style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{k as string}</label>
                  <select className="field-input" value={(form as any)[k as string]} onChange={e => set(k as string)(e.target.value)}>
                    {(opts as string[]).map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Requirements() {
  const { canWrite } = useAuth();
  const [reqs, setReqs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const load = () => api.requirements.list().then(setReqs).catch(() => {});
  useEffect(() => { load(); }, []);

  const filtered = reqs.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.req_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 20, color: 'var(--text)' }}>Requirements</h1>
          <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>{reqs.length} total</p>
        </div>
        {canWrite && <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={13} /> New Requirement</button>
      </div>

      <div className="relative">
        <Search size={13} className="absolute left-3 top-2.5" style={{ color: 'var(--text3)' }} />
        <input className="field-input" style={{ paddingLeft: 32 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or ID..." />
      </div>

      <div className="card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th><th>Name</th><th>Type</th><th>Priority</th><th>Status</th><th>Author</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign:'center', color:'var(--text3)', fontFamily:'JetBrains Mono', fontSize:12, padding:32 }}>No requirements found</td></tr>
            )}
            {filtered.map(r => (
              <tr key={r.id}>
                <td><span className="mono" style={{ fontSize:11, color:'var(--text3)' }}>{r.req_id}</span></td>
                <td style={{ fontWeight: 600 }}>{r.name}</td>
                <td><span style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--text2)' }}>{r.type}</span></td>
                <td><span style={{ fontFamily:'JetBrains Mono', fontSize:11, fontWeight:600, color: priorityColor(r.priority) }}>{r.priority}</span></td>
                <td><span className={`badge ${statusClass(r.status)}`}>{r.status}</span></td>
                <td style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--text3)' }}>{r.author}</td>
                <td>
                  <Link to={`/requirements/${r.id}`} className="flex items-center gap-1" style={{ color:'var(--text3)', fontSize:12 }}
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
