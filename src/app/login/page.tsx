import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/Button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await auth();

  // A session with no discordId is stale/broken (e.g. minted before an auth
  // fix) — never bounce it straight to team-select, since every protected
  // page would then hit a DB error on an empty discordId. Only auto-forward
  // healthy sessions.
  if (session && session.user.discordId && error !== "stale_session") {
    redirect("/team-select");
  }

  const stale = Boolean(session) && !session?.user.discordId;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-bold text-fg">VanceOS</h1>
        <p className="text-xs uppercase tracking-wide text-fg-muted">Computer Managed Dispatch</p>
        <p className="text-sm text-fg-muted">Sign in with your linked Discord account to continue.</p>
      </div>

      {stale ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border-subtle bg-surface p-6 text-center">
          <p className="max-w-sm text-sm text-fg-muted">
            Your session is stale and needs to be refreshed. Sign out, then sign back in.
          </p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button type="submit" variant="boxed" accent="red" className="px-6 py-3 text-base">
              Sign Out
            </Button>
          </form>
        </div>
      ) : (
        <form
          action={async () => {
            "use server";
            await signIn("discord", { redirectTo: "/team-select" });
          }}
        >
          <Button type="submit" variant="boxed" accent="teal" className="px-6 py-3 text-base">
            Sign in with Discord
          </Button>
        </form>
      )}
    </main>
  );
}
