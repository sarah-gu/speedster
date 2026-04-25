export type Split = { mile: number; time: string; pace: string };

export type Runner = {
  id: string;
  name: string;
  last: string;
  bib: number;
  corral: string;
  color: string;
  mile: number;
  pace: string;
  projected: string;
  gap: number;
  status: "pre" | "running" | "finished";
  hype: string;
  splits: Split[];
};

// [mile, elevation_ft] — Brooklyn Experience Half Marathon (+467ft/-357ft)
export const COURSE: [number, number][] = [
  [0, 10],
  [0.5, 25],
  [1, 15],
  [1.5, 10],
  [2, 8],
  [2.5, 22],
  [3, 12],
  [3.5, 18],
  [4, 40],
  [4.5, 35],
  [5, 28],
  [5.5, 45],
  [6, 68],
  [6.5, 48],
  [7, 35],
  [7.5, 75],
  [8, 148],
  [8.5, 138],
  [9, 85],
  [9.5, 55],
  [10, 105],
  [10.5, 72],
  [11, 88],
  [11.5, 62],
  [12, 152],
  [12.5, 148],
  [13, 118],
  [13.1, 110],
];

export function buildElevationPath(w: number, h: number, padY = 8) {
  const maxMile = 13.1;
  const maxEl = 170;
  const pts = COURSE.map(
    ([m, e]) =>
      [(m / maxMile) * w, h - padY - (e / maxEl) * (h - padY * 2)] as [
        number,
        number,
      ],
  );

  let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return { d, pts };
}

export function pointAtMile(mile: number, w: number, h: number, padY = 8) {
  const maxMile = 13.1;
  const maxEl = 170;
  const m = Math.max(0, Math.min(maxMile, mile));
  let i = 0;
  while (i < COURSE.length - 1 && COURSE[i + 1][0] < m) i++;
  const [m0, e0] = COURSE[i];
  const [m1, e1] = COURSE[Math.min(i + 1, COURSE.length - 1)];
  const t = m1 === m0 ? 0 : (m - m0) / (m1 - m0);
  const el = e0 + (e1 - e0) * t;
  const x = (m / maxMile) * w;
  const y = h - padY - (el / maxEl) * (h - padY * 2);
  return { x, y, el };
}

// [mile, x, y] — hand-traced from BKXHM26_CourseMap_20260406.pdf.
// Coords are normalized to a 0..1 box; the component fits them to its SVG viewport.
// x increases east, y increases south.
export const COURSE_GEO: [number, number, number][] = [
  [0.0, 0.62, 0.06],   // Start — Greenpoint (McCarren area)
  [0.5, 0.60, 0.12],
  [1.0, 0.52, 0.14],   // Greenpoint south
  [1.5, 0.48, 0.17],
  [2.0, 0.44, 0.20],   // Metropolitan Ave / Williamsburg
  [2.5, 0.36, 0.24],
  [3.0, 0.26, 0.29],   // DUMBO (westernmost)
  [3.5, 0.30, 0.33],
  [4.0, 0.38, 0.36],   // Navy Yard / Flushing Ave
  [4.5, 0.44, 0.39],
  [5.0, 0.42, 0.45],   // Fort Greene / Downtown Brooklyn
  [5.5, 0.42, 0.51],
  [6.0, 0.44, 0.57],   // Clinton Hill
  [6.5, 0.46, 0.62],
  [7.0, 0.48, 0.66],   // Prospect Heights (near GAP, pass 1)
  [7.5, 0.58, 0.68],
  [8.0, 0.74, 0.69],   // Eastern Pkwy turnaround (easternmost)
  [8.5, 0.60, 0.70],
  [9.0, 0.46, 0.70],   // Grand Army Plaza (pass 2)
  [9.5, 0.48, 0.74],
  [10.0, 0.52, 0.80],  // Empire Blvd / east side of Prospect Park
  [10.5, 0.48, 0.86],
  [11.0, 0.40, 0.92],  // Parkside Ave / south side
  [11.5, 0.32, 0.90],
  [12.0, 0.28, 0.82],  // Prospect Park West (near GAP, pass 3)
  [12.5, 0.30, 0.78],
  [13.0, 0.35, 0.82],  // Inside park
  [13.1, 0.36, 0.82],  // Finish
];

