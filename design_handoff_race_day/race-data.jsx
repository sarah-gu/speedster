// Race data + course elevation profile for the NYC-style marathon
// All names are fictional.

const RACE_START = '10:00 AM';

// Elevation profile: 26.2 miles, approx waypoints [mile, elevation_ft]
// Stylized — big bridge climb at mile 2 (up), descent, flat stretch,
// climb around mile 15-16 (big bridge), rolling hills mile 20-23, finish.
const COURSE = [
  [0, 20],
  [1, 40],
  [2, 170],   // bridge peak
  [3, 50],
  [4, 30],
  [5, 40],
  [6, 60],
  [7, 50],
  [8, 45],
  [9, 55],
  [10, 70],
  [11, 50],
  [12, 40],
  [13, 60],
  [14, 30],
  [15, 80],
  [16, 140],  // bridge peak
  [17, 90],
  [18, 60],
  [19, 70],
  [20, 110],
  [21, 130],
  [22, 95],
  [23, 105],
  [24, 60],
  [25, 50],
  [26.2, 85],
];

// Build a smooth SVG path for the elevation profile within a box
function buildElevationPath(w, h, padY = 8) {
  const maxMile = 26.2;
  const maxEl = 180;
  const pts = COURSE.map(([m, e]) => [
    (m / maxMile) * w,
    h - padY - (e / maxEl) * (h - padY * 2),
  ]);
  // Catmull-Rom -> cubic bezier for smoothness
  let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return { d, pts, maxMile };
}

// Given a mile value, find the (x,y) point on the built profile path
function pointAtMile(mile, w, h, padY = 8) {
  const maxMile = 26.2;
  const maxEl = 180;
  // linear-interpolate elevation from COURSE waypoints
  let i = 0;
  while (i < COURSE.length - 1 && COURSE[i + 1][0] < mile) i++;
  const [m0, e0] = COURSE[i];
  const [m1, e1] = COURSE[Math.min(i + 1, COURSE.length - 1)];
  const t = m1 === m0 ? 0 : (mile - m0) / (m1 - m0);
  const el = e0 + (e1 - e0) * t;
  const x = (mile / maxMile) * w;
  const y = h - padY - (el / maxEl) * (h - padY * 2);
  return { x, y, el };
}

// Runners — fictional
// status: 'running' | 'pre' | 'finished'
const INITIAL_RUNNERS = [
  {
    id: 'sarah',
    name: 'Sarah',
    last: 'Kwon',
    bib: 48219,
    corral: 'Blue B',
    color: '#e76f3c',
    mile: 8.23,
    pace: '8:45',
    projected: '10:47 AM',
    gap: 0,
    status: 'running',
    hype: 'GOING',
    splits: [
      { mile: 1, time: '8:52', pace: '8:52' },
      { mile: 2, time: '17:40', pace: '8:48' },
      { mile: 5, time: '44:10', pace: '8:50' },
      { mile: 8, time: '1:10:05', pace: '8:45' },
    ],
  },
  {
    id: 'melody',
    name: 'Melody',
    last: 'Reyes',
    bib: 51003,
    corral: 'Blue C',
    color: '#c84f2c',
    mile: 7.91,
    pace: '9:10',
    projected: '10:52 AM',
    gap: 3,
    status: 'running',
    hype: 'STEADY',
    splits: [
      { mile: 1, time: '9:14', pace: '9:14' },
      { mile: 2, time: '18:20', pace: '9:06' },
      { mile: 5, time: '45:55', pace: '9:11' },
      { mile: 7, time: '1:04:12', pace: '9:10' },
    ],
  },
  {
    id: 'riri',
    name: 'Riri',
    last: 'Okafor',
    bib: 49872,
    corral: 'Orange D',
    color: '#a03a24',
    mile: 6.15,
    pace: '9:45',
    projected: '11:08 AM',
    gap: 8,
    status: 'running',
    hype: 'LOCKED IN',
    splits: [
      { mile: 1, time: '9:51', pace: '9:51' },
      { mile: 2, time: '19:30', pace: '9:39' },
      { mile: 5, time: '48:45', pace: '9:45' },
      { mile: 6, time: '58:30', pace: '9:45' },
    ],
  },
  {
    id: 'dev',
    name: 'Devon',
    last: 'Walsh',
    bib: 52110,
    corral: 'Green A',
    color: '#8a4a22',
    mile: 5.4,
    pace: '10:02',
    projected: '11:22 AM',
    gap: 14,
    status: 'running',
    hype: 'CRUISING',
    splits: [
      { mile: 1, time: '10:10', pace: '10:10' },
      { mile: 2, time: '20:12', pace: '10:02' },
      { mile: 5, time: '50:10', pace: '10:02' },
    ],
  },
];

Object.assign(window, {
  RACE_START, COURSE, buildElevationPath, pointAtMile, INITIAL_RUNNERS,
});
