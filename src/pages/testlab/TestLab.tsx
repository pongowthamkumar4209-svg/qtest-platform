import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, X, Loader2, ChevronRight, TestTube } from 'lucide-react';

function CreateSuiteModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try { await api.suites.create({ name, description: desc }); onCreated(); onClose(); }
    catch (err: any) { alert(err.message); }
    finally { setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:15, color:'var(--text)' }}>New Test Suite</h3>
          <button onClick={onClose} className="btn-ghost p-1"><X size={14} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-3">
            <div className="space-y-1">
              <label style={{ fontSize:10, fontFamily:'JetBrains Mono', color:'var(--text3)', textTransform:'uppercase' }}>Suite Name *</label>
              <input required className="field-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Regression Suite v1" />
            </div>
            <div className="space-y-1">
              <label style={{ fontSize:10, fontFamily:'JetBrains Mono', color:'var(--text3)', textTransform:'uppercase' }}>Description</label>
              <textarea className="field-input" rows={2} value={desc} onChange={e => setDesc(e.target.value)} style={{ resize:'vertical' }} />
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

function AddInstanceModal({ suiteId, onClose, onAdded }: { suiteId: string; onClose: () => void; onAdded: () => void }) {
  const [tcs, setTCs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.testcases.list().then(setTCs); }, []);

  const add = async (tc_id: string) => {
    setLoading(true);
    try { await api.suites.addInstance(suiteId, { test_case_id: tc_id }); onAdded(); onClose(); }
    catch (err: any) { alert(err.message); }
    finally { setLoading(false); }
  };

  const filtered = tcs.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.tc_id?.includes(search));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:15, color:'var(--text)' }}>Add Test Instance</h3>
          <button onClick={onClose} className="btn-ghost p-1"><X size={14} /></button>
        </div>
        <div className="modal-body space-y-3">
          <input className="field-input" placeholder="Search test cases..." value={search} onChange={e => setSearch(e.target.value)} />
          <table className="data-table">
            <thead><tr><th>ID</th><th>Name</th><th>Type</th><th></th></tr></thead>
            <tbody>
              {filtered.map(tc => (
                <tr key={tc.id}>
                  <td className="mono" style={{ fontSize:11, color:'var(--text3)' }}>{tc.tc_id}</td>
                  <td style={{ fontWeight:600 }}>{tc.name}</td>
                  <td><span className={`badge ${tc.type==='Automated'?'badge-inprogress':'badge-draft'}`}>{tc.type}</span></td>
                  <td><button onClick={() => add(tc.id)} disabled={loading} className="btn-primary" style={{ padding:'4px 10px', fontSize:11 }}>Add</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SuiteRow({ suite, onSelect }: { suite: any; onSelect: () => void }) {
  return (
    <tr className="cursor-pointer" onClick={onSelect}>
      <td className="mono" style={{ fontSize:11, color:'var(--text3)' }}>{suite.suite_id}</td>
      <td style={{ fontWeight:600 }}>{suite.name}</td>
      <td style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--text2)' }}>{suite.description}</td>
      <td style={{ fontFamily:'JetBrains Mono', fontSize:12 }}>{suite.instance_count}</td>
      <td style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--text3)' }}>{suite.created_by}</td>
      <td><ChevronRight size={13} style={{ color:'var(--text3)' }} /></td>
    </tr>
  );
}

export default function TestLab() {
  const { canWrite, canExecute } = useAuth();
  const [suites, setSuites] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [instances, setInstances] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const loadSuites = () => api.suites.list().then(setSuites).catch(() => {});
  const loadInstances = (sid: string) => api.suites.listInstances(sid).then(setInstances).catch(() => {});

  useEffect(() => { loadSuites(); }, []);

  const selectSuite = (s: any) => { setSelected(s); loadInstances(s.id); };

  function statusBadge(s: string) {
    const m: Record<string,string> = { 'Not Run':'badge-notrun', 'In Progress':'badge-inprogress', Passed:'badge-passed', Failed:'badge-failed', Blocked:'badge-open' };
    return m[s] || 'badge-notrun';
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily:'Syne', fontWeight:800, fontSize:20, color:'var(--text)' }}>Test Lab</h1>
          <p style={{ fontFamily:'JetBrains Mono', fontSize:10, color:'var(--text3)', letterSpacing:'0.1em', textTransform:'uppercase', marginTop:2 }}>Test execution management</p>
        </div>
        {canWrite && <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={13} /> New Suite</button>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {/* Suite list */}
        <div className="col-span-2 card overflow-hidden">
          <div className="px-4 py-3" style={{ borderBottom:'1px solid var(--border)' }}>
            <span style={{ fontFamily:'JetBrains Mono', fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.12em' }}>Test Suites ({suites.length})</span>
          </div>
          <table className="data-table">
            <thead><tr><th>ID</th><th>Name</th><th>Desc</th><th>#</th><th>By</th><th></th></tr></thead>
            <tbody>
              {suites.length === 0 && <tr><td colSpan={6} style={{ textAlign:'center', color:'var(--text3)', fontFamily:'JetBrains Mono', fontSize:11, padding:20 }}>No suites yet</td></tr>}
              {suites.map(s => (
                <SuiteRow key={s.id} suite={s} onSelect={() => selectSuite(s)} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Instances */}
        <div className="col-span-3 card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom:'1px solid var(--border)' }}>
            <span style={{ fontFamily:'JetBrains Mono', fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.12em' }}>
              {selected ? `${selected.name} — Instances` : 'Select a suite'}
            </span>
            {selected && {canWrite && <button onClick={() => setShowAdd(true)} className="btn-ghost" style={{ padding:'4px 10px', fontSize:11 }}><Plus size={11} /> Add TC</button>}
          </div>
          {!selected && (
            <div className="flex flex-col items-center justify-center py-16" style={{ color:'var(--text3)' }}>
              <TestTube size={32} style={{ marginBottom:8, opacity:0.3 }} />
              <p style={{ fontFamily:'JetBrains Mono', fontSize:12 }}>Select a test suite to view instances</p>
            </div>
          )}
          {selected && (
            <table className="data-table">
              <thead><tr><th>ID</th><th>Test Case</th><th>Type</th><th>Status</th><th>Executed By</th><th></th></tr></thead>
              <tbody>
                {instances.length === 0 && <tr><td colSpan={6} style={{ textAlign:'center', color:'var(--text3)', fontFamily:'JetBrains Mono', fontSize:11, padding:20 }}>No instances. Add test cases above.</td></tr>}
                {instances.map((inst: any) => (
                  <tr key={inst.id}>
                    <td className="mono" style={{ fontSize:11, color:'var(--text3)' }}>{inst.instance_id}</td>
                    <td style={{ fontWeight:600 }}>{inst.tc_name}</td>
                    <td><span className={`badge ${inst.tc_type==='Automated'?'badge-inprogress':'badge-draft'}`}>{inst.tc_type}</span></td>
                    <td><span className={`badge ${statusBadge(inst.status)}`}>{inst.status}</span></td>
                    <td style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--text3)' }}>{inst.executed_by || '—'}</td>
                    <td>
                      <Link to={`/test-lab/${selected.id}/execute/${inst.id}`} className="btn-primary" style={{ padding:'4px 10px', fontSize:11 }}>
                        Execute
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showCreate && <CreateSuiteModal onClose={() => setShowCreate(false)} onCreated={loadSuites} />}
      {showAdd && selected && <AddInstanceModal suiteId={selected.id} onClose={() => setShowAdd(false)} onAdded={() => loadInstances(selected.id)} />}
    </div>
  );
}
