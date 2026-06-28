import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import StatsCard from '../../components/StatsCard';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import api from '../../services/api';

const ICONS = {
  wallet:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="5" width="20" height="15" rx="2"/><path d="M16 12h.01M2 10h20"/></svg>,
  earned:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  impr:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  clicks:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M5 3l14 9-7 1-3 7-4-17z" strokeLinejoin="round"/></svg>,
};

export default function PublisherDashboard() {
  const { user }           = useAuth();
  const { error }          = useToast();
  const [stats, setStats]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/publisher/stats')
      .then(r => setStats(r.data.data))
      .catch(() => error('Failed to load dashboard stats'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">Welcome back, {user?.full_name?.split(' ')[0]}</h1>
        <p className="page-subtitle">Here's your performance overview</p>
      </div>

      <div className="stats-grid">
        <StatsCard label="Wallet Balance"   icon={ICONS.wallet}  color="purple"
          value={loading ? '—' : `₦${Number(stats?.wallet_balance || 0).toLocaleString()}`} />
        <StatsCard label="Total Earned"     icon={ICONS.earned}  color="green"
          value={loading ? '—' : `₦${Number(stats?.total_earned || 0).toLocaleString()}`} />
        <StatsCard label="Impressions (30d)" icon={ICONS.impr}   color="purple"
          value={loading ? '—' : Number(stats?.impressions_30d || 0).toLocaleString()} />
        <StatsCard label="Clicks (30d)"     icon={ICONS.clicks}  color="green"
          value={loading ? '—' : Number(stats?.clicks_30d || 0).toLocaleString()} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div className="card">
          <div className="card-title">Quick actions</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <a href="/publisher/sites"    className="btn btn-secondary">Manage sites</a>
            <a href="/publisher/slots"    className="btn btn-secondary">Manage ad slots</a>
            <a href="/publisher/earnings" className="btn btn-secondary">View earnings</a>
            <a href="/publisher/withdraw" className="btn btn-primary">Withdraw funds</a>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Account summary</div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {[
              { label:'Sites',    val: loading ? '—' : stats?.site_count  || 0 },
              { label:'Ad Slots', val: loading ? '—' : stats?.slot_count  || 0 },
              { label:'Withdrawn',val: loading ? '—' : `₦${Number(stats?.total_withdrawn||0).toLocaleString()}` },
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
