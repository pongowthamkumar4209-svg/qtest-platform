import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, STREAM_BASE } from '@/services/api';
import { ArrowLeft, Play, CheckCircle, XCircle, MinusCircle, Loader2, Bug, Plus, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Attachments from '@/components/Attachments';
import ExecutionHistory from '@/components/ExecutionHistory';

function statusIcon(s: string) {
  if (s === 'Passed') return <CheckCircle size={14} style={{ color:'#22c55e' }} />;
  if (s === 'Failed') return <XCircle size={14} style={{ color:'#ef4444' }} />;
  if (s === 'Blocked') return <MinusCircle size={14} style={{ color:'#f59e0b' }} />;
  return <div style={{ width:14, height:14, borderRadius:'50%', border:'2px solid var(--border2)' }} />;
}

export default function TestExecution() {
  const { suiteId, instanceId } = useParams();
  const navigate = useNavigate();
  const [inst, setInst] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [executing, setExecuting] = useState(false);
  const [stepActuals, setStepActuals] = useState<Record<string,string>>({});
  const [showDefect, setShowDefect] = useState(false);
  const [runRefresh, setRunRefresh] = useState(0);
  const { canExecute, canWrite } = useAuth();
  const [defects, setDefects] = useState<any[]>([]);
  const consoleRef = useRef<HTMLDivElement>(null);

  const load = () => api.instances.get(instanceId!).then(setInst);
  useEffect(() => { load(); api.defects.list().then(setDefects); }, [instanceId]);
  useEffect(() => { if (consoleRef.current) consoleRef.current.scrollTop = consoleRef.current.scrollHeight; }, [logs]);

  const updateStep = async (stepId: string, status: string) => {
    await api.instances.updateStep(instanceId!, stepId, { status, actual: stepActuals[stepId] || '' });
    load();
  };

  const executeAuto = async () => {
    setExecuting(true); setLogs([]);
    try {
      const res = await api.instances.execute(instanceId!);
      // Poll instead of SSE - avoids CORS issues with EventSource
      let sent = 0;
      const poll = async () => {
        try {
          const result = await api.instances.pollExec(res.exec_id);
          const newEntries = result.logs.slice(sent);
          sent = result.logs.length;
          for (const entry of newEntries) {
            if (!entry.msg) continue;
            const prefix = entry.type === 'success' ? '✓' : entry.type === 'error' ? '✗' : entry.type === 'warning' ? '⚠' : '›';
            setLogs(l => [...l, `${prefix} ${entry.msg}`]);
          }
          if (result.done) {
            setExecuting(false); load(); setRunRefresh(r => r + 1);
          } else {
            setTimeout(poll, 500);
          }
        } catch {
          setExecuting(false);
          setLogs(l => [...l, '⚠ Lost connection to backend.']);
        }
      };
      setTimeout(poll, 300);
    } catch (err: any) { setLogs([`✗ ${err.message}`]); setExecuting(false); }
  };

  const linkDefect = async (defect_id: string) => {
    await api.defects.link({ defect_id, entity_type:'instance', entity_id: instanceId });
    load(); setShowDefect(false);
  };

  if (!inst) return <div className="p-6" style={{ color:'var(--text3)', fontFamily:'JetBrains Mono', fontSize:12 }}>Loading...</div>;

  const isAuto = inst.tc_type === 'Automated';
  const statusColor: Record<string,string> = { Passed:'#22c55e', Failed:'#ef4444', 'In Progress':'#3b82f6', 'Not Run':'#64748b', Blocked:'#f59e0b' };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/test-lab" className="btn-ghost p-1.5"><ArrowLeft size={13} /></Link>
          <div>
            <div style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--text3)' }}>{inst.instance_id} · {inst.tc_id}</div>
            <h1 style={{ fontFamily:'Syne', fontWeight:800, fontSize:18, color:'var(--text)' }}>{inst.tc_name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span style={{ fontFamily:'JetBrains Mono', fontSize:12, fontWeight:700, color: statusColor[inst.status] || '#64748b' }}>{inst.status}</span>
          {isAuto && (
            <button onClick={executeAuto} disabled={executing} className="btn-primary">
              {executing ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
              {executing ? 'Executing...' : 'Execute'}
            </button>
          )}
          {canExecute && <button onClick={() => setShowDefect(true)} className="btn-ghost"><Bug size={12} /> Link Defect</button>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          {isAuto ? (
            /* Automation console */
            <div className="card overflow-hidden">
              <div className="px-4 py-3" style={{ borderBottom:'1px solid var(--border)' }}>
                <span style={{ fontFamily:'JetBrains Mono', fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.12em' }}>Execution Console</span>
              </div>
              <div ref={consoleRef} style={{ background:'var(--bg)', minHeight:280, maxHeight:420, overflowY:'auto', padding:'12px 16px', fontFamily:'JetBrains Mono', fontSize:12, lineHeight:1.7 }}>
                {logs.length === 0 && <span style={{ color:'var(--text3)' }}>Click "Execute" to run the automation script...</span>}
                {logs.map((l, i) => (
                  <div key={i} style={{ color: l.startsWith('✓') ? '#4ade80' : l.startsWith('✗') ? '#f87171' : 'var(--text2)' }}>{l}</div>
                ))}
                {executing && <div style={{ color:'#fbbf24' }}>⠋ Running...</div>}
              </div>
            </div>
          ) : (
            /* Manual step execution */
            <div className="card overflow-hidden">
              <div className="px-4 py-3" style={{ borderBottom:'1px solid var(--border)' }}>
                <span style={{ fontFamily:'JetBrains Mono', fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.12em' }}>
                  Manual Execution — Steps ({inst.steps?.length || 0})
                </span>
              </div>
              {inst.steps?.length === 0 && (
                <p style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--text3)', textAlign:'center', padding:20 }}>No steps defined for this test case</p>
              )}
              {inst.steps?.map((step: any, idx: number) => (
                <div key={step.id} className="px-4 py-4" style={{ borderBottom:'1px solid var(--border)' }}>
                  <div className="flex items-start gap-3">
                    <span style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--red2)', minWidth:24, marginTop:2 }}>#{idx+1}</span>
                    <div className="flex-1 space-y-2">
                      <div style={{ fontSize:13, color:'var(--text)', fontWeight:600 }}>{step.action}</div>
                      <div style={{ fontSize:12, color:'var(--text3)', fontFamily:'JetBrains Mono' }}>Expected: {step.expected || '—'}</div>
                      <input className="field-input" placeholder="Actual result..."
                        value={stepActuals[step.id] || step.actual || ''}
                        onChange={e => setStepActuals(a => ({ ...a, [step.id]: e.target.value }))}
                        style={{ fontSize:12 }} />
                      <div className="flex gap-2">
                        {['Passed','Failed','Blocked','N/A'].map(s => (
                          <button key={s} onClick={() => updateStep(step.id, s)}
                            className={`btn-ghost`}
                            style={{
                              padding:'4px 12px', fontSize:11,
                              borderColor: step.result_status === s ? (s==='Passed'?'#22c55e':s==='Failed'?'#ef4444':'#f59e0b') : undefined,
                              color: step.result_status === s ? (s==='Passed'?'#4ade80':s==='Failed'?'#f87171':'#fbbf24') : undefined,
                            }}>{s}</button>
                        ))}
                      </div>
                    </div>
                    <div className="mt-1">{statusIcon(step.result_status || 'Not Run')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Linked Defects */}
          {inst.defects?.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3" style={{ borderBottom:'1px solid var(--border)' }}>
                <span style={{ fontFamily:'JetBrains Mono', fontSize:10, color:'var(--text3)', textTransform:'uppercase' }}>Linked Defects</span>
              </div>
              <table className="data-table">
                <thead><tr><th>BUG ID</th><th>Name</th><th>Status</th><th>Severity</th></tr></thead>
                <tbody>
                  {inst.defects.map((d: any) => (
                    <tr key={d.id}>
                      <td className="mono" style={{ fontSize:11, color:'var(--text3)' }}>{d.defect_id}</td>
                      <td><Link to={`/defects/${d.id}`} style={{ fontWeight:600 }}>{d.name}</Link></td>
                      <td><span className="badge badge-open">{d.status}</span></td>
                      <td style={{ fontFamily:'JetBrains Mono', fontSize:11 }}>{d.severity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-3">
          <div className="card p-4 space-y-3">
            <h3 style={{ fontFamily:'JetBrains Mono', fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.12em' }}>Execution Info</h3>
            {[['Instance', inst.instance_id],['Test Case', inst.tc_id],['Type', inst.tc_type],['Status', inst.status],['Executed By', inst.executed_by||'—'],['Executed At', inst.executed_at?.slice(0,16)||'—']].map(([k,v]) => (
              <div key={k}>
                <div style={{ fontFamily:'JetBrains Mono', fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.1em' }}>{k}</div>
                <div style={{ fontFamily:'JetBrains Mono', fontSize:12, color: k==='Status' ? (statusColor[v as string]||'var(--text)') : 'var(--text)', marginTop:2, fontWeight: k==='Status'?700:400 }}>{v}</div>
              </div>
            ))}
          </div>
          <ExecutionHistory instanceId={inst.id} refreshTrigger={runRefresh} />
          <Attachments entityType="instance" entityId={inst.id} readonly={false} />
        </div>
      </div>

      {/* Link Defect Modal */}
      {showDefect && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowDefect(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:15, color:'var(--text)' }}>Link Defect</h3>
              <button onClick={() => setShowDefect(false)} className="btn-ghost p-1"><X size={14} /></button>
            </div>
            <div className="modal-body">
              <table className="data-table">
                <thead><tr><th>BUG ID</th><th>Name</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {defects.length === 0 && <tr><td colSpan={4} style={{ textAlign:'center', color:'var(--text3)', fontSize:12, padding:20 }}>No defects. Create one in Defects module first.</td></tr>}
                  {defects.map((d: any) => (
                    <tr key={d.id}>
                      <td className="mono" style={{ fontSize:11, color:'var(--text3)' }}>{d.defect_id}</td>
                      <td style={{ fontWeight:600 }}>{d.name}</td>
                      <td><span className="badge badge-open">{d.status}</span></td>
                      <td><button onClick={() => linkDefect(d.id)} className="btn-primary" style={{ padding:'4px 10px', fontSize:11 }}>Link</button></td>
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
