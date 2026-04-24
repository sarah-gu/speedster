import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { mapSplits, parseMileFromLabel } from './rtrt-parse';

// Real RTRT payloads captured from NYRR-NYH2025 (2025 United Airlines NYC Half).
// Fixtures pin the live API's shape so parser drift is caught before race day.
// The Brooklyn Half (NYCRB-BROOKLYNEXPERIENCEHALF-2026) may emit Mile-style labels
// in addition to or instead of NYRR's K/mi style, so tests focus on *shape* and
// *parser flexibility*, not on the exact label format.

const F = (name: string) =>
  JSON.parse(readFileSync(join(__dirname, 'fixtures', 'rtrt', name), 'utf8'));

describe('register fixture', () => {
  test('has token and info', () => {
    const d = F('register.json');
    expect(typeof d.token).toBe('string');
    expect(d.token.length).toBeGreaterThan(8);
    expect(d.info).toBeDefined();
  });
});

describe('profile search fixtures', () => {
  test('bib match → single list entry with required fields', () => {
    const d = F('profile_search_bib1.json');
    expect(Array.isArray(d.list)).toBe(true);
    expect(d.list).toHaveLength(1);
    const p = d.list[0];
    expect(p.pid).toBeDefined();
    expect(typeof p.pid).toBe('string');
    expect(p.bib).toBe('1');
    expect(p.fname).toBeDefined();
    expect(p.lname).toBeDefined();
  });

  test('no match → error envelope, not an empty list', () => {
    // Regression target: /api/tracker does `searchData?.list?.[0]`, which safely
    // yields undefined when `list` is absent. This test pins that shape.
    const d = F('profile_search_missing.json');
    expect(d.list).toBeUndefined();
    expect(d.error).toBeDefined();
    expect(d.error.type).toBe('no_results');
  });
});

describe('splits fixtures — shape', () => {
  const fixtures = [
    'splits_finished_elite.json',
    'splits_finished_midpack.json',
    'splits_finished_back.json',
  ];

  test.each(fixtures)('%s: list is non-empty array of labeled points', (name) => {
    const d = F(name);
    expect(Array.isArray(d.list)).toBe(true);
    expect(d.list.length).toBeGreaterThan(0);
    for (const p of d.list) {
      expect(typeof p.label).toBe('string');
      expect(typeof p.time).toBe('string');
      expect(typeof p.pid).toBe('string');
    }
  });

  test.each(fixtures)('%s: ends with a FINISH-labeled split', (name) => {
    const d = F(name);
    const last = d.list[d.list.length - 1];
    expect(last.label).toMatch(/finish/i);
    // NYRR flags finish with isFinish="1"; capture so drift shows up
    expect(last.isFinish).toBe('1');
  });
});

describe('splits fixtures — mapSplits output', () => {
  test('elite finisher → mile 13.1, status=finished, every non-start split parsed', () => {
    const d = F('splits_finished_elite.json');
    const out = mapSplits(d.list);
    expect(out.mile).toBe(13.1);
    expect(out.status).toBe('finished');
    // START drops out (null label), every 5K/10K/... + FINISH is kept
    expect(out.splits.length).toBe(d.list.length - 1);
    // pace for the race came from the last non-START point's milePace
    expect(out.pace).toMatch(/^\d{1,2}:\d{2}$/);
  });

  test('mid-pack finisher missing the 5K split still resolves mile 13.1', () => {
    // This runner's payload has no 5K split (only 10K onward). Regression target:
    // parser must not choke on gaps.
    const d = F('splits_finished_midpack.json');
    const out = mapSplits(d.list);
    expect(out.mile).toBe(13.1);
    expect(out.status).toBe('finished');
  });

  test('back-of-pack finisher → all splits parsed, projected is em-dash on FINISH (no etfp)', () => {
    const d = F('splits_finished_back.json');
    const out = mapSplits(d.list);
    expect(out.mile).toBe(13.1);
    expect(out.status).toBe('finished');
    // FINISH points have no etfp in NYRR's payload — projected should surface as em-dash
    expect(out.projected).toBe('—');
  });

  test('mid-race simulation — truncate FINISH + last km split, status flips to running', () => {
    // Simulates what /api/tracker would see during the race: the runner has not
    // yet crossed FINISH. Uses the elite payload and drops the last two points
    // so the most recent split is 15K/9.3mi.
    const d = F('splits_finished_elite.json');
    const truncated = d.list.slice(0, -2);
    const out = mapSplits(truncated);
    expect(out.mile).toBeCloseTo(9.3, 5);
    expect(out.status).toBe('running');
    expect(out.splits.length).toBe(truncated.length - 1); // minus START
  });

  test('pre-race simulation — only the START split present → mile 0', () => {
    const d = F('splits_finished_elite.json');
    const preRace = d.list.slice(0, 1);
    const out = mapSplits(preRace);
    // START is unparsable by design, so it falls into the documented "mile 0" path
    expect(out.mile).toBe(0);
    expect(out.splits).toHaveLength(0);
  });
});

describe('parseMileFromLabel — NYRR formats', () => {
  test('K/mi combo label extracts the mile portion', () => {
    expect(parseMileFromLabel('5K/3.1mi')).toBe(3.1);
    expect(parseMileFromLabel('10K/6.2mi')).toBe(6.2);
    expect(parseMileFromLabel('15K/9.3mi')).toBe(9.3);
    expect(parseMileFromLabel('20K/12.4mi')).toBe(12.4);
  });

  test('FINISH maps to 13.1 (unchanged)', () => {
    expect(parseMileFromLabel('FINISH')).toBe(13.1);
  });

  test('START is unparsable — mapSplits relies on this', () => {
    expect(parseMileFromLabel('START')).toBeNull();
  });

  test('still parses Mile-style labels for Brooklyn Half compatibility', () => {
    expect(parseMileFromLabel('Mile 7')).toBe(7);
    expect(parseMileFromLabel('Mile 13.1')).toBe(13.1);
  });
});
