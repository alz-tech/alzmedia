import { useState, useEffect, useRef } from 'react';

/**
 * LiveChart — crypto-style animated area/line chart
 * Props:
 *   data      : [{ label, value }]   — array of data points
 *   color     : 'purple' | 'green'
 *   title     : string
 *   valuePrefix: string (e.g. '₦')
 *   animated  : bool  — if true, streams fake "live" ticks
 *   height    : number (default 180)
 */
export default function LiveChart({
  data = [],
  color = 'purple',
  title = 'Chart',
  valuePrefix = '',
  animated = false,
  height = 180,
}) {
  const [points, setPoints] = useState(data.length ? data : generateEmpty());
  const [hovered, setHovered] = useState(null);
  const tickRef = useRef(null);
  const svgRef = useRef(null);

  function generateEmpty() {
    return Array.from({ length: 20 }, (_, i) => ({
      label: `T-${20 - i}`,
      value: 30 + Math.sin(i * 0.7) * 15 + Math.random() * 10,
    }));
  }

  // If animated mode — simulate live ticks
  useEffect(() => {
    if (!animated) return;
    tickRef.current = setInterval(() => {
      setPoints(prev => {
        const last = prev[prev.length - 1].value;
        const next = Math.max(0, last + (Math.random() - 0.45) * (last * 0.08));
        const now = new Date();
        const label = `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
        return [...prev.slice(-29), { label, value: next }];
      });
    }, 1800);
    return () => clearInterval(tickRef.current);
  }, [animated]);

  // If real data provided — use it
  useEffect(() => {
    if (data.length) setPoints(data);
  }, [data]);

  const vals = points.map(p => p.value);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const range = maxV - minV || 1;

  const W = 600;
  const H = height;
  const PAD = { top: 14, right: 10, bottom: 24, left: 44 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const toX = (i) => PAD.left + (i / (points.length - 1)) * chartW;
  const toY = (v) => PAD.top + chartH - ((v - minV) / range) * chartH;

  const linePath = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(p.value).toFixed(1)}`
  ).join(' ');

  const areaPath = `${linePath} L ${toX(points.length - 1).toFixed(1)} ${(PAD.top + chartH).toFixed(1)} L ${PAD.left.toFixed(1)} ${(PAD.top + chartH).toFixed(1)} Z`;

  const colorVar   = color === 'green' ? 'var(--green)' : 'var(--purple-lt)';
  const gradientId = `grad-${color}-${title.replace(/\s/g,'')}`;

  const lastVal = points[points.length - 1]?.value ?? 0;
  const firstVal = points[0]?.value ?? 0;
  const isUp = lastVal >= firstVal;
  const changeVal = Math.abs(lastVal - firstVal);
  const changePct = firstVal ? ((changeVal / firstVal) * 100).toFixed(2) : '0.00';

  // Y-axis ticks
  const yTicks = 4;
  const yTickVals = Array.from({ length: yTicks + 1 }, (_, i) =>
    minV + (range / yTicks) * i
  );

  function handleMouseMove(e) {
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;
    const mouseX = (e.clientX - svgRect.left) / svgRect.width * W;
    let closest = 0;
    let closestDist = Infinity;
    points.forEach((_, i) => {
      const d = Math.abs(toX(i) - mouseX);
      if (d < closestDist) { closestDist = d; closest = i; }
    });
    setHovered(closest);
  }

  return (
    <div className="live-chart-wrap">
      <div className="live-chart-header">
        <div>
          <div className="live-chart-title">{title}</div>
          {animated && (
            <div className="live-chart-live-badge">
              <span className="live-dot" />
              LIVE
            </div>
          )}
        </div>
        <div className="live-chart-current">
          <span className="live-chart-value">{valuePrefix}{Number(lastVal.toFixed(2)).toLocaleString()}</span>
          <span className={`live-chart-change ${isUp ? 'up' : 'down'}`}>
            {isUp ? '▲' : '▼'} {changePct}%
          </span>
        </div>
      </div>

      <div
        className="live-chart-svg-wrap"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovered(null)}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          style={{ width: '100%', height: `${height}px`, display: 'block' }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colorVar} stopOpacity="0.22" />
              <stop offset="100%" stopColor={colorVar} stopOpacity="0.01" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Y-axis grid lines + labels */}
          {yTickVals.map((v, i) => {
            const y = toY(v);
            return (
              <g key={i}>
                <line
                  x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
                  stroke="var(--border)" strokeWidth="0.7" strokeDasharray="3 4"
                />
                <text x={PAD.left - 6} y={y + 4} textAnchor="end"
                  fontSize="10" fill="var(--text-dim)">
                  {valuePrefix}{v >= 1000 ? `${(v/1000).toFixed(0)}k` : v.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaPath} fill={`url(#${gradientId})`} />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke={colorVar}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
          />

          {/* Hover crosshair */}
          {hovered !== null && (
            <g>
              <line
                x1={toX(hovered)} y1={PAD.top}
                x2={toX(hovered)} y2={PAD.top + chartH}
                stroke="var(--border-light)" strokeWidth="1" strokeDasharray="3 3"
              />
              <circle
                cx={toX(hovered)} cy={toY(points[hovered].value)}
                r="4" fill={colorVar} stroke="var(--bg2)" strokeWidth="2"
              />
              {/* Tooltip */}
              <g transform={`translate(${Math.min(toX(hovered) + 8, W - 100)}, ${Math.max(toY(points[hovered].value) - 28, PAD.top)})`}>
                <rect rx="5" ry="5" width="88" height="32"
                  fill="var(--bg3)" stroke="var(--border-light)" strokeWidth="1" />
                <text x="44" y="13" textAnchor="middle" fontSize="10" fill="var(--text-muted)">
                  {points[hovered].label}
                </text>
                <text x="44" y="26" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text)">
                  {valuePrefix}{Number(points[hovered].value.toFixed(2)).toLocaleString()}
                </text>
              </g>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
