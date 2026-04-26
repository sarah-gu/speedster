'use client';

import { type Runner, WAVE_OFFSETS, WAVE_LABELS } from '@/lib/race-data';
import { FF, StarButton } from './race-shared';

function PillButton({ label, onClick, filled = false }: {
  label: string;
  onClick: () => void;
  filled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: filled ? 'var(--accent)' : 'transparent',
        border: `1.5px solid ${filled ? 'var(--accent)' : '#1a181633'}`,
        padding: '8px 14px', borderRadius: 999,
        fontFamily: FF.label, fontSize: 11, fontWeight: 800,
        letterSpacing: '0.12em', fontStyle: 'italic',
        color: filled ? '#fff' : '#1a1816cc',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

function MiniPill({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        border: '1px solid #1a181633',
        padding: '4px 9px', borderRadius: 999,
        fontFamily: FF.label, fontSize: 9, fontWeight: 800,
        letterSpacing: '0.14em', color: '#1a181699',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

function EditCrewRow({ runner, starred, onToggle }: {
  runner: Runner;
  starred: boolean;
  onToggle: (id: string) => void;
}) {
  const display = runner.name || runner.last
    ? `${runner.name}${runner.last ? ' ' + runner.last : ''}`
    : `BIB ${runner.bib}`;
  return (
    <div
      onClick={() => onToggle(runner.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle(runner.id);
        }
      }}
      role="button"
      tabIndex={0}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px',
        background: '#fbf7ee',
        borderBottom: '1px solid #1a18160d',
        cursor: 'pointer', position: 'relative',
      }}
    >
      <div style={{
        position: 'absolute', left: 0, top: 8, bottom: 8, width: 4,
        background: runner.color, borderRadius: '0 2px 2px 0',
        opacity: starred ? 1 : 0.4,
      }} />
      <div style={{ flex: 1, minWidth: 0, paddingLeft: 4 }}>
        <div style={{
          fontFamily: FF.display, fontSize: 17, fontWeight: 800,
          letterSpacing: '-0.02em', fontStyle: 'italic',
          color: '#1a1816', opacity: starred ? 1 : 0.55,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{display}</div>
        <div style={{
          fontFamily: FF.mono, fontSize: 10, fontWeight: 600,
          color: '#1a18167a', marginTop: 3, letterSpacing: '0.04em',
        }}>
          BIB {runner.bib}
        </div>
      </div>
      <StarButton starred={starred} onClick={() => onToggle(runner.id)} tone="dark" size={32} />
    </div>
  );
}

export function EditCrewView({
  runners, unstarred, onToggleStar,
  onStarAll, onClearAll, onStarCorral, onUnstarCorral, onBack,
}: {
  runners: Runner[];
  unstarred: Set<string>;
  onToggleStar: (id: string) => void;
  onStarAll: () => void;
  onClearAll: () => void;
  onStarCorral: (corral: string) => void;
  onUnstarCorral: (corral: string) => void;
  onBack: () => void;
}) {
  const total = runners.length;
  const starredCount = runners.filter(r => !unstarred.has(r.id)).length;

  const corrals = Array.from(new Set(runners.map(r => r.corral)))
    .sort((a, b) => (WAVE_OFFSETS[a] ?? 0) - (WAVE_OFFSETS[b] ?? 0));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f5f1e8' }}>
      {/* Dark header */}
      <div style={{
        padding: '20px 20px 16px',
        background: '#1a1816', color: '#f5f1e8',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'repeating-linear-gradient(-45deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 10px)',
        }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={onBack}
            aria-label="Back"
            style={{
              background: 'transparent', border: '1.5px solid #f5f1e855',
              color: '#f5f1e8', width: 36, height: 36, borderRadius: 999,
              fontSize: 18, lineHeight: 1, cursor: 'pointer', padding: 0,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}
          >←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FF.label, fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', opacity: 0.6 }}>
              MANAGE
            </div>
            <div style={{
              fontFamily: FF.display, fontSize: 24, fontWeight: 900,
              letterSpacing: '-0.03em', lineHeight: 1, marginTop: 4, fontStyle: 'italic',
            }}>
              EDIT CREW
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontFamily: FF.mono, fontSize: 11, fontWeight: 700,
              letterSpacing: '0.06em', whiteSpace: 'nowrap',
            }}>
              {starredCount} / {total}
            </div>
            <div style={{ fontFamily: FF.label, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', opacity: 0.55, marginTop: 4 }}>
              STARRED
            </div>
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      <div style={{
        padding: '14px 16px',
        display: 'flex', gap: 10,
        borderBottom: '1px solid #1a181614',
        background: '#f5f1e8',
      }}>
        <PillButton label="STAR ALL" onClick={onStarAll} filled />
        <PillButton label="CLEAR ALL" onClick={onClearAll} />
      </div>

      {/* Scrollable wave-grouped list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {corrals.map(corral => {
          const inWave = runners.filter(r => r.corral === corral);
          const allStarred = inWave.every(r => !unstarred.has(r.id));
          const label = WAVE_LABELS[corral] ?? '';
          return (
            <div key={corral}>
              <div style={{
                padding: '14px 16px 6px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                gap: 10,
              }}>
                <span style={{
                  fontFamily: FF.label, fontSize: 10, fontWeight: 800,
                  letterSpacing: '0.16em', color: '#1a181699',
                  fontStyle: 'italic',
                }}>
                  {corral.toUpperCase()}{label ? ` · ${label}` : ''}
                </span>
                <MiniPill
                  label={allStarred ? 'UNSTAR ALL' : 'STAR ALL'}
                  onClick={() => allStarred ? onUnstarCorral(corral) : onStarCorral(corral)}
                />
              </div>
              {inWave.map(r => (
                <EditCrewRow
                  key={r.id}
                  runner={r}
                  starred={!unstarred.has(r.id)}
                  onToggle={onToggleStar}
                />
              ))}
            </div>
          );
        })}
        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}
