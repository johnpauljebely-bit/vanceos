import { redirect } from "next/navigation";
import { canAccessDepartmentAsync, LEO_DEPARTMENTS, type Department } from "@/lib/roles";
import { requireDiscordSession } from "@/lib/session";
import { listCallsignsForUser, getOwnershipCallsign } from "@/db/queries/callsigns";
import { UnitSelectCard } from "@/components/leo/UnitSelectCard";
import { DeltaPdUnitSelectCard } from "@/components/leo/DeltaPdUnitSelectCard";

export default async function UnitSelectPage({ params }: { params: Promise<{ dept: string }> }) {
  const { dept } = await params;
  const session = await requireDiscordSession();

  if (!LEO_DEPARTMENTS.includes(dept as (typeof LEO_DEPARTMENTS)[number])) {
    redirect("/team-select");
  }
  if (!(await canAccessDepartmentAsync(dept as Department, session.guildRoles, session.user.discordId))) {
    redirect("/team-select");
  }

  // Accent split per department: Delta PD = blue, RCMP/BCHP = green.
  const accentVar = dept === "rcmp" || dept === "bchp" ? "--accent-verify-green" : "--accent-blue";

  // Delta PD: self-chosen 400-499, not a pre-existing /callsign-assigned
  // row (the bot has no self-assign code path for this department yet).
  if (dept === "delta-pd") {
    return (
      <UnitSelectShell accentVar={accentVar}>
        <DeltaPdUnitSelectCard />
      </UnitSelectShell>
    );
  }

  const rows = await listCallsignsForUser(session.user.discordId, dept);

  if (rows.length === 0) {
    // "Unlock everything" for ownership: no real callsign in this
    // department, but holding an ownership row still gets them in, using
    // that as a stand-in unit identity for this department's CAD.
    const ownership = await getOwnershipCallsign(session.user.discordId);
    if (ownership) {
      return (
        <UnitSelectShell accentVar={accentVar}>
          <UnitSelectCard
            department={dept}
            callsigns={[{ department: dept, number: ownership.number, rank: "Ownership" }]}
          />
        </UnitSelectShell>
      );
    }

    return (
      <UnitSelectShell accentVar={accentVar}>
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4 text-center">
          <h1 className="text-xl font-bold text-fg">No callsign assigned yet</h1>
          <p className="text-sm text-fg-muted">
            You don&apos;t have a callsign in this department yet. Get one assigned via{" "}
            <code className="rounded bg-surface-input px-1.5 py-0.5">/callsign</code> in Discord, then come
            back here.
          </p>
        </div>
      </UnitSelectShell>
    );
  }

  return (
    <UnitSelectShell accentVar={accentVar}>
      <UnitSelectCard department={dept} callsigns={rows} />
    </UnitSelectShell>
  );
}

function UnitSelectShell({ children, accentVar }: { children: React.ReactNode; accentVar: string }) {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-bg p-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{ background: `radial-gradient(ellipse 80% 50% at 50% -10%, var(${accentVar}) 0%, transparent 60%)` }}
      />
      <div className="relative z-10 w-full">{children}</div>
    </main>
  );
}
