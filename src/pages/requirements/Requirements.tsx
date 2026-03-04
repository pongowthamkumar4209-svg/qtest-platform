import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { DEMO_REQUIREMENTS } from '@/demo/demoData';
import { BookOpen, Plus, Search, ChevronRight } from 'lucide-react';

const PRIORITY_COLORS: Record<string,string> = { Critical:'#ef4444', High:'#f59e0b', Medium:'#3b82f6', Low:'#64748b' };
const STATUS_COLORS: Record<string,string> = { Approved:'#22c55e', 'In Review':'#f59e0b', Draft:'#64748b', Obsolete:'#ef4444' };

export default function Requirements() {
  const { canWrite } = useAuth();
  const isDemo = localStorage.getItem('qtest_demo') === 'true';
  const [reqs, setReqs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name:'', description:'', type:'Functional', priority:'Medium', status:'Draft' });

  useEffect(() => {
    if (isDemo) { setReqs(DEMO_REQUIREMENTS); return; }
    const load = () => api.requirements.list().then(setReqs).catch(() => setTimeout(load, 5000));
    load();
  }, [isDemo]);

  const filtered = reqs.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.req_id?.toLowerCase().includes(search.toLowerCase()));

  const create = async () => {
    if (isDemo) { alert('Preview Mode: Create is disabled. Sign in to use full features.'); return; }
    try { await api.requirements.create(form); api.requirements.list().then(setReqs); setShowCreate(false); setForm({ name:'', description:'', type:'Functional', priority:'Medium', status:'Draft' }); }
    catch (e: any) { alert(e.message); }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div style={{ width:36, height:36, borderRadius:6, background:'rgba(139,92,246,0.1)', border:'1px solid rgba(139,92,246,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <BookOpen size={15} style={{ color:'#8b5cf6' }} />
          </div>
          <div>
            <h1 style={{ fontFamily:'Syne', fontWeight:800, fontSize:20, color:'var(--text)' }}>Requirements</h1>
            <p style={{ fontFamily:'JetBrains Mono', fontSize:10, color:'var(--text3)', letterSpacing:'0.1em', textTransform:'uppercase', marginTop:2 }}>{reqs.length} total</p>
          </div>
        </div>
        {canWrite && !isDemo && <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={13} /> New Requirement</button>}
        {isDemo && <span style={{ fontFamily:'JetBrains Mono', fontSize:10, color:'#f59e0b', background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:3, padding:'4px 10px' }}>Preview Mode</span>}
      </div>

      <div className="relative">
        <Search size={13} className="absolute left-3 top-2.5" style={{ color:'var(--text3)' }} />
        <input className="field-input" style={{ paddingLeft:32 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or ID..." />
      </div>

      <div className="card overflow-hidden">
        <table className="data-table">
          <thead><tr><th>ID</th><th>Name</th><th>Type</th><th>Priority</th><th>Status</th><th>Author</th><th></th></tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign:'center', color:'var(--text3)', padding:24, fontFamily:'JetBrains Mono', fontSize:12 }}>No requirements found</td></tr>}
            {filtered.map(r => (
              <tr key={r.id}>
                <td style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--text3)' }}>{r.req_id}</td>
                <td style={{ fontWeight:600 }}>{r.name}</td>
                <td style={{ fontFamily:'JetBrains Mono', fontSize:11 }}>{r.type}</td>
                <td><span style={{ fontFamily:'JetBrains Mono', fontSize:10, fontWeight:700, color:PRIORITY_COLORS[r.priority]||'var(--text3)', textTransform:'uppercase' }}>{r.priority}</span></td>
                <td><span className="badge" style={{ color:STATUS_COLORS[r.status]||'var(--text3)', background:`${STATUS_COLORS[r.status]||'#64748b'}15`, border:`1px solid ${STATUS_COLORS[r.status]||'#64748b'}30` }}>{r.status}</span></td>
                <td style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--text3)' }}>{r.author}</td>
                <td><Link to={`/requirements/${r.id}`} style={{ color:'var(--text3)', display:'flex', alignItems:'center' }}><ChevronRight size={14} /></Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && !isDemo && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:15, color:'var(--text)' }}>New Requirement</h3>
              <button onClick={() => setShowCreate(false)} className="btn-ghost p-1"><Plus size={14} style={{ transform:'rotate(45deg)' }} /></button>
            </div>
            <div className="modal-body space-y-3">
              <div><label className="field-label">Name *</label><input className="field-input" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} /></div>
              <div><label className="field-label">Description</label><textarea className="field-input" rows={3} value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="field-label">Type</label><select className="field-input" value={form.type} onChange={e => setForm(f=>({...f,type:e.target.value}))}>{['Functional','Non-Functional','Performance','Security','UI/UX'].map(t=><option key={t}>{t}</option>)}</select></div>
                <div><label className="field-label">Priority</label><select className="field-input" value={form.priority} onChange={e => setForm(f=>({...f,priority:e.target.value}))}>{['Critical','High','Medium','Low'].map(p=><option key={p}>{p}</option>)}</select></div>
                <div><label className="field-label">Status</label><select className="field-input" value={form.status} onChange={e => setForm(f=>({...f,status:e.target.value}))}>{['Draft','In Review','Approved','Obsolete'].map(s=><option key={s}>{s}</option>)}</select></div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowCreate(false)} className="btn-ghost">Cancel</button>
              <button onClick={create} className="btn-primary" disabled={!form.name}>Create Requirement</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
