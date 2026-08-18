"use client";

import { LayoutGrid, PanelsTopLeft, Volume2, VolumeX, Map, Clock } from "lucide-react";
import { accentIdFromVar } from "@/lib/departmentAccent";
import type { LayoutMode } from "@/lib/layoutMode";
import type { ClockFormat } from "@/lib/cadSettings";
import { cn } from "@/lib/cn";

/**
 * Settings content — shared by the windows-mode FloatingWindow wrapper
 * (CadSettingsWindow) and the split-mode panel (CadPanel's CadSplitLayout
 * left slot), same pattern as Lookup/CallsBoard/RecordsWarrants content.
 */
export function CadSettingsContent({
  layoutMode,
  onLayoutModeChange,
  dispatchAlertMuted,
  onDispatchAlertMutedChange,
  mapOverviewVisible,
  onMapOverviewVisibleChange,
  clockFormat,
  onClockFormatChange,
  accentVar,
}: {
  layoutMode: LayoutMode;
  onLayoutModeChange: (mode: LayoutMode) => void;
  dispatchAlertMuted: boolean;
  onDispatchAlertMutedChange: (muted: boolean) => void;
  mapOverviewVisible: boolean;
  onMapOverviewVisibleChange: (visible: boolean) => void;
  clockFormat: ClockFormat;
  onClockFormatChange: (format: ClockFormat) => void;
  accentVar?: string;
}) {
  const accentId = accentIdFromVar(accentVar);
  const activeClass =
    accentId === "verify-green"
      ? "border-accent-verify-green bg-accent-verify-green/10 text-accent-verify-green"
      : "border-accent-blue bg-accent-blue/10 text-accent-blue";

  const layoutOptions: { id: LayoutMode; label: string; description: string; icon: React.ReactNode }[] = [
    {
      id: "windows",
      label: "Windows",
      description: "Sidebar actions open floating, draggable windows over the map.",
      icon: <PanelsTopLeft size={18} />,
    },
    {
      id: "split",
      label: "Splitscreen",
      description: "Sidebar actions resize the map down to a side panel and use the rest of the screen for that tab's content.",
      icon: <LayoutGrid size={18} />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h3 className="text-sm font-bold text-fg">Dashboard Layout</h3>
        <p className="mt-1 text-xs text-fg-muted">
          Choose how Search, Call Lookup, Records &amp; Warrants, and Settings itself present their content.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {layoutOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onLayoutModeChange(opt.id)}
              className={cn(
                "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors",
                layoutMode === opt.id ? activeClass : "border-border-subtle text-fg hover:border-fg-muted",
              )}
            >
              {opt.icon}
              <span className="text-sm font-bold">{opt.label}</span>
              <span className="text-xs text-fg-muted">{opt.description}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-bold text-fg">Dispatch Alert Sound</h3>
        <p className="mt-1 text-xs text-fg-muted">
          Play a tone and speak the callsign out loud when you&apos;re auto-assigned to a call.
        </p>
        <button
          type="button"
          onClick={() => onDispatchAlertMutedChange(!dispatchAlertMuted)}
          className={cn(
            "mt-3 flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors",
            !dispatchAlertMuted ? activeClass : "border-border-subtle text-fg hover:border-fg-muted",
          )}
        >
          {dispatchAlertMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          <span className="text-sm font-bold">{dispatchAlertMuted ? "Muted" : "On"}</span>
        </button>
      </section>

      <section>
        <h3 className="text-sm font-bold text-fg">Map Overview Widget</h3>
        <p className="mt-1 text-xs text-fg-muted">Show the on-duty status counts card over the map.</p>
        <button
          type="button"
          onClick={() => onMapOverviewVisibleChange(!mapOverviewVisible)}
          className={cn(
            "mt-3 flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors",
            mapOverviewVisible ? activeClass : "border-border-subtle text-fg hover:border-fg-muted",
          )}
        >
          <Map size={18} />
          <span className="text-sm font-bold">{mapOverviewVisible ? "Shown" : "Hidden"}</span>
        </button>
      </section>

      <section>
        <h3 className="text-sm font-bold text-fg">Clock Format</h3>
        <p className="mt-1 text-xs text-fg-muted">Time format for the navbar clock.</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {(["24h", "12h"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onClockFormatChange(f)}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-4 text-left transition-colors",
                clockFormat === f ? activeClass : "border-border-subtle text-fg hover:border-fg-muted",
              )}
            >
              <Clock size={18} />
              <span className="text-sm font-bold">{f === "24h" ? "24-hour" : "12-hour"}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
