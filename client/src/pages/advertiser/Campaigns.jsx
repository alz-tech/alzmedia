import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import DataList from '../../components/DataList';
import { useToast } from '../../hooks/useToast';
import api from '../../services/api';

export default function Campaigns() {
  const { success, error } = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading]     = useState(true);

  function load() {
    setLoading(true);
    api.get('/advertiser/campaigns')
      .then(r => setCampaigns(r.data.data))
      .catch(() => error('Failed to load campaigns'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function toggle(id, current) {
    const next = current === 'active' ? 'paused' : 'active';
    try {
      await api.patch(`/advertiser/campaigns/${id}/status`, { status: next });
      success(`Campaign ${next}`);
      load();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update status');
    }
  }

  const columns = [
    { key:'name',        label:'Campaign' },
    { key:'bid_type',    label:'Type',   render: v => v?.toUpperCase() },
    { key:'bid_amount',  label:'Bid',    render: v => `₦${Number(v).toLocaleString()}` },
    { key:'budget',      label:'Budget', render: v => `₦${Number(v).toLocaleString()}` },
    { key:'spent',       label:'Spent',  render: v => `₦${Number(v).toLocaleString()}` },
    { key:'status',      label:'Status', render: v => <span className={`badge badge-${v}`}>{v}</span> },
    { key:'id', label:'Action', actions: true, render:(_,row) => (
      <>
        <Link className="btn btn-ghost btn-sm" to={`/advertiser/campaigns/${row.id}/analytics`}>Analytics</Link>
        <Link className="btn btn-ghost btn-sm" to={`/advertiser/campaigns/${row.id}/creatives`}>Creatives</Link>
        {['active','paused'].includes(row.status) && (
          <button className="btn btn-secondary btn-sm" onClick={() => toggle(row.id, row.status)}>
            {row.status === 'active' ? 'Pause' : 'Resume'}
          </button>
        )}
      </>
    )},
  ];

  return (
    <DashboardLayout>
      <div className="page-header-row">
        <div className="page-header">
          <h1 className="page-title">Campaigns</h1>
          <p className="page-subtitle">Manage your ad campaigns</p>
        </div>
        <Link className="btn btn-primary" to="/advertiser/campaigns/new">+ New Campaign</Link>
      </div>
      <DataList columns={columns} data={campaigns} loading={loading} emptyMessage="No campaigns yet. Create your first campaign." />
    </DashboardLayout>
  );
}
