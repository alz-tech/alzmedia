import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import api from '../services/api';
import './Auth.css';

export default function Register({ role }) {
  const navigate       = useNavigate();
  const { login }      = useAuth();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' });

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.password)
      return error('All fields are required');
    if (form.password.length < 8)
      return error('Password must be at least 8 characters');
    if (form.password !== form.confirm)
      return error('Passwords do not match');

    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        full_name: form.full_name,
        email:     form.email,
        password:  form.password,
        role,
      });
      login(res.data.data.user);
      success('Account created! Welcome to AlzMedia.');
      navigate(`/${role}`);
    } catch (err) {
      error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const label = role === 'advertiser' ? 'Advertiser' : 'Publisher';

  return (
    <div className="auth-page">
      <div className="auth-glow" />
      <div className="auth-box">
        <Link to="/" className="auth-logo">
          <span className="logo-alz">Alz</span><span className="logo-media">Media</span>
        </Link>

        <div className={`auth-role-badge ${role}`}>{label}</div>
        <h1 className="auth-heading">Create account</h1>
        <p className="auth-sub">Start {role === 'advertiser' ? 'advertising' : 'earning'} today</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="full_name">Full name</label>
            <input id="full_name" type="text" className="form-input" placeholder="Your full name"
              value={form.full_name} onChange={set('full_name')} autoComplete="name" required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input id="email" type="email" className="form-input" placeholder="you@example.com"
              value={form.email} onChange={set('email')} autoComplete="email" required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input id="password" type="password" className="form-input" placeholder="Min. 8 characters"
              value={form.password} onChange={set('password')} autoComplete="new-password" required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="confirm">Confirm password</label>
            <input id="confirm" type="password" className="form-input" placeholder="Repeat password"
              value={form.confirm} onChange={set('confirm')} autoComplete="new-password" required />
          </div>

          <button type="submit" className="btn btn-primary btn-full auth-submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <Link to={`/${role}/login`}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
