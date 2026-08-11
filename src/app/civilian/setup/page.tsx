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
    <main className="flex flex-1 items-center justify-center p-8">
      <GenderSetupForm />
    </main>
  );
}
