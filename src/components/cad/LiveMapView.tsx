"use client";

import { useRef, useState } from "react";
import { User, Phone, Plus, Minus, Home, AlertCircle } from "lucide-react";
import { useLiveQuery } from "@/lib/useLiveQuery";
import { UNIT_STATUS_COLOR, UNIT_STATUS_LABEL, type UnitStatus } from "@/lib/unitStatus";
import { cn } from "@/lib/cn";

interface MapUnit {
  callsignKey: string;
  department: string;
  number: number;
  rank: string | null;
  status: string;
  postal: string | null;
  robloxUsername: string | null;
  coords: [number, number];
}

interface MapCall {
  id: string;
  title: string | null;
  type: string | null;
  status: string;
  postal: string | null;
  primaryUnitCallsign: string | null;
  units: string[];
  coords: [number, number];
}

/** Small deterministic spiral so multiple markers at the same postal don't fully stack. */
function jitter(index: number): [number, number] {
  if (index === 0) return [0, 0];
  const angle = (index * 137.5 * Math.PI) / 180;
  const radius = 10 + index * 6;
  return [Math.cos(angle) * radius, Math.sin(angle) * radius];
}

export function LiveMapView() {
  const { data } = useLiveQuery<{ units: MapUnit[]; calls: MapCall[] }>("/api/leo/map-data", 4000);
  const [showUnits, setShowUnits] = useState(true);
  const [showCalls, setShowCalls] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const units = data?.units ?? [];
  const calls = data?.calls ?? [];

  // Group by rounded coords (not postal) — units now place from real live
  // x/z when available, so exact overlaps are rare; calls still use postal
  // centers and commonly share one, so still need the jitter spiral.
  function groupByCoords<T extends { coords: [number, number] }>(items: T[]): Map<string, T[]> {
    const map = new Map<string, T[]>();
    for (const item of items) {
      const key = `${item.coords[0].toFixed(1)},${item.coords[1].toFixed(1)}`;
      const arr = map.get(key) ?? [];
      arr.push(item);
      map.set(key, arr);
    }
    return map;
  }

  const unitGroups = groupByCoords(units);
  const callGroups = groupByCoords(calls);

  function resetView() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  function onPointerDown(e: React.PointerEvent) {
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    setDragging(true);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging || !dragStart.current) return;
    setPan({
      x: dragStart.current.panX + (e.clientX - dragStart.current.x),
      y: dragStart.current.panY + (e.clientY - dragStart.current.y),
    });
  }
  function onPointerUp() {
    setDragging(false);
    dragStart.current = null;
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-black">
      <div className="flex items-center justify-between border-b border-border-subtle bg-surface px-4 py-3">
        <h1 className="text-lg font-bold text-fg">Map</h1>
        <p className="text-xs text-fg-muted">
          Live positions from real in-game coordinates where available, postal-level otherwise.
        </p>
      </div>

      {/* Show/hide toggles */}
      <div className="absolute left-4 top-16 z-20 flex gap-2">
        <button
          type="button"
          onClick={() => setShowUnits((v) => !v)}
          aria-label="Toggle units"
          title="Show/hide units"
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg border",
            showUnits ? "border-accent-teal bg-accent-teal/10 text-accent-teal" : "border-border-subtle text-fg-muted",
          )}
        >
          <User size={16} />
        </button>
        <button
          type="button"
          onClick={() => setShowCalls((v) => !v)}
          aria-label="Toggle calls"
          title="Show/hide calls"
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg border",
            showCalls ? "border-accent-teal bg-accent-teal/10 text-accent-teal" : "border-border-subtle text-fg-muted",
          )}
        >
          <Phone size={16} />
        </button>
      </div>

      {/* Zoom controls */}
      <div className="absolute right-4 top-16 z-20 flex flex-col gap-1 rounded-xl border border-border-subtle bg-surface p-1">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)))}
          aria-label="Zoom in"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-fg-muted hover:bg-white/5 hover:text-fg"
        >
          <Plus size={16} />
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
          aria-label="Zoom out"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-fg-muted hover:bg-white/5 hover:text-fg"
        >
          <Minus size={16} />
        </button>
        <button
          type="button"
          onClick={resetView}
          aria-label="Reset view"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-fg-muted hover:bg-white/5 hover:text-fg"
        >
          <Home size={16} />
        </button>
      </div>

      <div
        className="relative flex-1 overflow-hidden touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        style={{ cursor: dragging ? "grabbing" : "grab" }}
      >
        <div
          className="absolute left-1/2 top-1/2 aspect-square w-[min(150vh,150vw)]"
          style={{
            transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: dragging ? "none" : "transform 120ms ease-out",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/erlcmap.webp" alt="ER:LC Map" className="h-full w-full select-none" draggable={false} />

          {showUnits &&
            Array.from(unitGroups.values()).flatMap((group) =>
              group.map((u, i) => {
                const [jx, jy] = jitter(i);
                const color = UNIT_STATUS_COLOR[u.status as UnitStatus] ?? UNIT_STATUS_COLOR.available;
                return (
                  <div
                    key={u.callsignKey}
                    className="group absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `calc(${u.coords[0]}% + ${jx}px)`, top: `calc(${u.coords[1]}% + ${jy}px)` }}
                  >
                    <div
                      className={cn(
                        "rounded-full border-2 border-white/80 px-2 py-0.5 text-xs font-bold text-white shadow-lg",
                        color.bg,
                      )}
                    >
                      {u.number}
                    </div>
                    <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-border-subtle bg-surface px-2 py-1 text-xs shadow-2xl group-hover:block">
                      <div className="font-bold text-fg">
                        {u.department.toUpperCase()} {u.number}
                      </div>
                      <div className="text-fg-muted">
                        {UNIT_STATUS_LABEL[u.status as UnitStatus] ?? u.status}
                        {u.postal ? ` — Postal ${u.postal}` : ""}
                      </div>
                    </div>
                  </div>
                );
              }),
            )}

          {showCalls &&
            Array.from(callGroups.values()).flatMap((group) =>
              group.map((c, i) => {
                const [jx, jy] = jitter(i + 8);
                return (
                  <div
                    key={c.id}
                    className="group absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `calc(${c.coords[0]}% + ${jx}px)`, top: `calc(${c.coords[1]}% + ${jy}px)` }}
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white/80 bg-accent-red shadow-lg">
                      <AlertCircle size={13} className="text-white" />
                    </div>
                    <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 hidden w-52 -translate-x-1/2 rounded-lg border border-border-subtle bg-surface px-2 py-1.5 text-xs shadow-2xl group-hover:block">
                      <div className="font-bold text-fg">{c.title ?? c.type ?? "Call"}</div>
                      <div className="capitalize text-fg-muted">
                        {(c.type ?? "call").replace("_", " ")} — Postal {c.postal}
                      </div>
                      <div className="text-fg-muted">
                        {c.units.length ? `Units: ${c.units.join(", ")}` : "No units assigned"}
                      </div>
                    </div>
                  </div>
                );
              }),
            )}
        </div>
      </div>
    </div>
  );
}
