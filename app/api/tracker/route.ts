import {
  CREW,
  RACE_START_EPOCH,
  WAVE_OFFSETS,
  configToRunner,
  formatElapsed,
  formatTimeOfDay,
  parsePaceSec,
  type Runner,
  type RunnerConfig,
} from '@/lib/race-data';
import { mapSplits } from '@/lib/rtrt-parse';

// --- Token cache (module scope, persists across requests in same server process) ---
let tokenCache: { token: string; expires: number } | null = null;

async function getToken(appId: string): Promise<string> {
  if (tokenCache && tokenCache.expires > Date.now() + 86_400_000) {
    return tokenCache.token;
  }
  const res = await fetch(`https://api.rtrt.me/register?appid=${appId}`);
  if (!res.ok) throw new Error(`RTRT register failed: ${res.status}`);
  const data = await res.json();
  tokenCache = { token: data.token, expires: Date.now() + 29 * 86_400_000 };
  return tokenCache.token;
}

// --- Real API calls ---

const RTRT_BASE = 'https://api.rtrt.me';

async function fetchLiveRunner(config: RunnerConfig, appId: string, eventId: string): Promise<Runner> {
  const token = await getToken(appId);
  const auth = `appid=${appId}&token=${token}`;

  // Step 1: resolve bib → name + pid
  const searchUrl = `${RTRT_BASE}/events/${eventId}/profiles?search=${config.bib}&${auth}`;
  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) throw new Error(`profile search ${searchRes.status}`);
  const searchData = await searchRes.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = searchData?.list?.[0] as any;
  if (!profile?.pid) return configToRunner(config);

  // Step 2: fetch splits by pid
  const splitsUrl = `${RTRT_BASE}/events/${eventId}/profiles/${profile.pid}/splits?etimes=1&${auth}`;
  const splitsRes = await fetch(splitsUrl);
  const splitsData = splitsRes.ok ? await splitsRes.json() : null;
  const points = splitsData?.error ? [] : (splitsData?.list ?? []);
  const live = mapSplits(points);

  const estimated = projectRunner(config, live);

  return configToRunner(config, {
    name: profile.fname ?? '',
    last: profile.lname ?? '',
    ...estimated,
  });
}

// RTRT only publishes splits at chip mats. Between mats — and before the
// first mat — extrapolate the current mile from (lastKnownMile, lastKnownTime,
// pace). Pace is the latest split's milePaceAvg if available, otherwise the
// runner's pre-race default. Projected finish prefers RTRT's etfp when present
// and falls back to a same-pace projection.
function projectRunner(
  config: RunnerConfig,
  live: ReturnType<typeof mapSplits>,
): Pick<Runner, 'mile' | 'pace' | 'projected' | 'projectedElapsed' | 'splits' | 'status'> {
  const waveGunEpoch = RACE_START_EPOCH + (WAVE_OFFSETS[config.corral] ?? 0);
  const nowSec = Date.now() / 1000;

  // Already finished — trust the real data.
  if (live.status === 'finished') {
    return {
      mile: live.mile,
      pace: live.pace,
      projected: live.projected,
      projectedElapsed: live.projectedElapsed,
      splits: live.splits,
      status: 'finished',
    };
  }

  // Pre-race OR no chip read at any mat (including START) — don't fabricate
  // progress. A wave-gun timestamp doesn't prove the runner actually crossed
  // the start mat; treat as 'pre' until RTRT confirms a crossing.
  if (nowSec < waveGunEpoch || live.lastEpoch === undefined) {
    return { mile: 0, pace: '—', projected: '—', projectedElapsed: '—', splits: live.splits, status: 'pre' };
  }

  const hasRealPace = live.pace !== '—';
  const paceStr = hasRealPace ? live.pace : config.defaultPace;
  const paceSec = parsePaceSec(paceStr);

  const baselineEpoch = live.lastEpoch;
  const baselineMile = live.mile;

  let estMile = baselineMile;
  if (Number.isFinite(paceSec) && paceSec > 0) {
    const extra = Math.max(0, nowSec - baselineEpoch) / paceSec;
    estMile = Math.min(13.1, baselineMile + extra);
  }
  // Round to one decimal place for display stability.
  estMile = Math.round(estMile * 10) / 10;

  let projected = live.projected;
  let projectedElapsed = live.projectedElapsed;
  if (projected === '—' && Number.isFinite(paceSec) && paceSec > 0) {
    const projectedFinishEpoch = baselineEpoch + (13.1 - baselineMile) * paceSec;
    projected = formatTimeOfDay(projectedFinishEpoch);
    // We can compute net time only when baselineEpoch IS the START crossing
    // (baselineMile === 0). Otherwise the cumulative split time isn't in scope.
    if (projectedElapsed === '—' && baselineMile === 0) {
      projectedElapsed = formatElapsed(13.1 * paceSec);
    }
  }

  return {
    mile: estMile,
    pace: paceStr,
    projected,
    projectedElapsed,
    splits: live.splits,
    status: estMile >= 13.1 ? 'finished' : 'running',
  };
}

// --- Mock data: synthetic mid-race state for offline UI testing ---

function mockRunner(config: RunnerConfig, index: number): Runner {
  const miles = [7.8, 7.2, 6.5, 5.8, 5.1];
  const paces = ['8:45', '8:55', '9:15', '9:30', '9:45'];
  const names = [['Sarah', 'Gu'], ['Theodore', 'Chow'], ['Mandi', 'Xu'], ['Janet', 'Phang'], ['Kimberly', 'Tsao']];
  const mile = miles[index] ?? 0;
  const pace = paces[index] ?? '9:30';
  const [first, last] = names[index] ?? ['', ''];
  return configToRunner(config, {
    name: first, last,
    mile, pace,
    projected: '9:05 AM',
    status: 'running',
    splits: [
      { mile: 1, time: '9:00', pace },
      { mile: Math.floor(mile), time: '—', pace },
    ],
  });
}

// --- Handler ---

export async function GET() {
  const mock = process.env.RTRT_MOCK === 'true';
  const appId = process.env.RTRT_APP_ID ?? '';
  const eventId = process.env.RTRT_EVENT_ID ?? '';

  if (!mock && (!appId || !eventId)) {
    return Response.json({ error: 'Missing RTRT_APP_ID or RTRT_EVENT_ID' }, { status: 500 });
  }

  const runners: Runner[] = await Promise.all(
    CREW.map(async (config, i) => {
      if (mock) return mockRunner(config, i);
      try {
        return await fetchLiveRunner(config, appId, eventId);
      } catch {
        return configToRunner(config);
      }
    })
  );

  return Response.json({ runners, source: mock ? 'mock' : 'live' });
}
