import { type Runner, type Split } from './race-data';

export function parseMileFromLabel(label: string): number | null {
  const mileMatch = label.match(/Mile\s+(\d+(?:\.\d+)?)/i);
  if (mileMatch) return parseFloat(mileMatch[1]);
  if (/finish/i.test(label)) return 13.1;
  const kmMatch = label.match(/^(\d+(?:\.\d+)?)\s*[Kk]$/);
  if (kmMatch) return Math.round(parseFloat(kmMatch[1]) * 0.621371 * 10) / 10;
  return null;
}

export function formatProjected(etfp: string): string {
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

type LiveFields = Pick<Runner, 'mile' | 'pace' | 'projected' | 'splits' | 'status'>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapSplits(points: any[]): LiveFields {
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
