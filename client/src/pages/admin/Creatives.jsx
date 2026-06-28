import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Table from '../../components/Table';
import { useToast } from '../../hooks/useToast';
import api from '../../services/api';

export default function AdminCreatives() {
  const { success, error } = useToast();
  const [creatives, setCreatives] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [reasons,   setReasons]   = useState({});

  function load() {
    setLoading(true);
    api.get('/admin/creatives/pending')
      .then(r => setCreatives(r.data.data))
      .catch(() => error('Failed to load creatives'))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  async function review(id, status) {
    const reason = reasons[id];
    if (status === 'rejected' && !reason?.trim()) return error('Enter rejection reason');
    try {
      await api.patch(`/admin/creatives/${id}/review`, { status, rejection_reason: reason });
      success(`Creative ${status}`);
      load();
    } catch { error('Failed to update creative'); }
  }

  const columns = [
    { key:'advertiser_name', label:'Advertiser' },
    { key:'campaign_name',   label:'Campaign' },
    { key:'creative_type',   label:'Type' },
    { key:'headline',        label:'Headline', render: v => v || '—' },
    { key:'file_url',        label:'Preview',  render: v => v
        ? <a href={v} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">View</a>
        : '—' },
    { key:'id', label:'Action', width:300, render:(_,row) => (
      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
        <input className="form-input" style={{ width:140, padding:'5px 10px', fontSize:12 }}
          placeholder="Rejection reason" value={reasons[row.id] || ''}
          onChange={e => setReasons(p => ({ ...p, [row.id]: e.target.value }))} />
        <button className="btn btn-primary btn-sm" onClick={() => review(row.id,'approved')}>Approve</button>
        <button className="btn btn-danger btn-sm"  onClick={() => review(row.id,'rejected')}>Reject</button>
      </div>
    )},
  ];

  return (
    <DashboardLayout>
      <div className="page-header"><h1 className="page-title">Pending Creatives</h1></div>
      <Table columns={columns} data={creatives} loading={loading} emptyMessage="No pending creatives." />
    </DashboardLayout>
  );
}
