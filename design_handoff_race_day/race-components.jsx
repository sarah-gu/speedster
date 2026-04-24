// Shared components: ElevationMini, ElevationFull, HypeBadge, LiveDot, TickNumber, Confetti

function useAccent(accent) {
  React.useEffect(() => {
    document.documentElement.style.setProperty('--accent', accent);
  }, [accent]);
}

// Pulsing dot ● LIVE
function LiveDot({ accent = 'var(--accent)', size = 8 }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: size, height: size }}>
      <span style={{
        position: 'absolute', inset: 0, borderRadius: 9999,
        background: accent, animation: 'rd-pulse 1.4s ease-out infinite',
      }} />
      <span style={{
        position: 'absolute', inset: 0, borderRadius: 9999, background: accent,
      }} />
    </span>
  );
}

// Ticking number — briefly flashes on change
function TickNumber({ value, style, className }) {
  const [flash, setFlash] = React.useState(false);
  const prev = React.useRef(value);
  React.useEffect(() => {
    if (prev.current !== value) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 600);
      prev.current = value;
      return () => clearTimeout(t);
    }
  }, [value]);
  return (
    <span className={className} style={{
      transition: 'color 600ms ease, background 600ms ease',
      color: flash ? 'var(--accent)' : 'inherit',
      ...style,
    }}>{value}</span>
  );
}

// Hype chip — "GOING", "STEADY", etc.
function HypeBadge({ label, flame = true, tone = 'hot' }) {
  const bg = tone === 'hot' ? 'var(--accent)' : '#1a1816';
  const fg = tone === 'hot' ? '#fff' : '#fff';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: bg, color: fg,
      fontFamily: "'Archivo Narrow', 'Archivo', sans-serif",
      fontWeight: 800, fontSize: 10, letterSpacing: '0.08em',
      padding: '3px 7px 2px', borderRadius: 4,
      textTransform: 'uppercase',
      fontStyle: 'italic',
    }}>
      {label}{flame ? ' 🔥' : ''}
    </span>
  );
}

// Race-stripe divider (diagonal hatch)
function RaceStripe({ height = 6, style = {} }) {
  return (
    <div style={{
      height,
      backgroundImage: 'repeating-linear-gradient(-45deg, #1a1816 0, #1a1816 4px, transparent 4px, transparent 8px)',
      ...style,
    }} />
  );
}

// Mini elevation sparkline with a pulsing dot for this runner's position
function ElevationMini({ mile, color, width = 280, height = 46 }) {
  const { d } = React.useMemo(() => buildElevationPath(width, height, 6), [width, height]);
  const { x, y } = pointAtMile(mile, width, height, 6);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`fill-${Math.round(x)}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Traveled portion */}
      <path d={`${d} L ${width} ${height} L 0 ${height} Z`} fill={`url(#fill-${Math.round(x)})`} opacity="0.9" clipPath={`inset(0 ${width - x}px 0 0)`}/>
      {/* Full course path */}
      <path d={d} stroke="#1a1816" strokeOpacity="0.15" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Traveled line */}
      <path d={d} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round"
        style={{ strokeDasharray: `${x} 9999`, strokeDashoffset: 0 }} />
      {/* Dot */}
      <circle cx={x} cy={y} r="6" fill="#fff" />
      <circle cx={x} cy={y} r="4.5" fill={color}>
        <animate attributeName="r" values="4.5;5.5;4.5" dur="1.6s" repeatCount="indefinite" />
      </circle>
      {/* Mile ticks */}
      {[5, 10, 13.1, 15, 20, 25].map(m => {
        const tx = (m / 26.2) * width;
        return <line key={m} x1={tx} x2={tx} y1={height - 2} y2={height} stroke="#1a1816" strokeOpacity="0.3" strokeWidth="1" />;
      })}
    </svg>
  );
}