export function pointAtMileGeo(mile: number): { x: number; y: number } {
  const m = Math.max(0, Math.min(13.1, mile));
  let i = 0;
  while (i < COURSE_GEO.length - 1 && COURSE_GEO[i + 1][0] < m) i++;
  const [m0, x0, y0] = COURSE_GEO[i];
  const [m1, x1, y1] = COURSE_GEO[Math.min(i + 1, COURSE_GEO.length - 1)];
  const t = m1 === m0 ? 0 : (m - m0) / (m1 - m0);
  return { x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t };
}

export type Landmark = {
  id: string;
  name: string;
  shortName: string;
  passMiles: number[];
  geo: [number, number]; // position in COURSE_GEO's 0..1 space
};

export const LANDMARKS: Landmark[] = [
  {
    id: 'grand-army-plaza',
    name: 'Grand Army Plaza',
    shortName: 'GAP',
    passMiles: [7.0, 9.0, 12.0],
    geo: [0.46, 0.70],
  },
];

export function nextLandmarkPass(currentMile: number, lm: Landmark): number | null {
  for (const m of lm.passMiles) {
    if (m > currentMile) return m;
  }
  return null;
}

export function etaSecondsToMile(currentMile: number, targetMile: number, pace: string): number {
  const miles = Math.max(0, targetMile - currentMile);
  const paceSec = parsePaceSec(pace);
  if (!isFinite(paceSec) || paceSec <= 0) return 0;
  return Math.round(miles * paceSec);
}

// April 26 2026 07:00 AM EDT (UTC-4) — NYCRUNS Brooklyn Experience Half Marathon gun time
export const RACE_START_EPOCH = 1777201200;

// Per-wave gun times, expressed as seconds offset from RACE_START_EPOCH (Wave A = 7:00 AM).
export const WAVE_OFFSETS: Record<string, number> = {
  "Wave A": 0,
  "Wave C": 80 * 60,
  "Wave D": 120 * 60,
};

export const WAVE_LABELS: Record<string, string> = {
  "Wave A": "7:00 AM",
  "Wave C": "8:20 AM",
  "Wave D": "9:00 AM",
};

export function parsePaceSec(pace: string) {
  const [m, s] = pace.split(":").map(Number);
  return m * 60 + s;
}

// Dynamic hype-tag pools, picked by phase + pace.
export const HYPE_POOLS = {
  pre: [
    "BIB ON", "CAFFEINATED", "GU LOADED", "STRETCHING", "MENTAL REPS",
    "TOEING LINE", "PLAYLIST UP", "HYDRATING", "READY", "WARMING UP",
    "ANTHEM TIME", "SHAKING IT OUT",
  ],
  early: [
    "FRESH LEGS", "FINDING PACE", "EASY DOES IT", "FIRST GEAR",
    "ROLLING", "WARMED UP", "SETTLED IN", "FEELING IT",
  ],
  mid: [
    "LOCKED IN", "DIALED IN", "IN THE ZONE", "EATING MILES",
    "GRINDING", "FLOW STATE", "STEADY", "ON CRUISE", "JUST VIBES",
  ],
  late: [
    "KICK MODE", "DIGGING DEEP", "FULL SEND", "FINAL BOSS",
    "PAIN CAVE", "HOMESTRETCH", "ON FUMES", "ALL IN", "ALMOST THERE",
  ],
  fast: [
    "FLYING", "RIPPING", "ON ONE", "GAS", "SUB-7", "ZOOMIN",
  ],
  chill: [
    "ZEN MODE", "EASY MILES", "CRUISIN", "SAVING IT", "VIBES ONLY",
  ],
  finished: [
    "DONE", "MEDAL'D", "BAGEL TIME", "ICED OUT", "CRUSHED IT",
    "13.1 ✓", "BEER ME", "PIZZA TIME",
  ],
} as const;

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h * 31) + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Pick a hype tag for a runner based on their current state.
// `sessionSeed` is a per-page-load random; combined with the runner id, it gives
// stable-per-session, varied-per-runner, fresh-on-reload selections.
export function pickHype(runner: Runner, sessionSeed: number): string {
  let pool: readonly string[];
  if (runner.status === "pre") {
    pool = HYPE_POOLS.pre;
  } else if (runner.status === "finished") {
    pool = HYPE_POOLS.finished;
  } else {
    const paceSec = parsePaceSec(runner.pace);
    if (isFinite(paceSec) && paceSec > 0 && paceSec < 7 * 60 + 30) {
      pool = HYPE_POOLS.fast;
    } else if (isFinite(paceSec) && paceSec > 9 * 60 + 30) {
      pool = HYPE_POOLS.chill;
    } else if (runner.mile < 4) {
      pool = HYPE_POOLS.early;
    } else if (runner.mile >= 10) {
      pool = HYPE_POOLS.late;
    } else {
      pool = HYPE_POOLS.mid;
    }
  }
  return pool[(hashId(runner.id) + sessionSeed) % pool.length];
}

