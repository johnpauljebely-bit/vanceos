import { redirect } from "next/navigation";
import { requireDiscordSession } from "@/lib/session";
import { getOrCreateCivilianProfile } from "@/db/queries/civilians";
import { GenderSetupForm } from "@/components/civilian/GenderSetupForm";

export default async function CivilianSetupPage() {
  const session = await requireDiscordSession();

  const profile = await getOrCreateCivilianProfile(session.user.discordId);
  if (!profile) redirect("/civilian"); // shows the "link first" state
  if (profile.gender) redirect("/civilian");

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-bg p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,var(--accent-light-red)_0%,transparent_60%)] opacity-[0.12]" />
      <div className="relative z-10">
        <GenderSetupForm />
      </div>
    </main>
  );
}
