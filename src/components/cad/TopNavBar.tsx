"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Headset, Car } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SignOutButton } from "@/components/ui/SignOutButton";
import { LiveClock } from "./LiveClock";
import { StatusDropdown } from "./StatusDropdown";
import { PanicDropdown } from "./PanicDropdown";
import { QuickActionsMenu } from "./QuickActionsMenu";
import { QuickActionSearchBar, type QuickAction } from "./QuickActionSearchBar";
import type { UnitStatus } from "@/lib/unitStatus";
import { cn } from "@/lib/cn";

export type SelfDispatchState = "off" | "waiting" | "on";

export function TopNavBar({
  department,
  status,
  onStatusChange,
  selfDispatchState,
  onRequestSelfDispatch,
  onOpenTrafficStop,
  onOpenNotepad,
  onOpenLookup,
  onOpenRecords,
  quickActions,
  onQuickAction,
}: {
  department: string;
  status: UnitStatus;
  onStatusChange: (status: UnitStatus) => void;
  selfDispatchState: SelfDispatchState;
  onRequestSelfDispatch: () => void;
  onOpenTrafficStop: () => void;
  onOpenNotepad: () => void;
  onOpenLookup: () => void;
  onOpenRecords: () => void;
  quickActions: QuickAction[];
  onQuickAction: (action: QuickAction) => void;
}) {
  const pathname = usePathname();
  const cadHref = `/leo/${department}/cad`;
  const mapHref = `/leo/${department}/cad/map`;
  const isHome = pathname === cadHref;
  const isMap = pathname === mapHref;

  return (
    <div className="flex items-center gap-4 border-b border-border-subtle bg-surface px-4 py-3">
      <QuickActionsMenu onOpenNotepad={onOpenNotepad} onOpenLookup={onOpenLookup} onOpenRecords={onOpenRecords} />

      <StatusDropdown status={status} onChange={onStatusChange} />

      <nav className="flex items-center gap-4">
        <Link
          href={cadHref}
          className={cn(
            "text-sm font-bold",
            isHome ? "text-accent-blue" : "text-fg-muted hover:text-fg",
          )}
        >
          Home
        </Link>
        <Link
          href={mapHref}
          className={cn(
            "inline-flex items-center gap-1.5 text-sm font-medium",
            isMap ? "text-accent-blue" : "text-fg-muted hover:text-fg",
          )}
        >
          <Map size={14} /> Map
        </Link>
        <Button
          variant="plain"
          accent={selfDispatchState === "on" ? "blue" : "neutral"}
          active={selfDispatchState === "on"}
          onClick={onRequestSelfDispatch}
          disabled={selfDispatchState === "waiting"}
          icon={<Headset size={14} />}
          title="Requires approval from an available HR — sends a request when you click it."
        >
          {selfDispatchState === "waiting" ? "Awaiting approval..." : "Self Dispatch"}
        </Button>
        <Button variant="plain" accent="neutral" icon={<Car size={14} />} onClick={onOpenTrafficStop}>
          Traffic Stop
        </Button>
      </nav>

      <div className="ml-auto flex items-center gap-3">
        <PanicDropdown />
        <QuickActionSearchBar actions={quickActions} onActionSelect={onQuickAction} />
        <LiveClock />
        <SignOutButton />
      </div>
    </div>
  );
}
