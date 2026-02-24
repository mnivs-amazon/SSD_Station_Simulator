"use client"

import type { EditorState, ZoneType } from "@/lib/simulation/types"
import {
  MousePointer,
  Move,
  Plus,
  Trash2,
  Grid3x3,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface EditorToolbarProps {
  editorState: EditorState
  onSetTool: (tool: EditorState["tool"]) => void
  onDeleteZone: (zoneId: string) => void
  onSetAddType: (type: ZoneType) => void
  onToggleGrid: () => void
}

const ZONE_TYPES: { type: ZoneType; label: string }[] = [
  { type: "inbound", label: "Inbound" },
  { type: "pick", label: "Pick" },
  { type: "slam", label: "Slam" },
  { type: "conveyor", label: "Conveyor" },
  { type: "induct", label: "Induct" },
  { type: "route_cart", label: "Route Cart" },
  { type: "staging", label: "Staging" },
  { type: "loading", label: "Loading" },
]

export function EditorToolbar({
  editorState,
  onSetTool,
  onDeleteZone,
  onSetAddType,
  onToggleGrid,
}: EditorToolbarProps) {
  return (
    <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-2">
      <span className="mr-2 text-xs font-medium uppercase text-muted-foreground">
        Tools
      </span>

      <Button
        variant={editorState.tool === "select" ? "default" : "ghost"}
        size="icon"
        className="h-8 w-8"
        onClick={() => onSetTool("select")}
        title="Select"
      >
        <MousePointer className="h-4 w-4" />
      </Button>

      <Button
        variant={editorState.tool === "move" ? "default" : "ghost"}
        size="icon"
        className="h-8 w-8"
        onClick={() => onSetTool("move")}
        title="Move"
      >
        <Move className="h-4 w-4" />
      </Button>

      <Button
        variant={editorState.tool === "add" ? "default" : "ghost"}
        size="icon"
        className="h-8 w-8"
        onClick={() => onSetTool("add")}
        title="Add Zone"
      >
        <Plus className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive hover:text-destructive"
        onClick={() => {
          if (editorState.selectedZoneId) {
            onDeleteZone(editorState.selectedZoneId)
          }
        }}
        disabled={!editorState.selectedZoneId}
        title="Delete Selected"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <div className="h-5 w-px bg-border" />

      <Button
        variant={editorState.gridSnap ? "default" : "ghost"}
        size="icon"
        className="h-8 w-8"
        onClick={onToggleGrid}
        title="Grid Snap"
      >
        <Grid3x3 className="h-4 w-4" />
      </Button>

      {editorState.tool === "add" && (
        <>
          <div className="h-5 w-px bg-border" />
          <span className="text-xs text-muted-foreground">Zone Type:</span>
          <div className="flex flex-wrap gap-1">
            {ZONE_TYPES.map(({ type, label }) => (
              <Button
                key={type}
                variant={editorState.addZoneType === type ? "default" : "outline"}
                size="sm"
                className="h-6 px-2 text-[11px]"
                onClick={() => onSetAddType(type)}
              >
                {label}
              </Button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
