// Focus view — detailed single runner

function Bib({ runner }) {
  return (
    <div style={{
      background: '#fff',
      border: '2px solid #1a1816',
      borderRadius: 4,
      padding: '6px 10px 7px',
      display: 'inline-block',
      boxShadow: '3px 3px 0 #1a1816',
      fontFamily: "'Archivo', sans-serif",
    }}>
      <div style={{
        fontFamily: "'Archivo Narrow', sans-serif",
        fontSize: 8, fontWeight: 800, letterSpacing: '0.14em',
        color: runner.color, fontStyle: 'italic',
      }}>NYC MARATHON 2026</div>
      <div style={{
        fontFamily: "'Archivo', sans-serif",
        fontSize: 26, fontWeight: 900, letterSpacing: '0.02em',
        lineHeight: 1, color: '#1a1816', fontStyle: 'italic',
      }}>{runner.bib}</div>
    </div>
  );
}

function StatCell({ label, value, mono = true, flash }) {
  return (
    <div style={{ flex: 1, padding: '0 2px' }}>
      <div style={{
        fontFamily: "'Archivo Narrow', sans-serif",
        fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
        color: '#1a181699', marginBottom: 4,
      }}>{label}</div>
      <div style={{
        fontFamily: mono ? "'JetBrains Mono', monospace" : "'Archivo', sans-serif",
        fontSize: 20, fontWeight: 800,
        letterSpacing: mono ? '-0.02em' : '-0.03em',
        color: '#1a1816',
        fontStyle: mono ? 'normal' : 'italic',
      }}>
        {flash ? <TickNumber value={value} /> : value}
      </div>
    </div>
  );
}

