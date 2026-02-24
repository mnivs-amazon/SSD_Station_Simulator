# Implementation Plan: V3 Parity Features

Planned enhancements to bring V5 in line with V3 capabilities.

---

## 1. Console Logging

**Goal:** Log detailed package flow events to the browser console for debugging and analysis.

### Events to Log

| Event | Example Log |
|-------|-------------|
| Package created | `[T+120s] Package S12 created at Inbound` |
| Package state change | `[T+180s] Package S12: inbound → pick (zone_1)` |
| Induct → Route Cart assignment | `[T+240s] Package M5 assigned to route cart R003 (S03) — weighted 2/50` |
| Route cart flush | `[T+300s] Route cart R003 flushed to staging (25 packages, 48 wt)` |
| Route bundle → Loading | `[T+360s] Route bundle RB_001 moved to loading dock` |
| Package delivered | `[T+420s] Package S12 delivered (cycle time: 5.0 min)` |

### Implementation

- **Location:** `lib/simulation/engine.ts` — add optional `logEvent()` calls in `simulateTick()`
- **Approach:** Use `console.log()` when `process.env.NODE_ENV === 'development'` or a config flag `config.enableConsoleLogging`
- **Format:** Consistent prefix `[SSD]` or `[T+{tick}s]` for easy filtering
- **Config:** Add `enableConsoleLogging: boolean` to `SimConfig` (default: `false` in production, `true` in dev)

### Files to Modify

- `lib/simulation/types.ts` — add `enableConsoleLogging?: boolean` to `SimConfig`
- `lib/simulation/engine.ts` — add logging at key transition points
- `components/config-panel.tsx` — optional toggle for "Debug logging" in config panel

---

## 2. Zone Types: problem_solve, hazmat

**Goal:** Add `problem_solve` and `hazmat` zone types for layout and visualization.

### Zone Semantics

| Zone | Purpose | Package Flow |
|------|---------|--------------|
| `problem_solve` | Packages that need resolution (damaged, wrong address, etc.) | Packages can be routed here from induct or other stages; dwell then return to flow or exit |
| `hazmat` | Hazardous materials handling | Special handling; packages routed here bypass normal flow |

### Implementation Options

**Option A: Layout-only (MVP)**  
- Add zones for visual/layout purposes only  
- No package flow through them in simulation  
- Matches V3 rebuild: "Grocery zones exist for layout and visualization only in MVP"

**Option B: Full flow integration**  
- Packages can be routed to problem_solve (e.g., random % from induct)  
- Dwell time, then re-enter flow or mark as "resolved"  
- Hazmat: separate flow path  
- More complex; defer to later milestone

**Recommendation:** Start with **Option A** — add zone types for editor and rendering; flow logic in a follow-up.

### Files to Modify

- `lib/simulation/types.ts` — add `"problem_solve" | "hazmat"` to `ZoneType`
- `lib/simulation/engine.ts` — add to `ZONE_COLORS`, `createDefaultLayout()` (optional placement), ensure `simulateTick()` ignores these zones for flow
- `components/editor-toolbar.tsx` — add Problem Solve, Hazmat to `ZONE_TYPES`
- `components/config-panel.tsx` — add to `LEGEND_ITEMS`
- `components/wiki-panel.tsx` — add wiki entries for new zones
- `components/station-canvas.tsx` — ensure new types render correctly (reuse existing zone drawing)

### Color Suggestions

- `problem_solve`: amber/yellow (e.g. `#fef3c7`, `#d97706`)
- `hazmat`: orange/red with distinct styling (e.g. `#ffedd5`, `#ea580c`)

---

## 3. Zone Type: sort

**Note:** V5 uses `pick` and `slam` instead of a single `sort` stage. The flow is:

- **V3:** Inbound → Sort → Induct → Route Carts → Staging → Loading  
- **V5:** Inbound → Pick → Slam → Conveyor → Induct → Route Carts → Staging → Loading  

V5’s `pick` + `slam` is a more detailed model. Adding `sort` would mean:

- **Option A:** Add `sort` as an alias or alternative to `pick`+`slam` for simpler layouts  
- **Option B:** Keep current model; document that `pick`+`slam` = V3’s `sort`  
- **Recommendation:** **Option B** — no new `sort` zone; document the mapping in the wiki.

---

## 4. Route Cart Gradient Fill

**Goal:** Replace solid fill bar with a gradient (red → orange → green) based on capacity.

### Current (V5)

- Solid color: green (&lt;70%), orange (70–90%), red (&gt;90%)
- Fill bar at bottom of zone

### Target (V3)

- Linear gradient bottom-to-top: red (empty/low) → orange (mid) → green (full)
- Or: red (full) → orange → green (empty) — V3 used red bottom, green top for "fill level"

From V3 README:
```javascript
gradient.addColorStop(0, '#e74c3c'); // Red bottom
gradient.addColorStop(0.5, '#f39c12'); // Orange middle  
gradient.addColorStop(1, '#2ecc71'); // Green top
```
So: **bottom = red (low/empty), top = green (full)** — fill grows upward.

### Implementation

- **Location:** `components/station-canvas.tsx` — route cart drawing block (~lines 116–123)
- **Change:** Use `ctx.createLinearGradient(zone.x, zone.y + zone.h, zone.x, zone.y)` for bottom-to-top gradient
- **Color stops:** 0% red, 50% orange, 100% green
- **Fill height:** Same as now: `fillH = zone.h * Math.min(1, wPct)` — gradient fills that region from bottom

### Files to Modify

- `components/station-canvas.tsx` — replace solid `fillRect` with gradient fill for route carts

---

## Summary Checklist

| Feature | Effort | Files | Priority |
|---------|--------|-------|----------|
| Console logging | Medium | engine.ts, types.ts, config-panel | 1 |
| problem_solve, hazmat zones | Medium | types, engine, editor-toolbar, config-panel, wiki, canvas | 2 |
| Route cart gradient | Low | station-canvas.tsx | 3 |
| sort zone | Skip | — | Document only |

---

## Suggested Order

1. **Route cart gradient** — Small, visual-only change  
2. **Console logging** — Improves debugging for all future work  
3. **problem_solve, hazmat** — Layout-only first; flow logic later if needed  
