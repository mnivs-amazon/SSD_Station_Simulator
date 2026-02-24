import type {
  WorldState,
  Zone,
  Package,
  Sector,
  Route,
  RouteBundle,
  SimConfig,
  Metrics,
  PackageSize,
  ZoneType,
  StageTimes,
  WorkflowConfig,
} from "./types"
import { DEFAULT_WORKFLOW } from "./types"
import { PACKAGE_SIZE_WEIGHT } from "./types"

// ---- Default Stage Times (in minutes, from the ops clock table) ----
export const DEFAULT_STAGE_TIMES: StageTimes = {
  inboundMin: 4.5,
  pickMin: 1.75,          // avg of 0.5-3
  slamMin: 3.0,           // avg of 0.5-5.5 + 0.2 rebin
  conveyorMin: 3.75,      // avg of 3-4.5
  inductMin: 0.83,
  routeClosureMin: 1.5,
  stagingMin: 4.0,        // Driver Cart Pick Up 1.5 + Walk to Vehicle 2.5
  loadingMin: 1.0,        // Vehicle Loading
}

// ---- Default Config ----
export const DEFAULT_CONFIG: SimConfig = {
  packageRatePerMinute: 10,
  numSectors: 45,
  numStagingZones: 15,
  cartWeightedCapacity: 50,
  cartFlushThreshold: 45,
  stagingMaxRoutes: 3,
  promiseWindowMinutes: 300,             // packages get promise time T+2hrs to T+5hrs
  routeClosureBufferMinutes: 15,        // add 15 min buffer to earliest promise time
  enableRouteClosurePressure: true,     // route closure on promise time - buffer
  enableCapacityFlush: true,            // capacity threshold triggers flush
  promiseIgnoreCount: 0,               // ignore first N packages' promise times
  enableConsoleLogging: false,          // log package flow events to console
  stageTimes: DEFAULT_STAGE_TIMES,
  workflow: DEFAULT_WORKFLOW,
}

// ---- Console logging helper ----
function logEvent(config: SimConfig, tick: number, msg: string, logBuffer?: string[]) {
  if (config.enableConsoleLogging) {
    const entry = `[SSD T+${tick}s] ${msg}`
    console.log(entry)
    if (logBuffer) logBuffer.push(entry)
  }
}

