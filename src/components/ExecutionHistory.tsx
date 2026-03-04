import { useState, useEffect } from 'react';
import { History, CheckCircle, XCircle, Clock, Download, FileText, ChevronDown, ChevronUp, Loader2, RefreshCw } from 'lucide-react';

const BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api');
function getToken() { return localStorage.getItem('qtest_token') || ''; }

function statusColor(s: string) {
  return s === 'Passed' ? '#22c55e' : s === 'Failed' ? '#ef4444' : '#64748b';
}

function RunLogModal({ run, onClose }: { run: any; onClose: () => void }) {
  const [log, setLog] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/runs/${run.id}/log`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(d => { setLog(d.log || 'No log available'); setLoading(false); })
      .catch(() => { setLog('Failed to load log'); setLoading(false); });
  }, [run.id]);

  const downloadLog = () => {
    fetch(`${BASE}/runs/${run.id}/log/download`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${run.run_id}.log`;
        a.click();
        URL.revokeObjectURL(a.href);
      });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 720, width: '90vw' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <FileText size={15} style={{ color: statusColor(run.status) }} />
            <div>
              <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
                {run.run_id} — Log
              </div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>
                {run.executed_by} · {run.executed_at?.slice(0, 16)} · {run.duration_ms}ms · 
                <span style={{ color: statusColor(run.status), marginLeft: 4 }}>{run.status}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={downloadLog}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Syne', fontWeight: 700, fontSize: 11, color: '#60a5fa', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 3, padding: '5px 12px', cursor: 'pointer' }}>
              <Download size={11} /> Download .log
            </button>
            <button onClick={onClose}
              style={{ color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <ChevronDown size={16} />
            </button>
          </div>
        </div>

        {/* Log content */}
        <div style={{ padding: '12px 16px', maxHeight: '60vh', overflowY: 'auto' }}>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={18} className="animate-spin" style={{ color: 'var(--red)' }} />
            </div>
          ) : (
            <pre style={{
              fontFamily: 'JetBrains Mono', fontSize: 12, color: '#a8d8a0',
              background: '#080c10', padding: '14px 16px', borderRadius: 4,
              lineHeight: 1.7, overflow: 'auto', whiteSpace: 'pre-wrap',
              wordBreak: 'break-word', border: '1px solid var(--border)'
            }}>
              {log.split('\n').map((line, i) => {
                const isError = line.includes('[ERROR]') || line.includes('✗');
                const isSuccess = line.includes('[SUCCESS]') || line.includes('✓');
                const isSep = line.includes('---');
                return (
                  <span key={i} style={{
                    color: isError ? '#fca5a5' : isSuccess ? '#4ade80' : isSep ? '#475569' : '#a8d8a0',
                    display: 'block'
                  }}>{line}</span>
                );
              })}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

interface Props {
  instanceId: string;
  refreshTrigger?: number; // increment to force reload
}

export default function ExecutionHistory({ instanceId, refreshTrigger = 0 }: Props) {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [selectedRun, setSelectedRun] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/instances/${instanceId}/runs`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      setRuns(Array.isArray(data) ? data : []);
    } catch { setRuns([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (instanceId) load(); }, [instanceId, refreshTrigger]);

  const passCount = runs.filter(r => r.status === 'Passed').length;
  const failCount = runs.filter(r => r.status === 'Failed').length;

  return (
    <>
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: expanded ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}
          onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center gap-2">
            <History size={13} style={{ color: 'var(--text3)' }} />
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Execution History ({runs.length})
            </span>
            {runs.length > 0 && (
              <div className="flex gap-2" style={{ marginLeft: 4 }}>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '1px 6px', borderRadius: 2 }}>✓ {passCount}</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '1px 6px', borderRadius: 2 }}>✗ {failCount}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={e => { e.stopPropagation(); load(); }}
              style={{ color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <RefreshCw size={11} />
            </button>
            {expanded ? <ChevronUp size={13} style={{ color: 'var(--text3)' }} /> : <ChevronDown size={13} style={{ color: 'var(--text3)' }} />}
          </div>
        </div>

        {expanded && (
          <>
            {loading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={14} className="animate-spin" style={{ color: 'var(--text3)' }} />
              </div>
            )}
            {!loading && runs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-6 gap-1">
                <History size={20} style={{ color: 'var(--text3)', opacity: 0.3 }} />
                <p style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text3)' }}>No executions yet</p>
              </div>
            )}
            {!loading && runs.map((run, idx) => (
              <div key={run.id}
                className="flex items-center gap-3 px-4 py-2.5"
                style={{ borderBottom: idx < runs.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s', cursor: 'default' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>

                {/* Run number badge */}
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, color: statusColor(run.status), background: `${statusColor(run.status)}12`, border: `1px solid ${statusColor(run.status)}25`, borderRadius: 3, padding: '2px 7px', flexShrink: 0 }}>
                  {run.run_id}
                </div>

                {/* Status icon */}
                {run.status === 'Passed'
                  ? <CheckCircle size={13} style={{ color: '#22c55e', flexShrink: 0 }} />
                  : <XCircle size={13} style={{ color: '#ef4444', flexShrink: 0 }} />}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text)' }}>
                    {run.executed_by}
                    <span style={{ color: 'var(--text3)', marginLeft: 8 }}>{run.framework}</span>
                  </div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text3)', marginTop: 1 }}>
                    {run.executed_at?.slice(0, 16)}
                  </div>
                </div>

                {/* Duration */}
                <div className="flex items-center gap-1" style={{ flexShrink: 0 }}>
                  <Clock size={10} style={{ color: 'var(--text3)' }} />
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text3)' }}>
                    {run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : '—'}
                  </span>
                </div>

                {/* View log button */}
                <button onClick={() => setSelectedRun(run)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'JetBrains Mono', fontSize: 10, color: '#60a5fa', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 3, padding: '3px 8px', cursor: 'pointer', flexShrink: 0 }}>
                  <FileText size={10} /> View Log
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      {selectedRun && <RunLogModal run={selectedRun} onClose={() => setSelectedRun(null)} />}
    </>
  );
}
