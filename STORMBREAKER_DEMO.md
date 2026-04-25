# STORMBREAKER — EMP-RCWS Simulator
### Tech Fest Demo Guide

---

## What This Is

A fully browser-based simulation and operator control interface for the **STORMBREAKER EMP-RCWS (Remote-Controlled Weapon System)**. Visitors can sit at the console, select an incoming threat, execute a six-step electronic attack pipeline, and watch the engagement play out on a live tactical map — no hardware required.

---

## Layout

```
┌─────────────┬─────────────────────────────────┬──────────────┐
│  TRACKS     │         BATTLEFIELD MAP          │  OPERATOR    │
│  PANEL      │   (CartoDB dark / real tiles)    │  CONSOLE     │
│  (left)     │                                  │  (right)     │
│             │   [PIPELINE OVERLAY on engage]   │              │
│             │   [ENGAGE CONTROL — bottom-right]│              │
└─────────────┴─────────────────────────────────┴──────────────┘
                      [CONTROL BAR — bottom]
```

---

## Features Built

### 1. Battlefield Map (Days 20–21)
- Real OpenStreetMap tiles via **CartoDB Dark Matter** — actual terrain, looks tactical
- **EMP-RCWS vehicle** marker at map center (blue square labelled "EMP")
- **5 engagement zone rings** — color-coded:
  - Red 50m / Orange 150m — Hard-Kill EMP zone
  - Yellow 300m / 600m — Disruption zone
  - Blue 1km — RF Jam zone
- **Radar sweep animation** — green rotating sweep line at all times
- **Turret azimuth line** — blue dashed line showing where the weapon is pointing
- **EMP pulse ring** — expanding orange ring animation each time EMP fires

### 2. Threat Spawning System (Days 20–21)
- Three threat types with distinct icons on the map:
  - **FPV Drone** (F) — red diamond, 18 m/s, spawns at 800–1200m
  - **RF-IED** (I) — amber circle, 2 m/s, slow-moving
  - **Enemy RCWS** (R) — pink triangle, 8 m/s
- Each threat has: bearing, range, speed, RF fingerprint, priority (P1–P3)
- Threats move toward center in real time
- Threats that reach the perimeter (≤5m) are marked **ESCAPED**
- Click any marker on map or row in the Tracks panel to select a threat

### 3. Operator Console (Days 22–23)
Located in the right panel:
- **Azimuth Dial** — interactive circular dial, drag to rotate turret bearing
- **Elevation Arc** — vertical slider for -10° to +45°
- **Weapon Mode selector** — three modes:
  - `RF JAM` — disrupts C2 uplink, outcome: DISRUPTED
  - `DIRECTED EMP` — hard-kills electronics, outcome: DISRUPTED
  - `KINETIC` — physical engagement, outcome: DESTROYED
- **Engagement Zones** — collapsible zone legend with distances
- **Target Classification** — appears when a threat is selected:
  - RF fingerprint + live spectrum bar
  - Range / Bearing / Speed / Priority stats
  - Threat assessment string
- **E-Field Analysis** — auto-expands after each EMP fire (see Day 25)

### 4. Engage Control Panel (Days 22–23)
Floating panel, bottom-right of map:
- Shows selected threat's type, ID, range, bearing
- **APPROVE ENGAGEMENT** button — human-in-loop confirmation step
- **EXECUTE ATTACK** button — launches the pipeline
- Real-time status during pipeline execution

### 5. Six-Step Attack Pipeline (Day 24)
Top-center overlay visible during engagement:
| Step | Code | Description |
|------|------|-------------|
| 1 | FINGERPRINT | Analyse RF signature |
| 2 | SOFT ATTACK | Inject noise floor |
| 3 | FRONT DOOR | Exploit RF receiver |
| 4 | CUMULATIVE STRESS | Build EM stress field |
| 5 | RESONANCE STRIKE | Fire directed EMP pulse |
| 6 | ASSESS | Evaluate target status |

Each step has a **unique beam animation** on the map:
- FINGERPRINT → pulsing dashed line with travelling dots
- SOFT ATTACK → noise scatter cloud at target
- FRONT DOOR → solid beam with pulsing endpoint
- CUMULATIVE STRESS → oscillating energy beam with node rings
- RESONANCE STRIKE → full-bright EMP strike beam with expanding rings
- ASSESS → return ping moving back from target

Progress bar + step indicator + elapsed time shown throughout.

### 6. E-Field Simulation Panel (Day 25)
Auto-opens after each EMP fire (collapsible section in Operator Console):
- **E-Field vs Distance graph** — live-animated curve showing V/m at each range, zone bands overlaid, target range marker
- **Marx Generator Pulse Waveform** — 1.2/50μs double-exponential impulse (standard EMP test waveform), peak at ≈1.4μs annotated
- **Post-EMP BIT sequence** — Built-In Test runs automatically after each fire, checking all 5 subsystems in sequence

