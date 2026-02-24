"use client"

import { useState } from "react"
import { useSimulation } from "@/hooks/use-simulation"
import { StationCanvas } from "@/components/station-canvas"
import { ControlBar } from "@/components/control-bar"
import { MetricsPanel } from "@/components/metrics-panel"
import { ConfigPanel } from "@/components/config-panel"
import { EditorToolbar } from "@/components/editor-toolbar"
import { WikiPanel } from "@/components/wiki-panel"

type TabId = "simulator" | "wiki"

export default function SSDStationSimulator() {
  const sim = useSimulation()
  const [activeTab, setActiveTab] = useState<TabId>("simulator")

  return (
    <div className="flex h-screen flex-col bg-background text-foreground overflow-hidden">
      {/* Top header */}
      <header className="flex items-center justify-between border-b border-border bg-primary px-4 py-2">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-bold text-primary-foreground tracking-wide">
            SSD Station Simulator
          </h1>
          <nav className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("simulator")}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                activeTab === "simulator"
                  ? "bg-primary-foreground text-primary"
                  : "bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30"
              }`}
            >
              Simulator
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("wiki")}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                activeTab === "wiki"
                  ? "bg-primary-foreground text-primary"
                  : "bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30"
              }`}
            >
              Wiki
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={sim.exportTemplate}
            className="rounded-md bg-primary-foreground/20 px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary-foreground/30 transition-colors"
          >
            Save Template
          </button>
          <button
            onClick={sim.exportTemplate}
            className="rounded-md bg-primary-foreground/20 px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary-foreground/30 transition-colors"
          >
            Export
          </button>
        </div>
      </header>

      {activeTab === "wiki" ? (
        <div className="flex-1 overflow-hidden">
          <WikiPanel />
        </div>
      ) : (
        <>
          {/* Control bar */}
          <ControlBar
            isRunning={sim.isRunning}
            speed={sim.speed}
            mode={sim.mode}
            elapsedSeconds={sim.world.elapsedSeconds}
            tick={sim.world.tick}
            onPlay={sim.play}
            onPause={sim.pause}
            onStep={sim.step}
            onReset={sim.reset}
            onChangeSpeed={sim.changeSpeed}
            onToggleMode={sim.toggleMode}
          />

          {/* Editor toolbar (only in edit mode) */}
          {sim.mode === "edit" && (
            <EditorToolbar
              editorState={sim.editorState}
              onSetTool={sim.setEditorTool}
              onDeleteZone={sim.deleteZone}
              onSetAddType={sim.setAddZoneType}
              onToggleGrid={sim.toggleGridSnap}
            />
          )}

          {/* Main content area */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left: Metrics */}
            {sim.mode === "simulate" && (
              <MetricsPanel metrics={sim.world.metrics} />
            )}

            {/* Center: Canvas */}
            <div className="flex-1 relative p-2">
              <StationCanvas
                world={sim.world}
                mode={sim.mode}
                editorState={sim.editorState}
                onSelectZone={sim.selectZone}
                onMoveZone={sim.moveZone}
                onResizeZone={sim.resizeZone}
                onAddZone={sim.addZone}
                onDeleteZone={sim.deleteZone}
              />
            </div>

            {/* Right: Config */}
            <ConfigPanel
              config={sim.world.config}
              onUpdateConfig={sim.updateConfig}
              onUpdateStageTimes={sim.updateStageTimes}
              onExport={sim.exportTemplate}
              onImport={sim.importTemplate}
            />
          </div>
        </>
      )}
    </div>
  )
}
