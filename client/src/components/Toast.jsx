import { useState, useEffect, useCallback } from 'react';
import { _registerToast } from '../hooks/useToast';

const ICONS = {
  success: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 10l4 4 6-6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  error: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  info: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="10" cy="10" r="8"/>
      <path d="M10 7v3m0 3h.01" strokeLinecap="round"/>
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 3L2 17h16L10 3z" strokeLinejoin="round"/>
      <path d="M10 9v4m0 2h.01" strokeLinecap="round"/>
    </svg>
  ),
};

export default function Toast() {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, removing: false }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, removing: true } : t));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 260);
    }, duration);
  }, []);

  useEffect(() => { _registerToast(add); }, [add]);

  return (
    <div id="toast-root" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}${t.removing ? ' removing' : ''}`} role="alert">
          <span className="toast-icon">{ICONS[t.type]}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
