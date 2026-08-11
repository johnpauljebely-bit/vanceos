"use client";

import { useState } from "react";
import { UNIT_STATUSES, UNIT_STATUS_LABEL, UNIT_STATUS_COLOR, type UnitStatus } from "@/lib/unitStatus";
import { cn } from "@/lib/cn";

export function StatusDropdown({
  status,
  onChange,
}: {
  status: UnitStatus;
  onChange: (status: UnitStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const colors = UNIT_STATUS_COLOR[status];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium",
          colors.border,
          colors.text,
        )}
      >
        <span className={cn("h-2 w-2 rounded-full", colors.dot)} />
        {UNIT_STATUS_LABEL[status]}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-2 w-44 rounded-lg border border-border-subtle bg-surface py-1 shadow-2xl">
            {UNIT_STATUSES.map((s) => {
              const c = UNIT_STATUS_COLOR[s];
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    onChange(s);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-white/5",
                    s === status ? "font-bold text-fg" : "text-fg-muted",
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full", c.dot)} />
                  {UNIT_STATUS_LABEL[s]}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
