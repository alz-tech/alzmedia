import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import api from '../services/api';
import './Auth.css';

export default function Login({ role }) {
  const navigate           = useNavigate();
  const { login }          = useAuth();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.password) return error('Email and password are required');
    setLoading(true);
    try {
      const res  = await api.post('/auth/login', form);
      const user = res.data.data.user;

      // Set user in context first
      login(user);
      success('Welcome back!');

      // Redirect based on actual role returned from server
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(`/${user.role}`, { replace: true });
      }
    } catch (err) {
      error(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const label = role === 'advertiser' ? 'Advertiser' : 'Publisher';
  const other = role === 'advertiser' ? 'publisher' : 'advertiser';

  return (
    <div className="auth-page">
      <div className="auth-glow" />
      <div className="auth-box">
        <Link to="/" className="auth-logo">
          <span className="logo-alz">Alz</span><span className="logo-media">Media</span>
        </Link>

        <div className={`auth-role-badge ${role}`}>{label}</div>
        <h1 className="auth-heading">Sign in</h1>
        <p className="auth-sub">Welcome back to AlzMedia</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input id="email" type="email" className="form-input"
              placeholder="you@example.com"
              value={form.email} onChange={set('email')}
              autoComplete="email" required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input id="password" type="password" className="form-input"
              placeholder="••••••••"
              value={form.password} onChange={set('password')}
              autoComplete="current-password" required />
          </div>

          <button type="submit" className="btn btn-primary btn-full auth-submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Sign in'}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account?{' '}
          <Link to={`/${role}/register`}>Create one free</Link>
        </p>
        <p className="auth-switch">
          Are you a <Link to={`/${other}/login`}>{other}</Link>?
        </p>
      </div>
    </div>
  );
}
