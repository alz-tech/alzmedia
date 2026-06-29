import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import StatsCard from '../../components/StatsCard';
import LiveChart from '../../components/LiveChart';
import { useToast } from '../../hooks/useToast';
import api from '../../services/api';

const ICON_U = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
const ICON_C = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 12h4l3-9 4 18 3-9h4"/></svg>;

export default function AdminDashboard() {
  const { error }       = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(r => setData(r.data.data))
      .catch(() => error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const pend = data?.pending || {};

  const pendingItems = [
    { label: 'Sites pending',       val: pend.pending_sites,       href: '/admin/sites',     color: 'var(--yellow)' },
    { label: 'Creatives pending',   val: pend.pending_creatives,   href: '/admin/creatives', color: 'var(--yellow)' },
    { label: 'Campaigns pending',   val: pend.pending_campaigns,   href: '/admin/campaigns', color: 'var(--yellow)' },
    { label: 'Withdrawals pending', val: pend.pending_withdrawals, href: '/admin/payouts',   color: 'var(--red)' },
  ];

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Platform overview and pending actions</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <StatsCard label="Total Users"     icon={ICON_U} color="purple"
          value={loading ? '—' : data?.total_users || 0} />
        <StatsCard label="Total Campaigns" icon={ICON_C} color="green"
          value={loading ? '—' : data?.total_campaigns || 0} />
      </div>

      {/* Platform activity chart */}
      <div className="card" style={{ marginBottom: 24 }}>
        <LiveChart
          animated
          color="purple"
          title="Platform activity"
          height={180}
        />
      </div>

      {/* Pending actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {pendingItems.map(({ label, val, href, color }) => (
          <a key={label} href={href} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ cursor: 'pointer' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400, marginBottom: 10 }}>{label}</div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 28,
                fontWeight: 600,
                color: loading || !val ? 'var(--text)' : color,
              }}>
                {loading ? '—' : val || 0}
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Revenue */}
      <div className="card">
        <div className="card-title">Revenue summary</div>
        {loading
          ? <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading...</div>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
              {(data?.revenue || []).map(r => (
                <div key={r.type} style={{
                  background: 'var(--bg3)',
                  borderRadius: 'var(--radius)',
                  padding: '16px 18px',
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 500 }}>
                    {r.type.replace(/_/g, ' ')}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, marginBottom: 4 }}>
                    ₦{Number(r.total || 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>{r.count} transactions</div>
                </div>
              ))}
            </div>
        }
      </div>
    </DashboardLayout>
  );
}
