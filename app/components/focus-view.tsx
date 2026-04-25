'use client';

import { useRef, useState } from 'react';
import {
  type Runner,
  type Split,
  LANDMARKS,
  nextLandmarkPass,
  etaSecondsToMile,
  parsePaceSec,
  pickHype,
} from '@/lib/race-data';
import { FF, LiveDot, TickNumber, HypeBadge, RaceStripe, formatEta, Confetti } from './race-shared';
import { ElevationFull } from './race-elevation';
import { CourseMap } from './race-course-map';

function Bib({ runner }: { runner: Runner }) {
  return (
    <div style={{
      background: '#fff', border: '2px solid #1a1816', borderRadius: 4,
      padding: '6px 10px 7px', display: 'inline-block',
      boxShadow: '3px 3px 0 #1a1816', fontFamily: FF.display,
    }}>
      <div style={{
        fontFamily: FF.label, fontSize: 8, fontWeight: 800,
        letterSpacing: '0.14em', color: runner.color, fontStyle: 'italic',
      }}>
        BKLYN HALF 2026
      </div>
      <div style={{
        fontFamily: FF.display, fontSize: 26, fontWeight: 900,
        letterSpacing: '0.02em', lineHeight: 1, color: '#1a1816', fontStyle: 'italic',
      }}>
        {runner.bib}
      </div>
    </div>
  );
}

function StatCell({ label, value, flash = false }: {
  label: string;
  value: string;
  flash?: boolean;
}) {
  return (
    <div style={{ flex: 1, padding: '0 2px' }}>
      <div style={{
        fontFamily: FF.label, fontSize: 9, fontWeight: 700,
        letterSpacing: '0.14em', color: '#1a181699', marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: FF.mono, fontSize: 20, fontWeight: 800,
        letterSpacing: '-0.02em', color: '#1a1816',
      }}>
        {flash ? <TickNumber value={value} /> : value}
      </div>
    </div>
  );
}

function SplitRow({ s, prevPace, accent }: {
  s: Split;
  prevPace?: string;
  accent: string;
}) {
  const cur = parsePaceSec(s.pace);
  const prev = prevPace !== undefined ? parsePaceSec(prevPace) : NaN;
  const comparable = isFinite(cur) && isFinite(prev);
  const faster = comparable && cur < prev;
  const slower = comparable && cur > prev;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '10px 20px',
      borderBottom: '1px solid #1a181610', fontFamily: FF.mono,
    }}>
      <div style={{ width: 34, fontWeight: 700, fontSize: 12, color: '#1a181699' }}>
        MI {s.mile}
      </div>
      <div style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{s.time}</div>
      <div style={{ width: 70, textAlign: 'right', fontSize: 13, color: '#1a1816' }}>
        {s.pace}<span style={{ opacity: 0.5 }}>/mi</span>
      </div>
      <div style={{ width: 22, textAlign: 'right', fontSize: 11, marginLeft: 6 }}>
        {faster && <span style={{ color: accent }}>▲</span>}
        {slower && <span style={{ color: '#1a181655' }}>▼</span>}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: active ? '#1a1816' : 'transparent',
        color: active ? '#f5f1e8' : '#1a1816',
        border: active ? 'none' : '1px solid #1a181622',
        padding: '9px 0',
        borderRadius: 6,
        fontFamily: FF.label,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: '0.14em',
        fontStyle: 'italic',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

