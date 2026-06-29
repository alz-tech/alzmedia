import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import './Navbar.css';

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
  sun:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>,
  moon:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
  switch:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>,
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
    { to: '/advertiser',               label: 'Dashboard', icon: 'dashboard', end: true },
    { to: '/advertiser/campaigns',     label: 'Campaigns', icon: 'campaigns' },
    { to: '/advertiser/analytics',     label: 'Analytics', icon: 'analytics' },
    { to: '/advertiser/wallet',        label: 'Wallet',    icon: 'wallet' },
  ],
  admin: [
    { to: '/admin',           label: 'Dashboard', icon: 'dashboard', end: true },
    { to: '/admin/users',     label: 'Users',     icon: 'users' },
    { to: '/admin/campaigns', label: 'Campaigns', icon: 'campaigns' },
    { to: '/admin/creatives', label: 'Creatives', icon: 'creatives' },
    { to: '/admin/sites',     label: 'Sites',     icon: 'sites' },
    { to: '/admin/payouts',   label: 'Payouts',   icon: 'payouts' },
    { to: '/admin/settings',  label: 'Settings',  icon: 'settings' },
  ],
};

// Admin switch-to views
const ADMIN_VIEWS = {
  admin:      { label: 'Admin View',      links: NAV.admin },
  publisher:  { label: 'Publisher View',  links: NAV.publisher },
  advertiser: { label: 'Advertiser View', links: NAV.advertiser },
};

function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('alzmedia-theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('alzmedia-theme', theme);
  }, [theme]);

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  return { theme, toggle };
}

export default function Navbar() {
  const { user, logout }    = useAuth();
  const navigate             = useNavigate();
  const location             = useLocation();
  const { error }            = useToast();
  const { theme, toggle }    = useTheme();
  const [open, setOpen]      = useState(false);
  const [adminView, setAdminView] = useState('admin'); // session-only, resets on remount
  const menuRef              = useRef(null);

  // Close menu on route change
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // Close menu on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Prevent body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  async function handleLogout() {
    try { await logout(); navigate('/'); }
    catch { error('Logout failed. Please try again.'); }
  }

  const effectiveRole = user?.role === 'admin' ? adminView : user?.role;
  const links = (user?.role === 'admin' ? ADMIN_VIEWS[adminView].links : NAV[user?.role]) || [];

  return (
    <>
      <nav className="navbar" ref={menuRef}>
        <div className="navbar-inner">
          {/* Logo */}
          <a className="navbar-logo" href={user ? `/${effectiveRole === 'admin' ? 'admin' : effectiveRole}` : '/'}>
            <span className="logo-alz">Alz</span><span className="logo-media">Media</span>
          </a>

          <div className="navbar-right">
            {/* Theme toggle */}
            <button className="navbar-icon-btn" onClick={toggle} aria-label="Toggle theme" title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}>
              {theme === 'dark' ? ICONS.sun : ICONS.moon}
            </button>

            {/* User avatar / role */}
            {user && (
              <div className="navbar-avatar" title={user.full_name}>
                {user.full_name?.[0]?.toUpperCase()}
              </div>
            )}

            {/* Hamburger */}
            <button
              className={`navbar-hamburger ${open ? 'open' : ''}`}
              onClick={() => setOpen(o => !o)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
            >
              <span /><span /><span />
            </button>
          </div>
        </div>

        {/* Dropdown menu */}
        <div className={`navbar-menu ${open ? 'open' : ''}`} aria-hidden={!open}>
          <div className="navbar-menu-inner">

            {/* Admin view switcher */}
            {user?.role === 'admin' && (
              <div className="navbar-admin-switch">
                <div className="navbar-section-label">Switch view</div>
                <div className="navbar-switch-btns">
                  {Object.entries(ADMIN_VIEWS).map(([view, { label }]) => (
                    <button
                      key={view}
                      className={`navbar-switch-btn ${adminView === view ? 'active' : ''}`}
                      onClick={() => { setAdminView(view); }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Nav links */}
            {user && (
              <div className="navbar-section-label">
                {user.role === 'admin' ? ADMIN_VIEWS[adminView].label : user.role}
              </div>
            )}
            <nav className="navbar-links">
              {links.map(({ to, label, icon, end }) => (
                <NavLink key={to} to={to} end={end}
                  className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>
                  <span className="navbar-link-icon">{ICONS[icon]}</span>
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Footer */}
            {user && (
              <div className="navbar-menu-footer">
                <div className="navbar-user-info">
                  <div className="navbar-user-avatar">{user.full_name?.[0]?.toUpperCase()}</div>
                  <div>
                    <div className="navbar-user-name">{user.full_name}</div>
                    <div className="navbar-user-email">{user.email}</div>
                  </div>
                </div>
                <button className="navbar-logout" onClick={handleLogout}>
                  {ICONS.logout}
                  <span>Sign out</span>
                </button>
              </div>
            )}

            {/* Close button */}
            <button className="navbar-close-btn" onClick={() => setOpen(false)} aria-label="Close menu">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Backdrop */}
      {open && <div className="navbar-backdrop" onClick={() => setOpen(false)} />}
    </>
  );
}
