import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { useToast } from '../../hooks/useToast';
import api from '../../services/api';

function MiniSeries({ title, rows, emptyText }) {
  return (
    <div className="card">
      <div className="card-title">{title}</div>
      {!rows?.length
        ? <p style={{ fontSize:14, color:'var(--text-muted)' }}>{emptyText}</p>
        : <div className="summary-list">
            {rows.map(r => (
              <div className="summary-row" key={r.date}>
                <span className="summary-label">{new Date(r.date).toLocaleDateString()}</span>
                <span className="summary-val" style={{ color: 'var(--green)' }}>
                  {Number(r.count ?? r.valid ?? 0).toLocaleString()}
                  {r.fraud > 0 && <span style={{ fontSize:11, color:'var(--red)', marginLeft:6, fontWeight:400 }}>+{r.fraud} fraud</span>}
                </span>
              </div>
            ))}
          </div>
      }
    </div>
  );
}

export default function Analytics() {
  const { id }             = useParams();
  const { error }          = useToast();
  const [data, setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.get(`/advertiser/campaigns/${id}/analytics`)
      .then(r => setData(r.data.data))
      .catch(() => error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <DashboardLayout><div style={{ padding:'40px 0', color:'var(--text-muted)' }}>Loading analytics...</div></DashboardLayout>;

  const camp = data?.campaign;

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">{camp?.name || 'Campaign Analytics'}</h1>
        <p className="page-subtitle">Performance over the last 30 days</p>
      </div>

      <div className="stats-grid">
        <div className="mini-stat-card">
          <div className="mini-stat-label">Status</div>
          <div className="mini-stat-val"><span className={`badge badge-${camp?.status}`}>{camp?.status}</span></div>
        </div>
        <div className="mini-stat-card">
          <div className="mini-stat-label">Budget</div>
          <div className="mini-stat-val">₦{Number(camp?.budget||0).toLocaleString()}</div>
        </div>
        <div className="mini-stat-card">
          <div className="mini-stat-label">Spent</div>
          <div className="mini-stat-val">₦{Number(camp?.spent||0).toLocaleString()}</div>
        </div>
        <div className="mini-stat-card">
          <div className="mini-stat-label">Bid</div>
          <div className="mini-stat-val">₦{Number(camp?.bid_amount||0).toLocaleString()} {camp?.bid_type?.toUpperCase()}</div>
        </div>
      </div>

      <div className="card-grid-2">
        <MiniSeries title="Impressions" rows={data?.impressions} emptyText="No impressions yet" />
        <MiniSeries title="Clicks" rows={data?.clicks} emptyText="No clicks yet" />
      </div>
    </DashboardLayout>
  );
}
