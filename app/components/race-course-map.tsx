'use client';

import { useMemo } from 'react';
import { COURSE_GEO, LANDMARKS, pointAtMileGeo } from '@/lib/race-data';
import { FF } from './race-shared';

const INTEGER_MILES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

export function CourseMap({ mile, color, width = 354, height = 380 }: {
  mile: number;
  color: string;
  width?: number;
  height?: number;
}) {
  // Project normalized [0..1] course coords into the SVG viewport, preserving aspect.
  const { project, coursePath, traveledPath, runnerPt } = useMemo(() => {
    const padX = 18;
    const padY = 22;
    const innerW = width - padX * 2;
    const innerH = height - padY * 2;

    const xs = COURSE_GEO.map(p => p[1]);
    const ys = COURSE_GEO.map(p => p[2]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;

    const scale = Math.min(innerW / spanX, innerH / spanY);
    const drawW = spanX * scale;
    const drawH = spanY * scale;
    const offsetX = padX + (innerW - drawW) / 2;
    const offsetY = padY + (innerH - drawH) / 2;

    const project = (nx: number, ny: number) => ({
      x: offsetX + (nx - minX) * scale,
      y: offsetY + (ny - minY) * scale,
    });

    const pts = COURSE_GEO.map(([, nx, ny]) => project(nx, ny));

    // Full course path — smooth Catmull-Rom to cubic
    const toPath = (points: { x: number; y: number }[]) => {
      if (points.length === 0) return '';
      let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i - 1] ?? points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2] ?? p2;
        const c1x = p1.x + (p2.x - p0.x) / 6;
        const c1y = p1.y + (p2.y - p0.y) / 6;
        const c2x = p2.x - (p3.x - p1.x) / 6;
        const c2y = p2.y - (p3.y - p1.y) / 6;
        d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
      }
      return d;
    };

    const coursePath = toPath(pts);

    // Traveled path — all points up to current mile, plus an interpolated endpoint
    const clampedMile = Math.max(0, Math.min(13.1, mile));
    const traveledPts: { x: number; y: number }[] = [];
    for (const [m, nx, ny] of COURSE_GEO) {
      if (m <= clampedMile) traveledPts.push(project(nx, ny));
      else break;
    }
    const runnerNorm = pointAtMileGeo(clampedMile);
    const { x: rx, y: ry } = project(runnerNorm.x, runnerNorm.y);
    const tail = traveledPts[traveledPts.length - 1];
    if (!tail || tail.x !== rx || tail.y !== ry) {
      traveledPts.push({ x: rx, y: ry });
    }
    const traveledPath = toPath(traveledPts);

    return {
      project,
      coursePath,
      traveledPath,
      runnerPt: { x: rx, y: ry },
    };
  }, [mile, width, height]);

  const startPt = useMemo(() => {
    const [, sx, sy] = COURSE_GEO[0];
    return project(sx, sy);
  }, [project]);
  const finishPt = useMemo(() => {
    const [, fx, fy] = COURSE_GEO[COURSE_GEO.length - 1];
    return project(fx, fy);
  }, [project]);

  return (
    <div style={{
      position: 'relative', background: '#fbf7ee',
      borderRadius: 6, overflow: 'hidden',
      border: '1px solid #1a181614',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(-45deg, rgba(26,24,22,0.035) 0, rgba(26,24,22,0.035) 2px, transparent 2px, transparent 12px)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative', display: 'flex', justifyContent: 'space-between',
        alignItems: 'baseline', padding: '10px 14px 0',
      }}>
        <div style={{ fontFamily: FF.label, fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', color: '#1a1816', fontStyle: 'italic' }}>
          COURSE · BROOKLYN
        </div>
        <div style={{ fontFamily: FF.mono, fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', color: '#1a181688' }}>
          13.1MI
        </div>
      </div>

      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: 'block', position: 'relative' }}
        aria-label={`Course map, runner at mile ${mile.toFixed(1)}`}
      >
        {/* Full course path — faint ink */}
        <path
          d={coursePath}
          stroke="#1a1816"
          strokeOpacity="0.22"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Integer mile ticks */}
        {INTEGER_MILES.map(m => {
          const { x, y } = pointAtMileGeo(m);
          const { x: px, y: py } = project(x, y);
          const isPast = mile >= m;
          return (
            <g key={m}>
              <circle
                cx={px} cy={py} r="3.5"
                fill="#fbf7ee"
                stroke="#1a1816"
                strokeOpacity={isPast ? 0.7 : 0.3}
                strokeWidth="1"
              />
              <text
                x={px + 6} y={py - 5}
                fontFamily={FF.mono} fontSize="8" fontWeight="700"
                fill="#1a1816"
                fillOpacity={isPast ? 0.8 : 0.4}
              >
                {m}
              </text>
            </g>
          );
        })}

        {/* Landmark pins */}
        {LANDMARKS.map(lm => {
          const { x: px, y: py } = project(lm.geo[0], lm.geo[1]);
          const allPassed = lm.passMiles.every(m => mile >= m);
          const passesRemaining = lm.passMiles.filter(m => m > mile).length;
          const opacity = allPassed ? 0.4 : 1;
          return (
            <g key={lm.id} style={{ opacity }}>
              {/* Pin outer ring */}
              <circle cx={px} cy={py} r="9" fill="var(--accent)" stroke="#1a1816" strokeWidth="1.5" />
              <circle cx={px} cy={py} r="3" fill="#1a1816" />

              {/* Label chip */}
              <g transform={`translate(${px + 12}, ${py - 8})`}>
                <rect x="0" y="0" rx="3" ry="3"
                  width={lm.shortName.length * 7 + 18} height="18"
                  fill="#1a1816"
                />
                <text x="6" y="12"
                  fontFamily={FF.label} fontSize="10" fontWeight="800"
                  letterSpacing="0.08em" fontStyle="italic" fill="#fbf7ee">
                  {lm.shortName}
                </text>
                {lm.passMiles.length > 1 && (
                  <text
                    x={lm.shortName.length * 7 + 12}
                    y="12"
                    fontFamily={FF.mono} fontSize="9" fontWeight="700"
                    fill="var(--accent)"
                    textAnchor="middle"
                  >
                    ×{passesRemaining || lm.passMiles.length}
                  </text>
                )}
              </g>
            </g>
          );
        })}

        {/* Traveled portion */}
        {mile > 0 && (
          <path
            d={traveledPath}
            stroke={color}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Start marker — bib square */}
        <g>
          <rect
            x={startPt.x - 9} y={startPt.y - 9}
            width="18" height="18" rx="2"
            fill="#1a1816"
          />
          <text
            x={startPt.x} y={startPt.y + 4}
            textAnchor="middle"
            fontFamily={FF.label} fontSize="10" fontWeight="900"
            fontStyle="italic" fill="#fbf7ee"
          >
            S
          </text>
        </g>

        {/* Finish marker — bib square (accent) */}
        <g>
          <rect
            x={finishPt.x - 9} y={finishPt.y - 9}
            width="18" height="18" rx="2"
            fill="var(--accent)"
            stroke="#1a1816"
            strokeWidth="1.5"
          />
          <text
            x={finishPt.x} y={finishPt.y + 4}
            textAnchor="middle"
            fontFamily={FF.label} fontSize="10" fontWeight="900"
            fontStyle="italic" fill="#1a1816"
          >
            F
          </text>
        </g>

        {/* Runner dot */}
        {mile > 0 && mile < 13.1 && (
          <g>
            <circle cx={runnerPt.x} cy={runnerPt.y} r="10" fill="#fff" />
            <circle cx={runnerPt.x} cy={runnerPt.y} r="7" fill={color}>
              <animate attributeName="r" values="7;9;7" dur="1.6s" repeatCount="indefinite" />
            </circle>
            <circle cx={runnerPt.x} cy={runnerPt.y} r="3" fill="#fff" />
          </g>
        )}
      </svg>
    </div>
  );
}
