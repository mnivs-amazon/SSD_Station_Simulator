# SSD Station Simulator Rebuild

This README defines a clean rebuild plan for the SSD Station Simulator, based on the existing V1/V2/V3 documentation. It is structured around an MVP and clear milestones so we can deliver value incrementally.

## Goals
- Rebuild the simulator on a simpler, modular foundation.
- Preserve the most valuable behaviors from V2/V3 (layout editor, route cart flow, metrics).
- Make the simulation deterministic, testable, and easy to extend.
- Keep the app frontend-only and dependency-light.

## Non-Goals (for MVP)
- 3D visualization.
- Multi-station orchestration.
- Live API integration.
- Mobile-first UI polish.

## MVP Definition
The MVP is a fully usable SSD station simulator with a minimal but complete workflow and a reliable editor.

MVP includes:
- Core workflow: Inbound -> Sort -> Induct -> Route Carts -> Staging -> Loading.
- Route carts with capacity, random distribution, and auto-transfer to staging.
- Real-time metrics: throughput, active routes, average cycle time, zone utilization.
- Layout editor: select, move, resize, add zones, delete zones.
- Save/load templates (JSON) and import/export.
- Single-page, no external dependencies, runs from `index.html`.

MVP excludes:
- Advanced analytics dashboards.
- AI optimization or predictive routing.
- Multi-user collaboration.

## Milestones

### Milestone 0: Rebuild Foundations
Goal: Establish a clean project skeleton and core systems.
- New file structure (see "Target Structure").
- Basic rendering loop and time control (play/pause/step/speed).
- Zone model, package model, and deterministic simulation clock.
- Minimal UI shell and config panel (no styling polish).

Exit criteria:
- App loads with empty layout and basic controls.
- Zones can be created and rendered on canvas.

### Milestone 1: Core Simulation MVP
Goal: Implement the full package flow with metrics.
- Package lifecycle: inbound -> sort -> induct -> route carts -> staging -> loading.
- Route carts (15) with capacity, random distribution, and auto-transfer.
- Metrics panel for throughput, cycle time, utilization.
- Basic logging (console or on-screen).

Exit criteria:
- 100+ packages flow smoothly without errors.
- Cart distribution is balanced and visually obvious.

### Milestone 2: Layout Editor MVP
Goal: Rebuild the layout editor with essential tooling.
- Select, move, resize, delete.
- Grid snap (toggle).
- Add zone tool for required zone types.
- Undo/redo (25+ steps).

Exit criteria:
- Layout can be created, edited, and saved.
- Editor feels stable for a 30-minute session without refresh.

### Milestone 3: Templates + File I/O
Goal: Restore usability and sharing workflows.
- Save/load templates to local storage.
- Import/export JSON.
- Background image import.

Exit criteria:
- A saved layout can be exported, re-imported, and rendered identically.

### Milestone 4: V3 Visual Enhancements
Goal: Restore the high-value V3 visuals.
- Route cart labels (R001, R002, ...).
- Gradient fills with real-time capacity.
- "FULL!" alerts on capacity.

Exit criteria:
- Visual indicators are clear at a glance.

### Milestone 5: Quality + Performance
Goal: Make the rebuild resilient and fast.
- Performance tuning for 200+ packages.
- Visual regression checks (manual).
- Documentation and sample templates.

Exit criteria:
- Stable at 4x speed without jank on a modern laptop.

## Target Structure
This structure keeps the rebuild modular and testable.
```
/
├── index.html
├── styles.css
├── src/
│   ├── app.js                 # app boot, mode switching
│   ├── engine/
│   │   ├── clock.js            # simulation clock and speed control
│   │   ├── world.js            # zones + packages state
│   │   ├── flow.js             # routing logic
│   │   └── metrics.js          # stats/analytics
│   ├── editor/
│   │   ├── editor.js           # selection + tools
│   │   ├── tools.js            # move/resize/delete/add
│   │   └── history.js          # undo/redo
│   ├── ui/
│   │   ├── controls.js
│   │   ├── panels.js
│   │   └── renderer.js         # canvas drawing
│   └── io/
│       ├── templates.js
│       └── files.js
└── templates/
    └── default.json
```

## Zone Types (Initial)
Required for MVP layout and flow:
- inbound
- sort
- induct
- route_cart
- staging
- loading
- problem_solve
- hazmat

## Domain Model Decisions (Step 1)
These decisions lock the MVP behavior and data relationships.

### Flow
Inbound -> Sort -> Induct -> Route Carts -> Staging -> Loading

### Sector vs Route
- **Sector** = delivery area (geographic grouping).
- **Route** = a single driver run within a sector.
- **Rule:** One active route per sector at a time. When a route closes, a new route opens for the same sector.

### Route Carts
- **Route cart** represents the active route (one cart per active route).
- Carts fill until capacity, then move to staging.
- When a route closes, its cart completes and a new cart is created for the new route.

### Grocery/Temperature Zones
- Grocery zones exist for layout and visualization only in MVP.
- Package flow ignores temperature zones unless a future milestone explicitly routes by temperature.

### Assignment Logic
- On induct, package is assigned to a sector (random/KNN placeholder).
- Package is assigned to the sector's active route.
- Package then targets the active route cart.

## Data Model (Draft)
This is a minimal, explicit shape for data flow:
```json
{
  "sectors": [
    { "id": "S01", "activeRouteId": "S01R01" }
  ],
  "routes": [
    { "id": "S01R01", "sectorId": "S01", "status": "open" }
  ],
  "zones": [
    { "id": "route_cart_01", "type": "route_cart", "x": 0, "y": 0, "w": 120, "h": 80, "capacity": 25 }
  ],
  "packages": [
    { "id": "PKG1", "state": "induct", "sectorId": "S01", "routeId": "S01R01", "createdAt": 0 }
  ],
  "config": {
    "packageRatePerHour": 500,
    "numSectors": 15,
    "cycleTimeSec": 45
  }
}
```

## Definition of Done (MVP)
- No console errors during a 15-minute run.
- All primary controls work (play, pause, step, speed).
- Templates import/export correctly.
- Layout editor can build a full flow layout from scratch.
- Visual indicators for route carts are readable.

## Next Step
If you want, I can start Milestone 0 by scaffolding the new structure and moving the current code into a clean baseline for the rebuild.
