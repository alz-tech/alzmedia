import './StatsCard.css';

export default function StatsCard({ label, value, sub, icon, color = 'purple', trend }) {
  return (
    <div className={`stats-card stats-card--${color}`}>
      {icon && <span className="stats-card-icon">{icon}</span>}
      <div className="stats-card-body">
        <div className="stats-card-label">{label}</div>
        <div className="stats-card-value">{value}</div>
        {sub   && <div className="stats-card-sub">{sub}</div>}
        {trend && (
          <div className={`stats-card-trend ${trend >= 0 ? 'up' : 'down'}`}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              {trend >= 0
                ? <path d="M3 11l5-5 5 5" strokeLinecap="round" strokeLinejoin="round"/>
                : <path d="M3 5l5 5 5-5" strokeLinecap="round" strokeLinejoin="round"/>}
            </svg>
            {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );
}
