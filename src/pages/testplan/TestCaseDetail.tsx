import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '@/services/api';
import { ArrowLeft, Edit2, Save, X, Trash2, Loader2, Plus } from 'lucide-react';
import AICodeAssistant from '@/components/AICodeAssistant';

const TYPES = ['Manual','Automated'];
const PRIORITIES = ['Critical','High','Medium','Low'];
const STATUSES = ['Draft','Review','Approved','Deprecated'];
const FRAMEWORKS = ['selenium','pytest','unittest','robot'];

export default function TestCaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tc, setTC] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = () => api.testcases.get(id!).then(t => {
    setTC(t); setForm({ name:t.name, description:t.description, type:t.type, priority:t.priority, status:t.status, automation_code:t.automation_code||'', automation_framework:t.automation_framework||'selenium' });
    setSteps(t.steps||[]);
  });

  useEffect(() => { load(); }, [id]);

  const handleSave = async () => {
    setLoading(true);
    try { await api.testcases.update(id!, { ...form, steps }); load(); setEditing(false); }
    catch (err: any) { alert(err.message); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this test case?')) return;
    await api.testcases.delete(id!);
    navigate('/test-plan');
  };

  const setF = (k: string) => (v: string) => setForm((f: any) => ({ ...f, [k]: v }));
  const setStep = (i: number, k: string, v: string) => { const n=[...steps]; n[i]={...n[i],[k]:v}; setSteps(n); };

  if (!tc) return <div className="p-6" style={{ color:'var(--text3)', fontFamily:'JetBrains Mono', fontSize:12 }}>Loading...</div>;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/test-plan" className="btn-ghost p-1.5"><ArrowLeft size={13} /></Link>
          <div>
            <div style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--text3)' }}>{tc.tc_id}</div>
            <h1 style={{ fontFamily:'Syne', fontWeight:800, fontSize:18, color:'var(--text)' }}>{tc.name}</h1>
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
        <div className="col-span-2 space-y-4">
          <div className="card p-5 space-y-4">
            {editing ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label style={{ fontSize:10, fontFamily:'JetBrains Mono', color:'var(--text3)', textTransform:'uppercase' }}>Name</label>
                  <input className="field-input" value={form.name} onChange={e => setF('name')(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label style={{ fontSize:10, fontFamily:'JetBrains Mono', color:'var(--text3)', textTransform:'uppercase' }}>Description</label>
                  <textarea className="field-input" rows={3} value={form.description} onChange={e => setF('description')(e.target.value)} style={{ resize:'vertical' }} />
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[['type',TYPES],['priority',PRIORITIES],['status',STATUSES]].map(([k,opts]) => (
                    <div key={k as string} className="space-y-1">
                      <label style={{ fontSize:10, fontFamily:'JetBrains Mono', color:'var(--text3)', textTransform:'uppercase' }}>{k as string}</label>
                      <select className="field-input" value={form[k as string]} onChange={e => setF(k as string)(e.target.value)}>
                        {(opts as string[]).map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                  {form.type === 'Automated' && (
                    <div className="space-y-1">
                      <label style={{ fontSize:10, fontFamily:'JetBrains Mono', color:'var(--text3)', textTransform:'uppercase' }}>Framework</label>
                      <select className="field-input" value={form.automation_framework} onChange={e => setF('automation_framework')(e.target.value)}>
                        {FRAMEWORKS.map(f => <option key={f}>{f}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p style={{ fontSize:14, color:'var(--text)', lineHeight:1.6 }}>{tc.description || <span style={{ color:'var(--text3)' }}>No description</span>}</p>
                <div className="flex gap-4 flex-wrap">
                  {[['Type',tc.type],['Priority',tc.priority],['Status',tc.status],['Author',tc.author],['Framework',tc.type==='Automated'?tc.automation_framework:null]].filter(([,v])=>v).map(([k,v]) => (
                    <div key={k as string}>
                      <div style={{ fontFamily:'JetBrains Mono', fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.1em' }}>{k}</div>
                      <div style={{ fontFamily:'JetBrains Mono', fontSize:12, color:'var(--text)', fontWeight:600, marginTop:2 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Steps or Code */}
          {(editing ? form.type : tc.type) === 'Manual' ? (
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom:'1px solid var(--border)' }}>
                <span style={{ fontFamily:'JetBrains Mono', fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.12em' }}>Test Steps ({steps.length})</span>
                {editing && <button type="button" onClick={() => setSteps([...steps,{action:'',expected:''}])} className="btn-ghost" style={{ padding:'3px 10px', fontSize:11 }}><Plus size={11} /> Add</button>}
              </div>
              {steps.length === 0 && <p style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--text3)', textAlign:'center', padding:20 }}>No steps defined</p>}
              {steps.map((s, i) => (
                <div key={i} className="px-4 py-3" style={{ borderBottom:'1px solid var(--border)' }}>
                  <div className="flex items-start gap-3">
                    <span style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--red2)', minWidth:24, marginTop:2 }}>#{i+1}</span>
                    <div className="flex-1 space-y-1">
                      {editing ? (
                        <>
                          <input className="field-input" placeholder="Action" value={s.action} onChange={e => setStep(i,'action',e.target.value)} />
                          <input className="field-input" placeholder="Expected result" value={s.expected} onChange={e => setStep(i,'expected',e.target.value)} />
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize:13, color:'var(--text)', fontWeight:600 }}>{s.action}</div>
                          <div style={{ fontSize:12, color:'var(--text2)', fontFamily:'JetBrains Mono' }}>Expected: {s.expected}</div>
                        </>
                      )}
                    </div>
                    {editing && <button type="button" onClick={() => setSteps(steps.filter((_,j)=>j!==i))} style={{ color:'var(--text3)', background:'none', border:'none', cursor:'pointer' }}><Trash2 size={12} /></button>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div style={{ fontFamily:'JetBrains Mono', fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.12em' }}>
                  Automation Code ({editing ? form.automation_framework : tc.automation_framework})
                </div>
                {editing && (
                  <AICodeAssistant
                    framework={form.automation_framework}
                    currentCode={form.automation_code}
                    onInsert={code => setF('automation_code')(form.automation_code ? form.automation_code + '\n\n' + code : code)}
                    onReplace={code => setF('automation_code')(code)}
                  />
                )}
              </div>
              {editing ? (
                <textarea className="field-input" rows={14} value={form.automation_code} onChange={e => setF('automation_code')(e.target.value)} style={{ fontFamily:'JetBrains Mono', fontSize:12, lineHeight:1.5, resize:'vertical' }} />
              ) : (
                <pre style={{ fontFamily:'JetBrains Mono', fontSize:12, color:'var(--text)', background:'var(--bg3)', padding:12, borderRadius:3, overflow:'auto', lineHeight:1.5, maxHeight:400 }}>{tc.automation_code || '# No code written yet'}</pre>
              )}
            </div>
          )}

          {/* Linked Requirements */}
          {tc.requirements?.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3" style={{ borderBottom:'1px solid var(--border)' }}>
                <span style={{ fontFamily:'JetBrains Mono', fontSize:10, color:'var(--text3)', textTransform:'uppercase' }}>Linked Requirements</span>
              </div>
              <table className="data-table">
                <thead><tr><th>REQ ID</th><th>Name</th><th>Status</th></tr></thead>
                <tbody>
                  {tc.requirements.map((r: any) => (
                    <tr key={r.id}>
                      <td className="mono" style={{ fontSize:11, color:'var(--text3)' }}>{r.req_id}</td>
                      <td><Link to={`/requirements/${r.id}`} style={{ fontWeight:600 }}>{r.name}</Link></td>
                      <td><span className="badge badge-draft">{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="card p-4 space-y-3">
            <h3 style={{ fontFamily:'JetBrains Mono', fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.12em' }}>Metadata</h3>
            {[['Created', tc.created_at?.slice(0,10)], ['Updated', tc.updated_at?.slice(0,10)], ['Author', tc.author]].map(([k,v]) => (
              <div key={k}>
                <div style={{ fontFamily:'JetBrains Mono', fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.1em' }}>{k}</div>
                <div style={{ fontFamily:'JetBrains Mono', fontSize:12, color:'var(--text)', marginTop:2 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
