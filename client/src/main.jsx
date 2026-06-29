import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';

// ── Detect system theme on very first visit ──────────────────
// If user has never set a preference, honour prefers-color-scheme.
// Once they manually toggle, localStorage takes over.
(function initTheme() {
  const stored = localStorage.getItem('alzmedia-theme');
  if (stored) {
    document.documentElement.setAttribute('data-theme', stored);
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = prefersDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', initial);
    // Don't write to localStorage yet — let the toggle hook do it on first interaction
    // so that if the OS changes, we still pick it up on next visit
  }
})();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
