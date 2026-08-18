"use client";

import Image from "next/image";
import { Headset } from "lucide-react";
import { UnitBadgePill } from "@/components/ui/Pill";
import { CadAccountMenu } from "./CadAccountMenu";
import { LiveClock } from "./LiveClock";
import { StatusDropdown } from "./StatusDropdown";
import { PanicDropdown } from "./PanicDropdown";
import { QuickActionSearchBar, type QuickAction } from "./QuickActionSearchBar";
import { UNIT_STATUS_COLOR, type UnitStatus } from "@/lib/unitStatus";
import { accentIdForDepartment } from "@/lib/departmentAccent";
import { cn } from "@/lib/cn";

export type SelfDispatchState = "off" | "waiting" | "on";

/**
 * One navbar, not two. Everything that isn't a live status, a genuinely
 * urgent action (Panic), or identity/search lives in the sidebar instead —
 * see CadSidebar. Logo/wordmark on the left is Triton's actual brand, not
 * the old "VanceOS" leftover text.
 */
export function CadNavBar({
  department,
  unitNumber,
  status,
  onStatusChange,
  selfDispatchState,
  onRequestSelfDispatch,
  quickActions,
  onQuickAction,
  onOpenUnitManager,
  clockFormat,
}: {
  department: string;
  unitNumber: number;
  status: UnitStatus;
  onStatusChange: (status: UnitStatus) => void;
  selfDispatchState: SelfDispatchState;
  onRequestSelfDispatch: () => void;
  quickActions: QuickAction[];
  onQuickAction: (action: QuickAction) => void;
  onOpenUnitManager: () => void;
  clockFormat?: "24h" | "12h";
}) {
  const accentId = accentIdForDepartment(department);

  return (
    <div className="flex items-center gap-4 border-b border-border-subtle bg-surface px-5 py-2.5">
      <div className="flex items-center gap-2">
        <Image src="/brand/logo-white.png" alt="" width={22} height={22} className="opacity-90" />
        <span className="text-sm font-extrabold tracking-tight text-fg">Triton CAD</span>
      </div>

      <div className="h-5 w-px bg-border-subtle" />

      <UnitBadgePill
        callsign={String(unitNumber)}
        department={department.toUpperCase()}
        colorClassName={UNIT_STATUS_COLOR[status].bg}
        onClick={onOpenUnitManager}
      />

      <StatusDropdown status={status} onChange={onStatusChange} />

      <button
        type="button"
        onClick={onRequestSelfDispatch}
        disabled={selfDispatchState === "waiting"}
        aria-label={selfDispatchState === "on" ? "Self Dispatch active" : "Request Self Dispatch"}
        title={selfDispatchState === "waiting" ? "Awaiting approval..." : "Self Dispatch"}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full border transition-colors",
          selfDispatchState === "on"
            ? accentId === "verify-green"
              ? "border-accent-verify-green bg-accent-verify-green/10 text-accent-verify-green"
              : "border-accent-blue bg-accent-blue/10 text-accent-blue"
            : "border-border-subtle text-fg-muted hover:text-fg",
          selfDispatchState === "waiting" && "opacity-50",
        )}
      >
        <Headset size={14} />
      </button>

      <div className="min-w-0 flex-1 px-2">
        <QuickActionSearchBar actions={quickActions} onActionSelect={onQuickAction} />
      </div>

      <PanicDropdown />
      <LiveClock clockFormat={clockFormat} />
      <CadAccountMenu />
    </div>
  );
}
