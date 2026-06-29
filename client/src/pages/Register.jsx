import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import api from '../services/api';
import './Auth.css';
import './Register.css';

const STEPS = ['Basic Info', 'Role Details', 'Verification', 'Terms', 'Verify Email'];

const PLATFORMS = [
  { value: 'website',    label: 'Website',     icon: '🌐' },
  { value: 'mobile_app', label: 'Mobile App',  icon: '📱' },
  { value: 'android',    label: 'Android App', icon: '🤖' },
  { value: 'ios',        label: 'iOS App',     icon: '🍎' },
  { value: 'telegram',   label: 'Telegram',    icon: '✈️' },
  { value: 'whatsapp',   label: 'WhatsApp',    icon: '💬' },
  { value: 'youtube',    label: 'YouTube',     icon: '▶️' },
  { value: 'other',      label: 'Other',       icon: '📦' },
];
const TRAFFIC_OPTIONS = ['Under 1,000/mo','1K–10K/mo','10K–50K/mo','50K–200K/mo','200K–1M/mo','1M+/mo'];
const CONTENT_CATS    = ['News','Entertainment','Technology','Sports','Finance','Lifestyle','Education','Gaming','Other'];
const INDUSTRIES      = ['E-Commerce','Finance & Banking','Healthcare','Technology','Real Estate','Education','Food & Beverage','Fashion','Travel','Other'];
const BUDGET_RANGES   = ['Under ₦50K/mo','₦50K–₦200K/mo','₦200K–₦500K/mo','₦500K–₦1M/mo','Over ₦1M/mo'];

