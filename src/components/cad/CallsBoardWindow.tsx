"use client";

import { useState } from "react";
import { FloatingWindow } from "@/components/floating-window/FloatingWindow";
import { Button } from "@/components/ui/Button";
import { DataTable, DataRow, DataCell } from "@/components/ui/DataTable";
import { useLiveQuery } from "@/lib/useLiveQuery";
import { cn } from "@/lib/cn";

export interface BoardCall {
  id: string;
  title: string | null;
  status: string;
  priority: string | null;
  postal: string | null;
  source: string;
  clearedAt: string | null;
}

export function CallsBoardWindow({
  onOpenCall,
  onClose,
  onJoined,
}: {
  onOpenCall: (call: BoardCall) => void;
  onClose: () => void;
  onJoined?: () => void;
}) {
  const { data, mutate } = useLiveQuery<{ active: BoardCall[]; closed: BoardCall[] }>(
    "/api/calls?status=all",
  );
  const [tab, setTab] = useState<"active" | "closed">("active");
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const rows = tab === "active" ? (data?.active ?? []) : (data?.closed ?? []);

  async function join(callId: string) {
    setJoiningId(callId);
    const res = await fetch(`/api/calls/${callId}/join`, { method: "POST" });
    if (res.ok) onJoined?.();
    setJoiningId(null);
  }

  async function reopen(callId: string) {
    await fetch(`/api/calls/${callId}/reopen`, { method: "POST" });
    mutate();
  }

  return (
    <FloatingWindow title="Calls" onClose={onClose} width={640}>
      <div className="flex flex-col gap-4">
        <div className="flex gap-2 border-b border-border-subtle pb-3">
          {(["active", "closed"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium capitalize",
                tab === t ? "border-accent-blue text-accent-blue" : "border-transparent text-fg-muted hover:text-fg",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <DataTable columns={["Title", "Status", "Priority", "Postal", "Origin", ""]} isEmpty={rows.length === 0}>
          {rows.map((call) => (
            <DataRow key={call.id}>
              <DataCell>{call.title ?? call.id}</DataCell>
              <DataCell className="capitalize">{call.status.replace("_", " ")}</DataCell>
              <DataCell className="capitalize">{call.priority ?? "---"}</DataCell>
              <DataCell>{call.postal ?? "---"}</DataCell>
              <DataCell className="capitalize">{call.source}</DataCell>
              <DataCell>
                <div className="flex items-center gap-2">
                  <Button variant="plain" accent="blue" onClick={() => onOpenCall(call)} className="px-0 text-xs">
                    Open
                  </Button>
                  {tab === "active" ? (
                    <Button
                      variant="plain"
                      accent="blue"
                      onClick={() => join(call.id)}
                      disabled={joiningId === call.id}
                      className="px-0 text-xs"
                    >
                      Join
                    </Button>
                  ) : (
                    <Button variant="plain" accent="blue" onClick={() => reopen(call.id)} className="px-0 text-xs">
                      Reopen
                    </Button>
                  )}
                </div>
              </DataCell>
            </DataRow>
          ))}
        </DataTable>
      </div>
    </FloatingWindow>
  );
}
