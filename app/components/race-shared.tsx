'use client';

import { useState, useEffect, useMemo, useRef } from 'react';

// Font family helpers — resolved from next/font CSS variables set on <html>
export const FF = {
  display: "var(--font-archivo), 'Archivo', sans-serif",
  label: "var(--font-archivo-narrow), 'Archivo Narrow', sans-serif",
  mono: "var(--font-jetbrains-mono), 'JetBrains Mono', monospace",
} as const;

// Pulsing live dot
export function LiveDot({ accent = 'var(--accent)', size = 8 }: { accent?: string; size?: number }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: size, height: size, flexShrink: 0 }}>
      <span style={{
        position: 'absolute', inset: 0, borderRadius: 9999,
        background: accent, animation: 'rd-pulse 1.4s ease-out infinite',
      }} />
      <span style={{ position: 'absolute', inset: 0, borderRadius: 9999, background: accent }} />
    </span>
  );
}

// Number that briefly flashes to accent color on change, then returns to ink.
export function TickNumber({ value }: { value: string }) {
  const prevRef = useRef(value);
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    if (prevRef.current === value) return;
    prevRef.current = value;
    setFlashing(true);
    const t = setTimeout(() => setFlashing(false), 600);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <span style={{
      transition: 'color 600ms ease',
      color: flashing ? 'var(--accent)' : 'inherit',
    }}>{value}</span>
  );
}

// Hype chip — "GOING 🔥", "STEADY 🔥", etc.
export function HypeBadge({ label, tone = 'hot' }: { label: string; tone?: 'hot' | 'dark' }) {
  const bg = tone === 'hot' ? 'var(--accent)' : '#1a1816';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      background: bg, color: '#fff',
      fontFamily: FF.label, fontWeight: 800, fontSize: 10,
      letterSpacing: '0.08em', padding: '3px 7px 2px',
      borderRadius: 4, textTransform: 'uppercase', fontStyle: 'italic',
    }}>
      {label} 🔥
    </span>
  );
}

// Star / unstar toggle
export function StarButton({ starred, onClick, size = 36, tone = 'light' }: {
  starred: boolean;
  onClick: () => void;
  size?: number;
  tone?: 'light' | 'dark';
}) {
  const baseColor = tone === 'light' ? '#fff' : '#1a1816';
  const color = starred ? 'var(--accent)' : baseColor;
  const borderAlpha = starred ? '88' : '55';
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      aria-label={starred ? 'Unstar' : 'Star'}
      style={{
        width: size, height: size, borderRadius: 999,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent',
        border: `1.5px solid ${starred ? 'var(--accent)' : `${baseColor}${borderAlpha}`}`,
        color, cursor: 'pointer', padding: 0,
        fontSize: Math.round(size * 0.5), lineHeight: 1,
        transition: 'transform 120ms ease, background 160ms ease, color 160ms ease, border-color 160ms ease',
      }}
    >
      <span style={{ transform: starred ? 'scale(1.1)' : 'scale(1)' }}>
        {starred ? '★' : '☆'}
      </span>
    </button>
  );
}

export function formatEta(seconds: number): string {
  if (seconds < 60) return 'ANY SECOND';
  if (seconds < 3600) return `~${Math.round(seconds / 60)} MIN`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `~${h}H ${m}M`;
}

// Diagonal-hatch race stripe divider
export function RaceStripe({ height = 6 }: { height?: number }) {
  return (
    <div style={{
      height,
      backgroundImage: 'repeating-linear-gradient(-45deg, #1a1816 0, #1a1816 4px, transparent 4px, transparent 8px)',
    }} />
  );
}

// One-shot confetti burst at (x, y) relative to its positioned parent
export function Confetti({ x, y, accent }: { x: number; y: number; accent: string }) {
  const pieces = useMemo(() => {
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

  return (
    <div style={{ position: 'absolute', left: x, top: y, pointerEvents: 'none' }}>
      {pieces.map((p, i) => (
        <span key={i} style={{
          position: 'absolute',
          width: p.w, height: p.h,
          background: p.color,
          borderRadius: 1,
          ['--dx' as string]: `${p.dx}px`,
          ['--dy' as string]: `${p.dy}px`,
          ['--rot' as string]: `${p.rot}deg`,
          animation: `rd-confetti 1.1s cubic-bezier(.2,.7,.3,1) ${p.delay}ms forwards`,
        } as React.CSSProperties} />
      ))}
    </div>
  );
}