// Full elevation for focus view — labels, landmarks
function ElevationFull({ mile, color, width = 360, height = 160, animateProgress = false }) {
  const padY = 18;
  const { d } = React.useMemo(() => buildElevationPath(width, height, padY), [width, height]);
  const { x, y, el } = pointAtMile(mile, width, height, padY);
  const miles = [0, 6.5, 13.1, 19.5, 26.2];
  const labels = { 0: 'START', 6.5: '10K', 13.1: 'HALF', 19.5: '30K', 26.2: 'FINISH' };
  return (
    <svg width={width} height={height + 28} viewBox={`0 0 ${width} ${height + 28}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="elev-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <clipPath id="elev-clip">
          <rect x="0" y="0" width={x} height={height} />
        </clipPath>
      </defs>
      {/* faint grid */}
      {[0, 0.33, 0.66, 1].map((f, i) => (
        <line key={i} x1="0" x2={width} y1={padY + f * (height - padY * 2)} y2={padY + f * (height - padY * 2)}
          stroke="#1a1816" strokeOpacity="0.06" strokeDasharray="2 4" />
      ))}
      {/* Full path */}
      <path d={d} stroke="#1a1816" strokeOpacity="0.2" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Traveled fill + stroke */}
      <g clipPath="url(#elev-clip)">
        <path d={`${d} L ${width} ${height} L 0 ${height} Z`} fill="url(#elev-fill)" />
        <path d={d} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>
      {/* Dot */}
      <circle cx={x} cy={y} r="9" fill="#fff" />
      <circle cx={x} cy={y} r="6.5" fill={color}>
        <animate attributeName="r" values="6.5;8;6.5" dur="1.6s" repeatCount="indefinite" />
      </circle>
      {/* mile labels */}
      {miles.map(m => {
        const tx = (m / 26.2) * width;
        const isPast = mile >= m;
        return (
          <g key={m}>
            <line x1={tx} x2={tx} y1={height - 4} y2={height + 2} stroke="#1a1816" strokeOpacity={isPast ? 0.6 : 0.3} strokeWidth="1" />
            <text x={tx} y={height + 18}
              textAnchor={m === 0 ? 'start' : m === 26.2 ? 'end' : 'middle'}
              fontFamily="'JetBrains Mono', monospace" fontSize="9"
              fontWeight="700" letterSpacing="0.05em"
              fill={isPast ? '#1a1816' : '#1a181680'}>
              {labels[m]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// One-shot confetti burst at a point (in px, relative to its parent)
function Confetti({ x = 0, y = 0, accent = 'var(--accent)', onDone }) {
  const pieces = React.useMemo(() => {
    const arr = [];
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const vel = 30 + Math.random() * 70;
      arr.push({
        dx: Math.cos(angle) * vel,
        dy: Math.sin(angle) * vel - 20,
        rot: Math.random() * 360,
        color: [accent, '#1a1816', '#f5c246', '#fff'][i % 4],
        w: 3 + Math.random() * 4,
        h: 6 + Math.random() * 6,
        delay: Math.random() * 80,
      });
    }
    return arr;
  }, [accent]);
  React.useEffect(() => {
    const t = setTimeout(() => onDone && onDone(), 1400);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div style={{ position: 'absolute', left: x, top: y, pointerEvents: 'none' }}>
      {pieces.map((p, i) => (
        <span key={i} style={{
          position: 'absolute',
          width: p.w, height: p.h,
          background: p.color,
          borderRadius: 1,
          '--dx': `${p.dx}px`, '--dy': `${p.dy}px`, '--rot': `${p.rot}deg`,
          animation: `rd-confetti 1.1s cubic-bezier(.2,.7,.3,1) ${p.delay}ms forwards`,
        }} />
      ))}
    </div>
  );
}

Object.assign(window, {
  useAccent, LiveDot, TickNumber, HypeBadge, RaceStripe, ElevationMini, ElevationFull, Confetti,
});
