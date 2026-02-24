# SSD Station Simulator

A web-based simulator for modeling and visualizing package flow through Same-Day Delivery (SSD) station operations. Built with Next.js, React, and TypeScript.

## Overview

The simulator models the full lifecycle of packages through a delivery station:

1. **Inbound** → Packages arrive and wait for processing
2. **Pick** → Associates pick items from shelves
3. **Slam** → Scan, Label, Apply, Manifest
4. **Conveyor** → Transport from Slam to Induct
5. **Induct** → Packages are scanned and stowed into the sort system
6. **Route Cart** → Packages accumulate by weighted capacity; carts flush to create route bundles
7. **Staging** → Route bundles wait before loading
8. **Loading** → Bundles are loaded onto delivery vehicles and dispatched

## Features

- **Visual simulation** — Canvas-based visualization of zones, packages, and route bundles
- **Configurable parameters** — Package rate, sectors, staging zones, cart capacity, flush thresholds
- **Per-stage timing** — Adjustable dwell times for each stage (inbound, pick, slam, conveyor, induct, staging, loading)
- **Editor mode** — Add, move, resize, and delete zones to design custom layouts
- **Template I/O** — Export and import station layouts as JSON
- **Metrics panel** — Throughput, cycle time, zone utilization, packages per stage
- **Wiki** — Built-in documentation for zones and concepts
- **Speed control** — Run simulation at 0.5× to 20× speed

## Tech Stack

- **Next.js 16** — React framework
- **React 19** — UI library
- **TypeScript** — Type safety
- **Tailwind CSS 4** — Styling
- **Radix UI** — Accessible components
- **Recharts** — Metrics charts
- **npm / pnpm / yarn** — Package manager (npm comes with Node.js)

## Getting Started

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
│   ├── control-bar.tsx      # Play/pause, speed, mode
│   ├── config-panel.tsx     # Configuration sidebar
│   ├── metrics-panel.tsx   # Live metrics
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

Key parameters (configurable in the right panel):

| Parameter | Description | Default |
|-----------|-------------|---------|
| Package Rate | Packages per minute | 10 |
| Sectors | Number of route carts | 45 |
| Staging Zones | Number of staging areas | 15 |
| Cart Capacity | Weighted capacity per cart | 50 |
| Flush Threshold | Min weighted count to flush cart | 45 |
| Staging Max Routes | Max route bundles per staging zone | 3 |

Stage times (in minutes) control dwell at each stage. See the Wiki tab for detailed documentation.

## License

Private project.
