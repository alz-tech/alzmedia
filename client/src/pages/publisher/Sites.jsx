import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Table from '../../components/Table';
import { useToast } from '../../hooks/useToast';
import api from '../../services/api';

const PLATFORM_TYPES = ['website','android','windows','telegram','other'];

export default function Sites() {
  const { success, error } = useToast();
  const [sites, setSites]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name:'', url:'', platform_type:'website', monthly_traffic:'' });

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

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
      setForm({ name:'', url:'', platform_type:'website', monthly_traffic:'' });
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

  const statusBadge = (s) => <span className={`badge badge-${s}`}>{s}</span>;

  const columns = [
    { key:'name',          label:'Name' },
    { key:'platform_type', label:'Platform' },
    { key:'url',           label:'URL', render: v => v ? <a href={v} target="_blank" rel="noreferrer" style={{color:'var(--purple-lt)'}}>{v}</a> : '—' },
    { key:'status',        label:'Status', render: statusBadge },
    { key:'id',            label:'', width:80, render:(_,row) => row.status === 'pending'
        ? <button className="btn btn-danger btn-sm" onClick={() => handleDelete(row.id)}>Remove</button>
        : null },
  ];

  return (
    <DashboardLayout>
      <div className="page-header" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <h1 className="page-title">My Sites</h1>
          <p className="page-subtitle">Manage your registered websites and apps</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
          {showForm ? 'Cancel' : '+ Add Site'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom:24 }}>
          <div className="card-title">Add New Site / App</div>
          <form onSubmit={handleAdd}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-input" placeholder="My Blog" value={form.name} onChange={set('name')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Platform Type *</label>
                <select className="form-select" value={form.platform_type} onChange={set('platform_type')}>
                  {PLATFORM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">URL (optional)</label>
                <input className="form-input" placeholder="https://yoursite.com" value={form.url} onChange={set('url')} />
              </div>
              <div className="form-group">
                <label className="form-label">Monthly Traffic (optional)</label>
                <input className="form-input" placeholder="e.g. 10,000 visitors" value={form.monthly_traffic} onChange={set('monthly_traffic')} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <span className="spinner" /> : 'Submit for Review'}
            </button>
          </form>
        </div>
      )}

      <Table columns={columns} data={sites} loading={loading} emptyMessage="No sites added yet. Add your first site above." />
    </DashboardLayout>
  );
}
