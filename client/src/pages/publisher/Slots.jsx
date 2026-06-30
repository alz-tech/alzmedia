import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import DataList from '../../components/DataList';
import { useToast } from '../../hooks/useToast';
import api from '../../services/api';

const SLOT_TYPES = ['banner','in-content','video','native'];
const SIZES      = ['728x90','300x250','320x50','160x600','native'];

export default function Slots() {
  const { success, error } = useToast();
  const [slots,   setSlots]   = useState([]);
  const [sites,   setSites]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ site_id:'', name:'', slot_type:'banner', size:'300x250' });

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  function load() {
    setLoading(true);
    Promise.all([
      api.get('/publisher/slots'),
      api.get('/publisher/sites'),
    ]).then(([slotsRes, sitesRes]) => {
      setSlots(slotsRes.data.data);
      setSites(sitesRes.data.data.filter(s => s.status === 'approved'));
    }).catch(() => error('Failed to load data'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.site_id || !form.name || !form.slot_type) return error('All required fields must be filled');
    setSubmitting(true);
    try {
      await api.post('/publisher/slots', form);
      success('Ad slot created');
      setShowForm(false);
      setForm({ site_id:'', name:'', slot_type:'banner', size:'300x250' });
      load();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to create slot');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleSlot(id) {
    try {
      const res = await api.patch(`/publisher/slots/${id}/toggle`);
      success(`Slot ${res.data.data.is_active ? 'activated' : 'paused'}`);
      load();
    } catch { error('Failed to toggle slot'); }
  }

  async function deleteSlot(id) {
    try {
      await api.delete(`/publisher/slots/${id}`);
      success('Slot deleted');
      load();
    } catch { error('Failed to delete slot'); }
  }

  const columns = [
    { key:'name',      label:'Slot Name' },
    { key:'site_name', label:'Site' },
    { key:'slot_type', label:'Type' },
    { key:'size',      label:'Size', render: v => v || '—' },
    { key:'is_active', label:'Status', render: v => <span className={`badge ${v ? 'badge-active' : 'badge-paused'}`}>{v ? 'Active' : 'Paused'}</span> },
    { key:'id', label:'Action', actions: true, render:(_,row) => (
      <>
        <button className="btn btn-ghost btn-sm" onClick={() => toggleSlot(row.id)}>
          {row.is_active ? 'Pause' : 'Activate'}
        </button>
        <button className="btn btn-danger btn-sm" onClick={() => deleteSlot(row.id)}>Delete</button>
      </>
    )},
  ];

  return (
    <DashboardLayout>
      <div className="page-header-row">
        <div className="page-header">
          <h1 className="page-title">Ad Slots</h1>
          <p className="page-subtitle">Create and manage ad slots for your approved sites</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(s => !s)} disabled={!sites.length}>
          {showForm ? 'Cancel' : '+ New Slot'}
        </button>
      </div>

      {!sites.length && !loading && (
        <div className="card section-gap" style={{ textAlign:'center', color:'var(--text-muted)' }}>
          You need at least one approved site before creating ad slots.
        </div>
      )}

      {showForm && (
        <div className="card section-gap">
          <div className="card-title">Create Ad Slot</div>
          <form onSubmit={handleCreate}>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Site *</label>
                <select className="form-select" value={form.site_id} onChange={set('site_id')} required>
                  <option value="">Select site</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Slot Name *</label>
                <input className="form-input" placeholder="Header Banner" value={form.name} onChange={set('name')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Slot Type *</label>
                <select className="form-select" value={form.slot_type} onChange={set('slot_type')}>
                  {SLOT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Size</label>
                <select className="form-select" value={form.size} onChange={set('size')}>
                  {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <span className="spinner" /> : 'Create Slot'}
            </button>
          </form>
        </div>
      )}

      <DataList columns={columns} data={slots} loading={loading} emptyMessage="No ad slots yet." />
    </DashboardLayout>
  );
}
