import { canAccessDepartmentAsync } from "@/lib/roles";
import { requireDiscordSession } from "@/lib/session";
import { TeamSelectScreen } from "@/components/team-select/TeamSelectScreen";

export default async function TeamSelectPage() {
  const session = await requireDiscordSession();

  const guildRoles = session.guildRoles;
  const discordId = session.user.discordId;

  const [civilianAccess, deltaPdAccess, rcmpAccess, bchpAccess] = await Promise.all([
    canAccessDepartmentAsync("civilian", guildRoles, discordId),
    canAccessDepartmentAsync("delta-pd", guildRoles, discordId),
    canAccessDepartmentAsync("rcmp", guildRoles, discordId),
    canAccessDepartmentAsync("bchp", guildRoles, discordId),
  ]);

  return (
    <TeamSelectScreen
      userName={session.user?.name ?? "Officer"}
      userImage={session.user?.image ?? null}
      civilianAccess={civilianAccess}
      deltaPdAccess={deltaPdAccess}
      rcmpAccess={rcmpAccess}
      bchpAccess={bchpAccess}
    />
  );
}
