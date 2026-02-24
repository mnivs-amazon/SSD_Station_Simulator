"use client"

import { useRef, useEffect } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { ScrollText } from "lucide-react"

interface LogsPanelProps {
  logEntries: string[]
  isLoggingEnabled: boolean
}

const ROW_HEIGHT = 24

export function LogsPanel({ logEntries, isLoggingEnabled }: LogsPanelProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: logEntries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 20,
  })

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    if (logEntries.length > 0 && parentRef.current) {
      parentRef.current.scrollTop = parentRef.current.scrollHeight
    }
  }, [logEntries.length])

  return (
    <div className="flex h-full flex-col overflow-hidden bg-card">
      <div className="shrink-0 border-b border-border px-4 py-3">
        <div className="flex items-center gap-1.5">
          <ScrollText className="h-3.5 w-3.5 text-muted-foreground" />
          <h2 className="text-sm font-bold text-foreground">Event Log</h2>
          {logEntries.length > 0 && (
            <span className="ml-auto text-[10px] text-muted-foreground">
              {logEntries.length.toLocaleString()} entries
            </span>
          )}
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">
          {isLoggingEnabled
            ? "Package flow events for the full simulation. Run at higher speed (e.g. 20×) to reach a week of sim time faster."
            : "Enable Debug Logging in the Config panel to see package flow events."}
        </p>
      </div>

      <div
        ref={parentRef}
        className="flex-1 overflow-y-auto overflow-x-hidden font-mono text-[11px]"
      >
        {logEntries.length === 0 ? (
          <div className="p-4 text-muted-foreground">
            {isLoggingEnabled
              ? "No events yet. Start the simulation to see package flow."
              : "Logging is off. Enable Debug Logging in Config, then run the simulation."}
          </div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => (
              <div
                key={virtualRow.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="rounded px-2 py-1 hover:bg-muted/50 break-all flex items-center"
              >
                {logEntries[virtualRow.index]}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
