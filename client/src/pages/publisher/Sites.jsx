import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Table from '../../components/Table';
import { useToast } from '../../hooks/useToast';
import api from '../../services/api';

// Professional platform options with icons + descriptions
const PLATFORMS = [
  { value: 'website',     label: 'Website',      icon: '🌐', desc: 'A web-based site or blog' },
  { value: 'mobile_app',  label: 'Mobile App',   icon: '📱', desc: 'iOS or Android application' },
  { value: 'android',     label: 'Android App',  icon: '🤖', desc: 'Google Play / APK' },
  { value: 'ios',         label: 'iOS App',      icon: '🍎', desc: 'App Store application' },
  { value: 'telegram',    label: 'Telegram',     icon: '✈️', desc: 'Bot, channel or group' },
  { value: 'whatsapp',    label: 'WhatsApp',     icon: '💬', desc: 'Channel or community' },
  { value: 'youtube',     label: 'YouTube',      icon: '▶️', desc: 'Channel or video content' },
  { value: 'other',       label: 'Other',        icon: '📦', desc: 'Any other platform' },
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
        <span>{selected.icon}</span>
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
              <span className="custom-select-option-icon">{p.icon}</span>
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
  const getPlatformIcon  = (val) => PLATFORMS.find(p => p.value === val)?.icon || '📦';

  const statusBadge = (s) => <span className={`badge badge-${s}`}>{s}</span>;

  const columns = [
    { key: 'name',          label: 'Name' },
    { key: 'platform_type', label: 'Platform', render: v => (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
        {getPlatformIcon(v)} {getPlatformLabel(v)}
      </span>
    )},
    { key: 'url', label: 'URL', render: v => v
      ? <a href={v} target="_blank" rel="noreferrer" style={{ color: 'var(--purple-lt)', fontSize: 13 }}>{v}</a>
      : <span style={{ color: 'var(--text-dim)' }}>—</span>
    },
    { key: 'status', label: 'Status', render: statusBadge },
    { key: 'id', label: '', width: 90, render: (_, row) => row.status === 'pending'
        ? <button className="btn btn-danger btn-sm" onClick={() => handleDelete(row.id)}>Remove</button>
        : null
    },
  ];

  return (
    <DashboardLayout>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
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

      <Table
        columns={columns}
        data={sites}
        loading={loading}
        emptyMessage="No sites added yet. Add your first site above."
      />
    </DashboardLayout>
  );
}
