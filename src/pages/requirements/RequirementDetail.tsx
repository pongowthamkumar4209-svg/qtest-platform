import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '@/services/api';
import { ArrowLeft, Edit2, Save, X, Trash2, Plus, Loader2 } from 'lucide-react';

const REQ_TYPES = ['Functional','Non-Functional','Business','Technical','Security','Performance'];
const PRIORITIES = ['Critical','High','Medium','Low'];
const STATUSES = ['Draft','Review','Approved','Rejected','Implemented'];

export default function RequirementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [req, setReq] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [allTCs, setAllTCs] = useState<any[]>([]);
  const [showLinkTC, setShowLinkTC] = useState(false);

  const load = () => {
    api.requirements.get(id!).then(r => { setReq(r); setForm({ name: r.name, description: r.description, type: r.type, priority: r.priority, status: r.status }); });
  };

  useEffect(() => { load(); api.testcases.list().then(setAllTCs); }, [id]);

  const handleSave = async () => {
    setLoading(true);
    try { await api.requirements.update(id!, form); load(); setEditing(false); }
    catch (err: any) { alert(err.message); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this requirement?')) return;
    await api.requirements.delete(id!);
    navigate('/requirements');
  };

  const linkTC = async (tc_id: string) => {
    await api.requirements.addCoverage(id!, tc_id);
    load(); setShowLinkTC(false);
  };

  if (!req) return <div className="p-6" style={{ color: 'var(--text3)', fontFamily: 'JetBrains Mono', fontSize: 12 }}>Loading...</div>;

  const set = (k: string) => (v: string) => setForm((f: any) => ({ ...f, [k]: v }));
  const linkedTCIds = req.coverage?.map((t: any) => t.id) || [];
  const unlinkTCs = allTCs.filter(t => !linkedTCIds.includes(t.id));

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/requirements" className="btn-ghost p-1.5"><ArrowLeft size={13} /></Link>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text3)' }}>{req.req_id}</div>
            <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: 'var(--text)' }}>{req.name}</h1>
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
        {/* Main info */}
        <div className="col-span-2 space-y-4">
          <div className="card p-5 space-y-4">
            <h3 style={{ fontFamily:'JetBrains Mono', fontSize:10, color:'var(--text3)', letterSpacing:'0.12em', textTransform:'uppercase' }}>Details</h3>
            {editing ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label style={{ fontSize:10, fontFamily:'JetBrains Mono', color:'var(--text3)', letterSpacing:'0.1em', textTransform:'uppercase' }}>Name</label>
                  <input className="field-input" value={form.name} onChange={e => set('name')(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label style={{ fontSize:10, fontFamily:'JetBrains Mono', color:'var(--text3)', letterSpacing:'0.1em', textTransform:'uppercase' }}>Description</label>
                  <textarea className="field-input" rows={4} value={form.description} onChange={e => set('description')(e.target.value)} style={{ resize:'vertical' }} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[['type', REQ_TYPES], ['priority', PRIORITIES], ['status', STATUSES]].map(([k, opts]) => (
                    <div key={k as string} className="space-y-1">
                      <label style={{ fontSize:10, fontFamily:'JetBrains Mono', color:'var(--text3)', textTransform:'uppercase' }}>{k as string}</label>
                      <select className="field-input" value={form[k as string]} onChange={e => set(k as string)(e.target.value)}>
                        {(opts as string[]).map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p style={{ fontSize:14, color:'var(--text)', lineHeight:1.6 }}>{req.description || <span style={{ color:'var(--text3)' }}>No description</span>}</p>
                <div className="flex gap-4 flex-wrap">
                  {[['Type', req.type], ['Priority', req.priority], ['Status', req.status], ['Author', req.author]].map(([k,v]) => (
                    <div key={k}>
                      <div style={{ fontFamily:'JetBrains Mono', fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.1em' }}>{k}</div>
                      <div style={{ fontFamily:'JetBrains Mono', fontSize:12, color:'var(--text)', fontWeight:600, marginTop:2 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Test Coverage */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom:'1px solid var(--border)' }}>
              <span style={{ fontFamily:'JetBrains Mono', fontSize:10, color:'var(--text3)', letterSpacing:'0.12em', textTransform:'uppercase' }}>Test Coverage ({req.coverage?.length || 0})</span>
              <button onClick={() => setShowLinkTC(true)} className="btn-ghost" style={{ padding:'4px 10px', fontSize:11 }}><Plus size={11} /> Link Test Case</button>
            </div>
            <table className="data-table">
              <thead><tr><th>TC ID</th><th>Name</th><th>Type</th><th>Status</th></tr></thead>
              <tbody>
                {req.coverage?.length === 0 && <tr><td colSpan={4} style={{ textAlign:'center', color:'var(--text3)', fontFamily:'JetBrains Mono', fontSize:11, padding:20 }}>No test cases linked</td></tr>}
                {req.coverage?.map((tc: any) => (
                  <tr key={tc.id}>
                    <td><span className="mono" style={{ fontSize:11, color:'var(--text3)' }}>{tc.tc_id}</span></td>
                    <td><Link to={`/test-plan/${tc.id}`} style={{ color:'var(--text)', fontWeight:600 }}>{tc.name}</Link></td>
                    <td style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--text2)' }}>{tc.type}</td>
                    <td><span className="badge badge-draft">{tc.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Linked Defects */}
          {req.defects?.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3" style={{ borderBottom:'1px solid var(--border)' }}>
                <span style={{ fontFamily:'JetBrains Mono', fontSize:10, color:'var(--text3)', letterSpacing:'0.12em', textTransform:'uppercase' }}>Linked Defects ({req.defects.length})</span>
              </div>
              <table className="data-table">
                <thead><tr><th>BUG ID</th><th>Name</th><th>Status</th><th>Priority</th></tr></thead>
                <tbody>
                  {req.defects.map((d: any) => (
                    <tr key={d.id}>
                      <td className="mono" style={{ fontSize:11, color:'var(--text3)' }}>{d.defect_id}</td>
                      <td><Link to={`/defects/${d.id}`} style={{ fontWeight:600 }}>{d.name}</Link></td>
                      <td><span className="badge badge-open">{d.status}</span></td>
                      <td style={{ fontFamily:'JetBrains Mono', fontSize:11 }}>{d.priority}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Meta panel */}
        <div className="space-y-3">
          <div className="card p-4 space-y-3">
            <h3 style={{ fontFamily:'JetBrains Mono', fontSize:10, color:'var(--text3)', letterSpacing:'0.12em', textTransform:'uppercase' }}>Metadata</h3>
            {[['Created', req.created_at?.slice(0,10)], ['Updated', req.updated_at?.slice(0,10)], ['Author', req.author]].map(([k,v]) => (
              <div key={k}>
                <div style={{ fontFamily:'JetBrains Mono', fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.1em' }}>{k}</div>
                <div style={{ fontFamily:'JetBrains Mono', fontSize:12, color:'var(--text)', marginTop:2 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Link TC Modal */}
      {showLinkTC && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowLinkTC(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:15, color:'var(--text)' }}>Link Test Case</h3>
              <button onClick={() => setShowLinkTC(false)} className="btn-ghost p-1"><X size={14} /></button>
            </div>
            <div className="modal-body">
              <table className="data-table">
                <thead><tr><th>TC ID</th><th>Name</th><th>Type</th><th></th></tr></thead>
                <tbody>
                  {unlinkTCs.length === 0 && <tr><td colSpan={4} style={{ textAlign:'center', color:'var(--text3)', fontSize:12, padding:20 }}>All test cases already linked</td></tr>}
                  {unlinkTCs.map((tc: any) => (
                    <tr key={tc.id}>
                      <td className="mono" style={{ fontSize:11, color:'var(--text3)' }}>{tc.tc_id}</td>
                      <td style={{ fontWeight:600 }}>{tc.name}</td>
                      <td style={{ fontFamily:'JetBrains Mono', fontSize:11 }}>{tc.type}</td>
                      <td><button onClick={() => linkTC(tc.id)} className="btn-primary" style={{ padding:'4px 10px', fontSize:11 }}>Link</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
