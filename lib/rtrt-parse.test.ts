import { describe, expect, test } from 'bun:test';
import { parseMileFromLabel, formatProjected, mapSplits } from './rtrt-parse';

describe('parseMileFromLabel', () => {
  test('extracts integer mile', () => {
    expect(parseMileFromLabel('Mile 7')).toBe(7);
    expect(parseMileFromLabel('mile 12')).toBe(12);
  });

  test('extracts fractional mile', () => {
    expect(parseMileFromLabel('Mile 7.5')).toBe(7.5);
    expect(parseMileFromLabel('Mile 13.1')).toBe(13.1);
  });

  test('accepts surrounding text', () => {
    expect(parseMileFromLabel('Mile 10 Split')).toBe(10);
    expect(parseMileFromLabel('Official Mile 5 Mat')).toBe(5);
  });

  test('finish label maps to 13.1', () => {
    expect(parseMileFromLabel('Finish')).toBe(13.1);
    expect(parseMileFromLabel('FINISH LINE')).toBe(13.1);
    expect(parseMileFromLabel('half-marathon finish')).toBe(13.1);
  });

  test('bare kilometer label converts to miles', () => {
    expect(parseMileFromLabel('10K')).toBe(6.2);
    expect(parseMileFromLabel('5k')).toBe(3.1);
    expect(parseMileFromLabel('21.1K')).toBe(13.1);
  });

  test('returns null for unrecognized labels', () => {
    expect(parseMileFromLabel('')).toBeNull();
    expect(parseMileFromLabel('Start')).toBeNull();
    expect(parseMileFromLabel('Gun')).toBeNull();
    expect(parseMileFromLabel('Chip')).toBeNull();
    expect(parseMileFromLabel('Half')).toBeNull();
    expect(parseMileFromLabel('Checkpoint A')).toBeNull();
  });

  test('returns null for KM labels with trailing text (current limitation)', () => {
    // Regex requires K at end of string. If RTRT ever sends "10K Mat" it
    // will NOT parse as 6.2mi. Documented so a future race-day surprise
    // shows up as a test failure rather than a silent mile-0.
    expect(parseMileFromLabel('10K Mat')).toBeNull();
    expect(parseMileFromLabel('10km')).toBeNull();
  });

  test('does not throw on weird input', () => {
    expect(() => parseMileFromLabel('🏃')).not.toThrow();
    expect(() => parseMileFromLabel('\n\t  ')).not.toThrow();
  });
});

describe('formatProjected', () => {
  test('empty/falsy returns em-dash', () => {
    expect(formatProjected('')).toBe('—');
  });

  test('already AM/PM passes through, lowercase normalized to upper', () => {
    expect(formatProjected('9:05 AM')).toBe('9:05 AM');
    expect(formatProjected('1:45 PM')).toBe('1:45 PM');
    expect(formatProjected('12:00 pm')).toBe('12:00 PM');
  });

  test('RTRT tilde-separated format: takes last segment as time of day', () => {
    // Real RTRT etfp shape: "LABEL~ELAPSED~TIME_OF_DAY"
    expect(formatProjected('FINISH~01:38:31~9:07 am')).toBe('9:07 AM');
    expect(formatProjected('10K~00:40:30~7:40 am')).toBe('7:40 AM');
  });

  test('converts 24-hour time to 12-hour AM/PM', () => {
    expect(formatProjected('09:05')).toBe('9:05 AM');
    expect(formatProjected('13:45')).toBe('1:45 PM');
    expect(formatProjected('00:30')).toBe('12:30 AM');
    expect(formatProjected('12:00')).toBe('12:00 PM');
    expect(formatProjected('23:59')).toBe('11:59 PM');
  });

  test('accepts HH:MM:SS by ignoring seconds', () => {
    // Race-day concern: RTRT has been observed emitting "09:05:23" shape.
    expect(formatProjected('09:05:23')).toBe('9:05 AM');
  });

  test('pathological cases: returns some string, never throws', () => {
    // Current behavior: non-matching strings pass through verbatim. That means
    // if RTRT ever returns "DNF" or "PENDING" or "" it surfaces to the UI.
    // This test just pins the current contract: must return a string.
    expect(typeof formatProjected('DNF')).toBe('string');
    expect(typeof formatProjected('99:99')).toBe('string');
    expect(typeof formatProjected('not-a-time')).toBe('string');
    expect(() => formatProjected('🕐')).not.toThrow();
  });
});