const CHECK_ICON = (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" width="12" height="12">
    <path d="M4 10l5 5 7-7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function Register({ role }) {
  const navigate           = useNavigate();
  const { login }          = useAuth();
  const { success, error } = useToast();
  const [step, setStep]    = useState(1);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    full_name: '', email: '', password: '', confirm: '',
    // Publisher
    site_name: '', site_url: '', platform_type: '', traffic: '', content_category: '',
    // Advertiser
    company_name: '', industry: '', budget_range: '', what_to_advertise: '',
    // Verification
    id_doc: null,
    // Terms
    agreed: false,
  });
  const [verifyCode, setVerifyCode] = useState('');

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const inp  = (k) => (e) => setF(k, e.target.value);

  // ── Validators ──────────────────────────────────────────────
  function validateStep1() {
    if (!form.full_name.trim())              return 'Full name is required';
    if (!form.email.trim())                  return 'Email is required';
    if (!/\S+@\S+\.\S+/.test(form.email))   return 'Enter a valid email address';
    if (form.password.length < 8)            return 'Password must be at least 8 characters';
    if (form.password !== form.confirm)      return 'Passwords do not match';
    return null;
  }
  function validateStep2() {
    if (role === 'publisher') {
      if (!form.site_name.trim()) return 'Site / app name is required';
      if (!form.platform_type)   return 'Platform type is required';
      if (!form.traffic)         return 'Monthly traffic estimate is required';
    } else {
      if (!form.company_name.trim()) return 'Company / brand name is required';
      if (!form.industry)            return 'Industry is required';
      if (!form.budget_range)        return 'Budget range is required';
    }
    return null;
  }

  // ── Check email uniqueness before leaving step 1 ─────────────
  async function checkEmailAndAdvance() {
    const err = validateStep1();
    if (err) return error(err);
    setLoading(true);
    try {
      await api.post('/auth/check-email', { email: form.email });
      setStep(2);
    } catch (e) {
      error(e.response?.data?.message || 'Email already registered. Try logging in instead.');
    } finally {
      setLoading(false);
    }
  }

  // ── Final registration: called on step 4 (Terms accept) ──────
  async function submitRegistration() {
    if (!form.agreed) return error('You must accept the Terms & Privacy Policy');
    setLoading(true);
    try {
      const payload = {
        full_name: form.full_name,
        email:     form.email,
        password:  form.password,
        role,
        ...(role === 'publisher' ? {
          site_name: form.site_name,
          site_url:  form.site_url,
          platform_type: form.platform_type,
          traffic:   form.traffic,
          content_category: form.content_category,
        } : {
          company_name:    form.company_name,
          industry:        form.industry,
          budget_range:    form.budget_range,
          what_to_advertise: form.what_to_advertise,
        }),
      };

      const res = await api.post('/auth/register', payload);
      login(res.data.data.user);

      // Upload ID doc if provided
      if (form.id_doc) {
        const fd = new FormData();
        fd.append('document', form.id_doc);
        await api.post('/auth/upload-id', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }).catch(() => {});
      }

      // Send email verification code
      await api.post('/auth/send-verification').catch(() => {});
      success('Account created! Check your email for a verification code.');
      setStep(5);
    } catch (e) {
      error(e.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Email verify step ────────────────────────────────────────
  async function verifyEmail() {
    if (!verifyCode.trim()) return error('Enter the verification code');
    setLoading(true);
    try {
      await api.post('/auth/verify-email', { code: verifyCode });
      success('Email verified! Welcome to AlzMedia.');
      navigate(`/${role}`);
    } catch (e) {
      error(e.response?.data?.message || 'Invalid or expired code. Try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Next / submit router ─────────────────────────────────────
  async function handleNext() {
    if (step === 1) { await checkEmailAndAdvance(); return; }
    if (step === 2) { const e = validateStep2(); if (e) return error(e); }
    if (step === 4) { await submitRegistration(); return; }
    setStep(s => s + 1);
  }

  const label = role === 'advertiser' ? 'Advertiser' : 'Publisher';

  return (
    <div className="auth-page reg-page">
      <div className="auth-glow" />
      <div className="reg-box">
        {/* Logo */}
        <Link to="/" className="auth-logo">
          <span className="logo-alz">Alz</span><span className="logo-media">Media</span>
        </Link>

        {/* Progress */}
        <div className="reg-progress">
          {STEPS.map((name, i) => {
            const n = i + 1;
            const done   = n < step;
            const active = n === step;
            return (
              <div key={n} className={`reg-step${done ? ' done' : active ? ' active' : ''}`}>
                <div className="reg-step-dot">{done ? CHECK_ICON : n}</div>
                <div className="reg-step-label">{name}</div>
                {i < STEPS.length - 1 && <div className={`reg-step-line${done ? ' done' : ''}`} />}
              </div>
            );
          })}
        </div>

        {/* ── STEP 1: Basic Info ── */}
        {step === 1 && (
          <div className="reg-panel">
            <div className={`auth-role-badge ${role}`}>{label}</div>
            <h2 className="reg-heading">Create your account</h2>
            <p className="reg-sub">Start by entering your basic details</p>

            <div className="form-group">
              <label className="form-label">Full name</label>
              <input className="form-input" type="text" placeholder="Your full name"
                value={form.full_name} onChange={inp('full_name')} autoComplete="name" />
            </div>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input className="form-input" type="email" placeholder="you@example.com"
                value={form.email} onChange={inp('email')} autoComplete="email" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Minimum 8 characters"
                value={form.password} onChange={inp('password')} autoComplete="new-password" />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm password</label>
              <input className="form-input" type="password" placeholder="Repeat password"
                value={form.confirm} onChange={inp('confirm')} autoComplete="new-password" />
            </div>
          </div>
        )}

        {/* ── STEP 2: Role Details ── */}
        {step === 2 && (
          <div className="reg-panel">
            <div className={`auth-role-badge ${role}`}>{label} details</div>
            <h2 className="reg-heading">
              {role === 'publisher' ? 'Tell us about your platform' : 'Tell us about your business'}
            </h2>
            <p className="reg-sub">
              {role === 'publisher'
                ? 'We use this to match you with relevant ads'
                : 'We use this to help you reach the right audience'}
            </p>

            {role === 'publisher' ? (
              <>
                <div className="form-group">
                  <label className="form-label">Site / App name <span className="form-required">*</span></label>
                  <input className="form-input" type="text" placeholder="e.g. My Tech Blog"
                    value={form.site_name} onChange={inp('site_name')} />
                </div>
                <div className="form-group">
                  <label className="form-label">URL or Package name <span className="form-optional">(optional)</span></label>
                  <input className="form-input" type="text" placeholder="https://example.com or com.example.app"
                    value={form.site_url} onChange={inp('site_url')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Platform type <span className="form-required">*</span></label>
                  <div className="reg-chip-grid">
                    {PLATFORMS.map(p => (
                      <button key={p.value} type="button"
                        className={`reg-chip${form.platform_type === p.value ? ' active' : ''}`}
                        onClick={() => setF('platform_type', p.value)}>
                        {p.icon} {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Monthly traffic estimate <span className="form-required">*</span></label>
                  <div className="reg-chip-grid">
                    {TRAFFIC_OPTIONS.map(t => (
                      <button key={t} type="button"
                        className={`reg-chip${form.traffic === t ? ' active' : ''}`}
                        onClick={() => setF('traffic', t)}>{t}</button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Content category <span className="form-optional">(optional)</span></label>
                  <div className="reg-chip-grid">
                    {CONTENT_CATS.map(c => (
                      <button key={c} type="button"
                        className={`reg-chip${form.content_category === c ? ' active' : ''}`}
                        onClick={() => setF('content_category', c)}>{c}</button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Company / Brand name <span className="form-required">*</span></label>
                  <input className="form-input" type="text" placeholder="e.g. Acme Corp"
                    value={form.company_name} onChange={inp('company_name')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Industry <span className="form-required">*</span></label>
                  <div className="reg-chip-grid">
                    {INDUSTRIES.map(ind => (
                      <button key={ind} type="button"
                        className={`reg-chip${form.industry === ind ? ' active' : ''}`}
                        onClick={() => setF('industry', ind)}>{ind}</button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Monthly ad budget range <span className="form-required">*</span></label>
                  <div className="reg-chip-grid">
                    {BUDGET_RANGES.map(b => (
                      <button key={b} type="button"
                        className={`reg-chip${form.budget_range === b ? ' active' : ''}`}
                        onClick={() => setF('budget_range', b)}>{b}</button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">What do you want to advertise? <span className="form-optional">(optional)</span></label>
                  <textarea className="form-textarea" placeholder="Briefly describe your product or service..."
                    value={form.what_to_advertise} onChange={inp('what_to_advertise')} rows={3} />
                </div>
              </>
            )}
          </div>
        )}

        {/* ── STEP 3: Identity Verification ── */}
        {step === 3 && (
          <div className="reg-panel">
            <div className="auth-role-badge publisher">Verification</div>
            <h2 className="reg-heading">Identity verification</h2>
            <p className="reg-sub">Upload a government-issued ID or CAC document. Optional — you can do this later.</p>

            <div className="reg-upload-area"
              onClick={() => document.getElementById('id-doc-input').click()}
              onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drag'); }}
              onDragLeave={e => e.currentTarget.classList.remove('drag')}
              onDrop={e => {
                e.preventDefault(); e.currentTarget.classList.remove('drag');
                const file = e.dataTransfer.files[0];
                if (file) setF('id_doc', file);
              }}>
              <input id="id-doc-input" type="file" accept="image/*,.pdf"
                style={{ display: 'none' }}
                onChange={e => setF('id_doc', e.target.files[0])} />
              {form.id_doc ? (
                <div className="reg-upload-chosen">
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.7" width="28" height="28">
                    <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <div>
                    <div className="reg-upload-name">{form.id_doc.name}</div>
                    <div className="reg-upload-size">{(form.id_doc.size / 1024).toFixed(0)} KB — tap to change</div>
                  </div>
                </div>
              ) : (
                <div className="reg-upload-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                    width="32" height="32" style={{ color: 'var(--text-dim)' }}>
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                      strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div className="reg-upload-hint">Tap to upload or drag a file here</div>
                  <div className="reg-upload-sub">NIN card, Driver's licence, Int'l passport or CAC</div>
                  <div className="reg-upload-sub">JPG, PNG or PDF — max 5MB</div>
                </div>
              )}
            </div>

            <div className="reg-info-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
                width="16" height="16" style={{ flexShrink: 0, color: 'var(--purple-lt)' }}>
                <circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/>
              </svg>
              <span>Document stored securely. Review typically takes under 24 hours.</span>
            </div>

            <button type="button" className="reg-skip" onClick={() => setStep(4)}>
              Skip for now — I'll submit later
            </button>
          </div>
        )}

        {/* ── STEP 4: Terms ── */}
        {step === 4 && (
          <div className="reg-panel">
            <div className="auth-role-badge advertiser">Almost done</div>
            <h2 className="reg-heading">Terms & Privacy</h2>
            <p className="reg-sub">Review and accept to create your account</p>

            <div className="reg-terms-box">
              <p>By creating an account, you confirm you are at least 18 years old and agree to our <strong>Terms of Service</strong> and <strong>Privacy Policy</strong>. You consent to receive platform notifications related to your account, campaigns, and earnings.</p>
              <p style={{ marginTop: 12 }}>AlzMedia reserves the right to review and approve accounts before granting full access. Ad campaigns and publisher sites are subject to content guidelines.</p>
            </div>

            <label className="reg-checkbox-row">
              <input type="checkbox" checked={form.agreed}
                onChange={e => setF('agreed', e.target.checked)} />
              <span className="reg-checkbox-box">{form.agreed && CHECK_ICON}</span>
              <span>I accept the Terms of Service and Privacy Policy</span>
            </label>
          </div>
        )}

        {/* ── STEP 5: Email Verification ── */}
        {step === 5 && (
          <div className="reg-panel">
            <div className="reg-verify-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple-lt)" strokeWidth="1.5" width="32" height="32">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h2 className="reg-heading">Verify your email</h2>
            <p className="reg-sub">
              We sent a 6-digit code to <strong>{form.email}</strong>. Enter it below to activate your account.
            </p>

            <div className="form-group" style={{ marginTop: 24 }}>
              <label className="form-label">Verification code</label>
              <input className="form-input reg-code-input" type="text" inputMode="numeric"
                maxLength={6} placeholder="000000"
                value={verifyCode} onChange={e => setVerifyCode(e.target.value.replace(/\D/g, ''))} />
            </div>

            <button className="btn btn-primary btn-full reg-next-btn"
              onClick={verifyEmail} disabled={loading}>
              {loading ? <span className="spinner" /> : 'Verify & enter dashboard'}
            </button>

            <button className="reg-skip" style={{ marginTop: 16 }}
              onClick={async () => {
                try { await api.post('/auth/send-verification'); success('Code resent!'); }
                catch { error('Could not resend. Try again.'); }
              }}>
              Resend code
            </button>

            <button className="reg-skip" style={{ marginTop: 8 }}
              onClick={() => navigate(`/${role}`)}>
              Skip for now — verify later
            </button>
          </div>
        )}

        {/* Navigation */}
        {step < 5 && (
          <div className="reg-actions">
            {step > 1 && (
              <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)} disabled={loading}>
                Back
              </button>
            )}
            <button className="btn btn-primary reg-next-btn" onClick={handleNext} disabled={loading}>
              {loading ? <span className="spinner" /> : step === 4 ? 'Create account' : 'Continue'}
              {!loading && step < 4 && (
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M4 10h12m-5-5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
        )}

        <p className="auth-switch" style={{ marginTop: 20 }}>
          Already have an account?{' '}
          <Link to={`/${role}/login`}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
