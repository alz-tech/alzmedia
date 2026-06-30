import { useRef } from 'react';

/**
 * LiveChart — static snapshot chart (crypto-style area line)
 * No random animation. Shows real data or a flat placeholder.
 * Props:
 *   data        : [{ label, value }]  — real data points
 *   color       : 'purple' | 'green'
 *   title       : string
 *   valuePrefix : string (e.g. '₦')
 *   height      : number (default 160)
 *   isLive      : bool — shows the LIVE badge (still static visually; badge means data is up-to-date)
 */
export default function LiveChart({
  data = [],
  color = 'purple',
  title = 'Chart',
  valuePrefix = '',
  height = 160,
  isLive = false,
}) {
  const svgRef = useRef(null);

  // Placeholder flat line when no real data
  const points = data.length >= 2
    ? data
    : Array.from({ length: 16 }, (_, i) => ({
        label: `Day ${i + 1}`,
        value: 0,
      }));

  const vals  = points.map(p => p.value);
  const minV  = Math.min(...vals);
  const maxV  = Math.max(...vals);
  const range = maxV - minV || 1;

  const W = 600;
  const H = height;
  const PAD = { top: 12, right: 8, bottom: 22, left: 40 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const toX = (i) => PAD.left + (i / (points.length - 1)) * chartW;
  const toY = (v) => {
    if (maxV === 0) return PAD.top + chartH * 0.7; // flat middle when all zero
    return PAD.top + chartH - ((v - minV) / range) * chartH;
  };

  const linePath = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(p.value).toFixed(1)}`
  ).join(' ');

  const areaPath = `${linePath} L ${toX(points.length - 1).toFixed(1)} ${(PAD.top + chartH).toFixed(1)} L ${PAD.left.toFixed(1)} ${(PAD.top + chartH).toFixed(1)} Z`;

  const colorHex   = color === 'green' ? '#34D399' : '#9D5FF5';
  const gradientId = `grad-${color}-${title.replace(/\W/g, '')}`;

  const lastVal  = vals[vals.length - 1] ?? 0;
  const firstVal = vals[0] ?? 0;
  const isUp     = lastVal >= firstVal;
  const changePct = firstVal > 0
    ? ((Math.abs(lastVal - firstVal) / firstVal) * 100).toFixed(1)
    : '0.0';

  const isEmpty = maxV === 0;

  // Y-axis labels (3 ticks)
  const yTicks = [maxV, (maxV + minV) / 2, minV].filter((_, i, a) => {
    // deduplicate when all same
    return a.indexOf(_) === i;
  });

  return (
    <div className="lc-wrap">
      <div className="lc-header">
        <div className="lc-left">
          <span className="lc-title">{title}</span>
          {isLive && (
            <span className="lc-live">
              <span className="lc-dot" />
              LIVE
            </span>
          )}
        </div>
        <div className="lc-right">
          <span className="lc-value">{valuePrefix}{Number(lastVal.toFixed(2)).toLocaleString()}</span>
          {!isEmpty && (
            <span className={`lc-change ${isUp ? 'up' : 'down'}`}>
              {isUp ? '▲' : '▼'} {changePct}%
            </span>
          )}
        </div>
      </div>

      <div className="lc-svg-wrap" ref={svgRef}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          style={{ width: '100%', height: `${height}px`, display: 'block' }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={colorHex} stopOpacity={isEmpty ? '0.04' : '0.18'} />
              <stop offset="100%" stopColor={colorHex} stopOpacity="0.01" />
            </linearGradient>
            <filter id={`glow-${color}`}>
              <feGaussianBlur stdDeviation="2" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Grid lines */}
          {yTicks.map((v, i) => {
            const y = toY(v);
            return (
              <g key={i}>
                <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
                  stroke="#ffffff18" strokeWidth="0.6" strokeDasharray="3 5" />
                {!isEmpty && (
                  <text x={PAD.left - 5} y={y + 4} textAnchor="end"
                    fontSize="9" fill="#6B6B8A">
                    {valuePrefix}{v >= 1000 ? `${(v / 1000).toFixed(0)}k` : Math.round(v)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Area */}
          <path d={areaPath} fill={`url(#${gradientId})`} />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke={colorHex}
            strokeWidth={isEmpty ? '1' : '1.8'}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity={isEmpty ? '0.3' : '1'}
            filter={isEmpty ? undefined : `url(#glow-${color})`}
          />

          {/* Last point dot */}
          {!isEmpty && (
            <circle
              cx={toX(points.length - 1)}
              cy={toY(lastVal)}
              r="3.5"
              fill={colorHex}
              stroke="#0E0E1A"
              strokeWidth="2"
            />
          )}

          {/* Empty state text */}
          {isEmpty && (
            <text x={W / 2} y={H / 2 + 4} textAnchor="middle"
              fontSize="12" fill="#3D3D55">
              No data yet
            </text>
          )}
        </svg>
      </div>
    </div>
  );
}
