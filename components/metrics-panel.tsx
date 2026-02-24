"use client"

import type { Metrics, PackageSize } from "@/lib/simulation/types"
import { ZONE_COLORS } from "@/lib/simulation/engine"
import { PACKAGE_SIZE_CONFIG } from "@/lib/simulation/types"
import {
  Package,
  TrendingUp,
  Clock,
  Truck,
  BarChart3,
  Activity,
  Boxes,
} from "lucide-react"

interface MetricsPanelProps {
  metrics: Metrics
}

const ZONE_STATUS_INFO: { key: string; label: string; zoneColor: string }[] = [
  { key: "inbound", label: "Inbound", zoneColor: ZONE_COLORS.inbound.border },
  { key: "pick", label: "Pick", zoneColor: ZONE_COLORS.pick.border },
  { key: "slam", label: "Slam", zoneColor: ZONE_COLORS.slam.border },
  { key: "conveyor", label: "Conveyor", zoneColor: ZONE_COLORS.conveyor.border },
  { key: "induct", label: "Induct", zoneColor: ZONE_COLORS.induct.border },
  { key: "route_cart", label: "Route Carts", zoneColor: ZONE_COLORS.route_cart.border },
  { key: "staging", label: "Staging", zoneColor: ZONE_COLORS.staging.border },
  { key: "loading", label: "Loading", zoneColor: ZONE_COLORS.loading.border },
]

function capacityColor(pct: number): string {
  if (pct >= 90) return "#ef4444"    // red
  if (pct >= 70) return "#f59e0b"    // orange/amber
  if (pct >= 50) return "#eab308"    // yellow
  return "#22c55e"                    // green
}

export function MetricsPanel({ metrics }: MetricsPanelProps) {
  return (
    <div className="flex h-full w-64 flex-col border-l border-border bg-card overflow-y-auto">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-bold text-foreground">Real-time Metrics</h2>
      </div>

      <div className="flex flex-col gap-3 p-4">
        <MetricRow
          icon={<TrendingUp className="h-3.5 w-3.5 text-blue-500" />}
          label="Packages/Hour"
          value={Math.round(metrics.throughputPerMinute * 60).toLocaleString()}
        />
        <MetricRow
          icon={<Package className="h-3.5 w-3.5 text-amber-500" />}
          label="Total Delivered"
          value={metrics.deliveredPackages.toLocaleString()}
        />
        <MetricRow
          icon={<Truck className="h-3.5 w-3.5 text-green-600" />}
          label="Active Routes"
          value={String(metrics.activeRoutes)}
        />
        <MetricRow
          icon={<Clock className="h-3.5 w-3.5 text-purple-500" />}
          label="Avg Cycle Time"
          value={`${metrics.averageCycleTime > 0 ? (metrics.averageCycleTime / 60).toFixed(1) : "0"}m`}
        />
        <MetricRow
          icon={<Activity className="h-3.5 w-3.5 text-rose-500" />}
          label="Station Capacity"
          value={`${metrics.stationCapacityPct}%`}
        />
        <MetricRow
          icon={<Boxes className="h-3.5 w-3.5 text-emerald-600" />}
          label="Bundles in Staging"
          value={String(metrics.routeBundlesInStaging)}
        />
        <MetricRow
          icon={<Truck className="h-3.5 w-3.5 text-indigo-500" />}
          label="Bundles Loading"
          value={String(metrics.routeBundlesInLoading)}
        />
        <MetricRow
          icon={<Truck className="h-3.5 w-3.5 text-slate-500" />}
          label="Docks Active"
          value={String(metrics.trucksWaiting)}
        />
      </div>

      {/* Zone Status -- capacity-based coloring */}
      <div className="border-t border-border p-4">
        <div className="mb-3 flex items-center gap-1.5">
          <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-bold text-foreground">Zone Status</span>
        </div>
        <div className="flex flex-col gap-2">
          {ZONE_STATUS_INFO.map(({ key, label, zoneColor }) => {
            const cap = metrics.zoneCapacity?.[key]
            const pct = cap?.pct ?? 0
            const used = cap?.totalUsed ?? 0
            const total = cap?.totalCapacity ?? 0
            const barColor = capacityColor(pct)

            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: zoneColor }} />
                    <span className="text-xs text-foreground">{label}</span>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {used}/{total} <span className="font-semibold" style={{ color: barColor }}>{pct}%</span>
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, pct)}%`, backgroundColor: barColor }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Package size distribution */}
      <div className="border-t border-border p-4">
        <span className="mb-2 block text-xs font-bold text-foreground">Package Sizes</span>
        <div className="grid grid-cols-4 gap-2">
          {(["small", "medium", "large", "xlarge"] as PackageSize[]).map((size) => {
            const count = metrics.packagesBySize[size] || 0
            const info = PACKAGE_SIZE_CONFIG[size]
            return (
              <div key={size} className="flex flex-col items-center rounded-md bg-muted px-2 py-1.5">
                <span className="text-xs font-bold text-foreground">{info.label}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{count}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function MetricRow({
  icon, label, value,
}: {
  icon: React.ReactNode; label: string; value: string
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className="font-mono text-sm font-bold text-foreground">{value}</span>
    </div>
  )
}
