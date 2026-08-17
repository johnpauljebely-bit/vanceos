"use client";

import { LayoutGrid, PanelsTopLeft } from "lucide-react";
import { FloatingWindow } from "@/components/floating-window/FloatingWindow";
import { accentIdFromVar } from "@/lib/departmentAccent";
import type { LayoutMode } from "@/lib/layoutMode";
import { cn } from "@/lib/cn";

export function CadSettingsWindow({
  onClose,
  layoutMode,
  onLayoutModeChange,
  accentVar,
}: {
  onClose: () => void;
  layoutMode: LayoutMode;
  onLayoutModeChange: (mode: LayoutMode) => void;
  accentVar?: string;
}) {
  const accentId = accentIdFromVar(accentVar);
  const activeClass =
    accentId === "verify-green"
      ? "border-accent-verify-green bg-accent-verify-green/10 text-accent-verify-green"
      : "border-accent-blue bg-accent-blue/10 text-accent-blue";

  const options: { id: LayoutMode; label: string; description: string; icon: React.ReactNode }[] = [
    {
      id: "windows",
      label: "Windows",
      description: "Sidebar actions open floating, draggable windows over the map.",
      icon: <PanelsTopLeft size={18} />,
    },
    {
      id: "split",
      label: "Splitscreen",
      description:
        "Sidebar actions resize the map down to a side panel and use the rest of the screen for that tab's content.",
      icon: <LayoutGrid size={18} />,
    },
  ];

  return (
    <FloatingWindow title="Settings" onClose={onClose} width={480} accentVar={accentVar}>
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-bold text-fg">Dashboard Layout</h3>
          <p className="mt-1 text-xs text-fg-muted">
            Choose how Search, Call Lookup, Records, and the rest of the sidebar present their content.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onLayoutModeChange(opt.id)}
              className={cn(
                "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors",
                layoutMode === opt.id ? activeClass : "border-border-subtle text-fg hover:border-fg-muted",
              )}
            >
              {opt.icon}
              <span className="text-sm font-bold">{opt.label}</span>
              <span className="text-xs text-fg-muted">{opt.description}</span>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-fg-disabled">
          Splitscreen currently adapts Search and Call Lookup — other sidebar tabs still open as windows for now.
        </p>
      </div>
    </FloatingWindow>
  );
}
