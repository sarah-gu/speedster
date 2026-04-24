import { CREW, configToRunner, type Runner, type RunnerConfig, type Split } from '@/lib/race-data';

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

// --- Field parsing ---

function parseMileFromLabel(label: string): number | null {
  const mileMatch = label.match(/Mile\s+(\d+(?:\.\d+)?)/i);
  if (mileMatch) return parseFloat(mileMatch[1]);
  if (/finish/i.test(label)) return 13.1;
  const kmMatch = label.match(/^(\d+(?:\.\d+)?)\s*[Kk]$/);
  if (kmMatch) return Math.round(parseFloat(kmMatch[1]) * 0.621371 * 10) / 10;
  return null;
}

function formatProjected(etfp: string): string {
  if (!etfp) return '—';
  if (/AM|PM/i.test(etfp)) return etfp;
  const match = etfp.match(/^(\d+):(\d{2})/);
  if (!match) return etfp;
  let h = parseInt(match[1], 10);
  const m = match[2];
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSplits(points: any[]): Pick<Runner, 'mile' | 'pace' | 'projected' | 'splits' | 'status'> {
  if (points.length === 0) {
    return { mile: 0, pace: '—', projected: '—', splits: [], status: 'pre' };
  }
  const last = points[points.length - 1];
  const mile = parseMileFromLabel(last.label ?? '') ?? 0;
  const pace: string = last?.milePace ?? last?.pace ?? '—';
  const projected = last?.etfp ? formatProjected(String(last.etfp)) : '—';

  const splits: Split[] = points
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((p: any) => {
      const m = parseMileFromLabel(p.label ?? '');
      if (m === null) return null;
      return { mile: m, time: p.time ?? '', pace: p.milePace ?? p.pace ?? '' };
    })
    .filter((s): s is Split => s !== null);

  const status: Runner['status'] = mile >= 13.1 ? 'finished' : 'running';
  return { mile, pace, projected, splits, status };
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
