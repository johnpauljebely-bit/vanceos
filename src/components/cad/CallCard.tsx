"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CallLocationThumbnail } from "./CallLocationThumbnail";
import { accentIdFromVar } from "@/lib/departmentAccent";
import { cn } from "@/lib/cn";

export interface CompactCall {
  id: string;
  title: string | null;
  type: string | null;
  description: string | null;
  postal: string | null;
  createdAt: string;
}

function elapsed(createdAt: string): string {
  const ms = Date.now() - new Date(createdAt).getTime();
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

/**
 * Compact card for a single active call — icon/title/elapsed up top, a
 * short description, a small map thumbnail centered on the call's postal,
 * then Edit/Complete. Matches the reference: no full intake form inline,
 * that only opens as its own window when you actually click Edit.
 */
export function CallCard({
  call,
  onEdit,
  onComplete,
  accentVar,
}: {
  call: CompactCall;
  onEdit: () => void;
  onComplete: () => void;
  accentVar?: string;
}) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const accentId = accentIdFromVar(accentVar);
  const accent = accentId === "verify-green" ? "verify-green" : "blue";

  return (
    <div key={tick} className="flex flex-col gap-2 rounded-xl border border-border-subtle bg-surface p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-red/15 text-accent-red">
            <AlertCircle size={14} />
          </span>
          <span className="truncate text-sm font-bold text-fg">{call.title || call.type || "Call"}</span>
        </div>
        <span className="shrink-0 text-[11px] text-fg-muted">{elapsed(call.createdAt)}</span>
      </div>

      {call.description && <p className="line-clamp-2 text-xs text-fg-muted">{call.description}</p>}

      <CallLocationThumbnail postal={call.postal} accentVar={accentVar} className="h-28" />

      <div className="flex gap-2">
        <Button variant="plain" accent="neutral" icon={<Pencil size={12} />} onClick={onEdit} className="text-xs">
          Edit
        </Button>
        <Button
          variant="boxed"
          accent={accent}
          icon={<Check size={12} />}
          onClick={onComplete}
          className={cn("ml-auto px-3 py-1 text-xs")}
        >
          Complete
        </Button>
      </div>
    </div>
  );
}
