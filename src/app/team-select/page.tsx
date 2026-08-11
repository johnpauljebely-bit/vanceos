import { User, Shield, Star, BadgeCheck } from "lucide-react";
import { canAccessDepartmentAsync } from "@/lib/roles";
import { requireDiscordSession } from "@/lib/session";
import { TeamTile } from "@/components/team-select/TeamTile";
import { SignOutButton } from "@/components/ui/SignOutButton";

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

  const tiles = [
    { href: "/civilian", label: "Civilian", icon: <User size={40} />, enabled: civilianAccess },
    { href: "/leo/delta-pd/unit-select", label: "Delta Police", icon: <Shield size={40} />, enabled: deltaPdAccess },
    { href: "/leo/rcmp/unit-select", label: "RCMP", icon: <Star size={40} />, enabled: rcmpAccess },
    { href: "/leo/bchp/unit-select", label: "BCHP", icon: <BadgeCheck size={40} />, enabled: bchpAccess },
  ];

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-fg">Select a Team</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Signed in as {session.user?.name ?? session.user.discordId}
        </p>
        <div className="mt-2">
          <SignOutButton />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        {tiles.map((tile) => (
          <TeamTile key={tile.href} {...tile} />
        ))}
      </div>
    </main>
  );
}
