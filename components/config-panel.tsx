"use client"

import type { SimConfig, StageTimes } from "@/lib/simulation/types"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Download, Upload, Settings, Check } from "lucide-react"
import { ZONE_COLORS } from "@/lib/simulation/engine"
import { Button } from "@/components/ui/button"
import { useRef } from "react"

const LEGEND_ITEMS = [
  { label: "Inbound", color: ZONE_COLORS.inbound.border },
  { label: "Pick", color: ZONE_COLORS.pick.border },
  { label: "Slam", color: ZONE_COLORS.slam.border },
  { label: "Conveyor", color: ZONE_COLORS.conveyor.border },
  { label: "Induct", color: ZONE_COLORS.induct.border },
  { label: "Route Carts", color: ZONE_COLORS.route_cart.border },
  { label: "Staging", color: ZONE_COLORS.staging.border },
  { label: "Loading", color: ZONE_COLORS.loading.border },
]

interface ConfigPanelProps {
  config: SimConfig
  onUpdateConfig: (updates: Partial<SimConfig>) => void
  onUpdateStageTimes: (updates: Partial<StageTimes>) => void
  onExport: () => void
  onImport: (json: string) => void
}

export function ConfigPanel({
  config,
  onUpdateConfig,
  onUpdateStageTimes,
  onExport,
  onImport,
}: ConfigPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImport = () => fileInputRef.current?.click()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      if (text) onImport(text)
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  return (
    <div className="flex h-full w-64 flex-col border-l border-border bg-card overflow-y-auto">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Settings className="h-3.5 w-3.5 text-muted-foreground" />
          <h2 className="text-sm font-bold text-foreground">Configuration</h2>
        </div>
      </div>

      {/* Compact Legend */}
      <div className="border-b border-border px-4 py-2.5">
        <span className="mb-1.5 block text-[10px] font-bold uppercase text-muted-foreground">Legend</span>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {LEGEND_ITEMS.map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-foreground leading-none">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Station Settings */}
      <div className="flex flex-col gap-3.5 border-b border-border p-4">
        <span className="text-[10px] font-bold uppercase text-muted-foreground">Station</span>
        <ConfigSlider
          label="Pkg Rate" suffix="/min" value={config.packageRatePerMinute}
          min={1} max={60} step={1}
          onChange={(v) => onUpdateConfig({ packageRatePerMinute: v })}
        />
        <ConfigSlider
          label="Route Carts" suffix="" value={config.numSectors}
          min={10} max={60} step={1}
          onChange={(v) => onUpdateConfig({ numSectors: v })}
        />
        <ConfigSlider
          label="Staging Zones" suffix="" value={config.numStagingZones}
          min={5} max={30} step={1}
          onChange={(v) => onUpdateConfig({ numStagingZones: v })}
        />
        <ConfigSlider
          label="Route Cart Capacity" suffix=" wt" value={config.cartWeightedCapacity}
          min={20} max={100} step={5}
          onChange={(v) => onUpdateConfig({ cartWeightedCapacity: v })}
        />
        <ConfigSlider
          label="Route Cart Flush At" suffix=" wt" value={config.cartFlushThreshold}
          min={10} max={100} step={5}
          onChange={(v) => onUpdateConfig({ cartFlushThreshold: v })}
        />
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Capacity Flush</Label>
          <button
            type="button"
            onClick={() => onUpdateConfig({ enableCapacityFlush: !config.enableCapacityFlush })}
            className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
              config.enableCapacityFlush
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-transparent"
            }`}
          >
            <Check className="h-3 w-3" />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Route Closure Pressure</Label>
          <button
            type="button"
            onClick={() => onUpdateConfig({ enableRouteClosurePressure: !config.enableRouteClosurePressure })}
            className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
              config.enableRouteClosurePressure
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-transparent"
            }`}
          >
            <Check className="h-3 w-3" />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground" title="Log package flow events to browser console">Debug Logging</Label>
          <button
            type="button"
            onClick={() => onUpdateConfig({ enableConsoleLogging: !config.enableConsoleLogging })}
            className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
              config.enableConsoleLogging
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-transparent"
            }`}
          >
            <Check className="h-3 w-3" />
          </button>
        </div>
        {config.enableRouteClosurePressure && (
          <>
            <ConfigSlider
              label="Promise Window" suffix=" min" value={config.promiseWindowMinutes}
              min={60} max={600} step={30}
              onChange={(v) => onUpdateConfig({ promiseWindowMinutes: v })}
            />
            <ConfigSlider
              label="Closure Buffer" suffix=" min" value={config.routeClosureBufferMinutes}
              min={5} max={60} step={5}
              onChange={(v) => onUpdateConfig({ routeClosureBufferMinutes: v })}
            />
            <ConfigSlider
              label="Ignore First N Pkgs" suffix="" value={config.promiseIgnoreCount}
              min={0} max={20} step={1}
              onChange={(v) => onUpdateConfig({ promiseIgnoreCount: v })}
            />
          </>
        )}
        <ConfigSlider
          label="Max Routes/Stg" suffix="" value={config.stagingMaxRoutes}
          min={1} max={10} step={1}
          onChange={(v) => onUpdateConfig({ stagingMaxRoutes: v })}
        />
      </div>

      {/* Per-Stage Times */}
      <div className="flex flex-col gap-3.5 border-b border-border p-4">
        <span className="text-[10px] font-bold uppercase text-muted-foreground">Stage Times (min)</span>
        <ConfigSlider
          label="Inbound" suffix=" min" value={config.stageTimes.inboundMin}
          min={0.5} max={10} step={0.25}
          onChange={(v) => onUpdateStageTimes({ inboundMin: v })}
        />
        <ConfigSlider
          label="Pick" suffix=" min" value={config.stageTimes.pickMin}
          min={0.25} max={5} step={0.25}
          onChange={(v) => onUpdateStageTimes({ pickMin: v })}
        />
        <ConfigSlider
          label="Slam" suffix=" min" value={config.stageTimes.slamMin}
          min={0.25} max={8} step={0.25}
          onChange={(v) => onUpdateStageTimes({ slamMin: v })}
        />
        <ConfigSlider
          label="Conveyor" suffix=" min" value={config.stageTimes.conveyorMin}
          min={1} max={10} step={0.25}
          onChange={(v) => onUpdateStageTimes({ conveyorMin: v })}
        />
        <ConfigSlider
          label="Induct" suffix=" min" value={config.stageTimes.inductMin}
          min={0.25} max={5} step={0.25}
          onChange={(v) => onUpdateStageTimes({ inductMin: v })}
        />
        <ConfigSlider
          label="Route Closure" suffix=" min" value={config.stageTimes.routeClosureMin}
          min={0.5} max={5} step={0.25}
          onChange={(v) => onUpdateStageTimes({ routeClosureMin: v })}
        />
        <ConfigSlider
          label="Staging Dwell" suffix=" min" value={config.stageTimes.stagingMin}
          min={1} max={15} step={0.5}
          onChange={(v) => onUpdateStageTimes({ stagingMin: v })}
        />
        <ConfigSlider
          label="Loading" suffix=" min" value={config.stageTimes.loadingMin}
          min={0.5} max={5} step={0.25}
          onChange={(v) => onUpdateStageTimes({ loadingMin: v })}
        />
      </div>

      {/* Template I/O */}
      <div className="mt-auto border-t border-border p-4">
        <span className="mb-2 block text-[10px] font-bold uppercase text-muted-foreground">Templates</span>
        <div className="flex flex-col gap-2">
          <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={onExport}>
            <Download className="h-3.5 w-3.5" /> Export Layout
          </Button>
          <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={handleImport}>
            <Upload className="h-3.5 w-3.5" /> Import Layout
          </Button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />
        </div>
      </div>
    </div>
  )
}

function ConfigSlider({
  label, suffix, value, min, max, step, onChange,
}: {
  label: string; suffix: string; value: number
  min: number; max: number; step: number; onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className="font-mono text-xs font-semibold text-foreground">{value}{suffix}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} />
    </div>
  )
}
