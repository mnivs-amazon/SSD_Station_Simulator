"use client"

import { useState } from "react"
import type { WorkflowConfig, ZoneType } from "@/lib/simulation/types"
import { ZONE_COLORS } from "@/lib/simulation/engine"
import { ChevronUp, ChevronDown, GripVertical, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const ZONE_LABELS: Record<ZoneType, string> = {
  inbound: "Inbound",
  pick: "Pick",
  slam: "Slam",
  conveyor: "Conveyor",
  induct: "Induct",
  route_cart: "Route Cart",
  staging: "Staging",
  loading: "Loading",
  chilled: "Chilled",
  frozen: "Frozen",
  ambient: "Ambient",
  produce: "Produce",
  chilled_staging: "Chilled Staging",
  frozen_staging: "Frozen Staging",
  ambient_staging: "Ambient Staging",
  cart_storage: "Cart Storage",
  route_closure: "Route Closure",
  cart_staging: "Cart Staging",
  van_loading: "Van Loading",
  problem_solve: "Problem Solve",
  cage_pick: "Cage Pick",
  hazmat: "Hazmat",
  office: "Office",
}

// Zone types that participate in linear flow (before route_cart)
const FLOW_ELIGIBLE: ZoneType[] = [
  "inbound", "pick", "slam", "conveyor", "induct",
  "chilled", "frozen", "ambient", "produce", "cage_pick", "problem_solve", "hazmat",
]

// Zone types that are layout-only or special (route_cart, staging, loading)
const SPECIAL_ZONES: ZoneType[] = ["route_cart", "staging", "loading"]

interface WorkflowPanelProps {
  workflow: WorkflowConfig
  onUpdateWorkflow: (updates: Partial<WorkflowConfig>) => void
}

export function WorkflowPanel({ workflow, onUpdateWorkflow }: WorkflowPanelProps) {
  const [editingStageTime, setEditingStageTime] = useState<string | null>(null)

  const moveInFlow = (index: number, direction: 1 | -1) => {
    const seq = [...workflow.flowSequence]
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= seq.length) return
    ;[seq[index], seq[newIndex]] = [seq[newIndex], seq[index]]
    onUpdateWorkflow({ flowSequence: seq })
  }

  const addToFlow = (zoneType: ZoneType) => {
    if (workflow.flowSequence.includes(zoneType)) return
    onUpdateWorkflow({ flowSequence: [...workflow.flowSequence, zoneType] })
  }

  const removeFromFlow = (zoneType: ZoneType) => {
    onUpdateWorkflow({
      flowSequence: workflow.flowSequence.filter((z) => z !== zoneType),
    })
  }

  const toggleZoneEnabled = (zoneType: ZoneType) => {
    const enabled = workflow.enabledZoneTypes.includes(zoneType)
    if (enabled) {
      onUpdateWorkflow({
        enabledZoneTypes: workflow.enabledZoneTypes.filter((z) => z !== zoneType),
        flowSequence: workflow.flowSequence.filter((z) => z !== zoneType),
      })
    } else {
      onUpdateWorkflow({
        enabledZoneTypes: [...workflow.enabledZoneTypes, zoneType].sort(),
      })
    }
  }

  const setStageTime = (zoneType: string, value: number) => {
    const next = { ...workflow.stageTimeByZone }
    if (value <= 0 || Number.isNaN(value)) {
      delete next[zoneType]
    } else {
      next[zoneType] = value
    }
    onUpdateWorkflow({ stageTimeByZone: next })
    setEditingStageTime(null)
  }

  return (
    <div className="flex h-full flex-col overflow-auto bg-background p-6">
      <h2 className="mb-4 text-lg font-semibold text-foreground">Workflow Configuration</h2>

      {/* Flow Sequence */}
      <section className="mb-6">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <ArrowRight className="h-4 w-4" />
          Package Flow Sequence
        </h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Define the order packages move through zones. Flow ends at Route Cart (assignment), then Staging → Loading.
        </p>
        <div className="space-y-1 rounded-lg border border-border bg-card p-2">
          {workflow.flowSequence.map((zoneType, i) => {
            const colors = ZONE_COLORS[zoneType]
            return (
              <div
                key={`${zoneType}-${i}`}
                className="flex items-center gap-2 rounded-md border border-border/60 bg-background px-3 py-2"
              >
                <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span
                  className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: colors.bg,
                    color: colors.text,
                    borderColor: colors.border,
                    borderWidth: 1,
                  }}
                >
                  {ZONE_LABELS[zoneType]}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveInFlow(i, -1)}
                    disabled={i === 0}
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveInFlow(i, 1)}
                    disabled={i === workflow.flowSequence.length - 1}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>
                {editingStageTime === zoneType ? (
                  <input
                    type="number"
                    step={0.1}
                    min={0.1}
                    defaultValue={workflow.stageTimeByZone[zoneType] ?? ""}
                    placeholder="min"
                    className="ml-auto w-16 rounded border border-border bg-background px-2 py-1 text-xs"
                    onBlur={(e) => {
                      const v = parseFloat(e.target.value)
                      setStageTime(zoneType, v)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const v = parseFloat((e.target as HTMLInputElement).value)
                        setStageTime(zoneType, v)
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingStageTime(zoneType)}
                    className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                  >
                    {workflow.stageTimeByZone[zoneType] != null
                      ? `${workflow.stageTimeByZone[zoneType]} min`
                      : "Set time"}
                  </button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-destructive hover:text-destructive"
                  onClick={() => removeFromFlow(zoneType)}
                >
                  Remove
                </Button>
              </div>
            )
          })}
        </div>
        <div className="mt-2">
          <span className="text-xs text-muted-foreground">Add to flow: </span>
          {FLOW_ELIGIBLE.filter((z) => !workflow.flowSequence.includes(z)).map((zoneType) => (
            <Button
              key={zoneType}
              variant="outline"
              size="sm"
              className="mr-1 mt-1 h-6 px-2 text-[11px]"
              onClick={() => addToFlow(zoneType)}
            >
              + {ZONE_LABELS[zoneType]}
            </Button>
          ))}
        </div>
      </section>

      {/* Zone Types (Editor) */}
      <section>
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">Zone Types in Editor</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Enable zone types to make them available when adding zones in Edit mode.
        </p>
        <div className="flex flex-wrap gap-2">
          {([...FLOW_ELIGIBLE, ...SPECIAL_ZONES, "chilled_staging", "frozen_staging", "ambient_staging", "cart_storage", "route_closure", "cart_staging", "van_loading", "office"] as ZoneType[]).map((zoneType) => {
            const enabled = workflow.enabledZoneTypes.includes(zoneType)
            const colors = ZONE_COLORS[zoneType]
            return (
              <label
                key={zoneType}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${
                  enabled ? "border-border bg-card" : "border-border/50 bg-muted/30 opacity-60"
                }`}
              >
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={() => toggleZoneEnabled(zoneType)}
                  className="h-4 w-4 rounded"
                />
                <span
                  className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: colors.bg,
                    color: colors.text,
                    borderColor: colors.border,
                    borderWidth: 1,
                  }}
                >
                  {ZONE_LABELS[zoneType]}
                </span>
              </label>
            )
          })}
        </div>
      </section>
    </div>
  )
}