export function formatElapsed(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Static config — name / pace / projected / mile / splits / status come from the live API
export type RunnerConfig = {
  id: string;
  bib: number;
  color: string;
  corral: string;
  hype: string;
  gap: number;
  // Force a display name regardless of what RTRT returns for the bib.
  // Use when someone runs under a bib registered to a different person.
  nameOverride?: { first: string; last: string };
};

export const CREW: RunnerConfig[] = [
  {
    id: "sarah",
    bib: 44312,
    color: "#e76f3c",
    corral: "Wave D",
    hype: "GOING",
    gap: 0,
  },
  {
    id: "theodore",
    bib: 9396,
    color: "#c84f2c",
    corral: "Wave A",
    hype: "DIALED IN",
    gap: 0,
  },
  {
    id: "mandi",
    bib: 45568,
    color: "#a03a24",
    corral: "Wave D",
    hype: "SENDING",
    gap: 0,
  },
  {
    id: "janet",
    bib: 42191,
    color: "#8a4a22",
    corral: "Wave D",
    hype: "LOCKED IN",
    gap: 0,
  },
  {
    id: "kimberly",
    bib: 34223,
    color: "#5c3014",
    corral: "Wave C",
    hype: "CRUISING",
    gap: 0,
  },
  {
    id: "kevin",
    bib: 44315,
    color: "#d4562a",
    corral: "Wave D",
    hype: "SENDING",
    gap: 0,
  },
  {
    id: "jess",
    bib: 44316,
    color: "#b84428",
    corral: "Wave D",
    hype: "DIALED IN",
    gap: 0,
  },
  {
    id: "animesh",
    bib: 8444,
    color: "#7a3618",
    corral: "Wave D",
    hype: "GOING",
    gap: 0,
    // Bib registered to Steve Li; Animesh is running in Steve's place.
    nameOverride: { first: "Animesh", last: "Joshi" },
  },
  {
    id: "lucas",
    bib: 14816,
    color: "#9c4220",
    corral: "Wave A",
    hype: "DIALED IN",
    gap: 0,
  },
  {
    id: "angeline",
    bib: 12696,
    color: "#cc5a2e",
    corral: "Wave A",
    hype: "CRUISING",
    gap: 0,
  },
  {
    id: "evan",
    bib: 35669,
    color: "#6e3a1c",
    corral: "Wave C",
    hype: "SENDING",
    gap: 0,
  },
  {
    id: "jiahua",
    bib: 8673,
    color: "#b85a2e",
    corral: "Wave A",
    hype: "LOCKED IN",
    gap: 0,
  },
  {
    id: "ellen",
    bib: 8672,
    color: "#854020",
    corral: "Wave A",
    hype: "GOING",
    gap: 0,
  },
  {
    id: "puhua",
    bib: 17139,
    color: "#a84a26",
    corral: "Wave A",
    hype: "GOING",
    gap: 0,
  },
];

export function configToRunner(
  c: RunnerConfig,
  overrides: Partial<Runner> = {},
): Runner {
  const runner: Runner = {
    id: c.id,
    name: "",
    last: "",
    bib: c.bib,
    corral: c.corral,
    color: c.color,
    mile: 0,
    pace: "—",
    projected: "—",
    gap: c.gap,
    status: "pre",
    hype: c.hype,
    splits: [],
    ...overrides,
  };
  if (c.nameOverride) {
    runner.name = c.nameOverride.first;
    runner.last = c.nameOverride.last;
  }
  return runner;
}

export const INITIAL_RUNNERS: Runner[] = CREW.map((c) => configToRunner(c));
