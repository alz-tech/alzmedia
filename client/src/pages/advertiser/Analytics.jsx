import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { useToast } from '../../hooks/useToast';
import api from '../../services/api';

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

  if (loading) return <DashboardLayout><div style={{ padding:40, color:'var(--text-muted)' }}>Loading analytics...</div></DashboardLayout>;

  const camp = data?.campaign;

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">{camp?.name || 'Campaign Analytics'}</h1>
        <p className="page-subtitle">Performance over the last 30 days</p>
      </div>

      <div className="stats-grid" style={{ marginBottom:24 }}>
        {[
          { label:'Status',  val: <span className={`badge badge-${camp?.status}`}>{camp?.status}</span> },
          { label:'Budget',  val: `₦${Number(camp?.budget||0).toLocaleString()}` },
          { label:'Spent',   val: `₦${Number(camp?.spent||0).toLocaleString()}` },
          { label:'Bid',     val: `₦${Number(camp?.bid_amount||0).toLocaleString()} ${camp?.bid_type?.toUpperCase()}` },
        ].map(({ label, val }) => (
          <div key={label} className="card" style={{ padding:'20px 24px' }}>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.8px' }}>{label}</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700 }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div className="card">
          <div className="card-title">Impressions</div>
          {!data?.impressions?.length
            ? <p style={{ fontSize:14, color:'var(--text-muted)' }}>No impressions yet</p>
            : data.impressions.map(r => (
                <div key={r.date} style={{ display:'flex', justifyContent:'space-between', fontSize:13, padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ color:'var(--text-muted)' }}>{new Date(r.date).toLocaleDateString()}</span>
                  <span style={{ fontWeight:600 }}>{Number(r.count).toLocaleString()}</span>
                </div>
              ))}
        </div>
        <div className="card">
          <div className="card-title">Clicks</div>
          {!data?.clicks?.length
            ? <p style={{ fontSize:14, color:'var(--text-muted)' }}>No clicks yet</p>
            : data.clicks.map(r => (
                <div key={r.date} style={{ display:'flex', justifyContent:'space-between', fontSize:13, padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ color:'var(--text-muted)' }}>{new Date(r.date).toLocaleDateString()}</span>
                  <span style={{ fontWeight:600, color:'var(--green)' }}>{Number(r.valid).toLocaleString()}</span>
                  {r.fraud > 0 && <span style={{ fontSize:11, color:'var(--red)' }}>+{r.fraud} fraud</span>}
                </div>
              ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
