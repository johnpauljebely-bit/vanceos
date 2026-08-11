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

  // Delta PD: self-chosen 400-499, not a pre-existing /callsign-assigned
  // row (the bot has no self-assign code path for this department yet).
  if (dept === "delta-pd") {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <DeltaPdUnitSelectCard />
      </main>
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
        <main className="flex flex-1 items-center justify-center p-8">
          <UnitSelectCard
            department={dept}
            callsigns={[{ department: dept, number: ownership.number, rank: "Ownership" }]}
          />
        </main>
      );
    }

    return (
      <main className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-xl font-bold text-fg">No callsign assigned yet</h1>
        <p className="text-sm text-fg-muted">
          You don&apos;t have a callsign in this department yet. Get one assigned via{" "}
          <code className="rounded bg-surface-input px-1.5 py-0.5">/callsign</code> in Discord, then come
          back here.
        </p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <UnitSelectCard department={dept} callsigns={rows} />
    </main>
  );
}
