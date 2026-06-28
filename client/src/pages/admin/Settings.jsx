import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useToast } from '../../hooks/useToast';
import api from '../../services/api';

export default function AdminSettings() {
  const { success, error } = useToast();
  const [settings, setSettings] = useState({});
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState({});

  useEffect(() => {
    api.get('/admin/settings')
      .then(r => setSettings(r.data.data))
      .catch(() => error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  async function save(key) {
    setSaving(p => ({ ...p, [key]: true }));
    try {
      await api.put('/admin/settings', { key, value: settings[key] });
      success(`${key} updated`);
    } catch { error('Failed to update setting'); }
    finally { setSaving(p => ({ ...p, [key]: false })); }
  }

  const LABELS = {
    platform_cut:   'Platform Cut (%)',
    publisher_cut:  'Publisher Cut (%)',
    min_withdrawal: 'Minimum Withdrawal (₦)',
    default_cpm:    'Default CPM (₦)',
    default_cpc:    'Default CPC (₦)',
    max_file_size:  'Max File Size (MB)',
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">Platform Settings</h1>
        <p className="page-subtitle">Adjust global platform configuration</p>
      </div>

      <div className="card" style={{ maxWidth:560 }}>
        {loading
          ? <div style={{ color:'var(--text-muted)', fontSize:14 }}>Loading settings...</div>
          : Object.entries(LABELS).map(([key, label]) => (
              <div key={key} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                <div className="form-group" style={{ flex:1, marginBottom:0 }}>
                  <label className="form-label">{label}</label>
                  <input className="form-input" type="number"
                    value={settings[key] || ''}
                    onChange={e => setSettings(p => ({ ...p, [key]: e.target.value }))} />
                </div>
                <button className="btn btn-primary btn-sm" style={{ marginTop:20 }}
                  onClick={() => save(key)} disabled={saving[key]}>
                  {saving[key] ? <span className="spinner" style={{ width:14, height:14, borderWidth:2 }} /> : 'Save'}
                </button>
              </div>
            ))
        }
      </div>
    </DashboardLayout>
  );
}
