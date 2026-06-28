import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import StatsCard from '../../components/StatsCard';
import Table from '../../components/Table';
import { useToast } from '../../hooks/useToast';
import api from '../../services/api';

export default function Earnings() {
  const { error }          = useToast();
  const [data, setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/publisher/earnings')
      .then(r => setData(r.data.data))
      .catch(() => error('Failed to load earnings'))
      .finally(() => setLoading(false));
  }, []);

  const txColumns = [
    { key:'created_at', label:'Date',   render: v => new Date(v).toLocaleDateString() },
    { key:'type',       label:'Type',   render: v => v.replace(/_/g,' ') },
    { key:'amount',     label:'Amount', render: v => `₦${Number(v).toLocaleString()}` },
    { key:'status',     label:'Status', render: v => <span className={`badge badge-${v}`}>{v}</span> },
  ];

  const ICON_W = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="5" width="20" height="15" rx="2"/><path d="M16 12h.01M2 10h20"/></svg>;
  const ICON_E = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>;

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">Earnings</h1>
        <p className="page-subtitle">Track your revenue and transaction history</p>
      </div>

      <div className="stats-grid" style={{ marginBottom:32 }}>
        <StatsCard label="Wallet Balance" icon={ICON_W} color="purple"
          value={loading ? '—' : `₦${Number(data?.wallet_balance || 0).toLocaleString()}`} />
        <StatsCard label="Total Earned" icon={ICON_E} color="green"
          value={loading ? '—' : `₦${Number(data?.total_earned || 0).toLocaleString()}`} />
      </div>

      {!loading && data && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:32 }}>
          <div className="card">
            <div className="card-title">Impressions — Last 30 days</div>
            {data.impressions.length === 0
              ? <p style={{ color:'var(--text-muted)', fontSize:14 }}>No data yet</p>
              : data.impressions.map(r => (
                  <div key={r.date} style={{ display:'flex', justifyContent:'space-between', fontSize:13, padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
                    <span style={{ color:'var(--text-muted)' }}>{new Date(r.date).toLocaleDateString()}</span>
                    <span style={{ fontWeight:600 }}>{Number(r.count).toLocaleString()}</span>
                  </div>
                ))}
          </div>
          <div className="card">
            <div className="card-title">Clicks — Last 30 days</div>
            {data.clicks.length === 0
              ? <p style={{ color:'var(--text-muted)', fontSize:14 }}>No data yet</p>
              : data.clicks.map(r => (
                  <div key={r.date} style={{ display:'flex', justifyContent:'space-between', fontSize:13, padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
                    <span style={{ color:'var(--text-muted)' }}>{new Date(r.date).toLocaleDateString()}</span>
                    <span style={{ fontWeight:600 }}>{Number(r.count).toLocaleString()}</span>
                  </div>
                ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-title">Transaction History</div>
        <Table columns={txColumns} data={data?.transactions} loading={loading} emptyMessage="No transactions yet." />
      </div>
    </DashboardLayout>
  );
}
