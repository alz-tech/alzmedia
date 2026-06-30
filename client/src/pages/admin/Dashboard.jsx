import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import StatsCard from '../../components/StatsCard';
import LiveChart from '../../components/LiveChart';
import { useToast } from '../../hooks/useToast';
import api from '../../services/api';
import '../publisher/Dashboard.css';

const ICON_U = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>;
const ICON_C = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 12h4l3-9 4 18 3-9h4"/></svg>;

const ICON_SITES_PEND     = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 3c-4 4-4 14 0 18m0-18c4 4 4 14 0 18M3 12h18"/></svg>;
const ICON_CREATIVES_PEND = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M3 9h6M3 15h6"/></svg>;
const ICON_CAMPAIGNS_PEND = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 12h4l3-9 4 18 3-9h4"/></svg>;
const ICON_PAYOUTS_PEND   = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>;

const PENDING_LINKS = [
  { key: 'pending_sites',       label: 'Sites',       icon: ICON_SITES_PEND,     to: '/admin/sites' },
  { key: 'pending_creatives',   label: 'Creatives',   icon: ICON_CREATIVES_PEND, to: '/admin/creatives' },
  { key: 'pending_campaigns',   label: 'Campaigns',   icon: ICON_CAMPAIGNS_PEND, to: '/admin/campaigns' },
  { key: 'pending_withdrawals', label: 'Withdrawals', icon: ICON_PAYOUTS_PEND,   to: '/admin/payouts' },
];

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
  const hasPending = Object.values(pend).some(v => v > 0);

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Platform overview</p>
      </div>

      <div className="stats-grid">
        <StatsCard label="Total Users"     icon={ICON_U} color="purple"
          value={loading ? '—' : data?.total_users || 0} />
        <StatsCard label="Total Campaigns" icon={ICON_C} color="green"
          value={loading ? '—' : data?.total_campaigns || 0} />
      </div>

      {/* Platform chart */}
      <div className="card section-gap">
        <LiveChart
          data={[]}
          color="purple"
          title="Platform activity — last 30 days"
          isLive={false}
          height={150}
        />
      </div>

      {/* Pending approvals */}
      <div className="card section-gap">
        <div className="card-title">Pending Approvals</div>
        <div className="action-list">
          {PENDING_LINKS.map(({ key, label, icon, to }) => {
            const count = pend[key] || 0;
            return (
              <Link key={key} to={to} className={`action-item${count > 0 ? ' action-item--alert' : ''}`}>
                <span className="action-icon">{icon}</span>
                <div className="action-body">
                  <span className="action-label">{label}</span>
                  <span className="action-desc">{loading ? '…' : `${count} pending`}</span>
                </div>
                {count > 0 && (
                  <span className="action-badge">{count}</span>
                )}
                <svg className="action-arrow" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M7 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Revenue */}
      {(data?.revenue?.length > 0) && (
        <div className="card">
          <div className="card-title">Revenue Summary</div>
          <div className="summary-list">
            {data.revenue.map(r => (
              <div key={r.type} className="summary-row">
                <span className="summary-label">{r.type.replace(/_/g, ' ')}</span>
                <div style={{ textAlign: 'right' }}>
                  <span className="summary-val">₦{Number(r.total || 0).toLocaleString()}</span>
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', marginTop: 1 }}>{r.count} txns</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
