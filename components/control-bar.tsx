"use client"

import type { SimSpeed, AppMode } from "@/lib/simulation/types"
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Pencil,
  MonitorPlay,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

interface ControlBarProps {
  isRunning: boolean
  speed: SimSpeed
  mode: AppMode
  elapsedSeconds: number
  tick: number
  onPlay: () => void
  onPause: () => void
  onStep: () => void
  onReset: () => void
  onChangeSpeed: (speed: SimSpeed) => void
  onToggleMode: () => void
}

const SPEED_MIN = 4
const SPEED_MAX = 100

function formatTime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (d > 0) {
    return `${d}d ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export function ControlBar({
  isRunning,
  speed,
  mode,
  elapsedSeconds,
  tick,
  onPlay,
  onPause,
  onStep,
  onReset,
  onChangeSpeed,
  onToggleMode,
}: ControlBarProps) {
  return (
    <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-2">
      {/* Mode toggle */}
      <div className="flex items-center rounded-md border border-border overflow-hidden">
        <button
          onClick={mode === "edit" ? onToggleMode : undefined}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === "simulate"
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:bg-muted"
          }`}
        >
          <MonitorPlay className="h-3.5 w-3.5" />
          Simulation
        </button>
        <button
          onClick={mode === "simulate" ? onToggleMode : undefined}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === "edit"
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:bg-muted"
          }`}
        >
          <Pencil className="h-3.5 w-3.5" />
          Layout Editor
        </button>
      </div>

      <div className="h-5 w-px bg-border" />

      {/* Playback controls */}
      <div className="flex items-center gap-1">
        <Button
          variant={isRunning ? "default" : "outline"}
          size="sm"
          className="gap-1.5"
          onClick={isRunning ? onPause : onPlay}
          disabled={mode === "edit"}
        >
          {isRunning ? (
            <>
              <Pause className="h-3.5 w-3.5" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5" />
              Play
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={onReset}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={onStep}
          disabled={mode === "edit" || isRunning}
        >
          <SkipForward className="h-3.5 w-3.5" />
          Step
        </Button>
      </div>

      <div className="h-5 w-px bg-border" />

      {/* Speed slider */}
      <div className="flex items-center gap-3 min-w-[180px]">
        <span className="text-xs text-muted-foreground shrink-0">Speed:</span>
        <Slider
          value={[speed]}
          min={SPEED_MIN}
          max={SPEED_MAX}
          step={1}
          onValueChange={([v]) => onChangeSpeed(v)}
          className="flex-1"
        />
        <span className="font-mono text-xs font-semibold text-foreground w-10 shrink-0">{speed}x</span>
      </div>

      <div className="h-5 w-px bg-border" />

      {/* Time display */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase text-muted-foreground leading-none">Elapsed</span>
          <span className="font-mono text-sm font-semibold text-foreground">{formatTime(elapsedSeconds)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase text-muted-foreground leading-none">Tick</span>
          <span className="font-mono text-sm text-foreground">{tick.toLocaleString()}</span>
        </div>
      </div>

      {/* Status badge */}
      <div className="ml-auto flex items-center gap-2">
        {isRunning && (
          <span className="flex items-center gap-1.5 text-xs">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <span className="text-muted-foreground">Running</span>
          </span>
        )}
      </div>
    </div>
  )
}
