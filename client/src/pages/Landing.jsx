import { useNavigate } from 'react-router-dom';
import './Landing.css';

export default function Landing() {
  const navigate = useNavigate();
  return (
    <div className="landing">
      <div className="landing-glow" />
      <div className="landing-center">
        <div className="landing-logo">
          <span className="logo-alz">Alz</span><span className="logo-media">Media</span>
        </div>
        <p className="landing-tagline">
          Africa's ad network. Reach audiences or earn Naira from your traffic — built for you.
        </p>
        <button className="landing-btn" onClick={() => navigate('/get-started')}>
          Get Started
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 10h12m-5-5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      <div className="landing-footer">media.alz.name.ng · © 2026 AlzMedia</div>
    </div>
  );
}
