import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { api } from '@/services/api';

type Status = 'checking' | 'online' | 'offline' | 'waking';

export default function BackendStatus() {
  const [status, setStatus] = useState<Status>('checking');
  const isDemo = localStorage.getItem('qtest_demo') === 'true';

  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;

    const check = async () => {
      setStatus('checking');
      const start = Date.now();
      try {
        await api.health();
        if (!cancelled) setStatus('online');
      } catch {
        if (!cancelled) {
          const elapsed = Date.now() - start;
          // If it took long, it's waking up; if instant fail, it's offline
          setStatus(elapsed > 3000 ? 'waking' : 'offline');
        }
      }
    };

    check();
    // Re-check every 60 seconds
    const interval = setInterval(check, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [isDemo]);

  if (isDemo || status === 'online') return null;

  const cfg = {
    checking: { icon: <Loader2 size={10} className="animate-spin" />, text: 'Connecting to backend...', color: '#64748b', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.2)' },
    waking:   { icon: <Loader2 size={10} className="animate-spin" />, text: 'Backend waking up, please wait...', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
    offline:  { icon: <WifiOff size={10} />, text: 'Backend offline — data may not load', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
  }[status];

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px',
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: 4, margin: '8px 16px 0',
    }}>
      <span style={{ color: cfg.color }}>{cfg.icon}</span>
      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: cfg.color }}>{cfg.text}</span>
      {status === 'waking' && (
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'rgba(245,158,11,0.7)', marginLeft: 4 }}>
          (Render free tier can take up to 30s)
        </span>
      )}
    </div>
  );
}
