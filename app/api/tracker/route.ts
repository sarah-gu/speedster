import { CREW, configToRunner, type Runner, type RunnerConfig } from '@/lib/race-data';
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

  return configToRunner(config, {
    name: profile.fname ?? '',
    last: profile.lname ?? '',
    ...live,
  });
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