describe('mapSplits', () => {
  test('empty array → pre-race placeholder', () => {
    expect(mapSplits([])).toEqual({
      mile: 0, pace: '—', projected: '—', projectedElapsed: '—', splits: [], status: 'pre',
    });
  });

  test('standard mid-race payload', () => {
    const out = mapSplits([
      { label: 'Mile 1', time: '9:00', milePace: '9:00' },
      { label: 'Mile 5', time: '45:30', milePace: '9:06' },
      { label: 'Mile 7', time: '1:04:12', milePace: '9:10', etfp: '09:05' },
    ]);
    expect(out.mile).toBe(7);
    expect(out.pace).toBe('9:10');
    expect(out.projected).toBe('9:05 AM');
    expect(out.status).toBe('running');
    expect(out.splits).toHaveLength(3);
    expect(out.splits[1]).toEqual({ mile: 5, time: '45:30', pace: '9:06' });
  });

  test('finish label flips status to finished', () => {
    const out = mapSplits([
      { label: 'Mile 13', time: '2:00:00', milePace: '9:10' },
      { label: 'Finish', time: '2:01:00', milePace: '9:10', etfp: '9:01 AM' },
    ]);
    expect(out.mile).toBe(13.1);
    expect(out.status).toBe('finished');
    expect(out.projected).toBe('9:01 AM');
  });

  test('falls back to legacy `pace` key when `milePace` missing', () => {
    const out = mapSplits([{ label: 'Mile 3', time: '27:00', pace: '9:00' }]);
    expect(out.pace).toBe('9:00');
    expect(out.splits[0].pace).toBe('9:00');
  });

  test('drops splits whose labels we cannot parse', () => {
    const out = mapSplits([
      { label: 'Start', time: '0:00' },
      { label: 'Mile 3', time: '27:00', milePace: '9:00' },
      { label: 'Gun', time: '0:00' },
    ]);
    expect(out.splits).toHaveLength(1);
    expect(out.splits[0].mile).toBe(3);
  });

  test('unknown last-label degrades silently (DOCUMENTED FRAGILITY)', () => {
    // If RTRT reports a checkpoint we can't parse as the most recent split
    // (e.g. "Halfway Mat", "Chip Mat"), current behavior: mile=0, status=running.
    // This test pins that behavior so if we ever fix it the test flips.
    const out = mapSplits([{ label: 'Halfway Mat', time: '1:00:00', milePace: '9:00' }]);
    expect(out.mile).toBe(0);
    expect(out.status).toBe('running');
    // Downstream consumers (elevation dot, confetti, ETA) will treat this as
    // "at the start line" even though the runner is mid-race.
  });

  test('missing label on last point defaults to mile 0', () => {
    const out = mapSplits([{ label: 'Mile 5', time: '45:00', milePace: '9:00' }, {}]);
    expect(out.mile).toBe(0);
  });

  test('missing fields on points do not throw', () => {
    expect(() => mapSplits([{}])).not.toThrow();
    expect(() => mapSplits([{ label: null }])).not.toThrow();
    expect(() => mapSplits([{ label: 'Mile 1', time: null, milePace: null }])).not.toThrow();
  });

  test('runner past 13.1 still reports finished', () => {
    // RTRT occasionally reports mile markers at 13.2+ from GPS overshoot.
    // Finish-label match forces 13.1, but a raw "Mile 13.5" marker should
    // still cross the finished threshold.
    const out = mapSplits([{ label: 'Mile 13.5', time: '2:05:00', milePace: '9:15' }]);
    expect(out.mile).toBe(13.5);
    expect(out.status).toBe('finished');
  });

  test('pace falls back to em-dash when missing from last point', () => {
    const out = mapSplits([{ label: 'Mile 5', time: '45:00' }]);
    expect(out.pace).toBe('—');
  });

  test('projected falls back to em-dash when etfp missing/empty', () => {
    expect(mapSplits([{ label: 'Mile 5' }]).projected).toBe('—');
    expect(mapSplits([{ label: 'Mile 5', etfp: '' }]).projected).toBe('—');
    expect(mapSplits([{ label: 'Mile 5', etfp: 0 }]).projected).toBe('—');
  });

  test('numeric etfp is coerced to string before parsing', () => {
    // last.etfp is fed through String() — a numeric value shouldn't crash.
    expect(() => mapSplits([{ label: 'Mile 5', etfp: 90500 }])).not.toThrow();
  });
});
