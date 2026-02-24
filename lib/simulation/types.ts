// ---- Zone Types ----
export type ZoneType =
  | "inbound"
  | "pick"
  | "slam"
  | "conveyor"
  | "induct"
  | "route_cart"
  | "staging"
  | "loading"

export interface Zone {
  id: string
  type: ZoneType
  label: string
  x: number
  y: number
  w: number
  h: number
  capacity: number
  packages: string[] // package IDs
  routeId?: string   // for route_cart / staging
  sectorId?: string  // for route_cart
  waveId?: string    // for loading zones
  // Staging: holds route bundles (max 3)
  routeBundles?: RouteBundle[]
}

// ---- Package Sizes ----
export type PackageSize = "small" | "medium" | "large" | "xlarge"

// Weighted unit counts: S=1, M=2, L=3, XL=4
export const PACKAGE_SIZE_WEIGHT: Record<PackageSize, number> = {
  small: 1,
  medium: 2,
  large: 3,
  xlarge: 4,
}

export const PACKAGE_SIZE_CONFIG: Record<PackageSize, { weight: number; cuft: number; label: string }> = {
  small:  { weight: 1, cuft: 0.3, label: "S" },
  medium: { weight: 2, cuft: 0.7, label: "M" },
  large:  { weight: 4, cuft: 1.2, label: "L" },
  xlarge: { weight: 6, cuft: 2.0, label: "XL" },
}

// ---- Route Bundle (closed route moving through staging/loading — id = routeId) ----
export interface RouteBundle {
  id: string   // same as routeId — route is the sole identifier
  routeId: string
  sectorId: string
  packageCount: number
  weightedCount: number  // sum of S=1, M=2, L=3, XL=4
  enteredStagingAt: number // tick when it entered staging
  enteredLoadingAt: number | null
  state: "staging" | "loading" | "dispatched"
  // Visual position for animation
  visualX: number
  visualY: number
  targetX: number
  targetY: number
}

// ---- Package Types ----
export type PackageState =
  | "inbound"
  | "pick"
  | "slam"
  | "conveyor"
  | "induct"
  | "route_cart"
  | "bundled"    // consumed into a route bundle
  | "delivered"

export interface Package {
  id: string               // e.g. S000001, M000002, L000003 (size prefix + globally unique number)
  state: PackageState
  size: PackageSize
  sectorId: string | null
  routeId: string | null
  zoneId: string | null
  createdAt: number        // simulation tick
  promiseTime: number      // tick by which this package must be delivered (e.g. T+2hrs, T+5hrs)
  stateEnteredAt: number   // tick when entered current state
  completedAt: number | null
  // Visual animation position
  visualX: number
  visualY: number
  targetX: number
  targetY: number
}

// ---- Sector / Route ----
export interface Sector {
  id: string
  activeRouteId: string
}

export interface Route {
  id: string
  sectorId: string
  status: "open" | "closed"
  packageCount: number
  weightedCount: number            // sum of package weights in this route
  earliestPromiseTime: number | null  // earliest promise time among packages in this route
}

// ---- Per-stage timing config (in sim-minutes) ----
export interface StageTimes {
  inboundMin: number        // Order Drop: 4.5
  pickMin: number           // Pick Cycle: avg 1.75 (0.5-3)
  slamMin: number           // Pack Cycle: avg 3 (0.5-5.5 + 0.2 rebin)
  conveyorMin: number       // SLAM to Induct walk: avg 3.75 (3-4.5)
  inductMin: number         // Induct/stow: 0.83
  routeClosureMin: number   // Route closure/assignment + rabbit: 1.5
  stagingMin: number        // Driver Cart Pick Up + Walk to Vehicle: 4
  loadingMin: number        // Vehicle Loading: 1
}

// ---- Simulation Config ----
export interface SimConfig {
  packageRatePerMinute: number
  numSectors: number              // number of route carts (45)
  numStagingZones: number         // number of staging zones (15)
  cartWeightedCapacity: number    // weighted capacity per cart (50)
  cartFlushThreshold: number      // min weighted count to flush (45)
  stagingMaxRoutes: number        // max route bundles per staging zone (3)
  promiseWindowMinutes: number             // max random promise time offset from T (e.g. 300 => T+2 to T+5 hrs)
  routeClosureBufferMinutes: number       // extra minutes added to earliest promise time for route closure
  enableRouteClosurePressure: boolean     // if true, routes flush when approaching promise time - buffer
  enableCapacityFlush: boolean            // if true, routes flush when capacity threshold met
  promiseIgnoreCount: number              // ignore first N packages' promise times; use (N+1)th earliest
  enableConsoleLogging: boolean           // log package flow events to console for debugging
  stageTimes: StageTimes
}

// ---- Per-zone-type capacity summary ----
export interface ZoneCapacitySummary {
  totalUsed: number
  totalCapacity: number
  pct: number // 0-100
}

// ---- Metrics ----
export interface Metrics {
  totalPackages: number
  deliveredPackages: number
  throughputPerMinute: number
  averageCycleTime: number
  activeRoutes: number
  zoneUtilization: Record<string, number>
  packagesPerStage: Record<string, number>
  packagesBySize: Record<PackageSize, number>
  stationCapacityPct: number
  trucksWaiting: number
  routeBundlesInStaging: number
  routeBundlesInLoading: number
  zoneCapacity: Record<string, ZoneCapacitySummary>  // keyed by zone type
}

// ---- World State ----
export interface WorldState {
  zones: Zone[]
  packages: Package[]
  sectors: Sector[]
  routes: Route[]
  routeBundles: RouteBundle[]
  config: SimConfig
  tick: number
  elapsedSeconds: number
  metrics: Metrics
  logEntries: string[]  // in-app log buffer when enableConsoleLogging is on (capped)
}

// ---- Simulation Speed ----
export type SimSpeed = number  // 4 to 100 (slider)

// ---- Editor Types ----
export type EditorTool = "select" | "move" | "resize" | "add" | "delete"

export interface EditorState {
  tool: EditorTool
  selectedZoneId: string | null
  addZoneType: ZoneType
  gridSnap: boolean
  gridSize: number
}

// ---- Template ----
export interface Template {
  name: string
  zones: Zone[]
  config: SimConfig
}

// ---- App Mode ----
export type AppMode = "simulate" | "edit"
