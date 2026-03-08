import { ShieldOff } from 'lucide-react';

export default function NoPermission({ action = 'perform this action' }: { action?: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '32px 16px', gap: 10, textAlign: 'center'
    }}>
      <ShieldOff size={24} style={{ color: 'var(--text3)', opacity: 0.4 }} />
      <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: 'var(--text2)' }}>Permission Denied</p>
      <p style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>
        You don't have permission to {action}.<br />Contact your administrator to request access.
      </p>
    </div>
  );
}
