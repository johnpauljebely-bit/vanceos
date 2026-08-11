import { redirect } from "next/navigation";
import { canAccessDepartmentAsync, LEO_DEPARTMENTS, type Department } from "@/lib/roles";
import { requireDiscordSession } from "@/lib/session";
import { getUnitSession, clearUnitSession } from "@/lib/unitSession";
import { isUnitOwnedByUser } from "@/db/queries/callsigns";
import { getActiveCallForUnit } from "@/db/queries/calls";
import { getLiveUnit } from "@/db/queries/liveUnits";
import { CadPanel } from "@/components/cad/CadPanel";

export default async function CadPage({ params }: { params: Promise<{ dept: string }> }) {
  const { dept } = await params;
  const session = await requireDiscordSession();

  if (!LEO_DEPARTMENTS.includes(dept as (typeof LEO_DEPARTMENTS)[number])) redirect("/team-select");
  if (!(await canAccessDepartmentAsync(dept as Department, session.guildRoles, session.user.discordId))) {
    redirect("/team-select");
  }

  const unit = await getUnitSession();
  if (!unit || unit.department !== dept) {
    redirect(`/leo/${dept}/unit-select`);
  }

  // The cookie can outlive the callsign it points at (removed, reassigned,
  // ownership revoked) — re-check against current data on every load
  // rather than trusting whatever was true when the cookie was set.
  if (!(await isUnitOwnedByUser(session.user.discordId, unit.department, unit.number))) {
    await clearUnitSession();
    redirect(`/leo/${dept}/unit-select`);
  }

  const [activeCall, liveUnit] = await Promise.all([
    getActiveCallForUnit(session.user.discordId),
    getLiveUnit(`${unit.department}-${unit.number}`),
  ]);

  return (
    <CadPanel
      department={dept}
      unitNumber={unit.number}
      initialCall={activeCall ? { id: activeCall.id, title: activeCall.title } : null}
      initialStatus={(liveUnit?.status as "available" | "unavailable" | "busy" | "enroute" | "on_scene") ?? "available"}
    />
  );
}
