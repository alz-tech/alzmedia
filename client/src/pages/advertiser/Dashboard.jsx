import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import StatsCard from '../../components/StatsCard';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import api from '../../services/api';

const ICON_W = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="5" width="20" height="15" rx="2"/><path d="M16 12h.01M2 10h20"/></svg>;
const ICON_S = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>;
const ICON_C = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 12h4l3-9 4 18 3-9h4"/></svg>;
const ICON_A = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3"/></svg>;

export default function AdvertiserDashboard() {
  const { user }          = useAuth();
  const { error }         = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/advertiser/stats')
      .then(r => setStats(r.data.data))
      .catch(() => error('Failed to load dashboard stats'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">Welcome back, {user?.full_name?.split(' ')[0]}</h1>
        <p className="page-subtitle">Your campaign overview</p>
      </div>

      <div className="stats-grid">
        <StatsCard label="Wallet Balance"    icon={ICON_W} color="purple"
          value={loading ? '—' : `₦${Number(stats?.wallet_balance || 0).toLocaleString()}`} />
        <StatsCard label="Total Spent"       icon={ICON_S} color="green"
          value={loading ? '—' : `₦${Number(stats?.total_spent || 0).toLocaleString()}`} />
        <StatsCard label="Campaigns"         icon={ICON_C} color="purple"
          value={loading ? '—' : stats?.campaign_count || 0} />
        <StatsCard label="Active Campaigns"  icon={ICON_A} color="green"
          value={loading ? '—' : stats?.active_campaigns || 0} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div className="card">
          <div className="card-title">Quick actions</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <a href="/advertiser/campaigns"       className="btn btn-secondary">View campaigns</a>
            <a href="/advertiser/campaigns/new"   className="btn btn-primary">Create campaign</a>
            <a href="/advertiser/wallet"           className="btn btn-secondary">Fund wallet</a>
            <a href="/advertiser/analytics"        className="btn btn-secondary">Analytics</a>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Account summary</div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {[
              { label:'Total Funded', val: loading ? '—' : `₦${Number(stats?.total_funded||0).toLocaleString()}` },
              { label:'Total Spent',  val: loading ? '—' : `₦${Number(stats?.total_spent||0).toLocaleString()}` },
              { label:'Campaigns',    val: loading ? '—' : stats?.campaign_count || 0 },
            ].map(({ label, val }) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between', fontSize:14 }}>
                <span style={{ color:'var(--text-muted)' }}>{label}</span>
                <span style={{ fontWeight:600 }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
