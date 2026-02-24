"use client"

import { useRef, useEffect, useCallback } from "react"
import type { WorldState, AppMode, EditorState, PackageSize } from "@/lib/simulation/types"
import { ZONE_COLORS } from "@/lib/simulation/engine"

interface StationCanvasProps {
  world: WorldState
  mode: AppMode
  editorState: EditorState
  onSelectZone: (zoneId: string | null) => void
  onMoveZone: (zoneId: string, x: number, y: number) => void
  onResizeZone: (zoneId: string, w: number, h: number) => void
  onAddZone: (type: EditorState["addZoneType"], x: number, y: number) => void
  onDeleteZone: (zoneId: string) => void
}

const PKG_DOT_SIZE: Record<PackageSize, number> = {
  small: 2.5,
  medium: 3.5,
  large: 4.5,
  xlarge: 6,
}

export function StationCanvas({
  world,
  mode,
  editorState,
  onSelectZone,
  onMoveZone,
  onAddZone,
}: StationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    zoneId: string
    startX: number
    startY: number
    zoneStartX: number
    zoneStartY: number
  } | null>(null)
  const animFrameRef = useRef<number>(0)
  const worldRef = useRef(world)
  worldRef.current = world

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const dpr = window.devicePixelRatio || 1
    const rect = container.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    const ctx = canvas.getContext("2d")
    if (ctx) ctx.scale(dpr, dpr)
  }, [])

  useEffect(() => {
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)
    return () => window.removeEventListener("resize", resizeCanvas)
  }, [resizeCanvas])

  // Render loop
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const w = canvas.width / (window.devicePixelRatio || 1)
    const h = canvas.height / (window.devicePixelRatio || 1)
    const currentWorld = worldRef.current

    // Clear
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, w, h)

    // Subtle dot grid
    ctx.fillStyle = "#e5e7eb"
    for (let x = 20; x < w; x += 20) {
      for (let y = 20; y < h; y += 20) {
        ctx.beginPath()
        ctx.arc(x, y, 0.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Draw flow labels
    drawFlowLabels(ctx, currentWorld)

    // Draw zones
    for (const zone of currentWorld.zones) {
      const colors = ZONE_COLORS[zone.type]
      const isSelected = mode === "edit" && editorState.selectedZoneId === zone.id

      // For staging/loading, capacity is route bundles
      let fillPct = 0
      if (zone.type === "staging" || zone.type === "loading") {
        const bundleCount = zone.routeBundles?.length || 0
        fillPct = zone.capacity > 0 ? bundleCount / zone.capacity : 0
      } else {
        fillPct = zone.capacity > 0 ? zone.packages.length / zone.capacity : 0
      }

      // Zone background
      ctx.fillStyle = colors.bg
      ctx.beginPath()
      ctx.roundRect(zone.x, zone.y, zone.w, zone.h, 4)
      ctx.fill()

      // Capacity fill bar for route carts (weighted)
      if (zone.type === "route_cart" && zone.packages.length > 0) {
        const route = currentWorld.routes.find(r => r.id === zone.routeId)
        const wPct = route ? route.weightedCount / currentWorld.config.cartWeightedCapacity : 0
        const fillH = zone.h * Math.min(1, wPct)
        const fillColor = wPct > 0.9 ? "#fecaca" : wPct > 0.7 ? "#fed7aa" : "#d1fae5"
        ctx.fillStyle = fillColor
        ctx.fillRect(zone.x + 1, zone.y + zone.h - fillH, zone.w - 2, fillH)
      }

      // Capacity bar at bottom for top-row zones
      if (zone.packages.length > 0 && zone.type !== "route_cart" && zone.type !== "staging" && zone.type !== "loading") {
        const barH = 3
        const barW = zone.w * fillPct
        ctx.fillStyle = fillPct > 0.9 ? "#ef4444" : fillPct > 0.7 ? "#f59e0b" : colors.fill
        ctx.fillRect(zone.x, zone.y + zone.h - barH, barW, barH)
      }

      // Border
      ctx.strokeStyle = isSelected ? "#000000" : colors.border
      ctx.lineWidth = isSelected ? 2.5 : zone.type === "route_cart" ? 2 : 1.5
      if (fillPct >= 1) {
        ctx.strokeStyle = "#ef4444"
        ctx.lineWidth = 2.5
        ctx.setLineDash([4, 2])
      }
      ctx.beginPath()
      ctx.roundRect(zone.x, zone.y, zone.w, zone.h, 4)
      ctx.stroke()
      ctx.setLineDash([])

      // Label
      ctx.fillStyle = colors.text
      ctx.font = "bold 10px 'Geist', system-ui, sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "top"
      ctx.fillText(zone.label, zone.x + zone.w / 2, zone.y + 4)

      // Count display
      if (zone.type === "staging" || zone.type === "loading") {
        const bundleCount = zone.routeBundles?.length || 0
        const countText = `${bundleCount}/${zone.capacity} routes`
        ctx.font = "9px 'Geist Mono', monospace"
        ctx.fillStyle = bundleCount >= zone.capacity ? "#ef4444" : "#6b7280"
        ctx.textBaseline = "bottom"
        ctx.fillText(countText, zone.x + zone.w / 2, zone.y + zone.h - 3)
      } else if (zone.type === "route_cart") {
        const route = currentWorld.routes.find(r => r.id === zone.routeId)
        const wCount = route ? route.weightedCount : 0
        // Weighted count at bottom
        const countText = `${wCount}/${currentWorld.config.cartWeightedCapacity}`
        ctx.font = "9px 'Geist Mono', monospace"
        ctx.fillStyle = wCount >= currentWorld.config.cartFlushThreshold ? "#ef4444" : "#6b7280"
        ctx.textBaseline = "bottom"
        ctx.fillText(countText, zone.x + zone.w / 2, zone.y + zone.h - 3)

        // Earliest promise time at top-right of the box
        if (route && route.earliestPromiseTime !== null) {
          const promiseMins = Math.floor(route.earliestPromiseTime / 60)
          const hrs = Math.floor(promiseMins / 60)
          const mins = promiseMins % 60
          const label = `P:${hrs}h${String(mins).padStart(2, "0")}m`
          ctx.font = "bold 7px 'Geist Mono', monospace"
          ctx.textAlign = "right"
          ctx.textBaseline = "top"
          // Color based on urgency
          const ticksUntil = route.earliestPromiseTime - currentWorld.tick
          const minsUntil = ticksUntil / 60
          ctx.fillStyle = minsUntil <= 15 ? "#dc2626" : minsUntil <= 60 ? "#f59e0b" : "#6b7280"
          ctx.fillText(label, zone.x + zone.w - 2, zone.y + 3)
          ctx.textAlign = "center" // reset
        }
      } else {
        const countText = `${zone.packages.length}/${zone.capacity}`
        ctx.font = "9px 'Geist Mono', monospace"
        ctx.fillStyle = fillPct > 0.9 ? "#ef4444" : "#6b7280"
        ctx.textBaseline = "bottom"
        ctx.fillText(countText, zone.x + zone.w / 2, zone.y + zone.h - 3)
      }

      // Sector ID watermark on route carts
      if (zone.type === "route_cart" && zone.sectorId) {
        ctx.fillStyle = "#00000008"
        ctx.font = "bold 14px 'Geist Mono', monospace"
        ctx.textBaseline = "middle"
        ctx.textAlign = "center"
        ctx.fillText(zone.sectorId, zone.x + zone.w / 2, zone.y + zone.h / 2)
      }

      // FULL indicator
      if (fillPct >= 1) {
        ctx.fillStyle = "#ef4444"
        ctx.font = "bold 9px 'Geist', system-ui, sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "bottom"
        ctx.fillText("FULL!", zone.x + zone.w / 2, zone.y - 2)
      }

      // Closure pressure indicator on route carts (bottom-right)
      if (zone.type === "route_cart" && zone.packages.length > 0 && zone.routeId && currentWorld.config.enableRouteClosurePressure) {
        const route = currentWorld.routes.find(r => r.id === zone.routeId)
        if (route && route.earliestPromiseTime !== null) {
          // Route closure deadline = earliestPromiseTime - buffer
          const closureDeadline = route.earliestPromiseTime - currentWorld.config.routeClosureBufferMinutes * 60
          const ticksLeft = closureDeadline - currentWorld.tick
          const minsLeft = Math.max(0, Math.floor(ticksLeft / 60))
          // Show countdown when within 30 minutes of forced closure
          if (minsLeft <= 30) {
            ctx.fillStyle = minsLeft <= 5 ? "#dc2626" : "#f59e0b"
            ctx.font = "bold 8px 'Geist', system-ui, sans-serif"
            ctx.textAlign = "left"
            ctx.textBaseline = "bottom"
            ctx.fillText(`${minsLeft}m`, zone.x + 3, zone.y + zone.h - 3)
          }
        }
      }
    }

    // Draw individual packages (only in top-row zones and route carts)
    if (mode === "simulate") {
      const stateColors: Record<string, string> = {
        inbound: "#3b82f6",
        pick: "#f59e0b",
        slam: "#ec4899",
        conveyor: "#9ca3af",
        induct: "#f97316",
        route_cart: "#ef4444",
      }

      for (const pkg of currentWorld.packages) {
        if (pkg.state === "delivered" || pkg.state === "bundled") continue

        const color = stateColors[pkg.state] || "#6b7280"
        const radius = PKG_DOT_SIZE[pkg.size]

        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(pkg.visualX, pkg.visualY, radius, 0, Math.PI * 2)
        ctx.fill()

        ctx.strokeStyle = color + "80"
        ctx.lineWidth = 0.5
        ctx.stroke()
      }

      // Draw route bundles (condensed rectangles in staging/loading)
      for (const bundle of currentWorld.routeBundles) {
        if (bundle.state === "dispatched") continue

        const bundleColor = bundle.state === "staging" ? "#10b981" : "#6366f1"
        const bundleW = 44
        const bundleH = 24

        // Filled rectangle
        ctx.fillStyle = bundleColor + "20"
        ctx.beginPath()
        ctx.roundRect(bundle.visualX - bundleW / 2, bundle.visualY - bundleH / 2, bundleW, bundleH, 3)
        ctx.fill()
        ctx.strokeStyle = bundleColor
        ctx.lineWidth = 1.5
        ctx.stroke()

        // Unique ID label (top line)
        ctx.fillStyle = bundleColor
        ctx.font = "bold 7px 'Geist Mono', monospace"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(bundle.id, bundle.visualX, bundle.visualY - 5)

        // Package count (bottom line)
        ctx.fillStyle = "#374151"
        ctx.font = "8px 'Geist Mono', monospace"
        ctx.fillText(`${bundle.packageCount} pkg`, bundle.visualX, bundle.visualY + 5)
      }
    }

    // Editor mode overlay
    if (mode === "edit") {
      ctx.strokeStyle = "#3b82f6"
      ctx.lineWidth = 3
      ctx.setLineDash([8, 4])
      ctx.strokeRect(1, 1, w - 2, h - 2)
      ctx.setLineDash([])
    }

    animFrameRef.current = requestAnimationFrame(render)
  }, [mode, editorState.selectedZoneId])

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [render])

  // Draw flow arrows and labels (RIGHT to LEFT for top row)
  function drawFlowLabels(ctx: CanvasRenderingContext2D, world: WorldState) {
    // Top row is laid out: INDUCT (left) ... INBOUND (right)
    // Flow is right-to-left: INBOUND -> PICK -> SLAM -> CONVEYOR -> INDUCT
    // So arrows go from right zone to left zone

    const topFlowPairs = [
      { from: "inbound", to: "pick", label: "INBOUND \u2192 PICK" },
      { from: "pick", to: "slam", label: "PICK \u2192 SLAM" },
      { from: "slam", to: "conveyor", label: "SLAM \u2192 CONVEYOR" },
      { from: "conveyor", to: "induct", label: "CONVEYOR \u2192 INDUCT" },
    ] as const

    for (const { from, to, label } of topFlowPairs) {
      const fromZone = world.zones.find(z => z.type === from)
      const toZone = world.zones.find(z => z.type === to)
      if (!fromZone || !toZone) continue

      // From is to the RIGHT, To is to the LEFT (right-to-left flow)
      const startX = fromZone.x  // left edge of the right zone
      const endX = toZone.x + toZone.w  // right edge of the left zone
      const arrowY = fromZone.y + fromZone.h / 2
      const midX = (startX + endX) / 2

      // Label ABOVE the boxes
      const labelY = fromZone.y - 10
      ctx.fillStyle = "#111827"
      ctx.font = "bold 11px 'Geist', system-ui, sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "bottom"
      ctx.fillText(label, midX, labelY)

      // Arrow line: right to left
      ctx.strokeStyle = "#9ca3af"
      ctx.lineWidth = 1.5
      ctx.setLineDash([])
      ctx.beginPath()
      ctx.moveTo(startX - 4, arrowY)
      ctx.lineTo(endX + 10, arrowY)
      ctx.stroke()

      // Arrow head pointing LEFT
      ctx.fillStyle = "#9ca3af"
      ctx.beginPath()
      ctx.moveTo(endX + 4, arrowY)
      ctx.lineTo(endX + 12, arrowY - 4)
      ctx.lineTo(endX + 12, arrowY + 4)
      ctx.closePath()
      ctx.fill()
    }

    // Section header labels
    const sectionHeaders = [
      { label: "INDUCT \u2192 ROUTE CART", toType: "route_cart" as const },
      { label: "ROUTE CARTS \u2192 STAGING", toType: "staging" as const },
      { label: "STAGING \u2192 DRIVER LOADING", toType: "loading" as const },
    ]

    for (const { label, toType } of sectionHeaders) {
      const toZones = world.zones.filter(z => z.type === toType)
      if (toZones.length === 0) continue

      const minX = Math.min(...toZones.map(z => z.x))
      const maxX = Math.max(...toZones.map(z => z.x + z.w))
      const minY = Math.min(...toZones.map(z => z.y))

      ctx.fillStyle = "#111827"
      ctx.font = "bold 12px 'Geist', system-ui, sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "bottom"
      ctx.fillText(label, (minX + maxX) / 2, minY - 10)
    }
  }

  // Mouse handlers
  const getMousePos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const findZoneAtPos = (x: number, y: number) => {
    for (let i = world.zones.length - 1; i >= 0; i--) {
      const z = world.zones[i]
      if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) {
        return z
      }
    }
    return null
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getMousePos(e)
    if (mode === "edit") {
      if (editorState.tool === "add") {
        onAddZone(editorState.addZoneType, pos.x, pos.y)
        return
      }
      const zone = findZoneAtPos(pos.x, pos.y)
      if (zone) {
        onSelectZone(zone.id)
        if (editorState.tool === "select" || editorState.tool === "move") {
          dragRef.current = {
            zoneId: zone.id,
            startX: pos.x,
            startY: pos.y,
            zoneStartX: zone.x,
            zoneStartY: zone.y,
          }
        }
      } else {
        onSelectZone(null)
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (mode === "edit" && dragRef.current) {
      const pos = getMousePos(e)
      const dx = pos.x - dragRef.current.startX
      const dy = pos.y - dragRef.current.startY
      let newX = dragRef.current.zoneStartX + dx
      let newY = dragRef.current.zoneStartY + dy

      if (editorState.gridSnap) {
        newX = Math.round(newX / editorState.gridSize) * editorState.gridSize
        newY = Math.round(newY / editorState.gridSize) * editorState.gridSize
      }

      onMoveZone(dragRef.current.zoneId, newX, newY)
    }
  }

  const handleMouseUp = () => {
    dragRef.current = null
  }

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-background border border-border rounded-md">
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        style={{ cursor: mode === "edit" ? "crosshair" : "default" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  )
}
