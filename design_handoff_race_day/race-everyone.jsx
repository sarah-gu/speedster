// Global elevation map with all runners plotted as dots + slim list rows below

function GlobalElevation({ runners, width = 362, height = 160 }) {
  const padY = 32;
  const { d } = React.useMemo(() => buildElevationPath(width, height, padY), [width, height]);

  // Most-advanced runner determines shaded/traveled region
  const leadMile = Math.max(...runners.map(r => r.mile));
  const leadX = (leadMile / 26.2) * width;

  const miles = [0, 6.5, 13.1, 19.5, 26.2];
  const labels = { 0: 'START', 6.5: '10K', 13.1: 'HALF', 19.5: '30K', 26.2: 'FINISH' };

  // Smart label layout: compute each runner's dot position, then
  // distribute labels alternating above/below the curve with minimum
  // horizontal spacing to prevent overlap.
  const labelData = React.useMemo(() => {
    const sorted = [...runners].sort((a, b) => a.mile - b.mile);
    const slots = sorted.map((r, i) => {
      const { x, y } = pointAtMile(r.mile, width, height, padY);
      const above = i % 2 === 0; // alternate above/below
      return { r, x, y, above, labelX: x, labelY: above ? y - 14 : y + 22 };
    });
    // Horizontal nudge: within same band (above/below), ensure min 58px gap
    const MIN_GAP = 58;
    ['above', 'below'].forEach(band => {
      const group = slots.filter(s => (band === 'above') === s.above)
        .sort((a, b) => a.x - b.x);
      for (let i = 1; i < group.length; i++) {
        if (group[i].labelX - group[i - 1].labelX < MIN_GAP) {
          group[i].labelX = group[i - 1].labelX + MIN_GAP;
        }
      }
      // Clamp right edge
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
  }, [runners, width, height, padY]);

  return (
    <div style={{
      padding: '14px 16px 10px 16px',
      background: '#1a1816',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* diagonal stripe backdrop */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(-45deg, rgba(255,255,255,0.025) 0, rgba(255,255,255,0.025) 2px, transparent 2px, transparent 12px)',
      }} />

      <div style={{
        position: 'relative',
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: 4,
      }}>
        <div style={{
          fontFamily: "'Archivo Narrow', sans-serif",
          fontSize: 10, fontWeight: 800, letterSpacing: '0.16em',
          color: '#f5f1e8', fontStyle: 'italic', whiteSpace: 'nowrap',
        }}>COURSE · 26.2MI</div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9, fontWeight: 600, letterSpacing: '0.08em',
          color: '#f5f1e8aa', whiteSpace: 'nowrap',
        }}>↑180 FT · STATEN I → C.PARK</div>
      </div>

      <svg width={width} height={height + 18} viewBox={`0 0 ${width} ${height + 18}`} style={{ display: 'block', position: 'relative', overflow: 'visible' }}>
        <defs>
          <linearGradient id="global-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#f5f1e8" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#f5f1e8" stopOpacity="0" />
          </linearGradient>
          <clipPath id="global-clip">
            <rect x="0" y="0" width={leadX} height={height} />
          </clipPath>
        </defs>

        {/* faint horizontal grid */}
        {[0.25, 0.5, 0.75].map(f => (
          <line key={f} x1="0" x2={width}
            y1={padY + f * (height - padY * 2)} y2={padY + f * (height - padY * 2)}
            stroke="#f5f1e8" strokeOpacity="0.05" strokeDasharray="2 4" />
        ))}

        {/* base path (whole course, faded) */}
        <path d={d} stroke="#f5f1e8" strokeOpacity="0.28" strokeWidth="1.5" fill="none" strokeLinecap="round" />

        {/* traveled fill + brighter stroke (up to lead runner) */}
        <g clipPath="url(#global-clip)">
          <path d={`${d} L ${width} ${height} L 0 ${height} Z`} fill="url(#global-fill)" />
          <path d={d} stroke="#f5f1e8" strokeOpacity="0.7" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </g>

        {/* mile labels */}
        {miles.map(m => {
          const tx = (m / 26.2) * width;
          const isPast = leadMile >= m;
          const anchor = m === 0 ? 'start' : m === 26.2 ? 'end' : 'middle';
          return (
            <g key={m}>
              <line x1={tx} x2={tx} y1={height - 4} y2={height + 1}
                stroke="#f5f1e8" strokeOpacity={isPast ? 0.5 : 0.25} strokeWidth="1" />
              <text x={tx} y={height + 15}
                textAnchor={anchor}
                fontFamily="'JetBrains Mono', monospace" fontSize="9"
                fontWeight="700" letterSpacing="0.05em"
                fill="#f5f1e8" fillOpacity={isPast ? 0.85 : 0.45}>
                {labels[m]}
              </text>
            </g>
          );
        })}

        {/* runner dots + labels */}
        {labelData.map(({ r, x, y, above, labelX, labelY }) => {
          const anchor = 'middle';
          return (
            <g key={r.id}>
              {/* leader line from dot to label */}
              <line x1={x} y1={y} x2={labelX} y2={above ? labelY + 4 : labelY - 12}
                stroke={r.color} strokeOpacity="0.55" strokeWidth="1" strokeLinecap="round" />
              {/* outer ring */}
              <circle cx={x} cy={y} r="8" fill="#1a1816" />
              <circle cx={x} cy={y} r="6.5" fill="#1a1816" stroke={r.color} strokeWidth="2">
                <animate attributeName="r" values="6.5;8;6.5" dur="1.8s" repeatCount="indefinite" />
              </circle>
              <circle cx={x} cy={y} r="3" fill={r.color} />
              {/* name label */}
              <text x={labelX} y={labelY}
                textAnchor={anchor}
                fontFamily="'Archivo Narrow', sans-serif"
                fontSize="10" fontWeight="800"
                letterSpacing="0.04em"
                fontStyle="italic"
                fill="#f5f1e8">
                {r.name.toUpperCase()}
              </text>
              <text x={labelX} y={labelY + (above ? -9 : 10)}
                textAnchor={anchor}
                fontFamily="'JetBrains Mono', monospace"
                fontSize="8" fontWeight="600"
                fill={r.color}>
                {r.mile.toFixed(1)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function SlimRunnerRow({ runner, rank, onOpen }) {
  return (
    <button onClick={() => onOpen(runner)} style={{
      display: 'flex', width: '100%', alignItems: 'center',
      gap: 10, padding: '14px 14px 14px 14px',
      background: '#fbf7ee', border: 'none',
      borderBottom: '1px solid #1a18160d',
      textAlign: 'left', cursor: 'pointer',
      fontFamily: "'Archivo', sans-serif",
      position: 'relative',
      boxSizing: 'border-box',
    }}>
      {/* color stripe */}
      <div style={{
        position: 'absolute', left: 0, top: 8, bottom: 8, width: 4,
        background: runner.color, borderRadius: '0 2px 2px 0',
      }} />

      {/* Big mile — moved to LEFT for prominence */}
      <div style={{ textAlign: 'center', minWidth: 58, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, justifyContent: 'center' }}>
          <span style={{
            fontFamily: "'Archivo', sans-serif",
            fontSize: 34, fontWeight: 900, lineHeight: 0.9,
            letterSpacing: '-0.04em', fontStyle: 'italic',
            color: '#1a1816',
          }}>
            <TickNumber value={runner.mile.toFixed(1)} />
          </span>
        </div>
        <div style={{
          fontFamily: "'Archivo Narrow', sans-serif",
          fontSize: 8, fontWeight: 800, letterSpacing: '0.16em',
          color: '#1a181677', marginTop: 3,
        }}>MILE</div>
      </div>

      {/* Divider */}
      <div style={{ width: 1, alignSelf: 'stretch', background: '#1a181614', margin: '4px 2px' }} />

      {/* Name + details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'nowrap' }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10, fontWeight: 700, color: '#1a181655',
          }}>{String(rank).padStart(2, '0')}</span>
          <span style={{
            fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em',
            fontStyle: 'italic', lineHeight: 1, color: '#1a1816',
            whiteSpace: 'nowrap', paddingRight: 4,
          }}>{runner.name}</span>
          <span style={{
            fontSize: 12, fontWeight: 500, color: '#1a181699',
            whiteSpace: 'nowrap', letterSpacing: '-0.01em',
          }}>{runner.last}</span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          marginTop: 6,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10, fontWeight: 600, color: '#1a181699',
          whiteSpace: 'nowrap',
        }}>
          <HypeBadge label={runner.hype} />
          <span>{runner.pace}/mi</span>
          <span style={{ color: '#1a18162e' }}>·</span>
          <span>→{runner.projected.replace(' ', '')}</span>
        </div>
      </div>

      {/* Chevron */}
      <div style={{
        color: '#1a181644', fontFamily: 'monospace', fontSize: 18, flexShrink: 0,
      }}>›</div>
    </button>
  );
}

function EveryoneView({ runners, onOpen, elapsed, confettiFor }) {
  const liveCount = runners.filter(r => r.status === 'running').length;
  const sorted = [...runners].sort((a, b) => b.mile - a.mile);
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f5f1e8' }}>
      {/* Top dark block: title + live pill + global elevation */}
      <div style={{
        padding: '66px 20px 8px',
        background: '#1a1816',
        color: '#f5f1e8',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'repeating-linear-gradient(-45deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 10px)',
        }} />
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
          <div>
            <div style={{
              fontFamily: "'Archivo Narrow', sans-serif",
              fontSize: 9, fontWeight: 700, letterSpacing: '0.16em',
              opacity: 0.6, whiteSpace: 'nowrap',
            }}>NYC · NOV 1</div>
            <div style={{
              fontFamily: "'Archivo', sans-serif",
              fontSize: 26, fontWeight: 900, letterSpacing: '-0.03em',
              lineHeight: 1, marginTop: 4, fontStyle: 'italic',
            }}>RACE DAY.</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9, fontWeight: 600, letterSpacing: '0.08em',
              opacity: 0.9, whiteSpace: 'nowrap',
            }}>
              <LiveDot size={7} />
              {liveCount} LIVE
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11, marginTop: 4, opacity: 0.65, whiteSpace: 'nowrap',
            }}>{elapsed}</div>
          </div>
        </div>
      </div>

      {/* Global elevation (still dark) */}
      <div style={{ position: 'relative' }}>
        <GlobalElevation runners={runners} />
        {confettiFor && (() => {
          const r = runners.find(x => x.id === confettiFor);
          if (!r) return null;
          const { x, y } = pointAtMile(r.mile, 362, 160, 32);
          return <Confetti x={16 + x} y={48 + y} accent={r.color} />;
        })()}
      </div>

      {/* Section label */}
      <div style={{
        padding: '12px 16px 4px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        whiteSpace: 'nowrap',
      }}>
        <div style={{
          fontFamily: "'Archivo Narrow', sans-serif",
          fontSize: 11, fontWeight: 800, letterSpacing: '0.12em',
          fontStyle: 'italic',
        }}>CREW · {runners.length}</div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9, color: '#1a181680', letterSpacing: '0.06em',
        }}>SORTED · BY POS</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {sorted.map((r, i) => (
          <SlimRunnerRow
            key={r.id}
            runner={r}
            rank={i + 1}
            onOpen={onOpen}
          />
        ))}

        {/* edit crew footer */}
        <div style={{
          padding: '16px 20px 28px', textAlign: 'center',
        }}>
          <button style={{
            background: 'transparent', border: '1.5px solid #1a181622',
            padding: '10px 18px', borderRadius: 999,
            fontFamily: "'Archivo Narrow', sans-serif",
            fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
            color: '#1a1816aa', cursor: 'pointer',
          }}>EDIT CREW</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { EveryoneView, GlobalElevation });
