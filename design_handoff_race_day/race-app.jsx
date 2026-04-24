// Main app: wires Everyone <-> Focus, runs fake live updates, hosts Tweaks, renders in iOS frame

const { useState, useEffect, useRef } = React;

// Keyframes + CSS vars for accent
const STYLE = `
:root { --accent: #e76f3c; }
@keyframes rd-pulse {
  0% { box-shadow: 0 0 0 0 var(--accent); opacity: 0.75; transform: scale(1); }
  70% { box-shadow: 0 0 0 10px transparent; opacity: 0; transform: scale(1.6); }
  100% { box-shadow: 0 0 0 0 transparent; opacity: 0; transform: scale(1); }
}
@keyframes rd-confetti {
  0% { transform: translate(0,0) rotate(0); opacity: 1; }
  100% { transform: translate(var(--dx), var(--dy)) rotate(var(--rot)); opacity: 0; }
}
@keyframes rd-slide-in {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
@keyframes rd-slide-out {
  from { transform: translateX(0); }
  to { transform: translateX(-30%); opacity: 0.4; }
}
button:active { transform: scale(0.985); }
button { transition: transform 120ms ease; }
`;

function useInjectStyle() {
  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = STYLE;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);
}

function formatElapsed(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function RaceApp() {
  useInjectStyle();

  const [tweaks, setTweak] = useTweaks(/*EDITMODE-BEGIN*/{
    "accent": "#e76f3c"
  }/*EDITMODE-END*/);

  useAccent(tweaks.accent);

  // Live runner state — mile creeps up over time
  const [runners, setRunners] = useState(INITIAL_RUNNERS);
  const [elapsedSec, setElapsedSec] = useState(72 * 60 + 14); // 1:12:14 into race
  const [focusId, setFocusId] = useState(null);
  const [confettiFor, setConfettiFor] = useState(null);

  // Tick every 1.2s — creep miles, tick elapsed
  useEffect(() => {
    const t = setInterval(() => {
      setElapsedSec(s => s + 3);
      setRunners(rs => rs.map(r => {
        if (r.status !== 'running') return r;
        const prevMile = r.mile;
        const paceSec = parsePaceSec(r.pace);
        const deltaMile = 3 / paceSec; // 3 seconds of sim
        const newMile = Math.min(26.2, prevMile + deltaMile * 4); // 4x speed for demo
        // Mile crossed? (integer boundary)
        if (Math.floor(newMile) > Math.floor(prevMile)) {
          setTimeout(() => {
            setConfettiFor(r.id);
            setTimeout(() => setConfettiFor(null), 1400);
          }, 50);
        }
        return { ...r, mile: newMile };
      }));
    }, 1200);
    return () => clearInterval(t);
  }, []);

  const focused = focusId ? runners.find(r => r.id === focusId) : null;

  return (
    <>
      <IOSDevice width={402} height={874} dark={false}>
        <div style={{ position: 'relative', height: '100%', width: '100%', overflow: 'hidden' }}>
          {!focused && (
            <EveryoneView
              runners={runners}
              onOpen={(r) => setFocusId(r.id)}
              elapsed={formatElapsed(elapsedSec)}
              confettiFor={confettiFor}
            />
          )}
          {focused && (
            <div style={{ height: '100%', animation: 'rd-slide-in 280ms cubic-bezier(.2,.8,.2,1)' }}>
              <FocusView
                runner={focused}
                onBack={() => setFocusId(null)}
                elapsed={formatElapsed(elapsedSec)}
              />
            </div>
          )}
        </div>
      </IOSDevice>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Accent color">
          <TweakColor
            label="Hot accent"
            value={tweaks.accent}
            onChange={(v) => setTweak('accent', v)}
          />
          <div style={{ display: 'flex', gap: 6, padding: '6px 12px 12px', flexWrap: 'wrap' }}>
            {[
              ['Sunrise', '#e76f3c'],
              ['Lime', '#b8dd2e'],
              ['Hot pink', '#e93c7a'],
              ['Cyan', '#23c4d1'],
              ['Ink', '#1a1816'],
              ['Gold', '#e5a530'],
            ].map(([label, val]) => (
              <button key={val}
                onClick={() => setTweak('accent', val)}
                style={{
                  background: val, border: tweaks.accent === val ? '2px solid #1a1816' : '1px solid rgba(0,0,0,0.15)',
                  width: 24, height: 24, borderRadius: 999, cursor: 'pointer',
                }}
                title={label}
              />
            ))}
          </div>
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

function parsePaceSec(pace) {
  // "8:45" -> 525
  const [m, s] = pace.split(':').map(Number);
  return m * 60 + s;
}

ReactDOM.createRoot(document.getElementById('root')).render(<RaceApp />);
