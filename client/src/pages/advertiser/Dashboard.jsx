import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import StatsCard from '../../components/StatsCard';
import LiveChart from '../../components/LiveChart';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import api from '../../services/api';
import '../publisher/Dashboard.css';

const ICONS = {
  wallet:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="5" width="20" height="15" rx="2"/><path d="M16 12h.01M2 10h20"/></svg>,
  spent:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  campaigns:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 12h4l3-9 4 18 3-9h4"/></svg>,
  active:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3"/></svg>,
};

const QUICK_ACTIONS = [
  { to: '/advertiser/campaigns',     label: 'My Campaigns',     icon: '📣', desc: 'View all campaigns' },
  { to: '/advertiser/campaigns/new', label: 'Create Campaign',  icon: '✨', desc: 'Launch a new ad', primary: true },
  { to: '/advertiser/wallet',        label: 'Fund Wallet',      icon: '💳', desc: 'Top up your balance' },
  { to: '/advertiser/analytics',     label: 'Analytics',        icon: '📊', desc: 'Track performance' },
];

export default function AdvertiserDashboard() {
  const { user }       = useAuth();
  const { error }      = useToast();
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/advertiser/stats')
      .then(r => setStats(r.data.data))
      .catch(() => error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">Welcome, {user?.full_name?.split(' ')[0]}</h1>
        <p className="page-subtitle">Advertiser overview</p>
      </div>

      <div className="stats-grid">
        <StatsCard label="Wallet Balance"    icon={ICONS.wallet}    color="purple"
          value={loading ? '—' : `₦${Number(stats?.wallet_balance || 0).toLocaleString()}`} />
        <StatsCard label="Total Spent"       icon={ICONS.spent}     color="green"
          value={loading ? '—' : `₦${Number(stats?.total_spent || 0).toLocaleString()}`} />
        <StatsCard label="Campaigns"         icon={ICONS.campaigns} color="purple"
          value={loading ? '—' : stats?.campaign_count || 0} />
        <StatsCard label="Active"            icon={ICONS.active}    color="green"
          value={loading ? '—' : stats?.active_campaigns || 0} />
      </div>

      {/* Spend chart — static, shows real data when available */}
      <div className="card section-gap">
        <LiveChart
          data={[]}
          color="green"
          title="Spend activity — last 30 days"
          valuePrefix="₦"
          isLive={false}
          height={150}
        />
      </div>

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

      <div className="card">
        <div className="card-title">Account Summary</div>
        <div className="summary-list">
          <div className="summary-row">
            <span className="summary-label">Total funded</span>
            <span className="summary-val">{loading ? '—' : `₦${Number(stats?.total_funded || 0).toLocaleString()}`}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Total spent</span>
            <span className="summary-val">{loading ? '—' : `₦${Number(stats?.total_spent || 0).toLocaleString()}`}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Campaigns</span>
            <span className="summary-val">{loading ? '—' : stats?.campaign_count || 0}</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