// ---- Zone Colors (light theme) ----
export const ZONE_COLORS: Record<ZoneType, { bg: string; border: string; text: string; fill: string }> = {
  inbound:    { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af", fill: "#93c5fd" },
  pick:       { bg: "#fef3c7", border: "#f59e0b", text: "#92400e", fill: "#fcd34d" },
  slam:       { bg: "#fce7f3", border: "#ec4899", text: "#9d174d", fill: "#f9a8d4" },
  conveyor:   { bg: "#f3f4f6", border: "#9ca3af", text: "#374151", fill: "#d1d5db" },
  induct:     { bg: "#fff7ed", border: "#f97316", text: "#9a3412", fill: "#fdba74" },
  route_cart: { bg: "#fee2e2", border: "#ef4444", text: "#991b1b", fill: "#fca5a5" },
  staging:    { bg: "#d1fae5", border: "#10b981", text: "#065f46", fill: "#6ee7b7" },
  loading:    { bg: "#e0e7ff", border: "#6366f1", text: "#3730a3", fill: "#a5b4fc" },
  chilled:    { bg: "#e0f2fe", border: "#0ea5e9", text: "#0369a1", fill: "#7dd3fc" },
  frozen:     { bg: "#f0f9ff", border: "#38bdf8", text: "#0c4a6e", fill: "#bae6fd" },
  ambient:    { bg: "#fefce8", border: "#eab308", text: "#713f12", fill: "#fef08a" },
  produce:    { bg: "#dcfce7", border: "#22c55e", text: "#14532d", fill: "#86efac" },
  chilled_staging: { bg: "#cffafe", border: "#06b6d4", text: "#164e63", fill: "#67e8f9" },
  frozen_staging:  { bg: "#e0f2fe", border: "#0284c7", text: "#075985", fill: "#bae6fd" },
  ambient_staging: { bg: "#fef9c3", border: "#ca8a04", text: "#854d0e", fill: "#fde047" },
  cart_storage:    { bg: "#f5f5f4", border: "#78716c", text: "#44403c", fill: "#d6d3d1" },
  route_closure:  { bg: "#fef2f2", border: "#dc2626", text: "#7f1d1d", fill: "#fecaca" },
  cart_staging:   { bg: "#fef3c7", border: "#d97706", text: "#78350f", fill: "#fde68a" },
  van_loading:    { bg: "#ede9fe", border: "#7c3aed", text: "#4c1d95", fill: "#c4b5fd" },
  problem_solve:  { bg: "#fef3c7", border: "#b45309", text: "#78350f", fill: "#fcd34d" },
  cage_pick:      { bg: "#ecfdf5", border: "#059669", text: "#065f46", fill: "#6ee7b7" },
  hazmat:         { bg: "#fef2f2", border: "#b91c1c", text: "#7f1d1d", fill: "#fca5a5" },
  office:         { bg: "#f8fafc", border: "#64748b", text: "#334155", fill: "#cbd5e1" },
}

// ---- Package size distribution (weighted random) ----
const SIZE_WEIGHTS: { size: PackageSize; weight: number }[] = [
  { size: "small", weight: 40 },
  { size: "medium", weight: 35 },
  { size: "large", weight: 18 },
  { size: "xlarge", weight: 7 },
]

function randomPackageSize(): PackageSize {
  const total = SIZE_WEIGHTS.reduce((s, w) => s + w.weight, 0)
  let r = Math.random() * total
  for (const { size, weight } of SIZE_WEIGHTS) {
    r -= weight
    if (r <= 0) return size
  }
  return "medium"
}

// Convert minutes to simulation ticks (1 tick = 1 second)
function minToTicks(min: number): number {
  return Math.round(min * 60)
}

// Get stage time in minutes for a zone type (from workflow or StageTimes)
function getStageTimeMinutes(config: SimConfig, zoneType: ZoneType): number {
  const custom = config.workflow?.stageTimeByZone?.[zoneType]
  if (custom != null) return custom
  const st = config.stageTimes
  const map: Partial<Record<ZoneType, number>> = {
    inbound: st.inboundMin,
    pick: st.pickMin,
    slam: st.slamMin,
    conveyor: st.conveyorMin,
    induct: st.inductMin,
  }
  return map[zoneType] ?? 2
}

// ---- Default Layout ----
// Top row: RIGHT to LEFT: INBOUND (far right) -> PICK -> SLAM -> CONVEYOR -> INDUCT (far left)
export function createDefaultLayout(config: SimConfig): Zone[] {
  const zones: Zone[] = []
  let id = 0
  const nextId = () => `zone_${++id}`

  const topY = 75
  const topH = 75
  const boxW = 100
  const gap = 80

  // Layout right-to-left: Inbound starts on the right
  // Total width of the top row
  const totalTopW = (boxW + 20) + gap + boxW + gap + boxW + gap + (boxW + 20) + gap + (boxW + 10)
  const startX = 40

  // INDUCT (leftmost)
  zones.push({
    id: nextId(), type: "induct", label: "INDUCT",
    x: startX, y: topY, w: boxW + 10, h: topH, capacity: 20, packages: [],
  })
  // CONVEYOR
  zones.push({
    id: nextId(), type: "conveyor", label: "CONVEYOR",
    x: startX + (boxW + 10) + gap, y: topY, w: boxW + 20, h: topH, capacity: 40, packages: [],
  })
  // SLAM
  zones.push({
    id: nextId(), type: "slam", label: "SLAM",
    x: startX + (boxW + 10) + gap + (boxW + 20) + gap, y: topY, w: boxW, h: topH, capacity: 25, packages: [],
  })
  // PICK
  zones.push({
    id: nextId(), type: "pick", label: "PICK",
    x: startX + (boxW + 10) + gap + (boxW + 20) + gap + boxW + gap, y: topY, w: boxW, h: topH, capacity: 30, packages: [],
  })
  // INBOUND (rightmost)
  zones.push({
    id: nextId(), type: "inbound", label: "INBOUND",
    x: startX + (boxW + 10) + gap + (boxW + 20) + gap + boxW + gap + boxW + gap, y: topY, w: boxW + 20, h: topH, capacity: 50, packages: [],
  })

  // Route carts grid: 45 carts in 9 columns x 5 rows
  const numCarts = config.numSectors
  const cartCols = 9
  const cartW = 72
  const cartH = 50
  const cartGapX = 8
  const cartGapY = 8
  const cartStartX = 40
  const cartStartY = 220

  for (let i = 0; i < numCarts; i++) {
    const row = Math.floor(i / cartCols)
    const col = i % cartCols
    const sectorId = `S${String(i + 1).padStart(2, "0")}`
    zones.push({
      id: nextId(),
      type: "route_cart",
      label: `R${String(i + 1).padStart(3, "0")}`,
      x: cartStartX + col * (cartW + cartGapX),
      y: cartStartY + row * (cartH + cartGapY),
      w: cartW,
      h: cartH,
      capacity: config.cartWeightedCapacity,
      packages: [],
      routeId: `${sectorId}R01`,
      sectorId,
    })
  }

  // Staging zones: 15 zones in 5 columns x 3 rows
  const numStaging = config.numStagingZones
  const stagingCols = 5
  const stW = 110
  const stH = 50
  const stGapX = 10
  const stGapY = 10
  const stStartX = 40
  const cartBottomY = cartStartY + Math.ceil(numCarts / cartCols) * (cartH + cartGapY)
  const stStartY = cartBottomY + 35

  for (let i = 0; i < numStaging; i++) {
    const row = Math.floor(i / stagingCols)
    const col = i % stagingCols
    zones.push({
      id: nextId(),
      type: "staging",
      label: `STAGING${String(i + 1).padStart(2, "0")}`,
      x: stStartX + col * (stW + stGapX),
      y: stStartY + row * (stH + stGapY),
      w: stW,
      h: stH,
      capacity: config.stagingMaxRoutes, // capacity = max route bundles
      packages: [],
      routeBundles: [],
    })
  }

  // Loading docks (3)
  const dockX = stStartX + stagingCols * (stW + stGapX) + 30
  zones.push({
    id: nextId(), type: "loading", label: "DOCK 1",
    x: dockX, y: stStartY, w: 130, h: 60, capacity: 30, packages: [], waveId: "W1",
    routeBundles: [],
  })
  zones.push({
    id: nextId(), type: "loading", label: "DOCK 2",
    x: dockX, y: stStartY + 75, w: 130, h: 60, capacity: 30, packages: [], waveId: "W2",
    routeBundles: [],
  })
  zones.push({
    id: nextId(), type: "loading", label: "DOCK 3",
    x: dockX, y: stStartY + 150, w: 130, h: 60, capacity: 30, packages: [], waveId: "W3",
    routeBundles: [],
  })

  return zones
}

// ---- Create Initial World ----
export function createInitialWorld(zones?: Zone[], config?: SimConfig): WorldState {
  const cfg: SimConfig = config
    ? { ...DEFAULT_CONFIG, ...config, workflow: { ...DEFAULT_WORKFLOW, ...(config.workflow ?? {}) } }
    : DEFAULT_CONFIG
  const z = zones || createDefaultLayout(cfg)

  const sectors: Sector[] = []
  const routes: Route[] = []

  for (let i = 1; i <= cfg.numSectors; i++) {
    const sectorId = `S${String(i).padStart(2, "0")}`
    const routeId = nextRouteId(sectorId)
    sectors.push({ id: sectorId, activeRouteId: routeId })
    routes.push({
      id: routeId, sectorId, status: "open",
      packageCount: 0, weightedCount: 0, earliestPromiseTime: null,
    })
  }

  // Assign route IDs to route cart zones (match by sector)
  for (const zone of z) {
    if (zone.type === "route_cart" && zone.sectorId) {
      const route = routes.find((r) => r.sectorId === zone.sectorId)
      if (route) zone.routeId = route.id
    }
  }

  return {
    zones: z,
    packages: [],
    sectors,
    routes,
    routeBundles: [],
    config: cfg,
    tick: 0,
    elapsedSeconds: 0,
    metrics: computeMetrics([], z, routes, [], 0),
    logEntries: [],
  }
}

// ---- Compute Metrics ----
export function computeMetrics(
  packages: Package[],
  zones: Zone[],
  routes: Route[],
  routeBundles: RouteBundle[],
  elapsedSeconds: number,
): Metrics {
  const packagesPerStage: Record<string, number> = {
    inbound: 0, pick: 0, slam: 0, conveyor: 0, induct: 0,
    route_cart: 0, bundled: 0, delivered: 0,
  }
  const packagesBySize: Record<PackageSize, number> = {
    small: 0, medium: 0, large: 0, xlarge: 0,
  }

  let totalCycleTime = 0
  let deliveredCount = 0

  for (const pkg of packages) {
    packagesPerStage[pkg.state] = (packagesPerStage[pkg.state] || 0) + 1
    packagesBySize[pkg.size]++
    if (pkg.state === "delivered" && pkg.completedAt !== null) {
      totalCycleTime += pkg.completedAt - pkg.createdAt
      deliveredCount++
    }
  }

  const zoneUtilization: Record<string, number> = {}
  const zoneCapacity: Record<string, { totalUsed: number; totalCapacity: number; pct: number }> = {}
  let totalCap = 0
  let totalUsed = 0
  for (const zone of zones) {
    let used = 0
    if (zone.type === "staging" || zone.type === "loading") {
      used = zone.routeBundles?.length || 0
    } else if (zone.type === "route_cart") {
      // Use weighted count for route carts
      const route = routes.find(r => r.id === zone.routeId)
      used = route ? route.weightedCount : zone.packages.length
    } else {
      used = zone.packages.length
    }
    zoneUtilization[zone.id] = zone.capacity > 0 ? (used / zone.capacity) * 100 : 0
    totalCap += zone.capacity
    totalUsed += used

    // Aggregate by zone type
    if (!zoneCapacity[zone.type]) {
      zoneCapacity[zone.type] = { totalUsed: 0, totalCapacity: 0, pct: 0 }
    }
    zoneCapacity[zone.type].totalUsed += used
    zoneCapacity[zone.type].totalCapacity += zone.capacity
  }
  // Compute pct per type
  for (const key of Object.keys(zoneCapacity)) {
    const entry = zoneCapacity[key]
    entry.pct = entry.totalCapacity > 0 ? Math.round((entry.totalUsed / entry.totalCapacity) * 100) : 0
  }

  const activeRoutes = routes.filter((r) => r.status === "open").length
  const throughputPerMinute = elapsedSeconds > 0 ? (deliveredCount / elapsedSeconds) * 60 : 0
  const trucksWaiting = zones.filter(z => z.type === "loading" && (z.routeBundles?.length || 0) > 0).length

  const routeBundlesInStaging = routeBundles.filter(b => b.state === "staging").length
  const routeBundlesInLoading = routeBundles.filter(b => b.state === "loading").length

  return {
    totalPackages: packages.filter(p => p.state !== "delivered" && p.state !== "bundled").length,
    deliveredPackages: deliveredCount,
    throughputPerMinute,
    averageCycleTime: deliveredCount > 0 ? totalCycleTime / deliveredCount : 0,
    activeRoutes,
    zoneUtilization,
    packagesPerStage,
    packagesBySize,
    stationCapacityPct: totalCap > 0 ? Math.round((totalUsed / totalCap) * 100) : 0,
    trucksWaiting,
    routeBundlesInStaging,
    routeBundlesInLoading,
    zoneCapacity,
  }
}

// ---- Helpers ----
function findZonesOfType(zones: Zone[], type: ZoneType): Zone[] {
  return zones.filter((z) => z.type === type)
}

function findLeastFullZone(zones: Zone[]): Zone | null {
  let best: Zone | null = null
  let bestRatio = Infinity
  for (const z of zones) {
    const ratio = z.packages.length / (z.capacity || 1)
    if (ratio < bestRatio && z.packages.length < z.capacity) {
      best = z
      bestRatio = ratio
    }
  }
  return best
}

function findStagingWithRoom(zones: Zone[]): Zone | null {
  const stagingZones = findZonesOfType(zones, "staging")
  let best: Zone | null = null
  let bestCount = Infinity
  for (const z of stagingZones) {
    const bundleCount = z.routeBundles?.length || 0
    if (bundleCount < z.capacity && bundleCount < bestCount) {
      best = z
      bestCount = bundleCount
    }
  }
  return best
}

function findLoadingWithRoom(zones: Zone[]): Zone | null {
  const loadingZones = findZonesOfType(zones, "loading")
  for (const z of loadingZones) {
    const bundleCount = z.routeBundles?.length || 0
    if (bundleCount < z.capacity) return z
  }
  return null
}

function randomInZone(zone: Zone): { x: number; y: number } {
  return {
    x: zone.x + 8 + Math.random() * Math.max(1, zone.w - 16),
    y: zone.y + 8 + Math.random() * Math.max(1, zone.h - 16),
  }
}

// Global counters that never reset — ensure package and route IDs are never repeated
let pkgGlobalCounter = 0
let routeGlobalCounter = 0

const SIZE_PREFIX: Record<PackageSize, string> = {
  small: "S",
  medium: "M",
  large: "L",
  xlarge: "X",
}

function nextPackageId(size: PackageSize): string {
  pkgGlobalCounter++
  return `${SIZE_PREFIX[size]}${String(pkgGlobalCounter).padStart(6, "0")}`
}

function nextRouteId(sectorId: string): string {
  routeGlobalCounter++
  return `R${String(routeGlobalCounter).padStart(6, "0")}`
}

export function resetPackageCounter() {
  // pkgGlobalCounter and routeGlobalCounter are intentionally NOT reset — IDs must never repeat
}

// ---- Simulation Tick ----
export function simulateTick(world: WorldState): WorldState {
  const { zones, packages, sectors, routes, routeBundles, config, tick, logEntries } = world
  const flowSequence = config.workflow?.flowSequence ?? ["inbound", "pick", "slam", "conveyor", "induct"]

  const logBuffer: string[] = []

  // Deep clone
  const newZones = zones.map((z) => ({
    ...z,
    packages: [...z.packages],
    routeBundles: z.routeBundles ? z.routeBundles.map(b => ({ ...b })) : undefined,
  }))
  const newPackages = packages.map((p) => ({ ...p }))
  const newRoutes = routes.map((r) => ({ ...r }))
  const newSectors = sectors.map((s) => ({ ...s }))
  let newBundles = routeBundles.map((b) => ({ ...b }))

  const newTick = tick + 1
  const newElapsed = world.elapsedSeconds + 1

  // ============================================================
  // 1. SPAWN NEW PACKAGES (at first zone in flow)
  // ============================================================
  const packagesPerTick = config.packageRatePerMinute / 60
  const numToSpawn = Math.random() < (packagesPerTick % 1)
    ? Math.ceil(packagesPerTick)
    : Math.floor(packagesPerTick)

  const entryZoneType = flowSequence[0] ?? "inbound"
  const entryZones = findZonesOfType(newZones, entryZoneType)
  for (let i = 0; i < numToSpawn; i++) {
    const entry = findLeastFullZone(entryZones)
    if (entry) {
      const pos = randomInZone(entry)
      const size = randomPackageSize()
      // Promise time: randomly T+2hrs to T+5hrs from now
      const promiseMinutes = 120 + Math.random() * config.promiseWindowMinutes
      const promiseTime = newTick + promiseMinutes * 60

      const pkg: Package = {
        id: nextPackageId(size),
        state: entryZoneType,
        size,
        sectorId: null,
        routeId: null,
        zoneId: entry.id,
        createdAt: newTick,
        promiseTime,
        stateEnteredAt: newTick,
        completedAt: null,
        visualX: pos.x,
        visualY: pos.y,
        targetX: pos.x,
        targetY: pos.y,
      }
      newPackages.push(pkg)
      entry.packages.push(pkg.id)
      logEvent(config, newTick, `Package ${pkg.id} created at ${entry.label}`)
    }
  }

  // ============================================================
  // 2. PROCESS PACKAGES through flow sequence -> route_cart
  // ============================================================
  for (const pkg of newPackages) {
    if (pkg.state === "delivered" || pkg.state === "bundled") continue

    const ticksInState = newTick - pkg.stateEnteredAt

    // --- Linear flow: flowSequence[i] -> flowSequence[i+1] ---
    const flowIdx = flowSequence.indexOf(pkg.state as ZoneType)
    if (flowIdx >= 0 && flowIdx < flowSequence.length - 1) {
      const stageMin = getStageTimeMinutes(config, pkg.state as ZoneType)
      const nextType = flowSequence[flowIdx + 1]
      if (ticksInState >= minToTicks(stageMin)) {
        const nextZones = findZonesOfType(newZones, nextType)
        const target = findLeastFullZone(nextZones)
        if (target) {
          movePackage(pkg, target, newZones, newTick)
          pkg.state = nextType
          logEvent(config, newTick, `Package ${pkg.id}: ${flowSequence[flowIdx]} → ${nextType} (${target.label})`, logBuffer)
        }
      }
      continue
    }

    // --- Last flow stage -> ROUTE CART (random assignment) ---
    const lastFlowType = flowSequence[flowSequence.length - 1]
    if (pkg.state === lastFlowType && ticksInState >= minToTicks(getStageTimeMinutes(config, lastFlowType))) {
      const cartZones = findZonesOfType(newZones, "route_cart")
        .filter(z => {
          // Check weighted capacity
          const route = newRoutes.find(r => r.id === z.routeId)
          return route ? route.weightedCount < config.cartWeightedCapacity : z.packages.length < z.capacity
        })

      if (cartZones.length > 0) {
        const randomCart = cartZones[Math.floor(Math.random() * cartZones.length)]

        pkg.sectorId = randomCart.sectorId || null
        pkg.routeId = randomCart.routeId || null

        movePackage(pkg, randomCart, newZones, newTick)
        pkg.state = "route_cart"

        // Update route's weighted count and earliest promise time
        if (pkg.routeId) {
          const route = newRoutes.find(r => r.id === pkg.routeId)
          if (route) {
            route.packageCount++
            route.weightedCount += PACKAGE_SIZE_WEIGHT[pkg.size]
            if (route.earliestPromiseTime === null || pkg.promiseTime < route.earliestPromiseTime) {
              route.earliestPromiseTime = pkg.promiseTime
            }
            logEvent(config, newTick, `Package ${pkg.id} assigned to route cart ${randomCart.label} (RouteID ${route.id}) — weighted ${route.weightedCount}/${config.cartWeightedCapacity}`, logBuffer)
          }
        }
      }
    }
  }

  // ============================================================
  // 3. FLUSH ROUTE CARTS -> create ROUTE BUNDLE -> move to STAGING
  //    Flush when: (capacity met AND enableCapacityFlush) OR (route closure approaching AND enableRouteClosurePressure)
  // ============================================================
  const cartZones = findZonesOfType(newZones, "route_cart")
  for (const cart of cartZones) {
    if (cart.packages.length === 0) continue

    const route = newRoutes.find(r => r.id === cart.routeId)
    if (!route) continue

    // Check capacity flush
    const hitCapacity = config.enableCapacityFlush && route.weightedCount >= config.cartFlushThreshold

    // Check route closure pressure: flush when current time approaches
    // effective promise time - routeClosureBufferMinutes
    // Effective promise = (N+1)th earliest promise time (ignoring first N)
    let closurePressure = false
    if (config.enableRouteClosurePressure && cart.packages.length > 0) {
      // Gather promise times of packages in this cart, sorted ascending
      const promiseTimes = cart.packages
        .map(pkgId => newPackages.find(p => p.id === pkgId))
        .filter((p): p is Package => p !== undefined)
        .map(p => p.promiseTime)
        .sort((a, b) => a - b)

      // Pick the (N+1)th earliest (0-indexed: index = promiseIgnoreCount)
      const idx = Math.min(config.promiseIgnoreCount, promiseTimes.length - 1)
      const effectivePromiseTime = promiseTimes[idx]

      if (effectivePromiseTime !== undefined) {
        const closureDeadlineTick = effectivePromiseTime - minToTicks(config.routeClosureBufferMinutes)
        if (newTick >= closureDeadlineTick) {
          closurePressure = true
        }
        // Also update route's earliestPromiseTime for display purposes
        route.earliestPromiseTime = effectivePromiseTime
      }
    }

    if (hitCapacity || closurePressure) {
      // Find staging with room
      const staging = findStagingWithRoom(newZones)
      if (staging) {
        // Create route bundle (closed route moving through staging/loading — identified by routeId)
        const bundlePos = randomInZone(staging)
        const bundle: RouteBundle = {
          id: route.id,
          routeId: route.id,
          sectorId: cart.sectorId || "",
          packageCount: route.packageCount,
          weightedCount: route.weightedCount,
          enteredStagingAt: newTick,
          enteredLoadingAt: null,
          state: "staging",
          visualX: cart.x + cart.w / 2,
          visualY: cart.y + cart.h / 2,
          targetX: bundlePos.x,
          targetY: bundlePos.y,
        }
        newBundles.push(bundle)

        logEvent(config, newTick, `Route cart ${cart.label} flushed to staging: ${bundle.packageCount} packages, ${bundle.weightedCount} wt (${bundle.id})`, logBuffer)

        // Add bundle to staging zone
        if (!staging.routeBundles) staging.routeBundles = []
        staging.routeBundles.push(bundle)

        // Mark all packages in this cart as "bundled" (consumed)
        const pkgIds = [...cart.packages]
        for (const pkgId of pkgIds) {
          const p = newPackages.find(pp => pp.id === pkgId)
          if (p) {
            p.state = "bundled"
            p.zoneId = null
            p.completedAt = null // not delivered yet
          }
        }
        cart.packages = []

        // Close route and open new one for this sector
        route.status = "closed"
        if (cart.sectorId) {
          const sector = newSectors.find(s => s.id === cart.sectorId)
          if (sector) {
            const newRouteId = nextRouteId(sector.id)
            newRoutes.push({
              id: newRouteId, sectorId: sector.id, status: "open",
              packageCount: 0, weightedCount: 0, earliestPromiseTime: null,
            })
            sector.activeRouteId = newRouteId
            cart.routeId = newRouteId
          }
        }
      }
    }
  }

  // ============================================================
  // 4. STAGING -> LOADING (route bundles move after staging dwell time)
  // ============================================================
  const stagingZones = findZonesOfType(newZones, "staging")
  for (const stg of stagingZones) {
    if (!stg.routeBundles || stg.routeBundles.length === 0) continue

    const toRemove: string[] = []
    for (const bundle of stg.routeBundles) {
      if (bundle.state !== "staging") continue
      const dwellTicks = minToTicks(config.stageTimes.stagingMin)
      const ticksInStaging = newTick - bundle.enteredStagingAt
      if (ticksInStaging >= dwellTicks) {
        // Move to loading dock
        const dock = findLoadingWithRoom(newZones)
        if (dock) {
          bundle.state = "loading"
          bundle.enteredLoadingAt = newTick
          const dockPos = randomInZone(dock)
          bundle.targetX = dockPos.x
          bundle.targetY = dockPos.y
          if (!dock.routeBundles) dock.routeBundles = []
          dock.routeBundles.push(bundle)
          toRemove.push(bundle.id)
          logEvent(config, newTick, `Route ${bundle.routeId} moved to loading (${dock.label})`, logBuffer)

          // Update the global bundles array too
          const globalBundle = newBundles.find(b => b.id === bundle.id)
          if (globalBundle) {
            globalBundle.state = "loading"
            globalBundle.enteredLoadingAt = newTick
            globalBundle.targetX = dockPos.x
            globalBundle.targetY = dockPos.y
          }
        }
      }
    }
    stg.routeBundles = stg.routeBundles.filter(b => !toRemove.includes(b.id))
  }

  // ============================================================
  // 5. LOADING -> DISPATCHED (driver picks up after loading dwell)
  // ============================================================
  const loadingZones = findZonesOfType(newZones, "loading")
  for (const dock of loadingZones) {
    if (!dock.routeBundles || dock.routeBundles.length === 0) continue

    const toDispatch: string[] = []
    for (const bundle of dock.routeBundles) {
      if (bundle.state !== "loading" || bundle.enteredLoadingAt === null) continue
      const dwellTicks = minToTicks(config.stageTimes.loadingMin)
      const ticksInLoading = newTick - bundle.enteredLoadingAt
      if (ticksInLoading >= dwellTicks) {
        bundle.state = "dispatched"
        toDispatch.push(bundle.id)

        // Mark all bundled packages from this route as delivered
        for (const pkg of newPackages) {
          if (pkg.routeId === bundle.routeId && pkg.state === "bundled") {
            pkg.state = "delivered"
            pkg.completedAt = newTick
          }
        }

        logEvent(config, newTick, `Route ${bundle.routeId} dispatched (${bundle.packageCount} packages)`, logBuffer)

        // Update global bundle
        const globalBundle = newBundles.find(b => b.id === bundle.id)
        if (globalBundle) globalBundle.state = "dispatched"
      }
    }
    dock.routeBundles = dock.routeBundles.filter(b => !toDispatch.includes(b.id))
  }

  // Remove dispatched bundles from global list
  newBundles = newBundles.filter(b => b.state !== "dispatched")

  // ============================================================
  // 6. ANIMATE visual positions (lerp toward target)
  // ============================================================
  for (const pkg of newPackages) {
    if (pkg.state !== "delivered" && pkg.state !== "bundled") {
      pkg.visualX += (pkg.targetX - pkg.visualX) * 0.12
      pkg.visualY += (pkg.targetY - pkg.visualY) * 0.12
    }
  }
  for (const bundle of newBundles) {
    bundle.visualX += (bundle.targetX - bundle.visualX) * 0.10
    bundle.visualY += (bundle.targetY - bundle.visualY) * 0.10
  }

  // ============================================================
  // 7. COMPUTE METRICS
  // ============================================================
  const newMetrics = computeMetrics(newPackages, newZones, newRoutes, newBundles, newElapsed)

  const newLogEntries = [...(logEntries || []), ...logBuffer]

  return {
    zones: newZones,
    packages: newPackages,
    sectors: newSectors,
    routes: newRoutes,
    routeBundles: newBundles,
    config,
    tick: newTick,
    elapsedSeconds: newElapsed,
    metrics: newMetrics,
    logEntries: newLogEntries,
  }
}

// ---- Move package between zones ----
function movePackage(
  pkg: Package,
  target: Zone,
  allZones: Zone[],
  tick: number,
) {
  if (pkg.zoneId) {
    const old = allZones.find(z => z.id === pkg.zoneId)
    if (old) {
      old.packages = old.packages.filter(id => id !== pkg.id)
    }
  }
  target.packages.push(pkg.id)
  pkg.zoneId = target.id
  pkg.stateEnteredAt = tick

  const pos = randomInZone(target)
  pkg.targetX = pos.x
  pkg.targetY = pos.y
}
