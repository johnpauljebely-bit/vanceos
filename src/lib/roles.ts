import { hasOwnershipCallsign } from "@/db/queries/callsigns";

/**
 * RCMP and BCHP team-select tiles both gate on this single shared Discord
 * role (confirmed with the user: one role covers both departments at this
 * gate, not two separate roles).
 *
 * This is DELIBERATELY distinct from the bot's `CALLSIGN_ADMIN_ROLE_IDS` /
 * `DISPATCH_ADMIN_ROLE_IDS` (delta-city-dispatch/src/config.ts), which gate
 * who can *run* `/callsign` (admin/top-rank permission) — not general
 * department membership. Don't conflate the two.
 */
export const RCMP_BCHP_GATE_ROLE_ID = "1535866581823922233";

/**
 * Delta PD callsigns are NOT assigned via the bot's `/callsign` (that
 * command only has a real implementation for rcmp/bchp today — Delta PD
 * self-assign has no bot-side code path yet). Per the brief: self-chosen,
 * just needs to be unique and in range — so the CAD lets an officer pick
 * their own number here, range-checked and uniqueness-checked against the
 * shared `callsigns` table, rather than requiring a pre-existing row.
 */
export const DELTA_PD_CALLSIGN_RANGE = { min: 400, max: 499 } as const;

export type Department = "civilian" | "delta-pd" | "rcmp" | "bchp";
export const LEO_DEPARTMENTS = ["delta-pd", "rcmp", "bchp"] as const;
export type LeoDepartment = (typeof LEO_DEPARTMENTS)[number];

export function canAccessDepartment(dept: Department, guildRoles: string[]): boolean {
  if (dept === "civilian" || dept === "delta-pd") return true; // open to any logged-in user
  return guildRoles.includes(RCMP_BCHP_GATE_ROLE_ID);
}

/**
 * Ownership (department='ownership', callsign 100-199 — see
 * BOT_SIDE_INSTRUCTIONS.md #5 update / COORDINATION.md) unlocks full CAD
 * access across every department, confirmed with the user. This ORs with
 * the role-based check rather than replacing it — an owner doesn't need
 * the RCMP_BCHP_GATE_ROLE_ID role, but everyone else still does.
 */
export async function canAccessDepartmentAsync(
  dept: Department,
  guildRoles: string[],
  discordId: string,
): Promise<boolean> {
  if (canAccessDepartment(dept, guildRoles)) return true;
  return hasOwnershipCallsign(discordId);
}
