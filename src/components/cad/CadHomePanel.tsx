"use client";

import { useLiveQuery } from "@/lib/useLiveQuery";
import { UNIT_STATUS_COLOR, UNIT_STATUS_LABEL, type UnitStatus } from "@/lib/unitStatus";
import { CallCard, type CompactCall } from "./CallCard";
import { cn } from "@/lib/cn";

interface LiveUnit {
  callsignKey: string;
  department: string;
  number: number;
  robloxUsername: string | null;
  rank: string | null;
  onDuty: boolean;
  status: UnitStatus;
  postal: string | null;
  location: string | null;
  agency: string | null;
}

const DEPT_LABEL: Record<string, string> = { "delta-pd": "Police", rcmp: "RCMP", bchp: "BCHP" };

/**
 * Default content of the wide sidebar panel — compact Active Units list
 * then compact Calls list, matching the reference (small avatar + callsign
 * + location + status pill per row, "No Active Calls" grey text when
 * there's nothing, otherwise real CallCards).
 */
export function CadHomePanel({
  onEditCall,
  accentVar,
}: {
  onEditCall: (call: CompactCall) => void;
  accentVar?: string;
}) {
  const { data: unitsData } = useLiveQuery<{ liveUnits: LiveUnit[] }>("/api/live-units");
  const { data: callsData, mutate: mutateCalls } = useLiveQuery<{ active: CompactCall[] }>("/api/calls?status=all");

  const units = (unitsData?.liveUnits ?? []).filter((u) => u.onDuty);
  const calls = callsData?.active ?? [];

  async function completeCall(callId: string) {
    await fetch(`/api/calls/${callId}/clear`, { method: "POST" });
    mutateCalls();
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <span className="text-xs font-bold uppercase tracking-wide text-fg-muted">Active Units</span>
        <span className="text-xs text-fg-disabled">{units.length}</span>
      </div>
      <div className="flex flex-col gap-0.5 px-2 pb-2">
        {units.length === 0 ? (
          <p className="px-2 py-3 text-xs text-fg-disabled">No units on duty.</p>
        ) : (
          units.map((u) => {
            const color = UNIT_STATUS_COLOR[u.status ?? "available"];
            const initials = (u.robloxUsername ?? String(u.number)).slice(0, 2).toUpperCase();
            return (
              <div key={u.callsignKey} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-input text-[10px] font-bold text-fg-muted">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-fg">
                    {u.number} {u.robloxUsername ?? ""}
                  </div>
                  <div className="truncate text-xs text-fg-muted">
                    {u.location ?? u.postal ?? "Unknown location"} · {DEPT_LABEL[u.department] ?? u.department}
                  </div>
                </div>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-black", color.bg)}>
                  {UNIT_STATUS_LABEL[u.status ?? "available"]}
                </span>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-border-subtle px-4 pb-2 pt-4">
        <span className="text-xs font-bold uppercase tracking-wide text-fg-muted">Calls</span>
        <span className="text-xs text-fg-disabled">{calls.length}</span>
      </div>
      <div className="flex flex-col gap-2 px-2 pb-4">
        {calls.length === 0 ? (
          <p className="px-2 py-3 text-xs text-fg-disabled">No Active Calls</p>
        ) : (
          calls.map((c) => (
            <CallCard
              key={c.id}
              call={c}
              onEdit={() => onEditCall(c)}
              onComplete={() => completeCall(c.id)}
              accentVar={accentVar}
            />
          ))
        )}
      </div>
    </div>
  );
}
