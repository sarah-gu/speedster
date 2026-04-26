'use client';

import { useState, useEffect } from 'react';
import { type Runner, pointAtMile, RACE_START_EPOCH, WAVE_OFFSETS, WAVE_LABELS, pickHype } from '@/lib/race-data';
import { FF, LiveDot, TickNumber, HypeBadge, Confetti, StarButton } from './race-shared';
import { GlobalElevation } from './race-elevation';

function CountdownDigits({ remaining }: { remaining: number }) {
  const days = Math.floor(remaining / 86400);
  const hrs = Math.floor((remaining % 86400) / 3600);
  const min = Math.floor((remaining % 3600) / 60);
  const sec = remaining % 60;
  const pad = (n: number) => String(n).padStart(2, '0');

  const units: [string, string][] = [
    [pad(days), 'DAYS'],
    [pad(hrs), 'HRS'],
    [pad(min), 'MIN'],
    [pad(sec), 'SEC'],
  ];

  return (
    <div style={{
      position: 'relative', display: 'flex', alignItems: 'flex-start',
      marginTop: 10,
    }}>
      {units.map(([value, label], i) => (
        <div key={label} style={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
          <div style={{ flex: 1, textAlign: i === 0 ? 'left' : 'center' }}>
            <div style={{
              fontFamily: FF.display, fontSize: 42, fontWeight: 900,
              letterSpacing: '-0.04em', fontStyle: 'italic', lineHeight: 0.95,
            }}>
              <TickNumber value={value} />
            </div>
            <div style={{
              fontFamily: FF.label, fontSize: 9, fontWeight: 800,
              letterSpacing: '0.2em', opacity: 0.45, marginTop: 6,
              textAlign: i === 0 ? 'left' : 'center',
            }}>{label}</div>
          </div>
          {i < units.length - 1 && (
            <span style={{
              fontFamily: FF.display, fontSize: 28, fontWeight: 900,
              fontStyle: 'italic', opacity: 0.22, lineHeight: 1,
              alignSelf: 'center', marginTop: -10,
            }}>:</span>
          )}
        </div>
      ))}
    </div>
  );
}

function SlimRunnerRow({ runner, rank, starred, onToggleStar, onOpen, hypeSeed }: {
  runner: Runner;
  rank: number;
  starred: boolean;
  onToggleStar: (id: string) => void;
  onOpen: (r: Runner) => void;
  hypeSeed: number;
}) {
  return (
    <div
      onClick={() => onOpen(runner)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(runner);
        }
      }}
      role="button"
      tabIndex={0}
      style={{
        display: 'flex', width: '100%', alignItems: 'center',
        gap: 10, padding: '14px',
        background: '#fbf7ee',
        borderBottom: '1px solid #1a18160d',
        textAlign: 'left', cursor: 'pointer',
        position: 'relative', boxSizing: 'border-box',
      }}
    >
      {/* Color accent stripe */}
      <div style={{
        position: 'absolute', left: 0, top: 8, bottom: 8, width: 4,
        background: runner.color, borderRadius: '0 2px 2px 0',
      }} />

      {/* Big mile number */}
      <div style={{ textAlign: 'center', minWidth: 58, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, justifyContent: 'center' }}>
          <span style={{
            fontFamily: FF.display, fontSize: 34, fontWeight: 900,
            lineHeight: 0.9, letterSpacing: '-0.04em', fontStyle: 'italic', color: '#1a1816',
          }}>
            <TickNumber value={runner.mile.toFixed(1)} />
          </span>
        </div>
        <div style={{
          fontFamily: FF.label, fontSize: 8, fontWeight: 800,
          letterSpacing: '0.16em', color: '#1a181677', marginTop: 3,
        }}>MILE</div>
      </div>

      {/* Thin vertical divider */}
      <div style={{ width: 1, alignSelf: 'stretch', background: '#1a181614', margin: '4px 2px' }} />

      {/* Name + details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'nowrap' }}>
          <span style={{ fontFamily: FF.mono, fontSize: 10, fontWeight: 700, color: '#1a181655' }}>
            {String(rank).padStart(2, '0')}
          </span>
          <span style={{
            fontFamily: FF.display, fontSize: 18, fontWeight: 800,
            letterSpacing: '-0.02em', fontStyle: 'italic', lineHeight: 1,
            color: '#1a1816', whiteSpace: 'nowrap', paddingRight: 4,
          }}>{runner.name}</span>
          <span style={{
            fontFamily: FF.display, fontSize: 12, fontWeight: 500,
            color: '#1a181699', whiteSpace: 'nowrap', letterSpacing: '-0.01em',
          }}>{runner.last}</span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, marginTop: 6,
          fontFamily: FF.mono, fontSize: 10, fontWeight: 600,
          color: '#1a181699', whiteSpace: 'nowrap',
        }}>
          <HypeBadge label={pickHype(runner, hypeSeed)} />
          <span>{runner.pace}/mi</span>
          <span style={{ color: '#1a18162e' }}>·</span>
          <span>→{runner.projected.replace(' ', '')}</span>
        </div>
      </div>

      {/* Star toggle */}
      <StarButton starred={starred} onClick={() => onToggleStar(runner.id)} tone="dark" size={32} />

      {/* Chevron */}
      <div style={{ color: '#1a181644', fontFamily: 'monospace', fontSize: 18, flexShrink: 0 }}>›</div>
    </div>
  );
}

