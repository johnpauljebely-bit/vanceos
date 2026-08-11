"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Plus, Check } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const MIN = 400;
const MAX = 499;
const MAX_PROFILES = 3;

type LiveCheck = { online: boolean; callsign: string | null } | null;

interface UnitProfile {
  id: number;
  rpName: string;
}

export function DeltaPdUnitSelectCard() {
  const [liveCallsign, setLiveCallsign] = useState<LiveCheck>(null);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<UnitProfile[] | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [rpName, setRpName] = useState("");
  const [entering, setEntering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/leo/live-callsign")
      .then((r) => r.json())
      .then((data) => setLiveCallsign(data))
      .catch(() => setLiveCallsign({ online: false, callsign: null }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/leo/unit-profiles?department=delta-pd")
      .then((r) => r.json())
      .then((data: { profiles: UnitProfile[] }) => {
        setProfiles(data.profiles ?? []);
        if (data.profiles?.length) {
          setSelectedProfileId(data.profiles[0].id);
        } else {
          setShowNewForm(true);
        }
      })
      .catch(() => {
        setProfiles([]);
        setShowNewForm(true);
      });
  }, []);

  const selectedProfile = profiles?.find((p) => p.id === selectedProfileId) ?? null;
  const atLimit = (profiles?.length ?? 0) >= MAX_PROFILES;
  const activeRpName = showNewForm ? rpName : (selectedProfile?.rpName ?? "");

  const number = liveCallsign?.online ? liveCallsign.callsign : null;
  const parsedNumber = number ? Number(number) : NaN;
  const inRange = number !== null && /^\d+$/.test(number) && parsedNumber >= MIN && parsedNumber <= MAX;

  async function enterCad() {
    if (!inRange || !activeRpName.trim()) return;
    setEntering(true);
    setError(null);

    if (showNewForm) {
      // Best-effort save as a reusable unit — don't block entering on it failing.
      await fetch("/api/leo/unit-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ department: "delta-pd", rpName: activeRpName }),
      }).catch(() => {});
    }

    const res = await fetch("/api/leo/unit-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        department: "delta-pd",
        number: parsedNumber,
        rpName: activeRpName,
        agency: "Delta Police",
      }),
    });
    if (res.ok) {
      router.push("/leo/delta-pd/cad");
    } else {
      const body = await res.json().catch(() => ({}));
      setError(
        body.error === "taken"
          ? "That number is already in use by another officer — pick a different one."
          : body.error === "out_of_range"
            ? `Callsign must be between ${MIN} and ${MAX}.`
            : body.error === "not_live"
              ? "Couldn't verify your live in-game callsign — get online in ER:LC and try again."
              : "Something went wrong.",
      );
      setEntering(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 rounded-2xl border border-border-subtle bg-surface p-6">
      <div>
        <h1 className="text-xl font-bold text-fg">Delta Police — Select Unit</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Delta PD callsigns are based on your live in-game callsign only — nothing to type here.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-fg-muted">Checking your live in-game status...</p>
      ) : !liveCallsign?.online ? (
        <div className="rounded-lg border border-border-subtle bg-bg p-4 text-sm text-fg-muted">
          You need to be online in ER:LC with your Delta PD callsign set before you can onboard here.
          Join the server, set your callsign ({MIN}–{MAX}), then come back and refresh this page.
        </div>
      ) : !inRange ? (
        <div className="rounded-lg border border-accent-red bg-bg p-4 text-sm text-accent-red">
          Your live in-game callsign ({liveCallsign.callsign}) isn&apos;t a valid Delta PD number ({MIN}–{MAX}).
          Fix it in-game, then refresh this page.
        </div>
      ) : (
        <div className="rounded-lg border border-accent-status-green bg-bg p-4">
          <Label>Callsign (from your live in-game status)</Label>
          <div className="mt-1 flex items-center gap-2">
            <Input value={number ?? ""} readOnly disabled className="flex-1" />
            <CheckCircle2 size={18} className="text-accent-status-green" />
          </div>
        </div>
      )}

      {profiles === null ? (
        <p className="text-sm text-fg-muted">Loading your saved units...</p>
      ) : !showNewForm ? (
        <div className="flex flex-col gap-3">
          <Label>Your Units</Label>
          <div className="flex flex-col gap-2">
            {profiles.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedProfileId(p.id)}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-4 py-3 text-left font-semibold",
                  selectedProfileId === p.id
                    ? "border-accent-teal text-accent-teal"
                    : "border-border-subtle text-fg hover:border-fg-muted",
                )}
              >
                {p.rpName}
                {selectedProfileId === p.id && <Check size={16} />}
              </button>
            ))}
          </div>
          <Button
            variant="plain"
            accent="teal"
            icon={<Plus size={14} />}
            disabled={atLimit}
            onClick={() => setShowNewForm(true)}
            className="self-start"
          >
            {atLimit ? `Max ${MAX_PROFILES} units reached` : "Make a new unit"}
          </Button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between">
            <Label required>RP Name</Label>
            {profiles.length > 0 && (
              <button
                type="button"
                onClick={() => setShowNewForm(false)}
                className="text-xs text-accent-teal hover:underline"
              >
                Use a saved unit instead
              </button>
            )}
          </div>
          <Input
            value={rpName}
            onChange={(e) => setRpName(e.target.value)}
            placeholder="Character name for this shift"
            className="mt-1"
          />
        </div>
      )}

      {error && <p className="text-sm text-accent-red">{error}</p>}

      <Button
        variant="boxed"
        accent="teal"
        disabled={!inRange || !activeRpName.trim() || entering}
        onClick={enterCad}
        className="justify-center py-3 text-base"
      >
        {entering ? "Entering..." : "Enter CAD"}
      </Button>
    </div>
  );
}
