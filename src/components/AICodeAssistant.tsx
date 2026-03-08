import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, ChevronDown, ChevronUp, Copy, Check, RotateCcw, Loader2, Bot, Key } from 'lucide-react';

interface Message { role: 'user' | 'assistant'; content: string; }
interface AICodeAssistantProps {
  framework: string; currentCode: string;
  onInsert: (code: string) => void; onReplace: (code: string) => void;
}

const QUICK_PROMPTS = [
  'Open Edge and navigate to Google',
  'Login to a website with username and password',
  'Fill a form and submit',
  'Search for an element and click it',
  'Take a screenshot on failure',
  'Wait for element to appear',
  'Handle dropdown selection',
  'Verify page title and URL',
];

const API_KEY_STORAGE = 'qtest_ai_api_key';

function extractCode(text: string): string | null {
  const match = text.match(/```(?:python)?\n([\s\S]*?)```/);
  return match ? match[1].trim() : null;
}

function CodeBlock({ code, onInsert, onReplace }: { code: string; onInsert: (c: string) => void; onReplace: (c: string) => void }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <div style={{ borderRadius: 3, overflow: 'hidden', border: '1px solid var(--border2)', marginTop: 8 }}>
      <div className="flex items-center justify-between px-3 py-1.5" style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text3)' }}>python</span>
        <div className="flex gap-1.5">
          <button onClick={copy} style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: copied ? '#4ade80' : 'var(--text3)', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            {copied ? <Check size={10} /> : <Copy size={10} />} {copied ? 'Copied' : 'Copy'}
          </button>
          <button onClick={() => onInsert(code)} style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: '#60a5fa', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 3, padding: '1px 8px', cursor: 'pointer' }}>+ Insert</button>
          <button onClick={() => onReplace(code)} style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: '#4ade80', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 3, padding: '1px 8px', cursor: 'pointer' }}>↺ Replace</button>
        </div>
      </div>
      <pre style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text)', background: '#080c10', padding: '10px 12px', margin: 0, overflow: 'auto', maxHeight: 220, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{code}</pre>
    </div>
  );
}

