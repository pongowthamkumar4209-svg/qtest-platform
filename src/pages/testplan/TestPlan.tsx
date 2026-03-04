import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Search, ChevronRight, X, Loader2, Trash2 } from 'lucide-react';
import AICodeAssistant from '@/components/AICodeAssistant';

const TYPES = ['Manual','Automated'];
const PRIORITIES = ['Critical','High','Medium','Low'];
const STATUSES = ['Draft','Review','Approved','Deprecated'];
const FRAMEWORKS = ['selenium','pytest','unittest','robot'];

function StepEditor({ steps, onChange }: { steps: any[]; onChange: (s: any[]) => void }) {
  const add = () => onChange([...steps, { action:'', expected:'' }]);
  const remove = (i: number) => onChange(steps.filter((_,j) => j !== i));
  const set = (i: number, k: string, v: string) => {
    const n = [...steps]; n[i] = { ...n[i], [k]: v }; onChange(n);
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label style={{ fontSize:10, fontFamily:'JetBrains Mono', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Test Steps</label>
        <button type="button" onClick={add} className="btn-ghost" style={{ padding:'3px 10px', fontSize:11 }}><Plus size={11} /> Add Step</button>
      </div>
      {steps.length === 0 && <p style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--text3)', textAlign:'center', padding:'12px 0' }}>No steps added yet</p>}
      {steps.map((s, i) => (
        <div key={i} className="card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span style={{ fontFamily:'JetBrains Mono', fontSize:10, color:'var(--text3)' }}>Step {i+1}</span>
            <button type="button" onClick={() => remove(i)} style={{ color:'var(--text3)', background:'none', border:'none', cursor:'pointer' }}><Trash2 size={12} /></button>
          </div>
          <input className="field-input" placeholder="Action / Description" value={s.action} onChange={e => set(i,'action',e.target.value)} />
          <input className="field-input" placeholder="Expected Result" value={s.expected} onChange={e => set(i,'expected',e.target.value)} />
        </div>
      ))}
    </div>
  );
}

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name:'', description:'', type:'Manual', priority:'Medium', status:'Draft', automation_framework:'selenium', automation_code:'' });
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try { await api.testcases.create({ ...form, steps }); onCreated(); onClose(); }
    catch (err: any) { alert(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:15, color:'var(--text)' }}>New Test Case</h3>
          <button onClick={onClose} className="btn-ghost p-1"><X size={14} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div className="space-y-1">
              <label style={{ fontSize:10, fontFamily:'JetBrains Mono', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Name *</label>
              <input required className="field-input" value={form.name} onChange={e => set('name')(e.target.value)} placeholder="Test case name" />
            </div>
            <div className="space-y-1">
              <label style={{ fontSize:10, fontFamily:'JetBrains Mono', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Description</label>
              <textarea className="field-input" rows={2} value={form.description} onChange={e => set('description')(e.target.value)} placeholder="Objective / scope" style={{ resize:'vertical' }} />
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[['type', TYPES], ['priority', PRIORITIES], ['status', STATUSES]].map(([k, opts]) => (
                <div key={k as string} className="space-y-1">
                  <label style={{ fontSize:10, fontFamily:'JetBrains Mono', color:'var(--text3)', textTransform:'uppercase' }}>{k as string}</label>
                  <select className="field-input" value={(form as any)[k as string]} onChange={e => set(k as string)(e.target.value)}>
                    {(opts as string[]).map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              {form.type === 'Automated' && (
                <div className="space-y-1">
                  <label style={{ fontSize:10, fontFamily:'JetBrains Mono', color:'var(--text3)', textTransform:'uppercase' }}>Framework</label>
                  <select className="field-input" value={form.automation_framework} onChange={e => set('automation_framework')(e.target.value)}>
                    {FRAMEWORKS.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
              )}
            </div>

            {form.type === 'Manual' ? (
              <StepEditor steps={steps} onChange={setSteps} />
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label style={{ fontSize:10, fontFamily:'JetBrains Mono', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Python Automation Code</label>
                  <AICodeAssistant
                    framework={form.automation_framework}
                    currentCode={form.automation_code}
                    onInsert={code => set('automation_code')(form.automation_code ? form.automation_code + '\n\n' + code : code)}
                    onReplace={code => set('automation_code')(code)}
                  />
                </div>
                <textarea className="field-input" rows={10} value={form.automation_code}
                  onChange={e => set('automation_code')(e.target.value)}
                  placeholder={`# Selenium / pytest automation code\nimport time\nfrom selenium import webdriver\n\ndef test_example():\n    driver = webdriver.Chrome()\n    driver.get('https://example.com')\n    assert 'Example' in driver.title\n    driver.quit()\n    print('Test passed!')\n\nif __name__ == '__main__':\n    test_example()`}
                  style={{ resize:'vertical', fontFamily:'JetBrains Mono', fontSize:12, lineHeight:1.5 }} />
              </div>
            )}
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

export default function TestPlan() {
  const { canWrite } = useAuth();
  const [tcs, setTCs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [showCreate, setShowCreate] = useState(false);

  const load = () => api.testcases.list().then(setTCs).catch(() => {});
  useEffect(() => { load(); }, []);

  const filtered = tcs.filter(t =>
    (typeFilter === 'All' || t.type === typeFilter) &&
    (t.name.toLowerCase().includes(search.toLowerCase()) || t.tc_id?.includes(search))
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily:'Syne', fontWeight:800, fontSize:20, color:'var(--text)' }}>Test Plan</h1>
          <p style={{ fontFamily:'JetBrains Mono', fontSize:10, color:'var(--text3)', letterSpacing:'0.1em', textTransform:'uppercase', marginTop:2 }}>{tcs.length} test cases</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={13} /> New Test Case</button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-2.5" style={{ color:'var(--text3)' }} />
          <input className="field-input" style={{ paddingLeft:32 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search test cases..." />
        </div>
        <div className="flex gap-1">
          {['All','Manual','Automated'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={typeFilter === t ? 'btn-primary' : 'btn-ghost'}
              style={{ padding:'8px 14px', fontSize:12 }}>{t}</button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr><th>ID</th><th>Name</th><th>Type</th><th>Priority</th><th>Status</th><th>Author</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign:'center', color:'var(--text3)', fontFamily:'JetBrains Mono', fontSize:12, padding:32 }}>No test cases found</td></tr>
            )}
            {filtered.map(tc => (
              <tr key={tc.id}>
                <td className="mono" style={{ fontSize:11, color:'var(--text3)' }}>{tc.tc_id}</td>
                <td style={{ fontWeight:600 }}>{tc.name}</td>
                <td>
                  <span className={`badge ${tc.type === 'Automated' ? 'badge-inprogress' : 'badge-draft'}`}>{tc.type}</span>
                </td>
                <td style={{ fontFamily:'JetBrains Mono', fontSize:11 }}>{tc.priority}</td>
                <td><span className="badge badge-draft">{tc.status}</span></td>
                <td style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--text3)' }}>{tc.author}</td>
                <td>
                  <Link to={`/test-plan/${tc.id}`} className="flex items-center gap-1" style={{ color:'var(--text3)', fontSize:12 }}
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
