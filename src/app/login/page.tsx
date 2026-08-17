import Image from "next/image";
import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/Button";

function DiscordMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.099.245.198.372.291a.077.077 0 0 1-.006.128 12.3 12.3 0 0 1-1.873.892.076.076 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.834 19.834 0 0 0 6.002-3.03.077.077 0 0 0 .032-.056c.5-5.177-.838-9.674-3.548-13.66a.061.061 0 0 0-.031-.028ZM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.955 2.419-2.157 2.419Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.946 2.419-2.157 2.419Z" />
    </svg>
  );
}

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
    <main className="relative flex min-h-screen w-full items-center justify-end overflow-hidden bg-black p-6 sm:p-12">
      <Image
        src="/brand/login-bg.png"
        alt=""
        fill
        priority
        className="object-cover opacity-70"
      />
      {/* Left→right dark scrim: image stays legible on the left, text sits on solid dark on the right. */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-black/70 to-black" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-8 text-center sm:items-end sm:text-right">
        <Image src="/brand/logo-white.png" alt="Triton CAD" width={56} height={56} className="opacity-90" />

        <div className="flex flex-col items-center gap-3 sm:items-end">
          <h1 className="text-4xl font-extrabold tracking-tight text-white">Log in to Triton CAD</h1>
          <p className="max-w-sm text-sm text-white/60">
            Use Discord to sign in. Access is secured and permission-gated for you and your team.
          </p>
        </div>

        {stale ? (
          <div className="flex w-full flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm sm:items-end sm:text-right">
            <p className="max-w-sm text-sm text-white/60">
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
            className="w-full"
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-accent-blue px-6 py-3.5 text-base font-bold text-accent-blue-fg shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
              <DiscordMark />
              Continue with Discord
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
