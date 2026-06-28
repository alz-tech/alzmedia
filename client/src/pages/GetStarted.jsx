import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './GetStarted.css';

const ADV_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
    <path d="M3 11l19-9-9 19-2-8-8-2z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const PUB_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <path d="M3 9h18M9 21V9"/>
  </svg>
);

export default function GetStarted() {
  const navigate       = useNavigate();
  const [step, setStep]  = useState(1);
  const [role, setRole]  = useState(null);

  function back() {
    if (step === 1) navigate('/');
    else setStep(1);
  }

  return (
    <div className="gs-page">
      <div className="gs-glow" />

      <button className="gs-back" onClick={back}>
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 4l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back
      </button>

      <div className="gs-wrap">
        <div className="gs-steps">
          <div className={`gs-dot ${step > 1 ? 'done' : 'active'}`}>
            {step > 1
              ? <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 8l4 4 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              : '1'}
          </div>
          <div className={`gs-line ${step > 1 ? 'done' : ''}`} />
          <div className={`gs-dot ${step === 2 ? 'active' : ''}`}>2</div>
        </div>

        {step === 1 && (
          <div className="gs-panel" key="step1">
            <h1 className="gs-heading">Who are you?</h1>
            <p className="gs-sub">Choose your role to continue.</p>

            <div className="gs-cards">
              <button
                className={`gs-card adv ${role === 'advertiser' ? 'selected' : ''}`}
                onClick={() => setRole('advertiser')}
              >
                <div className="gs-card-check">
                  {role === 'advertiser' && <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 8l4 4 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span className="gs-card-icon">{ADV_ICON}</span>
                <div className="gs-card-title">Advertiser</div>
                <div className="gs-card-desc">Run ad campaigns and reach African audiences.</div>
              </button>

              <button
                className={`gs-card pub ${role === 'publisher' ? 'selected' : ''}`}
                onClick={() => setRole('publisher')}
              >
                <div className="gs-card-check">
                  {role === 'publisher' && <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 8l4 4 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span className="gs-card-icon">{PUB_ICON}</span>
                <div className="gs-card-title">Publisher</div>
                <div className="gs-card-desc">Earn Naira from your website, app, or bot.</div>
              </button>
            </div>

            <button
              className={`btn btn-primary btn-full gs-continue ${!role ? '' : 'enabled'}`}
              onClick={() => role && setStep(2)}
              disabled={!role}
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="gs-panel" key="step2">
            <div className={`gs-badge ${role}`}>
              {role === 'advertiser' ? ADV_ICON : PUB_ICON}
              {role === 'advertiser' ? 'Advertiser' : 'Publisher'}
            </div>

            <h1 className="gs-heading">
              Join as<br />{role === 'advertiser' ? 'Advertiser.' : 'Publisher.'}
            </h1>
            <p className="gs-sub">New here or already have an account?</p>

            <div className="gs-auth">
              <button className="btn btn-primary btn-full" onClick={() => navigate(`/${role}/register`)}>
                Create free account
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 10h12m-5-5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div className="gs-divider"><span>already have an account</span></div>
              <button className="btn btn-ghost btn-full" onClick={() => navigate(`/${role}/login`)}>
                Sign in
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
