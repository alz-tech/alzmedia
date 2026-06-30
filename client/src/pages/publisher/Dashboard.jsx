import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import StatsCard from '../../components/StatsCard';
import LiveChart from '../../components/LiveChart';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import api from '../../services/api';
import './Dashboard.css';

const ICONS = {
  wallet: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="5" width="20" height="15" rx="2"/><path d="M16 12h.01M2 10h20"/></svg>,
  earned: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  impr:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  clicks: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M5 3l14 9-7 1-3 7-4-17z" strokeLinejoin="round"/></svg>,
};

const QUICK_ACTIONS = [
  { to: '/publisher/sites',    label: 'Manage Sites',    icon: '🌐', desc: 'Add or review your sites' },
  { to: '/publisher/slots',    label: 'Ad Slots',        icon: '📦', desc: 'Configure ad placements' },
  { to: '/publisher/earnings', label: 'Earnings',        icon: '📈', desc: 'View earnings history' },
  { to: '/publisher/withdraw', label: 'Withdraw Funds',  icon: '💸', desc: 'Request a payout', primary: true },
];

export default function PublisherDashboard() {
  const { user }       = useAuth();
  const { error }      = useToast();
  const [stats, setStats]     = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/publisher/stats'),
      api.get('/publisher/earnings').catch(() => null),
    ])
      .then(([sRes, eRes]) => {
        setStats(sRes.data.data);
        if (eRes) setEarnings(eRes.data.data);
      })
      .catch(() => error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const chartData = earnings?.impressions?.length
    ? earnings.impressions.map(d => ({ label: d.date, value: Number(d.count) }))
    : [];

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">Welcome, {user?.full_name?.split(' ')[0]}</h1>
        <p className="page-subtitle">Publisher overview</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatsCard label="Wallet Balance"    icon={ICONS.wallet} color="purple"
          value={loading ? '—' : `₦${Number(stats?.wallet_balance || 0).toLocaleString()}`} />
        <StatsCard label="Total Earned"      icon={ICONS.earned} color="green"
          value={loading ? '—' : `₦${Number(stats?.total_earned || 0).toLocaleString()}`} />
        <StatsCard label="Impressions (30d)" icon={ICONS.impr}   color="purple"
          value={loading ? '—' : Number(stats?.impressions_30d || 0).toLocaleString()} />
        <StatsCard label="Clicks (30d)"      icon={ICONS.clicks} color="green"
          value={loading ? '—' : Number(stats?.clicks_30d || 0).toLocaleString()} />
      </div>

      {/* Chart */}
      <div className="card section-gap">
        <LiveChart
          data={chartData}
          color="purple"
          title="Impressions — last 30 days"
          isLive={false}
          height={150}
        />
      </div>

      {/* Quick Actions */}
      <div className="card section-gap">
        <div className="card-title">Quick Actions</div>
        <div className="action-list">
          {QUICK_ACTIONS.map(({ to, label, icon, desc, primary }) => (
            <Link key={to} to={to} className={`action-item${primary ? ' action-item--primary' : ''}`}>
              <span className="action-icon">{icon}</span>
              <div className="action-body">
                <span className="action-label">{label}</span>
                <span className="action-desc">{desc}</span>
              </div>
              <svg className="action-arrow" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M7 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          ))}
        </div>
      </div>

      {/* Account Summary */}
      <div className="card">
        <div className="card-title">Account Summary</div>
        <div className="summary-list">
          <div className="summary-row">
            <span className="summary-label">Sites registered</span>
            <span className="summary-val">{loading ? '—' : stats?.site_count || 0}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Ad slots</span>
            <span className="summary-val">{loading ? '—' : stats?.slot_count || 0}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Total withdrawn</span>
            <span className="summary-val">{loading ? '—' : `₦${Number(stats?.total_withdrawn || 0).toLocaleString()}`}</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
