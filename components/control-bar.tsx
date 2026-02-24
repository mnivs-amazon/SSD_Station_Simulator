"use client"

import type { SimSpeed, AppMode } from "@/lib/simulation/types"
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Gauge,
  Pencil,
  MonitorPlay,
} from "lucide-react"
import { Button } from "@/components/ui/button"

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

const SPEEDS: SimSpeed[] = [0.5, 1, 2, 4, 8, 12, 16, 20]

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
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

      {/* Speed selector */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Speed:</span>
        <div className="flex items-center rounded-md border border-border overflow-hidden">
          {SPEEDS.map((s) => (
            <button
              key={s}
              className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                speed === s
                  ? "bg-foreground text-background"
                  : "bg-card text-muted-foreground hover:bg-muted"
              }`}
              onClick={() => onChangeSpeed(s)}
            >
              {s}x
            </button>
          ))}
        </div>
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
