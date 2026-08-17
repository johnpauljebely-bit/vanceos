import Link from "next/link";
import { redirect } from "next/navigation";
import { requireDiscordSession } from "@/lib/session";
import { getLinkForDiscordId, getOrCreateCivilianProfile } from "@/db/queries/civilians";
import { listCharacters, ensureDefaultCharacter } from "@/db/queries/characters";
import { CivilianPanel } from "@/components/civilian/CivilianPanel";

export default async function CivilianPortalPage() {
  const session = await requireDiscordSession();

  const link = await getLinkForDiscordId(session.user.discordId);
  if (!link) {
    return (
      <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-bg p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,var(--accent-light-red)_0%,transparent_60%)] opacity-[0.12]" />
        <div className="relative z-10 mx-auto flex max-w-lg flex-col items-center gap-4 text-center">
          <h1 className="text-xl font-bold text-fg">Link your account first</h1>
          <p className="text-sm text-fg-muted">
            You need to link your Discord and Roblox accounts in-game before a civilian identity can be
            created. Run <code className="rounded bg-surface-input px-1.5 py-0.5">/link</code> in Discord,
            then type <code className="rounded bg-surface-input px-1.5 py-0.5">;verify &lt;code&gt;</code> in
            game.
          </p>
          <Link href="/team-select" className="text-sm text-accent-light-red underline">
            Back to team select
          </Link>
        </div>
      </main>
    );
  }

  const profile = await getOrCreateCivilianProfile(session.user.discordId);
  if (!profile) {
    // Shouldn't happen given the link check above, but keep the blocking state consistent.
    redirect("/team-select");
  }

  if (!profile.gender) {
    redirect("/civilian/setup");
  }

  await ensureDefaultCharacter(session.user.discordId);
  const characters = await listCharacters(session.user.discordId);

  return <CivilianPanel initialCharacters={characters} balance={profile.balance} />;
}
