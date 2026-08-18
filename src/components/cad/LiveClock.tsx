"use client";

import { useSyncExternalStore } from "react";
import { format } from "date-fns";

function subscribe(callback: () => void) {
  const id = setInterval(callback, 1000);
  return () => clearInterval(id);
}
function getSnapshot() {
  return Date.now();
}
function getServerSnapshot() {
  return 0; // fixed placeholder for SSR — avoids a server/client render mismatch
}

export function LiveClock({ clockFormat = "24h" }: { clockFormat?: "24h" | "12h" }) {
  const ts = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (ts === 0) return <div className="w-24" />;

  const now = new Date(ts);
  return (
    <div className="flex flex-col items-end leading-tight">
      <span className="text-2xl font-bold text-fg tabular-nums">
        {format(now, clockFormat === "12h" ? "h:mm:ss a" : "HH:mm:ss")}
      </span>
      <span className="text-xs text-fg-muted tabular-nums">{format(now, "M/d/yyyy")}</span>
    </div>
  );
}
