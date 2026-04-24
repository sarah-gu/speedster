# Handoff: Race Day — Live Marathon Tracker

## Overview

**Race Day** is a one-day mobile web app for following friends running a marathon. One shareable link, no login, no setup — spectators tap names of the runners they want to follow and get a live-updating board showing each runner's current mile, pace, and projected finish.

Designed for the NYC Marathon but the pattern generalizes to any race running on the RTRT.me data platform. The data source is NYRR's live tracker (`https://api.rtrt.me/events/NYRR-NYH2026/profiles?bib=BIB`), polled every 30s for splits, pace, and projected finish.

The design target is **mobile-first** — spectators watching from a street corner. The aesthetic is energetic and bold: big italic display type, race-stripe hatching, color-coded dots gliding along a shared elevation profile.

## About the Design Files

The files in this bundle are **design references created in HTML/React** — interactive prototypes showing intended look, layout, and motion. They are **not production code to copy directly**.

The task is to **recreate these HTML designs in the target codebase's environment** using its established patterns, component library, and conventions. If no codebase exists yet, pick the most appropriate framework (Next.js + Tailwind is a reasonable default for a one-day web app) and implement there.

The HTML prototype runs React via CDN + Babel in-browser, which is fine for a sketch but shouldn't ship.

## Fidelity

**High-fidelity.** Colors, typography, spacing, and micro-interactions are all final. Recreate pixel-perfectly. All real data wiring (API polling, selection state, etc.) is mocked with simulated updates — you will replace this with real RTRT.me polling.

## Screens / Views

Two primary spectator screens on mobile. Pre-race, Live, and Finished states are a single screen that swaps content based on race clock. Onboarding is listed below but was not mocked; follow the pattern.

### 1. Everyone View (default)

**Purpose:** Glanceable overview of all followed runners, sorted by race position.

**Layout (top → bottom):**
1. **Dark app header** (background `#1a1816`, diagonal stripe overlay at 3% opacity) — 66px top padding to clear iOS status bar / Dynamic Island.
   - Left: tiny label `NYC · NOV 1` (Archivo Narrow, 9px, 0.16em tracking, 60% opacity) + wordmark `RACE DAY.` (Archivo italic black, 26px, -0.03em tracking).
   - Right: `{N} LIVE` with pulsing orange dot (JetBrains Mono, 9px) + elapsed time `1:12:14` below (JetBrains Mono, 11px, 65% opacity).
