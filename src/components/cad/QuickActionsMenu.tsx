"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Shuffle, Maximize, StickyNote, Search, FileText, Radar } from "lucide-react";
import { accentTextClassFromVar } from "@/lib/departmentAccent";
import { cn } from "@/lib/cn";

export function QuickActionsMenu({
  onOpenNotepad,
  onOpenLookup,
  onOpenRecords,
  accentVar,
}: {
  onOpenNotepad: () => void;
  onOpenLookup: () => void;
  onOpenRecords: () => void;
  accentVar?: string;
}) {
  const accentClass = accentTextClassFromVar(accentVar);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const items = [
    { label: "Switch Panel", icon: <Shuffle size={14} />, onClick: () => router.push("/team-select") },
    {
      label: "Enter Fullscreen",
      icon: <Maximize size={14} />,
      onClick: () => document.documentElement.requestFullscreen?.(),
    },
    { label: "Notepad", icon: <StickyNote size={14} />, onClick: onOpenNotepad },
    { label: "Lookup", icon: <Search size={14} />, onClick: onOpenLookup },
    { label: "Records", icon: <FileText size={14} />, onClick: onOpenRecords },
  ];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn("flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle hover:bg-white/5", accentClass)}
        aria-label="Quick actions"
      >
        <Radar size={18} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-2 w-52 rounded-lg border border-border-subtle bg-surface py-1 shadow-2xl">
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  item.onClick();
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-fg-muted hover:bg-white/5 hover:text-fg",
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
            <div className="my-1 border-t border-border-subtle" />
            <button
              type="button"
              onClick={() => router.push("/team-select")}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-accent-red hover:bg-white/5"
            >
              <LogOut size={14} />
              Leave
            </button>
          </div>
        </>
      )}
    </div>
  );
}
