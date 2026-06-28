import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import './Sidebar.css';

const ICONS = {
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  sites:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="9"/><path d="M12 3c-4 4-4 14 0 18m0-18c4 4 4 14 0 18M3 12h18"/></svg>,
  slots:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 4v16"/></svg>,
  earnings:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  withdraw:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 5v14m-7-7h14"/><circle cx="12" cy="12" r="9"/></svg>,
  campaigns: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 12h4l3-9 4 18 3-9h4"/></svg>,
  analytics: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 3v18h18"/><path d="M7 16l4-4 4 4 4-8"/></svg>,
  wallet:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="5" width="20" height="15" rx="2"/><path d="M16 12h.01M2 10h20"/></svg>,
  users:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  settings:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  logout:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
  creatives: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M3 9h6M3 15h6"/></svg>,
  payouts:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>,
};

const NAV = {
  publisher:  [
    { to: '/publisher',          label: 'Dashboard', icon: 'dashboard', end: true },
    { to: '/publisher/sites',    label: 'My Sites',  icon: 'sites' },
    { to: '/publisher/slots',    label: 'Ad Slots',  icon: 'slots' },
    { to: '/publisher/earnings', label: 'Earnings',  icon: 'earnings' },
    { to: '/publisher/withdraw', label: 'Withdraw',  icon: 'withdraw' },
  ],
  advertiser: [
    { to: '/advertiser',                    label: 'Dashboard',  icon: 'dashboard', end: true },
    { to: '/advertiser/campaigns',          label: 'Campaigns',  icon: 'campaigns' },
    { to: '/advertiser/analytics',          label: 'Analytics',  icon: 'analytics' },
    { to: '/advertiser/wallet',             label: 'Wallet',     icon: 'wallet' },
  ],
  admin: [
    { to: '/admin',              label: 'Dashboard', icon: 'dashboard', end: true },
    { to: '/admin/users',        label: 'Users',     icon: 'users' },
    { to: '/admin/campaigns',    label: 'Campaigns', icon: 'campaigns' },
    { to: '/admin/creatives',    label: 'Creatives', icon: 'creatives' },
    { to: '/admin/sites',        label: 'Sites',     icon: 'sites' },
    { to: '/admin/payouts',      label: 'Payouts',   icon: 'payouts' },
    { to: '/admin/settings',     label: 'Settings',  icon: 'settings' },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const { error }        = useToast();
  const links            = NAV[user?.role] || [];

  async function handleLogout() {
    try {
      await logout();
      navigate('/');
    } catch {
      error('Logout failed. Please try again.');
    }
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-alz">Alz</span><span className="logo-media">Media</span>
      </div>

      <div className="sidebar-role">{user?.role}</div>

      <nav className="sidebar-nav">
        {links.map(({ to, label, icon, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <span className="sidebar-icon">{ICONS[icon]}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{user?.full_name?.[0]?.toUpperCase()}</div>
          <div>
            <div className="sidebar-name">{user?.full_name}</div>
            <div className="sidebar-email">{user?.email}</div>
          </div>
        </div>
        <button className="sidebar-logout" onClick={handleLogout}>
          <span className="sidebar-icon">{ICONS.logout}</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
