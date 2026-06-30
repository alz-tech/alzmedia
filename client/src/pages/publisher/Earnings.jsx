import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import StatsCard from '../../components/StatsCard';
import DataList from '../../components/DataList';
import { useToast } from '../../hooks/useToast';
import api from '../../services/api';

const ICON_W = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="5" width="20" height="15" rx="2"/><path d="M16 12h.01M2 10h20"/></svg>;
const ICON_E = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>;

function MiniSeries({ title, rows, emptyText, valueColor }) {
  return (
    <div className="card">
      <div className="card-title">{title}</div>
      {!rows?.length
        ? <p style={{ fontSize:14, color:'var(--text-muted)' }}>{emptyText}</p>
        : <div className="summary-list">
            {rows.map(r => (
              <div className="summary-row" key={r.date}>
                <span className="summary-label">{new Date(r.date).toLocaleDateString()}</span>
                <span className="summary-val" style={valueColor ? { color: valueColor } : undefined}>
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

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">Earnings</h1>
        <p className="page-subtitle">Track your revenue and transaction history</p>
      </div>

      <div className="stats-grid">
        <StatsCard label="Wallet Balance" icon={ICON_W} color="purple"
          value={loading ? '—' : `₦${Number(data?.wallet_balance || 0).toLocaleString()}`} />
        <StatsCard label="Total Earned" icon={ICON_E} color="green"
          value={loading ? '—' : `₦${Number(data?.total_earned || 0).toLocaleString()}`} />
      </div>

      {!loading && data && (
        <div className="card-grid-2 section-gap">
          <MiniSeries title="Impressions — Last 30 days" rows={data.impressions} emptyText="No data yet" />
          <MiniSeries title="Clicks — Last 30 days" rows={data.clicks} emptyText="No data yet" valueColor="var(--green)" />
        </div>
      )}

      <div className="card">
        <div className="card-title">Transaction History</div>
        <DataList columns={txColumns} data={data?.transactions} loading={loading} emptyMessage="No transactions yet." />
      </div>
    </DashboardLayout>
  );
}