function SplitRow({ s, prevPace, accent }) {
  const faster = prevPace && s.pace < prevPace;
  const slower = prevPace && s.pace > prevPace;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '10px 20px',
      borderBottom: '1px solid #1a181610',
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      <div style={{
        width: 34, fontWeight: 700, fontSize: 12, color: '#1a181699',
      }}>MI {s.mile}</div>
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

function FocusView({ runner, onBack, elapsed }) {
  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: '#f5f1e8',
    }}>
      {/* Dark topbar */}
      <div style={{
        padding: '54px 16px 14px',
        background: '#1a1816', color: '#f5f1e8',
        display: 'flex', alignItems: 'center', gap: 12,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'repeating-linear-gradient(-45deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 10px)',
        }} />
        <button onClick={onBack} style={{
          position: 'relative', background: 'transparent', border: 'none', color: '#f5f1e8',
          fontFamily: "'Archivo Narrow', sans-serif",
          fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
          cursor: 'pointer', padding: '6px 0',
        }}>← CREW</button>
        <div style={{ flex: 1 }} />
        <div style={{
          position: 'relative',
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
          opacity: 0.85, whiteSpace: 'nowrap',
        }}>
          <LiveDot size={7} />
          LIVE · {elapsed}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Name + bib block */}
        <div style={{
          padding: '22px 20px 18px',
          background: runner.color,
          color: '#fff',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'repeating-linear-gradient(-45deg, rgba(255,255,255,0.08) 0, rgba(255,255,255,0.08) 2px, transparent 2px, transparent 14px)',
          }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: "'Archivo Narrow', sans-serif",
                fontSize: 10, fontWeight: 700, letterSpacing: '0.16em',
                opacity: 0.8,
              }}>CORRAL {runner.corral.toUpperCase()}</div>
              <div style={{
                fontFamily: "'Archivo', sans-serif",
                fontSize: 44, fontWeight: 900, letterSpacing: '-0.035em',
                lineHeight: 0.95, marginTop: 6, fontStyle: 'italic',
              }}>{runner.name}</div>
              <div style={{
                fontFamily: "'Archivo', sans-serif",
                fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em',
                lineHeight: 1, marginTop: 2, opacity: 0.85,
              }}>{runner.last}</div>
              <div style={{ marginTop: 12 }}>
                <HypeBadge label={`${runner.hype}`} tone="dark" />
              </div>
            </div>
            <Bib runner={runner} />
          </div>
        </div>

        <RaceStripe height={4} />

        {/* Hero stat: big mile */}
        <div style={{
          padding: '22px 20px 8px',
          display: 'flex', alignItems: 'flex-end', gap: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{
              fontFamily: "'Archivo', sans-serif",
              fontSize: 108, fontWeight: 900, lineHeight: 0.85,
              letterSpacing: '-0.05em', fontStyle: 'italic',
              color: '#1a1816',
            }}>
              <TickNumber value={runner.mile.toFixed(1)} />
            </span>
            <span style={{
              fontFamily: "'Archivo Narrow', sans-serif",
              fontSize: 14, fontWeight: 800, letterSpacing: '0.14em',
              color: '#1a1816aa',
            }}>MI</span>
          </div>
          <div style={{ flex: 1, textAlign: 'right', marginBottom: 8 }}>
            <div style={{
              fontFamily: "'Archivo Narrow', sans-serif",
              fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
              color: '#1a181699',
            }}>OF 26.2</div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 13, fontWeight: 600, marginTop: 4,
            }}>{((runner.mile / 26.2) * 100).toFixed(0)}% complete</div>
          </div>
        </div>

        {/* Elevation profile */}
        <div style={{ padding: '4px 12px 14px' }}>
          <ElevationFull mile={runner.mile} color={runner.color} width={354} height={150} />
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex', padding: '14px 20px 18px',
          borderTop: '1px solid #1a181614',
          borderBottom: '1px solid #1a181614',
          background: '#fbf7ee',
        }}>
          <StatCell label="CURRENT PACE" value={`${runner.pace}`} flash />
          <div style={{ width: 1, background: '#1a181614', margin: '0 8px' }} />
          <StatCell label="PROJECTED" value={runner.projected} flash />
          <div style={{ width: 1, background: '#1a181614', margin: '0 8px' }} />
          <StatCell label="VS PR" value={runner.gap >= 0 ? `+${runner.gap}s` : `${runner.gap}s`} />
        </div>

        {/* Splits */}
        <div style={{ padding: '18px 20px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{
            fontFamily: "'Archivo Narrow', sans-serif",
            fontSize: 11, fontWeight: 800, letterSpacing: '0.14em',
            fontStyle: 'italic',
          }}>SPLITS</div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10, color: '#1a181680', letterSpacing: '0.06em', whiteSpace: 'nowrap',
          }}>MILE · TIME · PACE</div>
        </div>
        <div>
          {runner.splits.map((s, i) => (
            <SplitRow key={s.mile} s={s} prevPace={runner.splits[i - 1]?.pace} accent={runner.color} />
          ))}
          {/* Next split placeholder */}
          <div style={{
            display: 'flex', alignItems: 'center', padding: '10px 20px',
            fontFamily: "'JetBrains Mono', monospace",
            color: '#1a181655', fontSize: 12,
          }}>
            <div style={{ width: 34, fontWeight: 700 }}>MI {Math.ceil(runner.mile)}</div>
            <div style={{ flex: 1 }}>···</div>
            <LiveDot size={6} accent={runner.color} />
            <span style={{ marginLeft: 8, fontSize: 10, letterSpacing: '0.08em' }}>INCOMING</span>
          </div>
        </div>

        {/* Share */}
        <div style={{ padding: '20px 20px 32px', display: 'flex', gap: 10 }}>
          <button style={{
            flex: 1, background: '#1a1816', border: 'none',
            padding: '14px', borderRadius: 8, color: '#fff',
            fontFamily: "'Archivo Narrow', sans-serif",
            fontSize: 12, fontWeight: 800, letterSpacing: '0.14em',
            fontStyle: 'italic', cursor: 'pointer',
          }}>CHEER 📣</button>
          <button style={{
            background: 'transparent', border: '1.5px solid #1a181622',
            padding: '14px 18px', borderRadius: 8,
            fontFamily: "'Archivo Narrow', sans-serif",
            fontSize: 12, fontWeight: 700, letterSpacing: '0.12em',
            cursor: 'pointer', color: '#1a1816',
          }}>SHARE</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { FocusView });
