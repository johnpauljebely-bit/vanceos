"use client";

import { X } from "lucide-react";
import { useLiveQuery } from "@/lib/useLiveQuery";
import { UNIT_STATUS_COLOR, UNIT_STATUS_LABEL, UNIT_STATUSES, type UnitStatus } from "@/lib/unitStatus";
import { cn } from "@/lib/cn";

interface LiveUnit {
  callsignKey: string;
  onDuty: boolean;
  status: UnitStatus;
}

/**
 * Small compact stats card floating over the map — counts only, not a
 * duplicate of the sidebar's full Active Units list. Matches the
 * reference's "Overview" widget, sized down to what we actually have data
 * for (no ER:LC-wide player tracking here, just our own live units).
 * Visibility is controlled by the parent (persisted in Settings) so the
 * close button here and the Settings toggle stay in sync.
 */
export function CadMapOverview({ visible, onVisibleChange }: { visible: boolean; onVisibleChange: (v: boolean) => void }) {
  const { data } = useLiveQuery<{ liveUnits: LiveUnit[] }>("/api/live-units");
  const units = (data?.liveUnits ?? []).filter((u) => u.onDuty);

  if (!visible) return null;

  const counts = UNIT_STATUSES.map((s) => ({
    status: s,
    count: units.filter((u) => u.status === s).length,
  })).filter((c) => c.count > 0);

  return (
    <div className="absolute bottom-4 left-4 z-10 w-56 rounded-xl border border-border-subtle bg-surface/95 p-3 shadow-2xl backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-fg-muted">Overview</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-fg">{units.length} active</span>
          <button type="button" onClick={() => onVisibleChange(false)} aria-label="Close overview" className="text-fg-muted hover:text-fg">
            <X size={12} />
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {counts.length === 0 ? (
          <p className="text-xs text-fg-disabled">No units on duty.</p>
        ) : (
          counts.map(({ status, count }) => (
            <div key={status} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-fg-muted">
                <span className={cn("h-1.5 w-1.5 rounded-full", UNIT_STATUS_COLOR[status].dot)} />
                {UNIT_STATUS_LABEL[status]}
              </span>
              <span className="font-semibold text-fg">{count}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