2. **Global elevation graph** (dark continues): 362×160 SVG, padY=32.
   - Header row: `COURSE · 26.2MI` (Archivo Narrow italic, 10px) / `↑180 FT · STATEN I → C.PARK` (JetBrains Mono, 9px).
   - Faint grid lines at 25/50/75% height, 5% opacity dashed.
   - Base path: smooth Catmull-Rom-derived cubic bezier at 28% opacity, 1.5px.
   - Traveled path (up to lead runner's mile): brighter 70% opacity 1.8px stroke + gradient fill.
   - Mile markers: `START`, `10K`, `HALF`, `30K`, `FINISH` in JetBrains Mono 9px.
   - Runner dots: 8px outer ink ring, 6.5px colored stroke ring (pulses 6.5 → 8 → 6.5 over 1.8s), 3px solid color core.
   - Labels alternate above/below the curve, with minimum 58px horizontal gap enforced; leader line from dot to label at 55% opacity.
3. **Section divider**: `CREW · 4` (Archivo Narrow italic, 11px) / `SORTED · BY POS` (JetBrains Mono, 9px).
4. **Slim runner rows** (scrollable): one per followed runner, sorted descending by mile.
5. **Edit Crew** footer button (outline pill, 1.5px border at 13% opacity).

**Slim runner row layout (14px vertical padding, light cream `#fbf7ee` background):**
- Left accent stripe (4px wide, runner's color, 2px right-radius).
- Big mile number (Archivo italic black, 34px, 0.9 line-height) above a `MILE` label (Archivo Narrow, 8px, 0.16em tracking).
- Thin vertical divider (1px at 8% opacity).
- Right side: rank `02` (mono, 10px) + italic first name `Sarah` (18px) + last name `Kwon` (12px, 60% opacity) on one nowrap line; below it, the hype pill + `8:45/mi · →10:47AM` (mono, 10px).
- Chevron `›` in monospace 18px.

**Interactions:**
- Tap row → navigate to Focus view for that runner.
- Numbers tick (flash to accent color for 600ms on change).
- Confetti burst at the dot on the elevation graph when a runner crosses a whole-mile boundary.

### 2. Focus View (one runner)

**Purpose:** Zoom in on one runner — full elevation profile, splits, projected finish, cheer/share actions.

**Layout:**
1. **Dark top bar** (54px top padding): `← CREW` back button (Archivo Narrow 11px, 0.12em tracking) left; `LIVE · 1:12:53` (mono 10px) right with pulsing dot. Diagonal stripe overlay.
2. **Color-banner block** (background = runner's color, white text, diagonal stripe overlay at 8% opacity):
   - Label `CORRAL BLUE B` (Archivo Narrow 10px, 0.16em tracking, 80% opacity).
   - Display name `Sarah` (Archivo italic black, 44px, -0.035em tracking, 0.95 line-height).
   - Last name `Kwon` (Archivo 24px, 500 weight, 85% opacity).
   - Hype badge `GOING 🔥`.
   - Bib card floated right: white card, 2px black border, 3px offset hard shadow, `NYC MARATHON 2026` label in runner's color, bib number `48219` in Archivo italic black 26px.
3. **Race stripe divider** (4px diagonal hatch).
4. **Hero stat**: giant mile number `8.2` (Archivo italic black, 108px, -0.05em, 0.85 line-height) + `MI` suffix. Right side: `OF 26.2` label + `31% complete` (mono 13px).
5. **Full elevation profile**: 354×150 SVG, padY=18. Same structure as global graph but single runner, larger, with prominent START/10K/HALF/30K/FINISH labels (9px mono, 0.05em tracking, colored when past).
6. **Stats row** (3 cells, dividers between): `CURRENT PACE` / `PROJECTED` / `VS PR`. Labels in Archivo Narrow 9px. Values in JetBrains Mono 20px 800 weight.
7. **Splits list**: header `SPLITS` / `MILE · TIME · PACE`. Rows show `MI 1` / `8:52` / `8:52/mi` / `▲` or `▼` pace-direction indicator. Last row is a placeholder for the next-incoming mile with a pulsing dot and `INCOMING` label.
8. **Action row**: primary `CHEER 📣` (black button, italic Archivo Narrow 12px), secondary `SHARE` (outline pill).

**Interactions:**
- Tap `← CREW` → slide back to Everyone view.
- Numbers tick on update.
- Dot pulses on the elevation profile.

### 3. Race states (not separately mocked — drive via a single state variable)

- **Pre-race**: replace live board with corral info + countdown to gun time.
- **Live**: the two views above, auto-refreshing silently every 30s (no page jump).
- **Finished**: per-runner final time + pace card, shareable.

### 4. Onboarding (not mocked — build to pattern)

On first open, show the full roster of runners; tap to multi-select the ones to follow. Persist selection in localStorage. No account, no form. Let user edit selection via "EDIT CREW" button at any time.

## Interactions & Behavior

- **Silent polling**: poll RTRT.me every 30s. Update state in place — do not re-render the whole list or scroll-jump. Numbers should "tick" (flash to accent color for 600ms) on change.
- **Slide transitions**: Everyone → Focus slides in from right (`translateX(100%) → 0`, 280ms, `cubic-bezier(.2,.8,.2,1)`).
- **Mile-crossed confetti**: when a runner's integer mile increments, spawn ~18 confetti particles at their dot on the elevation graph. Particles are 3-4×6-12px rectangles in [accent, ink, gold, white], animated out with random velocity + rotation over 1.1s cubic-bezier.
- **Pulsing live dots**: keyframe `rd-pulse` — scale 1→1.6, opacity 0.75→0, 1.4s infinite.
- **Button press**: `:active { transform: scale(0.985) }` with 120ms ease.

## State Management

```ts
type Runner = {
  id: string;
  name: string; last: string;
  bib: number;
  corral: string;
  color: string;              // hex, used for stripe/banner/dot
  mile: number;               // 0 → 26.2
  pace: string;               // "8:45" (MM:SS)
  projected: string;          // "10:47 AM"
  gap: number;                // seconds vs PR (+/-)
  status: 'pre' | 'running' | 'finished';
  hype: string;               // "GOING", "STEADY", "LOCKED IN", ...
  splits: { mile: number; time: string; pace: string }[];
};

type AppState = {
  roster: Runner[];           // developer-configured, hardcoded per race
  followed: Set<string>;      // localStorage — spectator's selection
  focused: string | null;     // currently open runner, null = everyone view
  elapsedSec: number;         // derived from race start + now()
  lastUpdate: number;         // for "UPDATED Ns AGO"
};
```

- `roster` is static per-race (hardcode before race day).
- `followed` persists in localStorage under something like `raceday:followed`.
- Everything else is polled from RTRT.me.

## Design Tokens

### Colors

```css
--ink:         #1a1816;   /* near-black, warm */
--paper:       #f5f1e8;   /* warm off-white */
--paper-raise: #fbf7ee;   /* row background, slight lift */
--paper-bg:    #f0ece4;   /* page background */
--accent:      #e76f3c;   /* sunrise orange — default hot accent */

/* Runner colors (used for dots, stripes, banners) */
--runner-1:    #e76f3c;   /* Sarah — sunrise */
--runner-2:    #c84f2c;   /* Melody — rust */
--runner-3:    #a03a24;   /* Riri — clay */
--runner-4:    #8a4a22;   /* Devon — umber */

/* Alt accent presets (user-tweakable) */
#e76f3c sunrise · #b8dd2e lime · #e93c7a hot-pink
#23c4d1 cyan · #1a1816 ink · #e5a530 gold
```

Opacities used: 6%, 8%, 14%, 28%, 45%, 55%, 60%, 77%, 85%, 99% (expressed as hex suffixes like `#1a181655`).

### Typography

- **Display / names**: `Archivo` weights 400–900, italic on all display uses. Tracking is aggressively tight (-0.02em to -0.05em) at large sizes.
- **Labels / UI**: `Archivo Narrow` weights 500–800, italic, wide tracking (0.08em–0.18em), uppercase.
- **Data / numbers**: `JetBrains Mono` weights 400–700.

All three are Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&family=Archivo+Narrow:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Scale

- Micro labels: 8–10px with wide tracking.
- Body data: 11–13px mono.
- Row names: 18px display italic.
- Everyone-view mile: 34px display italic.
- Focus-view name: 44px display italic.
- Focus-view mile hero: 108px display italic.

### Spacing

- Screen padding: 16–20px horizontal.
- Row padding: 14px vertical.
- Block gap: 12–14px.
- Button padding: 10px × 18px for pills; 14px for primary.

### Borders, radii, shadows

- Row divider: `1px solid #1a18160d` (5% ink).
- Pill radius: 999px.
- Card radius: 4px (bib), 8px (action buttons).
- Bib shadow: `3px 3px 0 #1a1816` (hard offset, no blur — sporty).
- No soft drop shadows anywhere in the UI itself.

### Race-stripe hatch

Used on dark headers and as section dividers:
```css
background-image: repeating-linear-gradient(
  -45deg,
  rgba(255,255,255,0.03) 0,
  rgba(255,255,255,0.03) 2px,
  transparent 2px,
  transparent 10px
);
```

As a solid 4px divider:
```css
background-image: repeating-linear-gradient(
  -45deg,
  #1a1816 0,
  #1a1816 4px,
  transparent 4px,
  transparent 8px
);
```

## Elevation Profile Data

Stylized NYC-marathon-inspired profile in `race-data.jsx` — waypoints of `[mile, elevation_ft]`. Key features: climb at mile 2 (bridge), descent, flat middle, big climb at mile 15-16 (bridge), rolling hills 20-23. Max elevation ~180 ft.

Two helpers there you'll want to port:
- `buildElevationPath(w, h, padY)` — returns an SVG path string using Catmull-Rom-to-cubic-bezier smoothing.
- `pointAtMile(mile, w, h, padY)` — returns `{x, y}` for a runner's current position on the profile.

## Label Collision Avoidance

Runner name labels on the global elevation graph use this algorithm:

1. Sort runners by mile.
2. Assign alternating above/below-curve slots based on index parity.
3. Within each band, enforce minimum 58px horizontal spacing between labels — push the later label right if too close.
4. Clamp labels that run off the right edge; cascade the push backwards.
5. Draw a short leader line from dot to label in the runner's color at 55% opacity.

This handles clusters of 3-4 runners within a few miles cleanly without stacking text.

## Data Source (RTRT.me)

Per NYRR's live tracker:
1. Resolve bib → participant ID: `GET https://api.rtrt.me/events/NYRR-NYH2026/profiles?bib={BIB}`
2. Poll splits: `GET https://api.rtrt.me/events/NYRR-NYH2026/participants/{id}/splits`
3. Poll every 30s while `status === 'running'`.
4. Derive `mile`, `pace`, `projected finish` from splits.

Roster (names + bibs) is hardcoded in a config file before race day. No user-facing runner-add flow.

## Assets

No image assets. All visuals are SVG, CSS, and type. The elevation profile is procedurally drawn from a waypoint array.

## Files in this bundle

- `Race Day.html` — entry point, loads React + Babel + all JSX files.
- `race-app.jsx` — top-level app, routes between Everyone and Focus, runs simulated tick.
- `race-everyone.jsx` — Everyone view + global elevation + slim rows.
- `race-focus.jsx` — Focus view, hero mile, splits, actions.
- `race-components.jsx` — shared pieces: `LiveDot`, `TickNumber`, `HypeBadge`, `RaceStripe`, `ElevationMini`, `ElevationFull`, `Confetti`, `useAccent` hook.
- `race-data.jsx` — roster, elevation waypoints, `buildElevationPath`, `pointAtMile`.
- `ios-frame.jsx` — device bezel used for preview only. **Do not port.** The real app is a mobile web page; drop this entirely.
- `tweaks-panel.jsx` — design-time controls, also preview-only. **Do not port.**

## Build notes

- **Framework**: Next.js (App Router) + Tailwind is a reasonable default. React Query (or SWR) for the 30s polling. Zustand or React Context for the small amount of global state.
- **Polling**: use `refetchInterval: 30_000` in React Query; pause when tab is hidden (`refetchIntervalInBackground: false`). The "silent refresh" requirement means no loading spinners on subsequent fetches — only on the very first load.
- **Animation**: plain CSS keyframes + `transition` are enough for everything. Framer Motion would be overkill but works if you want it for the slide transition.
- **localStorage key**: `raceday:followed:v1`.
- **No service worker** needed for v1. If you want one, cache only fonts + JS bundle.
- **Mobile viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` and honor `env(safe-area-inset-top/bottom)` for the dark header padding and home-indicator spacing.
- **Accessibility**: the graph needs a text alternative — render an `aria-label` summarizing each runner's position, or a visually-hidden list mirroring the dots.
