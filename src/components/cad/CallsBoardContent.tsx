"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Check, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CallLocationThumbnail } from "./CallLocationThumbnail";
import { useLiveQuery } from "@/lib/useLiveQuery";
import { accentIdFromVar, accentBorderTextClassFromVar } from "@/lib/departmentAccent";
import { cn } from "@/lib/cn";

export interface BoardCall {
  id: string;
  title: string | null;
  status: string;
  priority: string | null;
  postal: string | null;
  source: string;
  clearedAt: string | null;
  clearedBy?: string | null;
}

function formatWhen(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Active/Archives call list — used both inside FloatingWindow (windows
 * mode) and directly in the splitscreen panel (split mode). `expanded`
 * switches the single-column row list into a responsive grid so it uses
 * the extra room splitscreen gives it instead of staying a narrow list.
 */
export function CallsBoardContent({
  onOpenCall,
  onJoined,
  accentVar,
  expanded = false,
}: {
  onOpenCall: (call: BoardCall) => void;
  onJoined?: () => void;
  accentVar?: string;
  expanded?: boolean;
}) {
  const { data, mutate } = useLiveQuery<{ active: BoardCall[]; closed: BoardCall[] }>(
    "/api/calls?status=all",
  );
  const [tab, setTab] = useState<"active" | "archives">("active");
  const [query, setQuery] = useState("");
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const accentId = accentIdFromVar(accentVar);
  const activeTabClass = accentBorderTextClassFromVar(accentVar);

  const rows = useMemo(() => {
    const source = tab === "active" ? (data?.active ?? []) : (data?.closed ?? []);
    if (!query.trim()) return source;
    const q = query.toLowerCase();
    return source.filter(
      (c) =>
        c.title?.toLowerCase().includes(q) ||
        c.postal?.toLowerCase().includes(q) ||
        c.clearedBy?.toLowerCase().includes(q),
    );
  }, [data, tab, query]);

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
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 border-b border-border-subtle pb-3">
        <div className="flex gap-2">
          {([
            { id: "active", label: "Active" },
            { id: "archives", label: "Archives" },
          ] as const).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium",
                tab === t.id ? activeTabClass : "border-transparent text-fg-muted hover:text-fg",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          className={cn("py-1 text-xs", expanded ? "w-56" : "w-36")}
        />
      </div>

      {tab === "archives" && (
        <p className="text-[11px] text-fg-disabled">Cleared calls from the last 7 days.</p>
      )}

      <div className={cn("flex flex-col gap-2", expanded && "grid grid-cols-2 gap-3 xl:grid-cols-3")}>
        {rows.length === 0 ? (
          <p className="px-2 py-3 text-xs text-fg-disabled">
            {tab === "active" ? "No active calls." : "No archived calls in the last 7 days."}
          </p>
        ) : (
          rows.map((call) => (
            <div key={call.id} className="flex gap-3 rounded-xl border border-border-subtle bg-surface p-3">
              <CallLocationThumbnail postal={call.postal} accentVar={accentVar} className="h-16 w-16 shrink-0" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1.5 truncate text-sm font-bold text-fg">
                    <AlertCircle size={12} className="shrink-0 text-fg-muted" />
                    {call.title ?? call.id}
                  </span>
                  {call.priority && <span className="shrink-0 text-[11px] capitalize text-fg-muted">{call.priority}</span>}
                </div>
                {tab === "archives" ? (
                  <div className="flex items-center gap-1.5 text-[11px] text-fg-muted">
                    <Check size={11} className="text-accent-status-green" />
                    {formatWhen(call.clearedAt)}
                    {call.clearedBy && (
                      <>
                        <span className="text-fg-disabled">·</span>
                        <User size={11} />
                        {call.clearedBy}
                      </>
                    )}
                  </div>
                ) : (
                  <span className="text-[11px] capitalize text-fg-muted">{call.status.replace("_", " ")}</span>
                )}
                <div className="mt-1 flex items-center gap-3">
                  <Button variant="plain" accent={accentId} onClick={() => onOpenCall(call)} className="px-0 text-xs">
                    Open
                  </Button>
                  {tab === "active" ? (
                    <Button
                      variant="plain"
                      accent={accentId}
                      onClick={() => join(call.id)}
                      disabled={joiningId === call.id}
                      className="px-0 text-xs"
                    >
                      Join
                    </Button>
                  ) : (
                    <Button variant="plain" accent={accentId} onClick={() => reopen(call.id)} className="px-0 text-xs">
                      Reopen
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
