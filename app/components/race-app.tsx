'use client';

import { useState, useEffect, useRef } from 'react';
import { INITIAL_RUNNERS, RACE_START_EPOCH, formatElapsed, type Runner } from '@/lib/race-data';
import { EveryoneView } from './everyone-view';
import { FocusView } from './focus-view';

const STAR_STORAGE_KEY = 'speedster:unstarred';

export function RaceApp() {
  const [runners, setRunners] = useState<Runner[]>(INITIAL_RUNNERS);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [confettiBursts, setConfettiBursts] = useState<{ key: number; id: string }[]>([]);
  const burstIdRef = useRef(0);
  const [unstarred, setUnstarred] = useState<Set<string>>(new Set());
  const [hypeSeed, setHypeSeed] = useState(0);
  const prevRunnersRef = useRef<Runner[]>(INITIAL_RUNNERS);

  // Roll a fresh hype seed once per page load (in effect to avoid SSR mismatch).
  useEffect(() => {
    setHypeSeed(Math.floor(Math.random() * 1_000_000));
  }, []);

  // Load starred state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STAR_STORAGE_KEY);
      if (saved) setUnstarred(new Set(JSON.parse(saved)));
    } catch { /* ignore */ }
  }, []);

  // Persist starred state
  useEffect(() => {
    try {
      localStorage.setItem(STAR_STORAGE_KEY, JSON.stringify([...unstarred]));
    } catch { /* ignore */ }
  }, [unstarred]);

  const toggleStar = (id: string) => {
    setUnstarred(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Drive elapsed time from wall clock
  useEffect(() => {
    const tick = () => {
      const elapsed = Math.floor(Date.now() / 1000) - RACE_START_EPOCH;
      setElapsedSec(Math.max(0, elapsed));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  // Poll live tracker every 30s
  useEffect(() => {
    const fetchRunners = async () => {
      try {
        const res = await fetch('/api/tracker');
        if (!res.ok) return;
        const data: { runners: Runner[] } = await res.json();
        const prev = prevRunnersRef.current;

        data.runners.forEach((r) => {
          const prevRunner = prev.find((p) => p.id === r.id);
          if (prevRunner && Math.floor(r.mile) > Math.floor(prevRunner.mile)) {
            const key = ++burstIdRef.current;
            setConfettiBursts(b => [...b, { key, id: r.id }]);
            setTimeout(() => {
              setConfettiBursts(b => b.filter(x => x.key !== key));
            }, 1400);
          }
        });

        prevRunnersRef.current = data.runners;
        setRunners(data.runners);
      } catch { /* keep existing state on error */ }
    };

    fetchRunners();
    const t = setInterval(fetchRunners, 30_000);
    return () => clearInterval(t);
  }, []);

  const focused = focusId ? runners.find(r => r.id === focusId) ?? null : null;
  const elapsed = formatElapsed(elapsedSec);

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', overflow: 'hidden', background: '#1a1816' }}>
      <div style={{
        position: 'absolute', inset: 0,
        transform: focused ? 'translateX(-30%)' : 'translateX(0)',
        opacity: focused ? 0.4 : 1,
        transition: 'transform 280ms cubic-bezier(.2,.8,.2,1), opacity 280ms cubic-bezier(.2,.8,.2,1)',
        pointerEvents: focused ? 'none' : 'auto',
      }}>
        <EveryoneView
          runners={runners}
          unstarred={unstarred}
          onToggleStar={toggleStar}
          onOpen={r => setFocusId(r.id)}
          elapsed={elapsed}
          confettiBursts={confettiBursts}
          hypeSeed={hypeSeed}
        />
      </div>

      {focused && (
        <div style={{
          position: 'absolute', inset: 0,
          animation: 'rd-slide-in 280ms cubic-bezier(.2,.8,.2,1) both',
        }}>
          <FocusView
            runner={focused}
            onBack={() => setFocusId(null)}
            elapsed={elapsed}
            hypeSeed={hypeSeed}
          />
        </div>
      )}
    </div>
  );
}
