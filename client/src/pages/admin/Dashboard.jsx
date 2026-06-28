import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import StatsCard from '../../components/StatsCard';
import { useToast } from '../../hooks/useToast';
import api from '../../services/api';

const ICON_U = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
const ICON_C = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 12h4l3-9 4 18 3-9h4"/></svg>;
const ICON_P = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>;
const ICON_W = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>;

export default function AdminDashboard() {
  const { error }          = useToast();
  const [data, setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(r => setData(r.data.data))
      .catch(() => error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const pend = data?.pending || {};

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Platform overview and pending actions</p>
      </div>

      <div className="stats-grid">
        <StatsCard label="Total Users"     icon={ICON_U} color="purple"
          value={loading ? '—' : data?.total_users || 0} />
        <StatsCard label="Total Campaigns" icon={ICON_C} color="green"
          value={loading ? '—' : data?.total_campaigns || 0} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:32 }}>
        {[
          { label:'Sites pending',       val: pend.pending_sites,      href:'/admin/sites',     color:'#FBBF24' },
          { label:'Creatives pending',   val: pend.pending_creatives,  href:'/admin/creatives', color:'#FBBF24' },
          { label:'Campaigns pending',   val: pend.pending_campaigns,  href:'/admin/campaigns', color:'#FBBF24' },
          { label:'Withdrawals pending', val: pend.pending_withdrawals,href:'/admin/payouts',   color:'var(--red)' },
        ].map(({ label, val, href, color }) => (
          <a key={label} href={href} style={{ textDecoration:'none' }}>
            <div className="card" style={{ cursor:'pointer', transition:'border-color .2s' }}>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:8 }}>{label}</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:700, color: loading || !val ? 'var(--text)' : color }}>
                {loading ? '—' : val || 0}
              </div>
            </div>
          </a>
        ))}
      </div>

      <div className="card">
        <div className="card-title">Revenue Summary</div>
        {loading
          ? <div style={{ color:'var(--text-muted)', fontSize:14 }}>Loading...</div>
          : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:16 }}>
              {(data?.revenue || []).map(r => (
                <div key={r.type} style={{ background:'var(--bg3)', borderRadius:'var(--radius)', padding:'14px 16px' }}>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.8px' }}>
                    {r.type.replace(/_/g,' ')}
                  </div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700 }}>
                    ₦{Number(r.total || 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:3 }}>{r.count} transactions</div>
                </div>
              ))}
            </div>
        }
      </div>
    </DashboardLayout>
  );
}