export function FocusView({ runner, onBack, elapsed, hypeSeed }: {
  runner: Runner;
  onBack: () => void;
  elapsed: string;
  hypeSeed: number;
}) {
  const [tab, setTab] = useState<'map' | 'elev'>('elev');
  const [cheers, setCheers] = useState<{ id: number; x: number; y: number }[]>([]);
  const cheerIdRef = useRef(0);
  const pct = ((runner.mile / 13.1) * 100).toFixed(0);

  const handleCheer = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const id = ++cheerIdRef.current;
    const x = btn.offsetWidth / 2;
    const y = btn.offsetHeight / 2;
    setCheers(c => [...c, { id, x, y }]);
    setTimeout(() => setCheers(c => c.filter(b => b.id !== id)), 1300);
  };

  const gap = LANDMARKS[0];
  const nextPass = nextLandmarkPass(runner.mile, gap);
  const etaSec = nextPass === null ? null : etaSecondsToMile(runner.mile, nextPass, runner.pace);
  const passIndex = nextPass === null ? null : gap.passMiles.indexOf(nextPass) + 1;
  const showNextStrip =
    runner.status === 'running' && nextPass !== null && etaSec !== null && passIndex !== null;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f5f1e8' }}>
      {/* Dark top bar */}
      <div style={{
        paddingTop: 16,
        paddingBottom: 14, paddingLeft: 16, paddingRight: 16,
        background: '#1a1816', color: '#f5f1e8',
        display: 'flex', alignItems: 'center', gap: 12,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'repeating-linear-gradient(-45deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 10px)',
        }} />
        <button
          onClick={onBack}
          style={{
            position: 'relative', background: 'transparent', border: 'none',
            color: '#f5f1e8', fontFamily: FF.label, fontSize: 11, fontWeight: 700,
            letterSpacing: '0.12em', cursor: 'pointer', padding: '6px 0',
          }}
        >
          ← CREW
        </button>
        <div style={{ flex: 1 }} />
        <div style={{
          position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6,
          fontFamily: FF.mono, fontSize: 10, fontWeight: 600,
          letterSpacing: '0.08em', opacity: 0.85, whiteSpace: 'nowrap',
        }}>
          <LiveDot size={7} />
          LIVE · {elapsed}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Color banner with name + bib */}
        <div style={{
          padding: '22px 20px 18px',
          background: runner.color, color: '#fff',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'repeating-linear-gradient(-45deg, rgba(255,255,255,0.08) 0, rgba(255,255,255,0.08) 2px, transparent 2px, transparent 14px)',
          }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: FF.label, fontSize: 10, fontWeight: 700,
                letterSpacing: '0.16em', opacity: 0.8,
              }}>
                CORRAL {runner.corral.toUpperCase()}
              </div>
              <div style={{
                fontFamily: FF.display, fontSize: 44, fontWeight: 900,
                letterSpacing: '-0.035em', lineHeight: 0.95, marginTop: 6, fontStyle: 'italic',
              }}>
                {runner.name}
              </div>
              <div style={{
                fontFamily: FF.display, fontSize: 24, fontWeight: 500,
                letterSpacing: '-0.02em', lineHeight: 1, marginTop: 2, opacity: 0.85,
              }}>
                {runner.last}
              </div>
              <div style={{ marginTop: 12 }}>
                <HypeBadge label={pickHype(runner, hypeSeed)} tone="dark" />
              </div>
            </div>
            <Bib runner={runner} />
          </div>
        </div>

        <RaceStripe height={4} />

        {/* Hero mile stat */}
        <div style={{ padding: '22px 20px 8px', display: 'flex', alignItems: 'flex-end', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{
              fontFamily: FF.display, fontSize: 108, fontWeight: 900,
              lineHeight: 0.85, letterSpacing: '-0.05em', fontStyle: 'italic', color: '#1a1816',
            }}>
              <TickNumber value={runner.mile.toFixed(1)} />
            </span>
            <span style={{
              fontFamily: FF.label, fontSize: 14, fontWeight: 800,
              letterSpacing: '0.14em', color: '#1a1816aa',
            }}>MI</span>
          </div>
          <div style={{ flex: 1, textAlign: 'right', marginBottom: 8 }}>
            <div style={{
              fontFamily: FF.label, fontSize: 9, fontWeight: 700,
              letterSpacing: '0.14em', color: '#1a181699',
            }}>OF 13.1</div>
            <div style={{ fontFamily: FF.mono, fontSize: 13, fontWeight: 600, marginTop: 4 }}>
              {pct}% complete
            </div>
          </div>
        </div>

        {/* NEXT-UP strip */}
        {showNextStrip && (
          <div style={{
            margin: '8px 20px 2px',
            padding: '10px 12px',
            background: '#1a1816',
            color: '#f5f1e8',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'repeating-linear-gradient(-45deg, rgba(255,255,255,0.04) 0, rgba(255,255,255,0.04) 2px, transparent 2px, transparent 10px)',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'relative',
              fontFamily: FF.label, fontSize: 9, fontWeight: 800,
              letterSpacing: '0.18em', fontStyle: 'italic',
              color: runner.color,
            }}>
              NEXT
            </div>
            <div style={{
              position: 'relative',
              fontFamily: FF.label, fontSize: 12, fontWeight: 800,
              letterSpacing: '0.08em', fontStyle: 'italic',
              flex: 1,
            }}>
              {gap.name.toUpperCase()}
            </div>
            <div style={{
              position: 'relative',
              fontFamily: FF.mono, fontSize: 13, fontWeight: 700,
              letterSpacing: '0.04em', color: '#f5f1e8',
            }}>
              {formatEta(etaSec)}
            </div>
            <div style={{
              position: 'relative',
              fontFamily: FF.mono, fontSize: 9, fontWeight: 600,
              letterSpacing: '0.08em', color: '#f5f1e8aa',
              whiteSpace: 'nowrap',
            }}>
              {passIndex}/{gap.passMiles.length}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, padding: '10px 20px 0' }}>
          <TabButton active={tab === 'map'} onClick={() => setTab('map')}>MAP</TabButton>
          <TabButton active={tab === 'elev'} onClick={() => setTab('elev')}>ELEVATION</TabButton>
        </div>

        {/* Map / Elevation */}
        <div style={{ padding: '10px 12px 14px' }}>
          {tab === 'map' ? (
            <CourseMap mile={runner.mile} color={runner.color} width={354} height={380} />
          ) : (
            <ElevationFull mile={runner.mile} color={runner.color} width={354} height={150} />
          )}
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex', padding: '14px 20px 18px',
          borderTop: '1px solid #1a181614', borderBottom: '1px solid #1a181614',
          background: '#fbf7ee',
        }}>
          <StatCell label="CURRENT PACE" value={runner.pace} flash />
          <div style={{ width: 1, background: '#1a181614', margin: '0 8px' }} />
          <StatCell label="PROJECTED" value={runner.projected} flash />
          <div style={{ width: 1, background: '#1a181614', margin: '0 8px' }} />
          <StatCell label="VS PR" value={runner.gap >= 0 ? `+${runner.gap}s` : `${runner.gap}s`} />
        </div>

        {/* Splits */}
        <div style={{
          padding: '18px 20px 6px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        }}>
          <div style={{ fontFamily: FF.label, fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', fontStyle: 'italic' }}>
            SPLITS
          </div>
          <div style={{ fontFamily: FF.mono, fontSize: 10, color: '#1a181680', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
            MILE · TIME · PACE
          </div>
        </div>
        <div>
          {runner.splits.map((s, i) => (
            <SplitRow
              key={s.mile}
              s={s}
              prevPace={runner.splits[i - 1]?.pace}
              accent={runner.color}
            />
          ))}
          {/* Next-mile placeholder */}
          <div style={{
            display: 'flex', alignItems: 'center', padding: '10px 20px',
            fontFamily: FF.mono, color: '#1a181655', fontSize: 12,
          }}>
            <div style={{ width: 34, fontWeight: 700 }}>MI {Math.ceil(runner.mile)}</div>
            <div style={{ flex: 1 }}>···</div>
            <LiveDot size={6} accent={runner.color} />
            <span style={{ marginLeft: 8, fontSize: 10, letterSpacing: '0.08em' }}>INCOMING</span>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{
          padding: '20px 20px',
          paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
          display: 'flex', gap: 10,
        }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <button
              onClick={handleCheer}
              style={{
                width: '100%', background: '#1a1816', border: 'none',
                padding: '14px', borderRadius: 8, color: '#fff',
                fontFamily: FF.label, fontSize: 12, fontWeight: 800,
                letterSpacing: '0.14em', fontStyle: 'italic', cursor: 'pointer',
              }}
            >
              CHEER 📣
            </button>
            {cheers.map(b => (
              <Confetti key={b.id} x={b.x} y={b.y} accent={runner.color} />
            ))}
          </div>
          <button style={{
            background: 'transparent', border: '1.5px solid #1a181622',
            padding: '14px 18px', borderRadius: 8,
            fontFamily: FF.label, fontSize: 12, fontWeight: 700,
            letterSpacing: '0.12em', cursor: 'pointer', color: '#1a1816',
          }}>
            SHARE
          </button>
        </div>
      </div>
    </div>
  );
}