function MessageBubble({ msg, onInsert, onReplace }: { msg: Message; onInsert: (c: string) => void; onReplace: (c: string) => void }) {
  const isUser = msg.role === 'user';
  const code = !isUser ? extractCode(msg.content) : null;
  const textOnly = code ? msg.content.replace(/```(?:python)?\n[\s\S]*?```/g, '').trim() : msg.content;
  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`} style={{ marginBottom: 12 }}>
      {!isUser && (
        <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full mt-0.5" style={{ background: 'rgba(192,0,0,0.15)', border: '1px solid rgba(192,0,0,0.3)' }}>
          <Bot size={12} style={{ color: '#e03030' }} />
        </div>
      )}
      <div style={{ maxWidth: '85%' }}>
        {textOnly && <div style={{ background: isUser ? 'rgba(192,0,0,0.1)' : 'var(--bg3)', border: `1px solid ${isUser ? 'rgba(192,0,0,0.25)' : 'var(--border)'}`, borderRadius: 4, padding: '8px 12px', fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>{textOnly}</div>}
        {code && <CodeBlock code={code} onInsert={onInsert} onReplace={onReplace} />}
      </div>
    </div>
  );
}

function ApiKeySetup({ onSave }: { onSave: (key: string) => void }) {
  const [key, setKey] = useState('');
  return (
    <div style={{ padding: '16px 14px' }}>
      <div className="flex items-center gap-2 mb-3">
        <Key size={14} style={{ color: '#fbbf24' }} />
        <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Anthropic API Key Required</span>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12, lineHeight: 1.6 }}>
        Enter your Anthropic API key to enable AI suggestions. Get one at <span style={{ color: '#60a5fa' }}>console.anthropic.com</span>. Stored in your browser only.
      </p>
      <div className="flex gap-2">
        <input type="password" value={key} onChange={e => setKey(e.target.value)}
          placeholder="sk-ant-..."
          style={{ flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'JetBrains Mono', fontSize: 12, padding: '6px 10px', borderRadius: 3, outline: 'none' }}
          onKeyDown={e => e.key === 'Enter' && key.trim() && onSave(key.trim())} />
        <button onClick={() => key.trim() && onSave(key.trim())} disabled={!key.trim()}
          style={{ background: key.trim() ? 'var(--red)' : 'var(--bg3)', color: key.trim() ? 'white' : 'var(--text3)', border: '1px solid var(--border)', borderRadius: 3, padding: '6px 14px', cursor: key.trim() ? 'pointer' : 'default', fontFamily: 'Syne', fontWeight: 700, fontSize: 12 }}>
          Save
        </button>
      </div>
    </div>
  );
}

export default function AICodeAssistant({ framework, currentCode, onInsert, onReplace }: AICodeAssistantProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQuick, setShowQuick] = useState(true);
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem(API_KEY_STORAGE) || '');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  useEffect(() => {
    if (open && apiKey && messages.length === 0) {
      setMessages([{ role: 'assistant', content: `Hi! I'm your AI assistant for ${framework} automation. Describe what you want to test, or pick a quick prompt below.` }]);
    }
  }, [open, apiKey]);

  const saveApiKey = (key: string) => {
    localStorage.setItem(API_KEY_STORAGE, key);
    setApiKey(key);
    setMessages([{ role: 'assistant', content: `API key saved! Ready to help with ${framework} automation. What would you like to test?` }]);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setShowQuick(false);

    const systemPrompt = `You are an expert Python test automation engineer specializing in Selenium WebDriver and ${framework}.
Framework: ${framework}
Current code in editor:
\`\`\`python
${currentCode || '# (empty)'}
\`\`\`
Rules:
- Always write complete, runnable Python scripts
- For Edge: use webdriver.Edge() with Options from selenium.webdriver.edge.options
- Always include time.sleep() for stability and driver.quit() at the end
- Include print() statements for progress
- Wrap code in try/finally to ensure driver.quit() always runs
- DO NOT use webdriver_manager
- Always wrap code in a python markdown code block`;

    try {
      const token = localStorage.getItem('qtest_token');
      const BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api');
      const response = await fetch(`${BASE}/ai/assist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ api_key: apiKey, system: systemPrompt, messages: newMessages.map(m => ({ role: m.role, content: m.content })) })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      const reply = data.content?.[0]?.text || 'No response generated.';
      setMessages(m => [...m, { role: 'assistant', content: reply }]);
    } catch (err: any) {
      const msg = err.message?.includes('401') || err.message?.includes('invalid_api_key')
        ? '⚠️ Invalid API key. Click the key icon to update it.'
        : `⚠️ Error: ${err.message}`;
      setMessages(m => [...m, { role: 'assistant', content: msg }]);
    } finally { setLoading(false); }
  };

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } };
  const reset = () => { setMessages([]); setShowQuick(true); };
  const clearKey = () => { localStorage.removeItem(API_KEY_STORAGE); setApiKey(''); setMessages([]); };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  const panelStyle: React.CSSProperties = isMobile
    ? { position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: '12px 12px 0 0', boxShadow: '0 -4px 32px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', maxHeight: '80vh' }
    : { position: 'absolute', top: '100%', right: 0, zIndex: 50, width: 430, marginTop: 6, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', maxHeight: 500 };

  return (
    <div style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(!open)} className="flex items-center gap-1.5"
        style={{ background: open ? 'rgba(192,0,0,0.15)' : 'rgba(192,0,0,0.08)', border: `1px solid ${open ? 'rgba(192,0,0,0.4)' : 'rgba(192,0,0,0.2)'}`, color: open ? '#e03030' : 'var(--text3)', padding: '4px 10px', borderRadius: 3, cursor: 'pointer', fontFamily: 'Syne', fontSize: 11, fontWeight: 700, transition: 'all 0.15s' }}>
        <Sparkles size={12} style={{ color: open ? '#e03030' : '#c00000' }} />
        AI Assistant
        {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>

      {open && (
        <>
          {/* Dark backdrop on mobile so user can tap outside to close */}
          {isMobile && (
            <div onClick={() => setOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 49 }} />
          )}
          <div style={panelStyle}>
            {/* Drag handle on mobile */}
            {isMobile && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border2)' }} />
              </div>
            )}
            <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div className="flex items-center gap-2">
                <Sparkles size={13} style={{ color: '#e03030' }} />
                <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>AI Code Assistant</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text3)', background: 'var(--bg3)', padding: '1px 6px', borderRadius: 2, textTransform: 'uppercase' }}>{framework}</span>
              </div>
              <div className="flex gap-1.5">
                {apiKey && <button type="button" onClick={clearKey} title="Change API key" style={{ color: '#fbbf24', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Key size={12} /></button>}
                <button type="button" onClick={reset} title="Clear chat" style={{ color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><RotateCcw size={12} /></button>
                <button type="button" onClick={() => setOpen(false)} style={{ color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={13} /></button>
              </div>
            </div>

            {!apiKey ? <ApiKeySetup onSave={saveApiKey} /> : (
              <>
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 0' }}>
                  {messages.map((m, i) => <MessageBubble key={i} msg={m} onInsert={onInsert} onReplace={onReplace} />)}
                  {loading && (
                    <div className="flex gap-2 items-center mb-3">
                      <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full" style={{ background: 'rgba(192,0,0,0.15)', border: '1px solid rgba(192,0,0,0.3)' }}>
                        <Bot size={12} style={{ color: '#e03030' }} />
                      </div>
                      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 4, padding: '8px 12px', display: 'flex', gap: 6, alignItems: 'center' }}>
                        <Loader2 size={12} className="animate-spin" style={{ color: '#e03030' }} />
                        <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'JetBrains Mono' }}>Generating code...</span>
                      </div>
                    </div>
                  )}
                  {showQuick && messages.length <= 1 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Quick prompts</div>
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_PROMPTS.map(p => (
                          <button key={p} type="button" onClick={() => sendMessage(p)}
                            style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: 'var(--text2)', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 3, padding: '3px 8px', cursor: 'pointer', transition: 'all 0.15s' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(192,0,0,0.4)'; (e.currentTarget as HTMLElement).style.color = '#e03030'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text2)'; }}>
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
                <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
                  <div className="flex gap-2 items-end">
                    <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
                      placeholder="Describe what to test... (Enter to send)" rows={2}
                      style={{ flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--text)', fontFamily: 'JetBrains Mono', fontSize: 12, padding: '6px 10px', outline: 'none', resize: 'none', lineHeight: 1.5 }}
                      onFocus={e => e.currentTarget.style.borderColor = 'rgba(192,0,0,0.5)'}
                      onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
                    <button type="button" onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
                      style={{ background: input.trim() && !loading ? 'var(--red)' : 'var(--bg3)', border: '1px solid var(--border)', color: input.trim() && !loading ? 'white' : 'var(--text3)', borderRadius: 3, padding: '8px 10px', cursor: input.trim() && !loading ? 'pointer' : 'default', transition: 'all 0.15s', flexShrink: 0 }}>
                      <Send size={13} />
                    </button>
                  </div>
                  <p style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text3)', marginTop: 5 }}>Shift+Enter for new line · Enter to send · Insert or Replace to apply code</p>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
