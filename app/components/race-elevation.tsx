'use client';

import { useId, useMemo } from 'react';
import { buildElevationPath, pointAtMile, type Runner } from '@/lib/race-data';
import { FF } from './race-shared';

const MILE_MARKS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 13.1];
const MILE_LABELS: Record<number, string> = {
  0: 'S', 1: '1', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6',
  7: '7', 8: '8', 9: '9', 10: '10', 11: '11', 12: '12', 13: '13', 13.1: 'F',
};

// Global elevation graph with all runners plotted
export function GlobalElevation({ runners, width = 362, height = 160 }: {
  runners: Runner[];
  width?: number;
  height?: number;
}) {
  const padY = 32;
  const { d } = useMemo(() => buildElevationPath(width, height, padY), [width, height]);
  const uid = useId();
  const fillId = `global-fill-${uid}`;
  const clipId = `global-clip-${uid}`;

  const leadMile = runners.length ? Math.max(...runners.map(r => r.mile)) : 0;
  const leadX = (leadMile / 13.1) * width;

  // Label layout with collision avoidance
  const labelData = useMemo(() => {
    const sorted = [...runners].sort((a, b) => a.mile - b.mile);
    const slots = sorted.map((r, i) => {
      const { x, y } = pointAtMile(r.mile, width, height, padY);
      const above = i % 2 === 0;
      return { r, x, y, above, labelX: x, labelY: above ? y - 14 : y + 22 };
    });

    const MIN_GAP = 58;
    (['above', 'below'] as const).forEach(band => {
      const group = slots
        .filter(s => (band === 'above') === s.above)
        .sort((a, b) => a.x - b.x);
      for (let i = 1; i < group.length; i++) {
        if (group[i].labelX - group[i - 1].labelX < MIN_GAP) {
          group[i].labelX = group[i - 1].labelX + MIN_GAP;
        }
      }
      // Clamp right edge and cascade back
      for (let i = group.length - 1; i > 0; i--) {
        if (group[i].labelX > width - 6) {
          group[i].labelX = width - 6;
          if (group[i - 1].labelX > group[i].labelX - MIN_GAP) {
            group[i - 1].labelX = group[i].labelX - MIN_GAP;
          }
        }
      }
    });
    return slots;
  }, [runners, width, height]);

  return (
    <div style={{ padding: '14px 16px 10px', background: '#1a1816', position: 'relative', overflow: 'hidden' }}>
      {/* Diagonal stripe backdrop */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(-45deg, rgba(255,255,255,0.025) 0, rgba(255,255,255,0.025) 2px, transparent 2px, transparent 12px)',
      }} />

      {/* Header row */}
      <div style={{
        position: 'relative', display: 'flex', justifyContent: 'space-between',
        alignItems: 'baseline', marginBottom: 4,
      }}>
        <div style={{ fontFamily: FF.label, fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', color: '#f5f1e8', fontStyle: 'italic' }}>
          COURSE · 13.1MI
        </div>
        <div style={{ fontFamily: FF.mono, fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', color: '#f5f1e8aa' }}>
          +467FT / -357FT · BROOKLYN
        </div>
      </div>

      <svg
        width={width}
        height={height + 18}
        viewBox={`0 0 ${width} ${height + 18}`}
        style={{ display: 'block', position: 'relative', overflow: 'visible' }}
        aria-label={runners.map(r => `${r.name} at mile ${r.mile.toFixed(1)}`).join(', ')}
      >
        <defs>
          <linearGradient id={fillId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#f5f1e8" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#f5f1e8" stopOpacity="0" />
          </linearGradient>
          <clipPath id={clipId}>
            <rect x="0" y="0" width={Math.max(0, leadX)} height={height} />
          </clipPath>
        </defs>

        {/* Faint horizontal grid lines */}
        {[0.25, 0.5, 0.75].map(f => (
          <line key={f}
            x1="0" x2={width}
            y1={padY + f * (height - padY * 2)}
            y2={padY + f * (height - padY * 2)}
            stroke="#f5f1e8" strokeOpacity="0.05" strokeDasharray="2 4"
          />
        ))}

        {/* Base path — whole course, faded */}
        <path d={d} stroke="#f5f1e8" strokeOpacity="0.28" strokeWidth="1.5" fill="none" strokeLinecap="round" />

        {/* Traveled region — brighter stroke + gradient fill */}
        <g clipPath={`url(#${clipId})`}>
          <path d={`${d} L ${width} ${height} L 0 ${height} Z`} fill={`url(#${fillId})`} />
          <path d={d} stroke="#f5f1e8" strokeOpacity="0.7" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </g>

        {/* Mile labels */}
        {MILE_MARKS.map(m => {
          const tx = (m / 13.1) * width;
          const isPast = leadMile >= m;
          const anchor = m === 0 ? 'start' : m === 13.1 ? 'end' : 'middle';
          return (
            <g key={m}>
              <line x1={tx} x2={tx} y1={height - 4} y2={height + 1}
                stroke="#f5f1e8" strokeOpacity={isPast ? 0.5 : 0.25} strokeWidth="1" />
              <text x={tx} y={height + 15}
                textAnchor={anchor}
                fontFamily={FF.mono} fontSize="9" fontWeight="700" letterSpacing="0.05em"
                fill="#f5f1e8" fillOpacity={isPast ? 0.85 : 0.45}>
                {MILE_LABELS[m]}
              </text>
            </g>
          );
        })}

        {/* Runner dots + labels */}
        {labelData.map(({ r, x, y, above, labelX, labelY }) => (
          <g key={r.id}>
            {/* Leader line from dot to label */}
            <line x1={x} y1={y} x2={labelX} y2={above ? labelY + 4 : labelY - 12}
              stroke={r.color} strokeOpacity="0.55" strokeWidth="1" strokeLinecap="round" />
            {/* Outer ink ring */}
            <circle cx={x} cy={y} r="8" fill="#1a1816" />
            {/* Colored stroke ring — pulses */}
            <circle cx={x} cy={y} r="6.5" fill="#1a1816" stroke={r.color} strokeWidth="2">
              <animate attributeName="r" values="6.5;8;6.5" dur="1.8s" repeatCount="indefinite" />
            </circle>
            {/* Solid color core */}
            <circle cx={x} cy={y} r="3" fill={r.color} />
            {/* Name */}
            <text x={labelX} y={labelY}
              textAnchor="middle"
              fontFamily={FF.label} fontSize="10" fontWeight="800"
              letterSpacing="0.04em" fontStyle="italic" fill="#f5f1e8">
              {r.name.toUpperCase()}
            </text>
            {/* Mile readout */}
            <text x={labelX} y={labelY + (above ? -9 : 10)}
              textAnchor="middle"
              fontFamily={FF.mono} fontSize="8" fontWeight="600" fill={r.color}>
              {r.mile.toFixed(1)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// Full elevation profile for focus view
export function ElevationFull({ mile, color, width = 354, height = 150 }: {
  mile: number;
  color: string;
  width?: number;
  height?: number;
}) {
  const padY = 18;
  const { d } = useMemo(() => buildElevationPath(width, height, padY), [width, height]);
  const { x, y } = pointAtMile(mile, width, height, padY);
  const uid = useId();
  const fillId = `elev-fill-${uid}`;
  const clipId = `elev-clip-${uid}`;

  return (
    <svg
      width={width}
      height={height + 28}
      viewBox={`0 0 ${width} ${height + 28}`}
      style={{ display: 'block' }}
      aria-label={`Elevation profile, runner at mile ${mile.toFixed(1)}`}
    >
      <defs>
        <linearGradient id={fillId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <clipPath id={clipId}>
          <rect x="0" y="0" width={Math.max(0, x)} height={height} />
        </clipPath>
      </defs>

      {/* Faint grid lines */}
      {[0, 0.33, 0.66, 1].map((f, i) => (
        <line key={i} x1="0" x2={width}
          y1={padY + f * (height - padY * 2)}
          y2={padY + f * (height - padY * 2)}
          stroke="#1a1816" strokeOpacity="0.06" strokeDasharray="2 4" />
      ))}

      {/* Full course path */}
      <path d={d} stroke="#1a1816" strokeOpacity="0.2" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Traveled fill + stroke */}
      <g clipPath={`url(#${clipId})`}>
        <path d={`${d} L ${width} ${height} L 0 ${height} Z`} fill={`url(#${fillId})`} />
        <path d={d} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>

      {/* Runner dot */}
      <circle cx={x} cy={y} r="9" fill="#fff" />
      <circle cx={x} cy={y} r="6.5" fill={color}>
        <animate attributeName="r" values="6.5;8;6.5" dur="1.6s" repeatCount="indefinite" />
      </circle>

      {/* Mile labels */}
      {MILE_MARKS.map(m => {
        const tx = (m / 13.1) * width;
        const isPast = mile >= m;
        return (
          <g key={m}>
            <line x1={tx} x2={tx} y1={height - 4} y2={height + 2}
              stroke="#1a1816" strokeOpacity={isPast ? 0.6 : 0.3} strokeWidth="1" />
            <text x={tx} y={height + 18}
              textAnchor={m === 0 ? 'start' : m === 13.1 ? 'end' : 'middle'}
              fontFamily={FF.mono} fontSize="9" fontWeight="700" letterSpacing="0.05em"
              fill={isPast ? '#1a1816' : '#1a181680'}>
              {MILE_LABELS[m]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
