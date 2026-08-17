"use client";

import { useMemo, useState } from "react";
import { Columns3, LayoutGrid, MicOff, Search as SearchIcon, X, ExternalLink, Plus } from "lucide-react";
import { Pill } from "@/components/ui/Pill";
import { DataTable, DataRow, DataCell } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { useLiveQuery } from "@/lib/useLiveQuery";
import { UNIT_STATUS_COLOR, type UnitStatus } from "@/lib/unitStatus";

interface LiveUnit {
  callsignKey: string;
  department: string;
  number: number;
  robloxUsername: string | null;
  rank: string | null;
  onDuty: boolean;
  status: UnitStatus;
  callId: string | null;
  postal: string | null;
  location: string | null;
  agency: string | null;
  subdivision: string | null;
}

export function ActiveUnitsPanel() {
  const { data } = useLiveQuery<{ liveUnits: LiveUnit[] }>("/api/live-units");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"list" | "grid">("list");

  const units = useMemo(() => {
    const all = (data?.liveUnits ?? []).filter((u) => u.onDuty);
    if (!query.trim()) return all;
    const q = query.toLowerCase();
    return all.filter(
      (u) =>
        String(u.number).includes(q) ||
        u.robloxUsername?.toLowerCase().includes(q) ||
        u.agency?.toLowerCase().includes(q),
    );
  }, [data, query]);

  return (
    <div className="flex flex-col border-b border-border-subtle">
      <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-2">
        <h3 className="text-sm font-bold text-fg">Active Units</h3>
        <button
          type="button"
          onClick={() => setView("list")}
          className={view === "list" ? "text-accent-blue" : "text-fg-muted hover:text-fg"}
          aria-label="List view"
        >
          <Columns3 size={14} />
        </button>
        <button
          type="button"
          onClick={() => setView("grid")}
          className={view === "grid" ? "text-accent-blue" : "text-fg-muted hover:text-fg"}
          aria-label="Grid view"
        >
          <LayoutGrid size={14} />
        </button>
        <button type="button" className="text-fg-muted hover:text-fg" aria-label="Mute all">
          <MicOff size={14} />
        </button>
        <div className="relative ml-auto w-48">
          <SearchIcon size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-fg-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="pl-7 py-1 text-xs"
          />
        </div>
        <button type="button" className="text-fg-muted hover:text-fg" aria-label="Clear"><X size={14} /></button>
        <button type="button" className="text-fg-muted hover:text-fg" aria-label="Open"><ExternalLink size={14} /></button>
        <button type="button" className="text-fg-muted hover:text-fg" aria-label="Add"><Plus size={14} /></button>
      </div>

      {view === "list" ? (
        <DataTable
          columns={["Unit", "Call", "Name", "Location", "Agency", "Subdivision", "Rank"]}
          isEmpty={units.length === 0}
        >
          {units.map((u) => (
            <DataRow key={u.callsignKey}>
              <DataCell>
                <Pill colorClassName={UNIT_STATUS_COLOR[u.status ?? "available"].bg}>{u.number}</Pill>
              </DataCell>
              <DataCell>{u.callId ?? "---"}</DataCell>
              <DataCell>{u.robloxUsername ?? "---"}</DataCell>
              <DataCell>{u.location ?? u.postal ?? "---"}</DataCell>
              <DataCell>{u.agency ?? "---"}</DataCell>
              <DataCell>{u.subdivision ?? "---"}</DataCell>
              <DataCell>{u.rank ?? "---"}</DataCell>
            </DataRow>
          ))}
        </DataTable>
      ) : (
        <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3">
          {units.length === 0 ? (
            <span className="text-sm text-fg-muted">No Data</span>
          ) : (
            units.map((u) => (
              <div key={u.callsignKey} className="rounded-lg border border-border-subtle bg-surface p-3">
                <Pill colorClassName={UNIT_STATUS_COLOR[u.status ?? "available"].bg}>{u.number}</Pill>
                <div className="mt-2 text-xs text-fg-muted">{u.robloxUsername ?? "---"}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
