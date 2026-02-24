# SSD Station Simulator

A web-based simulator for modeling and visualizing package flow through Same-Day Delivery (SSD) station operations. Built with Next.js, React, and TypeScript.

## Overview

The simulator models the full lifecycle of packages through a delivery station. The default flow is:

1. **Inbound** → Packages arrive and wait for processing
2. **Pick** → Associates pick items from shelves
3. **Slam** → Scan, Label, Apply, Manifest
4. **Conveyor** → Transport from Slam to Induct
5. **Induct** → Packages are scanned and stowed into the sort system
6. **Route Cart** → Packages accumulate by weighted capacity (wt); when full, the Route is closed and moves to staging
7. **Staging** → Closed Routes wait before loading
8. **Loading** → Routes are loaded onto delivery vehicles and dispatched

The **Workflow** tab lets you customize the flow sequence, add zone types (e.g. chilled, frozen, ambient, produce), and define per-stage dwell times.

## Features

- **Visual simulation** — Canvas-based visualization of zones, packages, and routes
- **Workflow tab** — Define package flow sequence, enable/disable zone types (V5 + V3 extended), set per-stage times
- **Configurable parameters** — Package rate, sectors, staging zones, cart capacity (wt), flush thresholds
- **Per-stage timing** — Adjustable dwell times for each stage (inbound, pick, slam, conveyor, induct, staging, loading)
- **Editor mode** — Add, move, resize, and delete zones; zone types shown in editor come from Workflow config
- **Template I/O** — Export and import station layouts as JSON (includes workflow config)
- **Metrics panel** — Throughput, cycle time, zone utilization, packages per stage
- **Wiki** — Built-in documentation for zones and concepts
- **Logs tab** — Event log for package flow (enable Debug Logging in Config)
- **Speed control** — Slider from 4× to 100× for fast simulation runs

## Tech Stack

- **Next.js 16** — React framework
- **React 19** — UI library
- **TypeScript** — Type safety
- **Tailwind CSS 4** — Styling
- **Radix UI** — Accessible components
- **Recharts** — Metrics charts
- **npm / pnpm / yarn** — Package manager (npm comes with Node.js)

## Getting Started

### Run from GitHub

1. **Clone the repo**
   ```bash
   git clone https://github.com/mnivs-amazon/SSD_Station_Simulator.git
   cd SSD_Station_Simulator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the simulator**
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Prerequisites

- Node.js 18+ (includes npm)

### Installation

```bash
npm install
```

Or with pnpm or yarn:

```bash
pnpm install
# or
yarn install
```

### Run the simulator

```bash
npm run dev
```

Or with pnpm or yarn:

```bash
pnpm dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. If port 3000 is in use, Next.js will pick an available port (e.g. 3001, 3005); check the terminal output.

### Build for production

```bash
npm run build
npm start
```

Or with pnpm or yarn: `pnpm build` / `pnpm start` or `yarn build` / `yarn start`

## Project Structure

```
├── app/
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Main simulator page
│   └── globals.css     # Global styles
├── components/
│   ├── station-canvas.tsx   # Canvas visualization
│   ├── control-bar.tsx      # Play/pause, speed slider, mode
│   ├── config-panel.tsx     # Configuration sidebar
│   ├── metrics-panel.tsx   # Live metrics
│   ├── workflow-panel.tsx   # Workflow: flow sequence, zone types
│   ├── logs-panel.tsx      # Event log (package & route flow)
│   ├── editor-toolbar.tsx  # Edit-mode tools
│   ├── wiki-panel.tsx      # Documentation
│   └── ui/                 # Reusable UI components
├── hooks/
│   └── use-simulation.ts   # Simulation state & logic
├── lib/
│   ├── simulation/
│   │   ├── types.ts        # Type definitions
│   │   └── engine.ts       # Simulation tick logic
│   └── utils.ts
└── public/                  # Static assets
```

## Configuration

### Top tabs

- **Simulator** — Main canvas, controls, metrics, config
- **Wiki** — Documentation for zones and concepts
- **Workflow** — Define package flow sequence, enable zone types, set per-stage times
- **Logs** — Event log (enable Debug Logging in Config)

### Workflow tab

- **Flow sequence** — Order packages move through zones (e.g. inbound → pick → slam → conveyor → induct). Add, remove, or reorder stages. Flow ends at Route Cart (assignment), then Staging → Loading.
- **Zone types** — Enable/disable zone types for the editor. Supports V5 + V3 extended types: inbound, pick, slam, conveyor, induct, route_cart, staging, loading, chilled, frozen, ambient, produce, chilled_staging, frozen_staging, ambient_staging, cart_storage, route_closure, cart_staging, van_loading, problem_solve, cage_pick, hazmat, office.
- **Per-stage times** — Override dwell time (minutes) for each zone in the flow.

### Config panel (right sidebar)

| Parameter | Description | Default |
|-----------|-------------|---------|
| Package Rate | Packages per minute | 10 |
| Sectors | Number of route carts | 45 |
| Staging Zones | Number of staging areas | 15 |
| Cart Capacity | Weighted capacity per cart (wt: S=1, M=2, L=3, X=4) | 50 |
| Flush Threshold | Min weighted count to flush cart | 45 |
| Staging Max Routes | Max routes per staging zone | 3 |
| Debug Logging | Log package/route events to Logs tab and console | Off |

Stage times (in minutes) control dwell at each stage. See the Wiki tab for detailed documentation.

## IDs

- **Package ID** — Size prefix (S/M/L/X) + unique number, e.g. S000001, M000002
- **Route ID** — Unique per route, e.g. R000001, R000002. Created when packages are assigned; used throughout staging, loading, and dispatch.

## License

Private project.
