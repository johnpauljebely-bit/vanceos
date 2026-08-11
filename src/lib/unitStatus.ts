export const UNIT_STATUSES = ["available", "unavailable", "busy", "enroute", "on_scene"] as const;
export type UnitStatus = (typeof UNIT_STATUSES)[number];

export const UNIT_STATUS_LABEL: Record<UnitStatus, string> = {
  available: "Available",
  unavailable: "Unavailable",
  busy: "Busy",
  enroute: "Enroute",
  on_scene: "On-Scene",
};

/**
 * One color per status, shared by the top-nav status pill, the status
 * dropdown, and a unit's own row in the Active Units table — so all three
 * always agree on what a given status looks like.
 */
export const UNIT_STATUS_COLOR: Record<UnitStatus, { dot: string; text: string; border: string; bg: string }> = {
  available: { dot: "bg-accent-status-green", text: "text-accent-status-green", border: "border-accent-status-green", bg: "bg-accent-status-green" },
  unavailable: { dot: "bg-accent-red", text: "text-accent-red", border: "border-accent-red", bg: "bg-accent-red" },
  busy: { dot: "bg-amber-500", text: "text-amber-500", border: "border-amber-500", bg: "bg-amber-500" },
  enroute: { dot: "bg-blue-500", text: "text-blue-500", border: "border-blue-500", bg: "bg-blue-500" },
  on_scene: { dot: "bg-purple-500", text: "text-purple-500", border: "border-purple-500", bg: "bg-purple-500" },
};
