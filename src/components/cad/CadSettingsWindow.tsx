"use client";

import { FloatingWindow } from "@/components/floating-window/FloatingWindow";
import { CadSettingsContent } from "./CadSettingsContent";
import type { LayoutMode } from "@/lib/layoutMode";
import type { ClockFormat } from "@/lib/cadSettings";

/** Windows-mode wrapper around CadSettingsContent — see CadPanel for the split-mode version. */
export function CadSettingsWindow({
  onClose,
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
  onClose: () => void;
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
  return (
    <FloatingWindow title="Settings" onClose={onClose} width={520} accentVar={accentVar}>
      <CadSettingsContent
        layoutMode={layoutMode}
        onLayoutModeChange={onLayoutModeChange}
        dispatchAlertMuted={dispatchAlertMuted}
        onDispatchAlertMutedChange={onDispatchAlertMutedChange}
        mapOverviewVisible={mapOverviewVisible}
        onMapOverviewVisibleChange={onMapOverviewVisibleChange}
        clockFormat={clockFormat}
        onClockFormatChange={onClockFormatChange}
        accentVar={accentVar}
      />
    </FloatingWindow>
  );
}
