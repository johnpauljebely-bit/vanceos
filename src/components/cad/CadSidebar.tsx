"use client";

import { Home, Search, PhoneIncoming, Gavel, Car, StickyNote, Settings } from "lucide-react";
import { accentIdFromVar } from "@/lib/departmentAccent";
import { NewRecordDropdown } from "./NewRecordDropdown";
import type { RecordType } from "./RecordFormWindow";
import { cn } from "@/lib/cn";

interface DraftSummary {
  id: number;
  recordType: RecordType;
  createdAt: string;
}

export type SidebarItemId =
  | "home"
  | "search"
  | "call-lookup"
  | "records"
  | "traffic-stop"
  | "notepad"
  | "settings";

/**
 * Left nav rail — everything that isn't a live status or genuinely urgent
 * (those stay in CadNavBar) lives here instead of scattered across two
 * toolbars.
 */
export function CadSidebar({
  active = "home",
  onHome,
  onSearch,
  onCallLookup,
  onRecords,
  onTrafficStop,
  onNotepad,
  onSettings,
  onCreateRecord,
  onOpenDraft,
  onOpenWarrantsBolosTab,
  accentVar,
}: {
  active?: SidebarItemId;
  onHome?: () => void;
  onSearch: () => void;
  onCallLookup: () => void;
  onRecords: () => void;
  onTrafficStop: () => void;
  onNotepad: () => void;
  onSettings: () => void;
  onCreateRecord: (type: RecordType) => void;
  onOpenDraft: (draft: DraftSummary) => void;
  onOpenWarrantsBolosTab: (tab: "warrants" | "bolos") => void;
  accentVar?: string;
}) {
  const accentId = accentIdFromVar(accentVar);
  const accent = accentId === "verify-green" ? "verify-green" : "blue";
  const accentClass = accentId === "verify-green" ? "text-accent-verify-green" : "text-accent-blue";
  const accentActiveClass =
    accentId === "verify-green" ? "bg-accent-verify-green/15 text-accent-verify-green" : "bg-accent-blue/15 text-accent-blue";

  const items: { id: SidebarItemId; label: string; icon: React.ReactNode; onClick?: () => void; disabled?: boolean }[] = [
    { id: "search", label: "Search", icon: <Search size={18} />, onClick: onSearch },
    { id: "call-lookup", label: "Call Lookup", icon: <PhoneIncoming size={18} />, onClick: onCallLookup },
    { id: "records", label: "Records & Warrants", icon: <Gavel size={18} />, onClick: onRecords },
    { id: "traffic-stop", label: "Traffic Stop", icon: <Car size={18} />, onClick: onTrafficStop },
    { id: "notepad", label: "Notepad", icon: <StickyNote size={18} />, onClick: onNotepad },
    { id: "settings", label: "Settings", icon: <Settings size={18} />, onClick: onSettings },
  ];

  return (
    <aside className="flex w-16 shrink-0 flex-col items-center gap-1 border-r border-border-subtle bg-surface py-4">
      <button
        type="button"
        onClick={onHome}
        title="Home"
        aria-label="Home"
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-xl text-fg-muted transition-colors hover:bg-white/5 hover:text-fg",
          active === "home" && accentActiveClass,
        )}
      >
        <Home size={18} />
      </button>
      <NewRecordDropdown
        onCreateNew={onCreateRecord}
        onOpenDraft={onOpenDraft}
        onOpenWarrantsBolos={onOpenWarrantsBolosTab}
        accent={accent}
        accentClass={accentClass}
        iconOnly
      />
      <div className="my-1 h-px w-8 bg-border-subtle" />
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={item.onClick}
          disabled={item.disabled}
          title={item.disabled ? `${item.label} (coming soon)` : item.label}
          aria-label={item.label}
          className={cn(
            "flex h-11 w-11 flex-col items-center justify-center gap-0.5 rounded-xl text-fg-muted transition-colors",
            !item.disabled && "hover:bg-white/5 hover:text-fg",
            item.disabled && "opacity-30",
            active === item.id && !item.disabled && accentActiveClass,
          )}
        >
          {item.icon}
        </button>
      ))}
    </aside>
  );
}