export function EveryoneView({ runners, unstarred, onToggleStar, onOpen, onEdit, elapsed, confettiBursts, hypeSeed }: {
  runners: Runner[];
  unstarred: Set<string>;
  onToggleStar: (id: string) => void;
  onOpen: (r: Runner) => void;
  onEdit: () => void;
  elapsed: string;
  confettiBursts: { key: number; id: string }[];
  hypeSeed: number;
}) {
  const visible = runners.filter(r => !unstarred.has(r.id));
  const hidden = runners.filter(r => unstarred.has(r.id));
  const liveCount = visible.filter(r => r.status === 'running').length;

  const onCourse = visible
    .filter(r => r.status !== 'pre')
    .sort((a, b) => b.mile - a.mile);

  const preRaceCorrals = Array.from(new Set(
    visible.filter(r => r.status === 'pre').map(r => r.corral)
  )).sort((a, b) => (WAVE_OFFSETS[a] ?? 0) - (WAVE_OFFSETS[b] ?? 0));

  const waveGroups = preRaceCorrals.map(corral => ({
    corral,
    label: WAVE_LABELS[corral] ?? '',
    runners: visible.filter(r => r.status === 'pre' && r.corral === corral),
  }));

  const sections: { key: string; title: string; runners: Runner[] }[] = [
    ...(onCourse.length > 0 ? [{ key: 'on-course', title: 'ON COURSE', runners: onCourse }] : []),
    ...waveGroups.map(g => ({
      key: g.corral,
      title: `${g.corral.toUpperCase()}${g.label ? ` · ${g.label}` : ''}`,
      runners: g.runners,
    })),
  ];

  let rankCounter = 0;

  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, RACE_START_EPOCH - Math.floor(Date.now() / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  const preRace = remaining > 0;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f5f1e8' }}>
      {/* Dark top header */}
      <div style={{
        paddingTop: 20,
        paddingBottom: preRace ? 14 : 8,
        paddingLeft: 20, paddingRight: 20,
        background: '#1a1816', color: '#f5f1e8',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Diagonal stripe */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'repeating-linear-gradient(-45deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 10px)',
        }} />
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
          <div>
            <div style={{ fontFamily: FF.label, fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', opacity: 0.6 }}>
              BROOKLYN · NYCRUNS
            </div>
            {!preRace && (
              <div style={{ fontFamily: FF.display, fontSize: 26, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1, marginTop: 4, fontStyle: 'italic' }}>
                RACE DAY.
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            {preRace ? (
              <>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontFamily: FF.label, fontSize: 10, fontWeight: 800,
                  letterSpacing: '0.14em', whiteSpace: 'nowrap',
                }}>
                  <LiveDot size={7} />
                  STARTS IN
                </div>
                <div style={{
                  fontFamily: FF.label, fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.14em', opacity: 0.55,
                  marginTop: 4, whiteSpace: 'nowrap',
                }}>
                  SUN · 7AM ET
                </div>
              </>
            ) : (
              <>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontFamily: FF.mono, fontSize: 9, fontWeight: 600,
                  letterSpacing: '0.08em', opacity: 0.9, whiteSpace: 'nowrap',
                }}>
                  <LiveDot size={7} />
                  {liveCount} LIVE
                </div>
                <div style={{ fontFamily: FF.mono, fontSize: 11, marginTop: 4, opacity: 0.65, whiteSpace: 'nowrap' }}>
                  {elapsed}
                </div>
              </>
            )}
          </div>
        </div>

        {preRace && <CountdownDigits remaining={remaining} />}
      </div>

      {/* Global elevation graph */}
      <div style={{ position: 'relative' }}>
        <GlobalElevation runners={visible} />
        {confettiBursts.map(b => {
          const r = visible.find(x => x.id === b.id);
          if (!r) return null;
          const { x, y } = pointAtMile(r.mile, 362, 160, 32);
          return <Confetti key={b.key} x={16 + x} y={48 + y} accent={r.color} />;
        })}
      </div>

      {/* Section label */}
      <div style={{
        padding: '12px 16px 4px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        whiteSpace: 'nowrap',
      }}>
        <div style={{ fontFamily: FF.label, fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', fontStyle: 'italic' }}>
          CREW · {visible.length}
        </div>
        <div style={{ fontFamily: FF.mono, fontSize: 9, color: '#1a181680', letterSpacing: '0.06em' }}>
          GROUPED · BY WAVE
        </div>
      </div>

      {/* Scrollable runner list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {sections.map(section => (
          <div key={section.key}>
            <div style={{
              padding: '14px 16px 6px',
              fontFamily: FF.label, fontSize: 10, fontWeight: 800,
              letterSpacing: '0.16em', color: '#1a181699',
              fontStyle: 'italic',
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            }}>
              <span>{section.title}</span>
              <span style={{ fontFamily: FF.mono, fontSize: 9, color: '#1a18164d', letterSpacing: '0.08em' }}>
                {section.runners.length}
              </span>
            </div>
            {section.runners.map(r => {
              rankCounter += 1;
              return (
                <SlimRunnerRow
                  key={r.id}
                  runner={r}
                  rank={rankCounter}
                  starred={!unstarred.has(r.id)}
                  onToggleStar={onToggleStar}
                  onOpen={onOpen}
                  hypeSeed={hypeSeed}
                />
              );
            })}
          </div>
        ))}

        {/* Hidden runners — quick re-star */}
        {hidden.length > 0 && (
          <div style={{ padding: '16px 16px 4px' }}>
            <div style={{
              fontFamily: FF.label, fontSize: 10, fontWeight: 800,
              letterSpacing: '0.14em', color: '#1a181666', marginBottom: 8,
              fontStyle: 'italic',
            }}>
              HIDDEN · {hidden.length}
            </div>
            {hidden.map(r => (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 4px', borderBottom: '1px solid #1a18160d',
              }}>
                <div style={{ width: 4, height: 18, background: r.color, borderRadius: 2, opacity: 0.4 }} />
                <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: 6, opacity: 0.55 }}>
                  <span style={{
                    fontFamily: FF.display, fontSize: 15, fontWeight: 800,
                    letterSpacing: '-0.02em', fontStyle: 'italic', color: '#1a1816',
                  }}>{r.name}</span>
                  <span style={{
                    fontFamily: FF.display, fontSize: 12, fontWeight: 500,
                    color: '#1a181699',
                  }}>{r.last}</span>
                </div>
                <StarButton starred={false} onClick={() => onToggleStar(r.id)} tone="dark" size={28} />
              </div>
            ))}
          </div>
        )}

        {/* Edit crew footer */}
        <div style={{ padding: '16px 20px 28px', textAlign: 'center' }}>
          <button onClick={onEdit} style={{
            background: 'transparent', border: '1.5px solid #1a181622',
            padding: '10px 18px', borderRadius: 999,
            fontFamily: FF.label, fontSize: 11, fontWeight: 700,
            letterSpacing: '0.1em', color: '#1a1816aa', cursor: 'pointer',
          }}>
            EDIT CREW
          </button>
        </div>
      </div>
    </div>
  );
}
