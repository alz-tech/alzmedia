import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Table from '../../components/Table';
import { useToast } from '../../hooks/useToast';
import api from '../../services/api';

export default function AdminCampaigns() {
  const { success, error } = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [status,    setStatus]    = useState('pending');
  const [reasons,   setReasons]   = useState({});

  function load() {
    setLoading(true);
    api.get('/admin/campaigns', { params: { status } })
      .then(r => setCampaigns(r.data.data))
      .catch(() => error('Failed to load campaigns'))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, [status]);

  async function review(id, newStatus) {
    const reason = reasons[id];
    if (newStatus === 'rejected' && !reason?.trim()) return error('Enter rejection reason');
    try {
      await api.patch(`/admin/campaigns/${id}/review`, { status: newStatus, rejection_reason: reason });
      success(`Campaign ${newStatus}`);
      load();
    } catch { error('Failed to update campaign'); }
  }

  const columns = [
    { key:'name',            label:'Campaign' },
    { key:'advertiser_name', label:'Advertiser' },
    { key:'bid_type',        label:'Type',   render: v => v?.toUpperCase() },
    { key:'budget',          label:'Budget', render: v => `₦${Number(v).toLocaleString()}` },
    { key:'status',          label:'Status', render: v => <span className={`badge badge-${v}`}>{v}</span> },
    { key:'id', label:'Action', width:300, render:(_,row) => row.status !== 'pending' ? null : (
      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
        <input className="form-input" style={{ width:140, padding:'5px 10px', fontSize:12 }}
          placeholder="Rejection reason" value={reasons[row.id] || ''}
          onChange={e => setReasons(p => ({ ...p, [row.id]: e.target.value }))} />
        <button className="btn btn-primary btn-sm" onClick={() => review(row.id,'active')}>Approve</button>
        <button className="btn btn-danger btn-sm"  onClick={() => review(row.id,'rejected')}>Reject</button>
      </div>
    )},
  ];

  return (
    <DashboardLayout>
      <div className="page-header"><h1 className="page-title">Campaigns</h1></div>
      <div style={{ display:'flex', gap:10, marginBottom:20 }}>
        {['pending','active','rejected','paused'].map(s => (
          <button key={s} className={`btn btn-sm ${status===s?'btn-primary':'btn-ghost'}`} onClick={() => setStatus(s)}>{s}</button>
        ))}
      </div>
      <Table columns={columns} data={campaigns} loading={loading} emptyMessage="No campaigns." />
    </DashboardLayout>
  );
}