### 7. BIT Panel (Day 25)
Bottom of Operator Console:
- Manual RUN BIT button — simulates system self-test
- Subsystems: RADAR ARRAY / EMP GENERATOR / RF JAMMER / FIRE CONTROL / COMMS
- Statuses animate through CHECKING → nominal (ACTIVE / CHARGED / NOMINAL / ARMED / ENCRYPTED)

### 8. Mission Tracking & Kill Log
- TopBar shows live: TRACKS / HOSTILE / NEUTRALISED / ESCAPED counts
- Left panel **ENGAGEMENT LOG** — shows last 6 engagements with ID, type, mode, range, outcome

---

## How to Run a Demo

**Start the simulation:**
```bash
npm run dev
```
Open `http://localhost:5173` on any browser (Chrome/Firefox/Edge).

**Standard visitor walkthrough (3 minutes):**

1. **Orient** — Point to the map. Explain the range rings. The green sweep is radar. Blue vehicle at center is the EMP-RCWS.
2. **Select a threat** — Click any threat marker on the map, or click a row in the Tracks panel (left side). The Operator Console (right) will show target classification and RF fingerprint.
3. **Change weapon mode** — In the console, select `DIRECTED EMP` (default) or `RF JAM`.
4. **Approve** — Click **APPROVE ENGAGEMENT** (or press `Space`). This is the human-in-loop step.
5. **Execute** — Click **EXECUTE ATTACK** (or press `Enter`). Watch the pipeline overlay run through all 6 steps with map animations.
6. **See results** — Orange EMP pulse ring expands on map. Toast notification appears. E-Field panel auto-opens showing the pulse waveform and BIT sequence.
7. **Spawn more threats** — Use the **INJECT TRACK** buttons (bottom of left panel) or press `1`, `2`, `3` for FPV / IED / RCWS.
8. **Reset** — Press `R` or click **RESET [R]** button in the top-right.

**Keyboard shortcuts:**
| Key | Action |
|-----|--------|
| `Space` | Approve engagement |
| `Enter` | Execute attack |
| `1` | Spawn FPV Drone |
| `2` | Spawn RF-IED |
| `3` | Spawn Enemy RCWS |
| `R` | Reset scenario |

---

## Known Bugs & Status

| # | Bug | Status | Notes |
|---|-----|--------|-------|
| 1 | EMPPulse only fired once | **FIXED** | Now uses `empFireCount` not boolean flag — re-triggers every engagement |
| 2 | Threats stayed APPROACHING at range 0 | **FIXED** | Range ≤5m now marks threat ESCAPED + shows toast |
| 3 | FPV drone selected state lost diamond rotation | **FIXED** | CSS: `.fpv-drone.selected` now compounds transforms; letter counter-rotated |
| 4 | `currentStep` undefined in some renders | **FIXED** | Computed before return instead of inline |
| 5 | No scenario reset | **FIXED** | Reset button in TopBar + `R` keyboard shortcut |
| 6 | Engagement log missing | **FIXED** | KillEntry stored in state, shown in Tracks panel |

---

## Architecture Notes (for evaluators)

```
src/
├── store/simStore.ts        — All state: threats, turret, pipeline, kill log
├── types/index.ts           — Threat, SimState, KillEntry, etc.
├── App.tsx                  — Root: game loop, keyboard shortcuts, toast logic
├── components/
│   ├── TopBar.tsx           — Metrics bar + reset
│   ├── ThreatPanel.tsx      — Track list + inject + engagement log
│   ├── MapView.tsx          — Leaflet map: zones, radar sweep, EMP pulse, beam overlays
│   ├── ZoneLegend.tsx       — Zone key
│   ├── pipeline/
│   │   └── PipelineOverlay.tsx  — 6-step pipeline UI overlay
│   └── console/
│       ├── OperatorConsole.tsx  — Right panel container
│       ├── AzimuthDial.tsx      — Interactive bearing dial
│       ├── ElevationArc.tsx     — Elevation control
│       ├── RFSpectrum.tsx       — RF fingerprint visualiser
│       ├── EFieldPanel.tsx      — E-field graph + Marx waveform + post-EMP BIT
│       └── BITPanel.tsx         — Manual BIT tester
```

**State flow:**
1. `tickThreats()` runs every animation frame — moves threats, marks ESCAPED
2. User selects threat → `selectThreat(id)` → turret auto-aims
3. `approveEngagement()` → sets flag for human-in-loop
4. `runPipeline()` → advances steps every 1.4s via `setTimeout` chain
5. On completion → threat status updated, `KillEntry` pushed to `killLog`, `empFireCount` incremented → triggers EMP pulse + E-field animation

**Tech stack:** React 18 + TypeScript + Vite + Leaflet/react-leaflet + Tailwind CSS + Sonner (toasts)
