import { useState, useEffect, useRef } from 'react';
import { Paperclip, Upload, Trash2, Download, File, Image, FileText, Archive, Loader2, X } from 'lucide-react';

const BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api');

function getToken() { return localStorage.getItem('qtest_token') || ''; }

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['png','jpg','jpeg','gif','webp'].includes(ext)) return <Image size={14} style={{ color: '#3b82f6' }} />;
  if (['pdf'].includes(ext)) return <FileText size={14} style={{ color: '#ef4444' }} />;
  if (['zip','rar','7z'].includes(ext)) return <Archive size={14} style={{ color: '#f59e0b' }} />;
  if (['log','txt','csv'].includes(ext)) return <FileText size={14} style={{ color: '#22c55e' }} />;
  return <File size={14} style={{ color: 'var(--text3)' }} />;
}

interface Props {
  entityType: string;   // 'requirement' | 'testcase' | 'defect' | 'instance'
  entityId: string;
  readonly?: boolean;
}

export default function Attachments({ entityType, entityId, readonly = false }: Props) {
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/attachments/${entityType}/${entityId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      setAttachments(Array.isArray(data) ? data : []);
    } catch { setAttachments([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (entityId) load(); }, [entityType, entityId]);

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('file', file);
      try {
        await fetch(`${BASE}/attachments/${entityType}/${entityId}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${getToken()}` },
          body: fd
        });
      } catch (e: any) { alert(`Failed to upload ${file.name}: ${e.message}`); }
    }
    setUploading(false);
    load();
  };

  const remove = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    await fetch(`${BASE}/attachments/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    load();
  };

  const download = (id: string, name: string) => {
    const a = document.createElement('a');
    a.href = `${BASE}/attachments/${id}/download`;
    a.download = name;
    // Add auth header via fetch
    fetch(`${BASE}/attachments/${id}/download`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    }).then(r => r.blob()).then(blob => {
      a.href = URL.createObjectURL(blob);
      a.click();
      URL.revokeObjectURL(a.href);
    });
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    upload(e.dataTransfer.files);
  };

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <Paperclip size={13} style={{ color: 'var(--text3)' }} />
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Attachments {attachments.length > 0 && `(${attachments.length})`}
          </span>
        </div>
        {!readonly && (
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="flex items-center gap-1.5"
            style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 11, color: 'var(--text2)', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 3, padding: '3px 10px', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(192,0,0,0.4)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}>
            {uploading ? <Loader2 size={11} className="animate-spin" style={{ color: '#e03030' }} /> : <Upload size={11} />}
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        )}
        <input ref={fileRef} type="file" multiple style={{ display: 'none' }}
          onChange={e => upload(e.target.files)} />
      </div>

      {/* Drop zone + list */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        style={{ minHeight: 60, background: dragOver ? 'rgba(192,0,0,0.05)' : 'transparent', border: dragOver ? '1px dashed rgba(192,0,0,0.4)' : 'none', transition: 'all 0.2s' }}>

        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 size={14} className="animate-spin" style={{ color: 'var(--text3)' }} />
          </div>
        )}

        {!loading && attachments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-5 gap-1.5">
            <Paperclip size={18} style={{ color: 'var(--text3)', opacity: 0.3 }} />
            <p style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text3)' }}>
              {readonly ? 'No attachments' : 'Drop files here or click Upload'}
            </p>
          </div>
        )}

        {!loading && attachments.map(att => (
          <div key={att.id} className="flex items-center gap-3 px-4 py-2.5"
            style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
            <FileIcon name={att.original_name} />
            <div className="flex-1 min-w-0">
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                title={att.original_name}>{att.original_name}</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text3)', marginTop: 1 }}>
                {formatSize(att.file_size)} · {att.uploaded_by} · {att.uploaded_at?.slice(0, 16)}
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => download(att.id, att.original_name)}
                title="Download"
                style={{ color: '#60a5fa', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 3, padding: '3px 7px', cursor: 'pointer' }}>
                <Download size={11} />
              </button>
              {!readonly && (
                <button onClick={() => remove(att.id, att.original_name)}
                  title="Delete"
                  style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 3, padding: '3px 7px', cursor: 'pointer' }}>
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
