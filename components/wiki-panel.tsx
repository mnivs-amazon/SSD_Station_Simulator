"use client"

import { useState } from "react"
import { BookOpen, ChevronDown, ChevronRight } from "lucide-react"

type WikiSection = {
  title: string
  items: { term: string; definition: string; formula?: string }[]
}

const WIKI_SECTIONS: WikiSection[] = [
  {
    title: "Zones",
    items: [
      {
        term: "Inbound",
        definition:
          "Entry zone where packages first arrive at the station. Packages wait here for the configured inbound dwell time before moving to Pick.",
        formula: "Dwell = inboundMin (default 4.5 min)",
      },
      {
        term: "Pick",
        definition:
          "Associates pick items from shelves for each package. Packages dwell for the pick cycle time before advancing to Slam.",
        formula: "Dwell = pickMin (default 1.75 min, range 0.5-3)",
      },
      {
        term: "Slam",
        definition:
          "Scan, Label, Apply, Manifest. Packages are scanned, labeled and sealed. After dwell they move to the conveyor.",
        formula: "Dwell = slamMin (default 3.0 min, includes 0.2 rebin)",
      },
      {
        term: "Conveyor",
        definition:
          "Physical conveyor belt transporting packages from Slam to the Induct area. Models the walk/transport time.",
        formula: "Dwell = conveyorMin (default 3.75 min, range 3-4.5)",
      },
      {
        term: "Induct",
        definition:
          "Packages are inducted (scanned and stowed) into the sort system. After dwell, they are randomly assigned to a Route Cart.",
        formula: "Dwell = inductMin (default 0.83 min)",
      },
      {
        term: "Route Cart",
        definition:
          "Physical cart assigned to a sector/route. Packages accumulate here by weighted capacity. When full, the Route is closed and moves to staging.",
        formula: "Capacity = cartWeightedCapacity (default 50 wt); Flush at = cartFlushThreshold (default 45 wt)",
      },
      {
        term: "Staging",
        definition:
          "Area where closed Routes wait before moving to a loading dock. Each staging zone holds a max number of routes.",
        formula: "Max routes = stagingMaxRoutes (default 3); Dwell = stagingMin (default 4 min)",
      },
      {
        term: "Loading (Dock)",
        definition:
          "Loading docks where Routes are loaded onto delivery vehicles. After loading dwell time, the route is dispatched and packages are marked as delivered.",
        formula: "Dwell = loadingMin (default 1 min)",
      },
    ],
  },
  {
    title: "Package Attributes",
    items: [
      {
        term: "Package ID",
        definition:
          "Globally unique identifier with size prefix: S (small), M (medium), L (large), X (xlarge) followed by a number (e.g. S000001, M000002). The number never repeats.",
      },
      {
        term: "Package Size",
        definition:
          "Randomly assigned on creation using weighted distribution. Determines the weighted unit count added to a route cart.",
        formula: "S=40% (wt 1), M=35% (wt 2), L=18% (wt 3), XL=7% (wt 4)",
      },
      {
        term: "Promise Time",
        definition:
          "The time by which a package is promised for delivery. Assigned randomly when a package is created, as a time offset from the current simulation time.",
        formula: "promiseTime = T + (120 + random * promiseWindowMinutes) minutes; Default window = 300 min, so T+2hrs to T+7hrs",
      },
      {
        term: "Package State",
        definition:
          "The current processing stage: inbound, pick, slam, conveyor, induct, route_cart, bundled (consumed into a route bundle), or delivered.",
      },
    ],
  },
  {
    title: "Route Attributes",
    items: [
      {
        term: "Sector",
        definition:
          "A logical grouping (e.g. S01, S02...S45). Each sector has one active route at a time. When a route flushes, a new route is opened for that sector.",
      },
      {
        term: "Route",
        definition:
          "An active collection of packages assigned to a sector. Tracks package count, weighted count, and the earliest promise time among its packages.",
        formula: "Route ID = R000001, R000002... (globally unique, never repeated). Each route is tied to a sector.",
      },
      {
        term: "Earliest Promise Time",
        definition:
          "The minimum promiseTime among all packages in a route. Used by route closure pressure to determine when a route should flush.",
      },
      {
        term: "Route (closed)",
        definition:
          "When a route cart flushes, the Route is closed and packages become bundled into it. The Route (identified by RouteID) then moves through Staging (dwell) → Loading dock (dwell) → dispatched (packages marked delivered). One RouteID throughout — no separate bundle ID.",
      },
    ],
  },
  {
    title: "Flush Triggers",
    items: [
      {
        term: "Capacity Flush",
        definition:
          "Route cart flushes when the weighted count of its packages meets or exceeds the flush threshold. Can be toggled on/off via the 'Capacity Flush' config toggle.",
        formula: "Triggers when: route.weightedCount >= cartFlushThreshold",
      },
      {
        term: "Route Closure Pressure",
        definition:
          "Route cart flushes when the current simulation time reaches or exceeds the route closure deadline. The deadline is the earliest promise time in the route minus a configurable buffer, ensuring the route leaves before the promise expires. Can be toggled on/off.",
        formula: "Deadline = earliestPromiseTime - (routeClosureBufferMinutes * 60 ticks); Triggers when: currentTick >= deadline",
      },
      {
        term: "Route Closure Buffer",
        definition:
          "Minutes subtracted from the earliest promise time to form the route closure deadline. Ensures the route departs with enough lead time to meet the delivery promise.",
        formula: "Default = 15 min",
      },
    ],
  },
  {
    title: "Configuration Parameters",
    items: [
      {
        term: "Pkg Rate (/min)",
        definition: "Number of new packages spawned per simulation minute. Each tick (1 sec) spawns rate/60 packages probabilistically.",
      },
      {
        term: "Route Carts (numSectors)",
        definition: "Total number of route carts / sectors in the station. Default 45. Each gets its own sector ID (S01-S45).",
      },
      {
        term: "Staging Zones",
        definition: "Number of staging zones. Default 15. Laid out in a grid below the route carts.",
      },
      {
        term: "Route Cart Capacity (wt)",
        definition: "Maximum weighted capacity per route cart. Default 50. Weight = S:1, M:2, L:3, XL:4.",
      },
      {
        term: "Route Cart Flush At (wt)",
        definition: "Weighted count threshold to trigger a capacity flush. Default 45. Must be <= Route Cart Capacity.",
      },
      {
        term: "Promise Window (min)",
        definition: "Maximum additional offset for random promise time assignment. Promise = T + 120min + random(0..promiseWindow). Default 300.",
      },
      {
        term: "Closure Buffer (min)",
        definition: "Minutes subtracted from the effective promise time to compute route closure deadline. The route must leave this many minutes before the effective promise. Default 15.",
      },
      {
        term: "Ignore First N Pkgs",
        definition: "Skips the N earliest promise times when calculating closure pressure. The engine sorts all promise times in the route cart ascending and uses the (N+1)th value as the effective promise time. Set to 0 to use the absolute earliest. Useful for ignoring outlier packages with unusually tight deadlines.",
        formula: "effectivePromise = sortedPromiseTimes[min(N, count-1)]; closureDeadline = effectivePromise - buffer",
      },
      {
        term: "Max Routes/Stg",
        definition: "Maximum number of route bundles a single staging zone can hold simultaneously. Default 3.",
      },
    ],
  },
  {
    title: "Stage Times",
    items: [
      { term: "Inbound", definition: "Order drop dwell time.", formula: "Default 4.5 min" },
      { term: "Pick", definition: "Pick cycle time.", formula: "Default 1.75 min (avg 0.5-3)" },
      { term: "Slam", definition: "Pack cycle time including rebin.", formula: "Default 3.0 min (avg 0.5-5.5 + 0.2)" },
      { term: "Conveyor", definition: "SLAM to Induct transport time.", formula: "Default 3.75 min (avg 3-4.5)" },
      { term: "Induct", definition: "Induct/stow cycle time.", formula: "Default 0.83 min" },
      { term: "Route Closure", definition: "Route closure assignment + rabbit refresh.", formula: "Default 1.5 min" },
      { term: "Staging Dwell", definition: "Driver cart pick up + walk to vehicle time.", formula: "Default 4.0 min" },
      { term: "Loading", definition: "Vehicle loading time before dispatch.", formula: "Default 1.0 min" },
    ],
  },
  {
    title: "Metrics Definitions",
    items: [
      {
        term: "Packages/Hour",
        definition: "Number of packages fully delivered per hour of simulation time.",
        formula: "= (deliveredCount / elapsedSeconds) * 3600",
      },
      {
        term: "Total Delivered",
        definition: "Cumulative count of packages that have reached the 'delivered' state.",
      },
      {
        term: "Active Routes",
        definition: "Number of routes currently in 'open' status, accepting new packages.",
      },
      {
        term: "Avg Cycle Time",
        definition: "Average time (in minutes) from package creation to delivery.",
        formula: "= sum(completedAt - createdAt) / deliveredCount / 60",
      },
      {
        term: "Station Capacity",
        definition: "Overall utilization percentage across all zones.",
        formula: "= (totalUsed / totalCapacity) * 100",
      },
      {
        term: "Zone Status Bars",
        definition:
          "Each zone type shows used/total capacity and a color-coded progress bar. Green (<50%), Yellow (50-69%), Orange (70-89%), Red (90%+).",
      },
      {
        term: "Bundles in Staging",
        definition: "Count of route bundles currently in staging zones awaiting dock assignment.",
      },
      {
        term: "Bundles Loading",
        definition: "Count of route bundles currently at loading docks being loaded onto vehicles.",
      },
      {
        term: "Docks Active",
        definition: "Number of loading dock zones that have at least one route bundle being loaded.",
      },
    ],
  },
  {
    title: "Simulation Speed",
    items: [
      {
        term: "Speed Multiplier",
        definition:
          "Controls how fast the simulation runs. At 1x, 1 tick = 1 real second. At higher speeds, multiple ticks are batched per animation frame.",
        formula: "Available: 0.5x, 1x, 2x, 4x, 8x, 12x, 16x, 20x",
      },
      {
        term: "Tick",
        definition: "The fundamental time unit of the simulation. 1 tick = 1 simulation second. All dwell times and promise times are measured in ticks.",
      },
    ],
  },
]

export function WikiPanel() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const toggle = (title: string) => {
    setExpanded((prev) => ({ ...prev, [title]: !prev[title] }))
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-card">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
          <h2 className="text-sm font-bold text-foreground">Wiki / Definitions</h2>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">
          Reference for all zones, metrics, configs, and calculations used in the simulation.
        </p>
      </div>

      <div className="flex flex-col">
        {WIKI_SECTIONS.map((section) => {
          const isOpen = expanded[section.title] ?? false
          return (
            <div key={section.title} className="border-b border-border">
              <button
                type="button"
                onClick={() => toggle(section.title)}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-muted/50 transition-colors"
              >
                {isOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span className="text-xs font-bold text-foreground">{section.title}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">{section.items.length}</span>
              </button>
              {isOpen && (
                <div className="flex flex-col gap-3 px-4 pb-3">
                  {section.items.map((item) => (
                    <div key={item.term} className="rounded-md border border-border bg-muted/30 p-3">
                      <div className="text-xs font-bold text-foreground">{item.term}</div>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                        {item.definition}
                      </p>
                      {item.formula && (
                        <div className="mt-1.5 rounded bg-muted px-2 py-1">
                          <code className="text-[10px] font-mono text-foreground">{item.formula}</code>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
