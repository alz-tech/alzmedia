import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import DataList from '../../components/DataList';
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
    { key:'id', label:'Review', actions: true, render:(_,row) => row.status !== 'pending' ? null : (
      <div className="review-action">
        <input className="form-input" placeholder="Rejection reason (if rejecting)"
          value={reasons[row.id] || ''}
          onChange={e => setReasons(p => ({ ...p, [row.id]: e.target.value }))} />
        <div className="review-action-btns">
          <button className="btn btn-primary btn-sm" onClick={() => review(row.id,'active')}>Approve</button>
          <button className="btn btn-danger btn-sm"  onClick={() => review(row.id,'rejected')}>Reject</button>
        </div>
      </div>
    )},
  ];

  return (
    <DashboardLayout>
      <div className="page-header"><h1 className="page-title">Campaigns</h1></div>
      <div className="filter-pill-row">
        {['pending','active','rejected','paused'].map(s => (
          <button key={s} className={`filter-pill ${status===s ? 'active' : ''}`} onClick={() => setStatus(s)}>{s}</button>
        ))}
      </div>
      <DataList columns={columns} data={campaigns} loading={loading} emptyMessage="No campaigns." />
    </DashboardLayout>
  );
}
