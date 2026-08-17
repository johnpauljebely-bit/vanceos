"use client";

import { Home, Search, PhoneIncoming, Settings } from "lucide-react";
import { accentIdFromVar } from "@/lib/departmentAccent";
import { cn } from "@/lib/cn";

type SidebarItemId = "home" | "search" | "call-lookup" | "settings";

/**
 * Left nav rail for the redesigned CAD dashboard — Home/Search/Call Lookup
 * open existing floating windows (nothing new functionally, just a new
 * entry point), Settings is a placeholder for future window/tile
 * customization, not wired to anything real yet.
 */
export function CadSidebar({
  active = "home",
  onHome,
  onSearch,
  onCallLookup,
  accentVar,
}: {
  active?: SidebarItemId;
  onHome?: () => void;
  onSearch: () => void;
  onCallLookup: () => void;
  accentVar?: string;
}) {
  const accentId = accentIdFromVar(accentVar);
  const accentActiveClass =
    accentId === "verify-green" ? "bg-accent-verify-green/15 text-accent-verify-green" : "bg-accent-blue/15 text-accent-blue";

  const items: { id: SidebarItemId; label: string; icon: React.ReactNode; onClick?: () => void; disabled?: boolean }[] = [
    { id: "home", label: "Home", icon: <Home size={18} />, onClick: onHome },
    { id: "search", label: "Search", icon: <Search size={18} />, onClick: onSearch },
    { id: "call-lookup", label: "Call Lookup", icon: <PhoneIncoming size={18} />, onClick: onCallLookup },
    { id: "settings", label: "Settings", icon: <Settings size={18} />, disabled: true },
  ];

  return (
    <aside className="flex w-16 shrink-0 flex-col items-center gap-1 border-r border-border-subtle bg-surface py-4">
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
