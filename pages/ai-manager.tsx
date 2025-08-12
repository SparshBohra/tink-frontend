import React, { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import Cookies from 'js-cookie';
import { withAuth } from '../lib/auth-context';
import DashboardLayout from '../components/DashboardLayout';
import MapboxAddressAutocomplete from '../components/MapboxAddressAutocomplete';
import { phoneUtils } from '../lib/utils';
import USPhoneInput, { getUSPhoneError, toE164Format } from '../components/USPhoneInput';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  animated?: boolean;
  ui?: UiSchema | null;
};

type UiFormField =
  | { name: string; label: string; type: 'text' | 'email' | 'tel' | 'number' | 'search'; required?: boolean; placeholder?: string }
  | { name: string; label: string; type: 'select'; required?: boolean; options: Array<{ label: string; value: string }> }
  | { name: string; label: string; type: 'mapbox-address'; required?: boolean; targetFields?: { address_line1?: string; city?: string; state?: string; postal_code?: string } };

type UiSchema =
  | {
      type: 'form';
      id: string;
      title?: string;
      submit: { tool: string };
      fields: UiFormField[];
      initial?: Record<string, any>;
      context?: Record<string, any>;
    }
  | {
      type: 'address_picker';
      id: string;
      title?: string;
      options: Array<{ index: number; label: string }>;
      submit: { tool: string };
      context?: Record<string, any>;
    };

const AGENT_BASE = process.env.NEXT_PUBLIC_AGENT_BASE_URL || 'http://localhost:8081';

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  const tenant = window.localStorage.getItem('tenant_access_token');
  if (tenant) return tenant;
  return Cookies.get('access_token') || null;
}

function AiManagerPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const authHeader = useMemo(() => {
    const token = getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const hasConversation = useMemo(() => messages.some((m) => m.role === 'user'), [messages]);

  async function callAgent(body: any) {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    const tokenHeader = (authHeader as any)['Authorization'];
    if (tokenHeader) (headers as any)['Authorization'] = tokenHeader;
    const res = await fetch(`${AGENT_BASE}/chat`, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || `HTTP ${res.status}`);
    }
    return res.json();
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);

    try {
      const data = await callAgent({
        message: text,
        history: messages.map((m) => ({ role: m.role, content: m.content })),
      });
      const reply: string = data?.reply || 'I could not generate a response.';
      const ui: UiSchema | null = data?.ui || null;
      setMessages((prev) => [...prev, { role: 'assistant', content: reply, animated: true, ui }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Sorry, I hit an error: ${err?.message || 'Unknown error'}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function submitUiForm(ui: UiSchema, values: Record<string, any>) {
    setLoading(true);
    try {
      const data = await callAgent({
        message: '',
        history: messages.map((m) => ({ role: m.role, content: m.content })),
        form: { id: (ui as any).id, tool: (ui as any).submit?.tool || (ui as any).id, values, context: (ui as any).context || {} },
      });
      const reply: string = data?.reply || 'I could not generate a response.';
      const nextUi: UiSchema | null = data?.ui || null;
      setMessages((prev) => [...prev, { role: 'assistant', content: reply, animated: true, ui: nextUi }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Sorry, I hit an error: ${err?.message || 'Unknown error'}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function FormBubble({ ui }: { ui: Extract<UiSchema, { type: 'form' }> }) {
    const [form, setForm] = useState<Record<string, any>>(ui.initial || {});
    const [addressText, setAddressText] = useState('');
    const [vendorPhoneError, setVendorPhoneError] = useState<string | null>(null);
    function setField(name: string, val: any) {
      setForm((f) => ({ ...f, [name]: val }));
    }

    // Dropdown data mirrors site
    const TIMEZONE_OPTIONS = [
      { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
      { value: 'America/New_York', label: 'Eastern Time (ET)' },
      { value: 'America/Chicago', label: 'Central Time (CT)' },
      { value: 'America/Denver', label: 'Mountain Time (MT)' },
      { value: 'Europe/London', label: 'GMT/BST' },
      { value: 'Europe/Paris', label: 'CET/CEST' },
    ];
    const US_STATES = [
      { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' }, { value: 'AZ', label: 'Arizona' }, { value: 'AR', label: 'Arkansas' },
      { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' }, { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' },
      { value: 'FL', label: 'Florida' }, { value: 'GA', label: 'Georgia' }, { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
      { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' }, { value: 'IA', label: 'Iowa' }, { value: 'KS', label: 'Kansas' },
      { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' }, { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' },
      { value: 'MA', label: 'Massachusetts' }, { value: 'MI', label: 'Michigan' }, { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
      { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' }, { value: 'NE', label: 'Nebraska' }, { value: 'NV', label: 'Nevada' },
      { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' }, { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' },
      { value: 'NC', label: 'North Carolina' }, { value: 'ND', label: 'North Dakota' }, { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
      { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' }, { value: 'RI', label: 'Rhode Island' }, { value: 'SC', label: 'South Carolina' },
      { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' }, { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' },
      { value: 'VT', label: 'Vermont' }, { value: 'VA', label: 'Virginia' }, { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
      { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
    ];

    // For vendor form, render as two-column layout similar to site
    const isVendorForm = ui.id === 'add_vendor';
    const formGridStyle: React.CSSProperties = { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' };

    const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
      <span style={{ fontSize: 12, color: '#334155' }}>
        {children} {required ? <span style={{ color: '#dc2626' }}>*</span> : null}
      </span>
    );

    return (
      <div style={{ marginTop: 8, opacity: 0, animation: 'tinkFadeIn 600ms ease-out forwards' }}>
        {ui.title ? (
          <div style={{ fontWeight: 700, marginBottom: 10 }}>{ui.title}</div>
        ) : null}
        <div className="ai-form-grid" style={formGridStyle}>
          {ui.fields.map((f, i) => {
            const required = (f as any).required;
            const animatedLabelStyle: React.CSSProperties = { opacity: 0, animation: `tinkFadeIn 540ms ease-out ${i * 90}ms forwards` };
            if (f.type === 'select' && f.name === 'timezone' && !(f as any).options) {
              return (
                <label key={f.name} style={{ display: 'grid', gap: 6, ...animatedLabelStyle }}>
                  <Label required={required}>{f.label}</Label>
                  <select
                    value={form[f.name] ?? ''}
                    onChange={(e) => setField(f.name, e.target.value)}
                    style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#ffffff' }}
                  >
                    <option value="" disabled>Select...</option>
                    {TIMEZONE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
              );
            }
            if (f.type === 'select' && f.name === 'state' && !(f as any).options) {
              return (
                <label key={f.name} style={{ display: 'grid', gap: 6, ...animatedLabelStyle }}>
                  <Label required={required}>{f.label}</Label>
                  <select
                    value={form[f.name] ?? ''}
                    onChange={(e) => setField(f.name, e.target.value)}
                    style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#ffffff' }}
                  >
                    <option value="" disabled>Select...</option>
                    {US_STATES.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
              );
            }

            if (f.type === 'select') {
              return (
                <label key={f.name} style={{ display: 'grid', gap: 6, ...animatedLabelStyle }}>
                  <Label required={required}>{f.label}</Label>
                  <select
                    value={form[f.name] ?? ''}
                    onChange={(e) => setField(f.name, e.target.value)}
                    style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#ffffff' }}
                  >
                    <option value="" disabled>
                      Select...
                    </option>
                    {(f as any).options?.map((opt: any) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              );
            }
            if (f.type === 'mapbox-address') {
              const targets = f.targetFields || { address_line1: 'address_line1', city: 'city', state: 'state', postal_code: 'postal_code' };
              return (
                <label key={f.name} className="full-span" style={{ display: 'grid', gap: 6, ...animatedLabelStyle }}>
                  <Label required={required}>{f.label}</Label>
                  <MapboxAddressAutocomplete
                    value={addressText}
                    onChange={setAddressText}
                    onAddressSelect={(c) => {
                      setForm((prev) => ({
                        ...prev,
                        [targets.address_line1 || 'address_line1']: c.address_line1,
                        [targets.city || 'city']: c.city,
                        [targets.state || 'state']: c.state,
                        [targets.postal_code || 'postal_code']: c.postal_code,
                      }));
                    }}
                  />
                </label>
              );
            }

            if ((isVendorForm && f.name === 'contact_phone') || f.name === 'phone') {
              const error = vendorPhoneError || null;
              return (
                <label key={f.name} style={{ display: 'grid', gap: 6, ...animatedLabelStyle }}>
                  <Label required={required}>{f.label}</Label>
                  <USPhoneInput
                    value={form[f.name] ?? ''}
                    onChange={(val) => {
                      setField(f.name, val);
                      setVendorPhoneError(getUSPhoneError(val));
                    }}
                  />
                  {error && <span style={{ color: '#dc2626', fontSize: 12 }}>{error}</span>}
                </label>
              );
            }

            return (
              <label key={f.name} style={{ display: 'grid', gap: 6, ...animatedLabelStyle }}>
                <Label required={required}>{f.label}</Label>
                <input
                  type={f.type}
                  inputMode={f.type === 'number' ? 'numeric' : undefined}
                  value={form[f.name] ?? ''}
                  placeholder={(f as any).placeholder}
                  onChange={(e) => setField(f.name, e.target.value)}
                  style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#ffffff' }}
                />
              </label>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10, opacity: 0, animation: 'tinkFadeIn 540ms ease-out 270ms forwards' }}>
          <button
            onClick={() => submitUiForm(ui, form)}
            disabled={loading}
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid transparent',
              background: loading ? '#9ca3af' : '#2563eb',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
            }}
          >
            {loading ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>
    );
  }

  function AddressPickerBubble({ ui }: { ui: Extract<UiSchema, { type: 'address_picker' }> }) {
    const [selected, setSelected] = useState<number | null>(null);
    return (
      <div style={{ marginTop: 8, opacity: 0, animation: 'tinkFadeIn 600ms ease-out forwards' }}>
        {ui.title ? <div style={{ fontWeight: 600, marginBottom: 8 }}>{ui.title}</div> : null}
        <div style={{ display: 'grid', gap: 8 }}>
          {ui.options.map((o, i) => (
            <label key={o.index} style={{ display: 'flex', gap: 8, alignItems: 'center', opacity: 0, animation: `tinkFadeIn 540ms ease-out ${i * 90}ms forwards` }}>
              <input
                type="radio"
                name={ui.id}
                value={o.index}
                checked={selected === o.index}
                onChange={() => setSelected(o.index)}
              />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
          <button
            onClick={() => selected && submitUiForm(ui, { selected_index: selected })}
            disabled={loading || selected == null}
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid transparent',
              background: loading ? '#9ca3af' : '#2563eb',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
            }}
          >
            {loading ? 'Submitting…' : 'Confirm'}
          </button>
        </div>
      </div>
    );
  }

  function renderMessageContent(m: ChatMessage) {
    if (m.ui) {
      return (
        <div>
          {m.content ? (
            <div style={{ marginBottom: 8, color: '#334155' }}>{m.content}</div>
          ) : null}
          {m.ui.type === 'form' ? <FormBubble ui={m.ui} /> : null}
          {m.ui.type === 'address_picker' ? <AddressPickerBubble ui={m.ui} /> : null}
        </div>
      );
    }
    if (m.role !== 'assistant' || !m.animated) return m.content;
    const normalized = m.content.replace(/\r\n/g, '\n');
    const lines = normalized.split('\n');
    let charIndex = 0;
    return (
      <span aria-live="polite">
        {lines.map((line, li) => {
          const tokens = line.split(/(\s+)/); // keep spaces
          return (
            <span key={`line-${li}`}>
              {tokens.map((tok, ti) => {
                if (/^\s+$/.test(tok)) {
                  return (
                    <span key={`sp-${li}-${ti}`} style={{ whiteSpace: 'pre' }}>
                      {tok}
                    </span>
                  );
                }
                const wordChars = Array.from(tok);
                const word = (
                  <span
                    key={`w-${li}-${ti}`}
                    style={{ display: 'inline-block', whiteSpace: 'nowrap' }}
                  >
                    {wordChars.map((ch, ci) => {
                      const idx = charIndex++;
                      return (
                        <span
                          key={`c-${li}-${ti}-${ci}`}
                          style={{
                            opacity: 0,
                            display: 'inline-block',
                            animationName: 'tinkFadeInChar',
                            animationDuration: '320ms',
                            animationTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
                            animationDelay: `${idx * 14}ms`,
                            animationFillMode: 'forwards',
                          }}
                        >
                          {ch}
                        </span>
                      );
                    })}
                  </span>
                );
                return word;
              })}
              {li < lines.length - 1 ? <br /> : null}
            </span>
          );
        })}
      </span>
    );
  }

  return (
    <>
      <Head>
        <title>Tink AI Manager</title>
      </Head>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background:
            'radial-gradient(1400px 700px at 15% 20%, var(--bg-spot-1), transparent 60%),' +
            'radial-gradient(1200px 600px at 85% 80%, var(--bg-spot-2), transparent 60%),' +
            'linear-gradient(135deg, var(--bg-base-1) 0%, var(--bg-base-2) 45%, var(--bg-base-3) 100%)',
        }}
      />
      <DashboardLayout title="">
        {!hasConversation ? (
          <div
            style={{
              maxWidth: 1100,
              margin: '16px auto',
              padding: 0,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div
              style={{
                height: '58vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                position: 'relative',
                overflow: 'visible',
              }}
            >
              <div style={{ padding: '0 24px', maxWidth: 820 }}>
                <h1
                  style={{
                    fontSize: 40,
                    fontWeight: 800,
                    margin: '0 0 12px 0',
                    letterSpacing: '-0.02em',
                    color: '#0f172a',
                  }}
                >
                  Introducing Tink!
                </h1>
                <p
                  style={{
                    color: '#475569',
                    fontSize: 16,
                    lineHeight: 1.6,
                    margin: '0 0 24px 0',
                  }}
                >
                  Tink is your fastest, most helpful AI property manager — built for day‑to‑day operations with
                  reasoning baked in, so you get the right action every time.
                </p>

                <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask anything (e.g., list all my tenants)"
                    style={{
                      width: '70%',
                      maxWidth: 680,
                      padding: '14px 16px',
                      borderRadius: 999,
                      border: '1px solid var(--input-border)',
                      background: 'var(--input-bg)',
                      color: 'var(--text-color)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04) inset',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: '12px 18px',
                      borderRadius: 999,
                      border: '1px solid transparent',
                      background: loading ? '#9ca3af' : '#2563eb',
                      color: 'white',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    {loading ? 'Sending…' : 'Ask'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1, padding: '0 8px' }}>
            <div
              ref={viewportRef}
              style={{
                border: 'none',
                borderRadius: 0,
                height: 'calc(100vh - 240px)',
                overflowY: 'auto',
                padding: '16px 8px 160px',
                background: 'transparent',
              }}
            >
              <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
                {messages.map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div
                      style={{
                        maxWidth: m.ui ? 1180 : 720,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'keep-all',
                        overflowWrap: 'break-word',
                        background: m.role === 'user' ? 'var(--bubble-user)' : (m.ui ? 'var(--bubble-assistant-form)' : 'var(--bubble-assistant)'),
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-color)',
                        borderRadius: 18,
                        padding: '12px 14px',
                        backdropFilter: 'saturate(120%)',
                      }}
                    >
                      <div className={m.ui ? 'ai-form-bubble' : undefined}>{renderMessageContent(m)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <form
              onSubmit={sendMessage}
              style={{
                position: 'fixed',
                left: '50%',
                transform: 'translateX(-50%)',
                bottom: 24,
                zIndex: 2,
                maxWidth: 1280,
                width: 'min(1280px, calc(100% - 32px))',
                display: 'flex',
                gap: 8,
                padding: 0,
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                style={{
                  flex: 1,
                  padding: '14px 16px',
                  borderRadius: 999,
                  border: '1px solid var(--input-border)',
                  background: 'var(--input-bg)',
                  color: 'var(--text-color)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04) inset',
                }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px 18px',
                  borderRadius: 999,
                  border: '1px solid transparent',
                  background: loading ? '#9ca3af' : '#2563eb',
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
              >
                {loading ? 'Sending…' : 'Send'}
              </button>
            </form>
          </div>
        )}
      </DashboardLayout>
      <style jsx global>{`
        .dashboard-layout { background: transparent !important; }
        .dashboard-layout::before { background: none !important; }
        .dashboard-layout .page-header { display: none !important; }
        :root {
          --bg-spot-1: rgba(99,102,241,0.10);
          --bg-spot-2: rgba(124,58,237,0.10);
          --bg-base-1: #ffffff;
          --bg-base-2: #f7f9ff;
          --bg-base-3: #f4f0ff;
          --bubble-user: rgba(59,130,246,0.12);
          --bubble-assistant: rgba(15,23,42,0.06);
          --bubble-assistant-form: rgba(241,245,249,0.85);
          --border-color: rgba(148,163,184,0.28);
          --text-color: #0f172a;
          --input-bg: #ffffff;
          --input-border: #e5e7eb;
        }
        :global(.dark-mode) {
          --bg-spot-1: rgba(99,102,241,0.14);
          --bg-spot-2: rgba(124,58,237,0.16);
          --bg-base-1: #0a0a0a;
          --bg-base-2: #0b0b12;
          --bg-base-3: #0d0b14; /* subtle purple tint */
          --bubble-user: rgba(59,130,246,0.18);
          --bubble-assistant: rgba(255,255,255,0.06);
          --bubble-assistant-form: rgba(255,255,255,0.08);
          --border-color: rgba(148,163,184,0.22);
          --text-color: #e5e7eb;
          --input-bg: #111111;
          --input-border: #333333;
        }
        /* Ensure form elements inside chat bubbles honor variables */
        .ai-form-bubble input,
        .ai-form-bubble select,
        .ai-form-bubble textarea {
          background: var(--input-bg) !important;
          border: 1px solid var(--input-border) !important;
          color: var(--text-color) !important;
        }
        .ai-form-bubble option { color: initial; }
        /* USPhoneInput dark mode */
        .us-phone-input-container .phone-number-input {
          padding: 12px 14px;
          border-radius: 10px;
          background: var(--input-bg);
          border: 1px solid var(--input-border);
          color: var(--text-color);
        }
        .us-phone-input-container .country-code { color: var(--text-color); margin-left: 6px; }
        .us-phone-input-container .phone-input-error { color: #fca5a5; }
        @keyframes tinkFadeInChar {
          from { opacity: 0; transform: translateY(2px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes tinkFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        /* Two-column grid for chat forms at larger widths */
        .ai-form-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
        @media (min-width: 900px) {
          .ai-form-grid { grid-template-columns: 1fr 1fr; }
          .ai-form-grid .full-span { grid-column: 1 / -1; }
        }
      `}</style>
    </>
  );
}

export default withAuth(AiManagerPage, ['owner', 'manager', 'admin']); 