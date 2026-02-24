"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import type { WorldState, SimSpeed, AppMode, EditorState, ZoneType, StageTimes } from "@/lib/simulation/types"
import {
  createInitialWorld,
  createDefaultLayout,
  simulateTick,
  resetPackageCounter,
} from "@/lib/simulation/engine"

export function useSimulation() {
  const [world, setWorld] = useState<WorldState>(() => createInitialWorld())
  const [isRunning, setIsRunning] = useState(false)
  const [speed, setSpeed] = useState<SimSpeed>(1)
  const [mode, setMode] = useState<AppMode>("simulate")
  const [editorState, setEditorState] = useState<EditorState>({
    tool: "select",
    selectedZoneId: null,
    addZoneType: "route_cart",
    gridSnap: true,
    gridSize: 20,
  })

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const worldRef = useRef(world)
  worldRef.current = world

  // Simulation loop - batch multiple ticks per frame at high speeds
  useEffect(() => {
    if (isRunning && mode === "simulate") {
      // At speeds > 4x, run multiple ticks per 60fps frame instead of
      // shrinking the interval below what the browser can reliably handle.
      const ticksPerFrame = Math.max(1, Math.round(speed))
      const frameMs = Math.max(50, Math.floor(1000 / Math.min(speed, 4)))
      intervalRef.current = setInterval(() => {
        setWorld((prev) => {
          let w = prev
          for (let i = 0; i < ticksPerFrame; i++) {
            w = simulateTick(w)
          }
          return w
        })
      }, frameMs)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, speed, mode])

  const play = useCallback(() => setIsRunning(true), [])
  const pause = useCallback(() => setIsRunning(false), [])

  const step = useCallback(() => {
    setIsRunning(false)
    setWorld((prev) => simulateTick(prev))
  }, [])

  const reset = useCallback(() => {
    setIsRunning(false)
    resetPackageCounter()
    const cfg = worldRef.current.config
    const newZones = createDefaultLayout(cfg)
    setWorld(createInitialWorld(newZones, cfg))
  }, [])

  const changeSpeed = useCallback((s: SimSpeed) => setSpeed(s), [])

  const toggleMode = useCallback(() => {
    setIsRunning(false)
    setMode((prev) => (prev === "simulate" ? "edit" : "simulate"))
  }, [])

  // Editor actions
  const selectZone = useCallback((zoneId: string | null) => {
    setEditorState((prev) => ({ ...prev, selectedZoneId: zoneId }))
  }, [])

  const setEditorTool = useCallback((tool: EditorState["tool"]) => {
    setEditorState((prev) => ({ ...prev, tool }))
  }, [])

  const setAddZoneType = useCallback((type: ZoneType) => {
    setEditorState((prev) => ({ ...prev, addZoneType: type, tool: "add" }))
  }, [])

  const toggleGridSnap = useCallback(() => {
    setEditorState((prev) => ({ ...prev, gridSnap: !prev.gridSnap }))
  }, [])

  const addZone = useCallback((type: ZoneType, x: number, y: number) => {
    setWorld((prev) => {
      const id = `zone_${Date.now()}`
      const newZone = {
        id,
        type,
        label: type.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()).toUpperCase(),
        x: Math.round(x / 20) * 20,
        y: Math.round(y / 20) * 20,
        w: 140,
        h: 80,
        capacity: type === "route_cart" ? prev.config.cartWeightedCapacity : type === "staging" ? prev.config.stagingMaxRoutes : 50,
        packages: [] as string[],
        routeBundles: (type === "staging" || type === "loading") ? [] : undefined,
      }
      return { ...prev, zones: [...prev.zones, newZone] }
    })
  }, [])

  const deleteZone = useCallback((zoneId: string) => {
    setWorld((prev) => ({
      ...prev,
      zones: prev.zones.filter((z) => z.id !== zoneId),
    }))
    setEditorState((prev) => ({
      ...prev,
      selectedZoneId: prev.selectedZoneId === zoneId ? null : prev.selectedZoneId,
    }))
  }, [])

  const moveZone = useCallback((zoneId: string, x: number, y: number) => {
    setWorld((prev) => ({
      ...prev,
      zones: prev.zones.map((z) => z.id === zoneId ? { ...z, x, y } : z),
    }))
  }, [])

  const resizeZone = useCallback((zoneId: string, w: number, h: number) => {
    setWorld((prev) => ({
      ...prev,
      zones: prev.zones.map((z) =>
        z.id === zoneId ? { ...z, w: Math.max(60, w), h: Math.max(40, h) } : z
      ),
    }))
  }, [])

  const updateConfig = useCallback((updates: Partial<WorldState["config"]>) => {
    setWorld((prev) => ({
      ...prev,
      config: { ...prev.config, ...updates },
    }))
  }, [])

  const updateStageTimes = useCallback((updates: Partial<StageTimes>) => {
    setWorld((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        stageTimes: { ...prev.config.stageTimes, ...updates },
      },
    }))
  }, [])

  // Template I/O
  const exportTemplate = useCallback(() => {
    const template = {
      name: "SSD Station Layout",
      zones: worldRef.current.zones.map((z) => ({ ...z, packages: [], routeBundles: [] })),
      config: worldRef.current.config,
    }
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "ssd-station-template.json"
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const importTemplate = useCallback((json: string) => {
    try {
      const template = JSON.parse(json)
      if (template.zones && template.config) {
        setIsRunning(false)
        resetPackageCounter()
        setWorld(createInitialWorld(template.zones, template.config))
      }
    } catch {
      console.error("Failed to parse template JSON")
    }
  }, [])

  return {
    world,
    isRunning,
    speed,
    mode,
    editorState,
    play,
    pause,
    step,
    reset,
    changeSpeed,
    toggleMode,
    selectZone,
    setEditorTool,
    setAddZoneType,
    toggleGridSnap,
    addZone,
    deleteZone,
    moveZone,
    resizeZone,
    updateConfig,
    updateStageTimes,
    exportTemplate,
    importTemplate,
  }
}
