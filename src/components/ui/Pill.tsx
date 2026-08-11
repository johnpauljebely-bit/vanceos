import { Shield } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Rounded pill, solid status-green background, bold dark text — used for
 * the unit badge (shield icon + callsign + department) and reused inline
 * as the Unit-column value in the Active Units table.
 */
export function Pill({
  children,
  icon,
  className,
  colorClassName,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  /** Solid background color class, e.g. from UNIT_STATUS_COLOR[status].bg — defaults to status-green. */
  colorClassName?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-black",
        colorClassName ?? "bg-accent-status-green",
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

export function UnitBadgePill({
  callsign,
  department,
  colorClassName,
  onClick,
}: {
  callsign: string;
  department: string;
  colorClassName?: string;
  onClick?: () => void;
}) {
  return (
    <button type="button" onClick={onClick} disabled={!onClick} className={onClick ? "cursor-pointer" : undefined}>
      <Pill icon={<Shield size={12} />} colorClassName={colorClassName}>
        {callsign} {department}
      </Pill>
    </button>
  );
}
