import { type Runner, type Split } from './race-data';

export function parseMileFromLabel(label: string): number | null {
  const mileMatch = label.match(/Mile\s+(\d+(?:\.\d+)?)/i);
  if (mileMatch) return parseFloat(mileMatch[1]);
  // Embedded mile hint, e.g. "5K/3.1mi" or "3.1 mi" or "13.1mi"
  const miMatch = label.match(/(\d+(?:\.\d+)?)\s*mi\b/i);
  if (miMatch) return parseFloat(miMatch[1]);
  if (/finish/i.test(label)) return 13.1;
  const kmMatch = label.match(/^(\d+(?:\.\d+)?)\s*[Kk]$/);
  if (kmMatch) return Math.round(parseFloat(kmMatch[1]) * 0.621371 * 10) / 10;
  return null;
}

export function formatProjected(etfp: string): string {
  if (!etfp) return '—';
  // RTRT etfp format is "LABEL~ELAPSED~TIME_OF_DAY", e.g. "FINISH~01:38:31~9:07 am".
  // Take the last tilde segment as the time of day.
  const segments = String(etfp).split('~');
  const last = segments[segments.length - 1].trim();
  if (/AM|PM/i.test(last)) {
    return last.replace(/\s*am\s*$/i, ' AM').replace(/\s*pm\s*$/i, ' PM');
  }
  const match = last.match(/^(\d+):(\d{2})/);
  if (!match) return last;
  let h = parseInt(match[1], 10);
  const m = match[2];
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

type LiveFields = Pick<Runner, 'mile' | 'pace' | 'projected' | 'projectedElapsed' | 'splits' | 'status'> & {
  // Epoch (seconds) of the most recent timing-mat crossing, including START.
  // Used downstream to extrapolate current mile by elapsed-since-cross.
  lastEpoch?: number;
};

// "01:50:35" → "1:50:35"; pass-through if shape isn't H:MM:SS.
function trimLeadingZero(t: string): string {
  return t.replace(/^0+(?=\d)/, '');
}

// "01:59:28.75" → "1:59:28": drop fractional seconds + leading zero.
function formatNetTime(t: string): string {
  return trimLeadingZero(t.split('.')[0]);
}

// True when a split represents the finish line, regardless of which signal
// RTRT happens to set on a given event.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isFinishPoint(p: any): boolean {
  return String(p?.isFinish ?? '') === '1' || /finish/i.test(String(p?.label ?? ''));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapSplits(points: any[]): LiveFields {
  if (points.length === 0) {
    return { mile: 0, pace: '—', projected: '—', projectedElapsed: '—', splits: [], status: 'pre' };
  }
  const last = points[points.length - 1];
  const mile = parseMileFromLabel(last.label ?? '') ?? 0;
  // Prefer cumulative average over instantaneous segment pace — more stable for
  // projection and matches what the official app surfaces as "current pace".
  const pace: string = last?.milePaceAvg ?? last?.milePace ?? last?.pace ?? '—';
  // Falsy etfp (undefined / '' / 0) is treated as "no projection".
  const etfpStr = last?.etfp ? String(last.etfp) : '';
  const projected = etfpStr ? formatProjected(etfpStr) : '—';
  // RTRT etfp shape is "LABEL~ELAPSED~TIME_OF_DAY"; the middle segment is the
  // projected net (chip-to-chip) finish time. RTRT drops etfp on the FINISH
  // split itself — fall back to the FINISH point's netTime for actual time.
  const etfpSegments = etfpStr.split('~');
  let projectedElapsed = '—';
  if (etfpSegments.length >= 3) {
    projectedElapsed = trimLeadingZero(etfpSegments[1].trim());
  } else if (isFinishPoint(last) && last?.netTime) {
    projectedElapsed = formatNetTime(String(last.netTime));
  }
  const lastEpochRaw = last?.epochTime;
  const lastEpoch = lastEpochRaw != null ? Number(lastEpochRaw) : undefined;

  const splits: Split[] = points
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((p: any) => {
      const m = parseMileFromLabel(p.label ?? '');
      if (m === null) return null;
      return { mile: m, time: p.time ?? '', pace: p.milePace ?? p.pace ?? '' };
    })
    .filter((s): s is Split => s !== null);

  const status: Runner['status'] = mile >= 13.1 ? 'finished' : 'running';
  return {
    mile, pace, projected, projectedElapsed, splits, status,
    lastEpoch: Number.isFinite(lastEpoch) ? lastEpoch : undefined,
  };
}
