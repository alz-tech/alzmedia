import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import DataList from '../../components/DataList';
import { useToast } from '../../hooks/useToast';
import api from '../../services/api';

// Real SVG icons for each platform type
const PLATFORM_ICONS = {
  website:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 3c-4 4-4 14 0 18m0-18c4 4 4 14 0 18M3 12h18"/></svg>,
  mobile_app: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 18h4" strokeLinecap="round"/></svg>,
  android:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="5" y="7" width="14" height="13" rx="2"/><path d="M9 3l1.5 2.5M15 3l-1.5 2.5M5 12H3m18 0h-2" strokeLinecap="round"/><circle cx="9.5" cy="11.5" r="0.7" fill="currentColor" stroke="none"/><circle cx="14.5" cy="11.5" r="0.7" fill="currentColor" stroke="none"/></svg>,
  ios:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 19h4" strokeLinecap="round"/></svg>,
  telegram:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinejoin="round" strokeLinecap="round"/></svg>,
  whatsapp:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 11.5a8.5 8.5 0 01-12.4 7.5L3 20l1.1-5.5A8.5 8.5 0 1121 11.5z" strokeLinejoin="round"/><path d="M8.5 9.5c0 3 2.5 5.5 5.5 5.5" strokeLinecap="round"/></svg>,
  youtube:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M10 9l5 3-5 3V9z" fill="currentColor" stroke="none"/></svg>,
  other:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>,
};

// Professional platform options
const PLATFORMS = [
  { value: 'website',     label: 'Website',      desc: 'A web-based site or blog' },
  { value: 'mobile_app',  label: 'Mobile App',   desc: 'iOS or Android application' },
  { value: 'android',     label: 'Android App',  desc: 'Google Play / APK' },
  { value: 'ios',         label: 'iOS App',      desc: 'App Store application' },
  { value: 'telegram',    label: 'Telegram',     desc: 'Bot, channel or group' },
  { value: 'whatsapp',    label: 'WhatsApp',     desc: 'Channel or community' },
  { value: 'youtube',     label: 'YouTube',      desc: 'Channel or video content' },
  { value: 'other',       label: 'Other',        desc: 'Any other platform' },
];

function PlatformSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = PLATFORMS.find(p => p.value === value) || PLATFORMS[0];

  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="custom-select-wrapper" ref={ref}>
      <div
        className={`custom-select-trigger${open ? ' open' : ''}`}
        onClick={() => setOpen(o => !o)}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && setOpen(o => !o)}
      >
        <span className="custom-select-icon">{PLATFORM_ICONS[selected.value]}</span>
        <span style={{ flex: 1, fontWeight: 500 }}>{selected.label}</span>
        <svg className="custom-select-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      {open && (
        <div className="custom-select-dropdown">
          {PLATFORMS.map(p => (
            <div
              key={p.value}
              className={`custom-select-option${p.value === value ? ' selected' : ''}`}
              onClick={() => { onChange(p.value); setOpen(false); }}
            >
              <span className="custom-select-option-icon">{PLATFORM_ICONS[p.value]}</span>
              <div>
                <div className="custom-select-option-label">{p.label}</div>
                <div className="custom-select-option-desc">{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sites() {
  const { success, error } = useToast();
  const [sites, setSites]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '', url: '', platform_type: 'website', monthly_traffic: '',
  });

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const setPlatform = (val) => setForm(p => ({ ...p, platform_type: val }));

  function load() {
    setLoading(true);
    api.get('/publisher/sites')
      .then(r => setSites(r.data.data))
      .catch(() => error('Failed to load sites'))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.name || !form.platform_type) return error('Name and platform type are required');
    setSubmitting(true);
    try {
      await api.post('/publisher/sites', form);
      success('Site submitted for review');
      setShowForm(false);
      setForm({ name: '', url: '', platform_type: 'website', monthly_traffic: '' });
      load();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to add site');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/publisher/sites/${id}`);
      success('Site removed');
      load();
    } catch {
      error('Cannot delete an approved or rejected site');
    }
  }

  const getPlatformLabel = (val) => PLATFORMS.find(p => p.value === val)?.label || val;

  const statusBadge = (s) => <span className={`badge badge-${s}`}>{s}</span>;

  const columns = [
    { key: 'name',          label: 'Name' },
    { key: 'platform_type', label: 'Platform', render: v => (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
        <span style={{ display: 'inline-flex', width: 15, height: 15 }}>{PLATFORM_ICONS[v]}</span>
        {getPlatformLabel(v)}
      </span>
    )},
    { key: 'url', label: 'URL', render: v => v
      ? <a href={v} target="_blank" rel="noreferrer" style={{ color: 'var(--purple-lt)', fontSize: 13 }}>{v}</a>
      : <span style={{ color: 'var(--text-dim)' }}>—</span>
    },
    { key: 'status', label: 'Status', render: statusBadge },
    { key: 'id', label: 'Action', actions: true, render: (_, row) => row.status === 'pending'
        ? <button className="btn btn-danger btn-sm" onClick={() => handleDelete(row.id)}>Remove</button>
        : null
    },
  ];

  return (
    <DashboardLayout>
      <div className="page-header-row">
        <div className="page-header">
          <h1 className="page-title">My Sites</h1>
          <p className="page-subtitle">Manage your registered websites and apps</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
          {showForm ? 'Cancel' : '+ Add Site'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 28 }}>
          <div className="card-title">Add New Site / App</div>
          <form onSubmit={handleAdd}>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-input" placeholder="My Blog" value={form.name} onChange={set('name')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Platform Type *</label>
                <PlatformSelect value={form.platform_type} onChange={setPlatform} />
              </div>
              <div className="form-group">
                <label className="form-label">URL <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>(optional)</span></label>
                <input className="form-input" placeholder="https://yoursite.com" value={form.url} onChange={set('url')} />
              </div>
              <div className="form-group">
                <label className="form-label">Monthly Traffic <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>(optional)</span></label>
                <input className="form-input" placeholder="e.g. 10,000 visitors" value={form.monthly_traffic} onChange={set('monthly_traffic')} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <span className="spinner" /> : 'Submit for Review'}
            </button>
          </form>
        </div>
      )}

      <DataList
        columns={columns}
        data={sites}
        loading={loading}
        emptyMessage="No sites added yet. Add your first site above."
      />
    </DashboardLayout>
  );
}
