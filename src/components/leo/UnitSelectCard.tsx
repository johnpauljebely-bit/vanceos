"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Plus, Check } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface CallsignRow {
  department: string;
  number: number;
  rank: string;
}

interface UnitProfile {
  id: number;
  rpName: string;
  agency: string | null;
  subdivision: string | null;
  items: string | null;
}

const DEPT_LABEL: Record<string, string> = {
  "delta-pd": "Delta Police",
  rcmp: "RCMP",
  bchp: "BCHP",
};

const MAX_PROFILES = 3;

export function UnitSelectCard({ department, callsigns }: { department: string; callsigns: CallsignRow[] }) {
  const [selected, setSelected] = useState<CallsignRow | null>(callsigns[0] ?? null);
  const [profiles, setProfiles] = useState<UnitProfile[] | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [rpName, setRpName] = useState("");
  const [agency, setAgency] = useState(DEPT_LABEL[department] ?? department);
  const [subdivision, setSubdivision] = useState("");
  const [items, setItems] = useState("");
  const [entering, setEntering] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/leo/unit-profiles?department=${department}`)
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
  }, [department]);

  const selectedProfile = profiles?.find((p) => p.id === selectedProfileId) ?? null;
  const atLimit = (profiles?.length ?? 0) >= MAX_PROFILES;

  async function enterCad() {
    if (!selected) return;
    setEntering(true);

    let unitInput: { rpName: string; agency?: string; subdivision?: string; items?: string };
    if (showNewForm) {
      if (!rpName.trim()) {
        setEntering(false);
        return;
      }
      unitInput = {
        rpName,
        agency: agency || undefined,
        subdivision: subdivision || undefined,
        items: items || undefined,
      };
      // Save this as a reusable unit profile for next shift — best-effort,
      // don't block entering the CAD if saving happens to fail.
      await fetch("/api/leo/unit-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ department, ...unitInput }),
      }).catch(() => {});
    } else {
      if (!selectedProfile) {
        setEntering(false);
        return;
      }
      unitInput = {
        rpName: selectedProfile.rpName,
        agency: selectedProfile.agency ?? undefined,
        subdivision: selectedProfile.subdivision ?? undefined,
        items: selectedProfile.items ?? undefined,
      };
    }

    const res = await fetch("/api/leo/unit-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        department: selected.department,
        number: selected.number,
        ...unitInput,
      }),
    });
    if (res.ok) {
      router.push(`/leo/${department}/cad`);
    } else {
      setEntering(false);
    }
  }

  const canEnter = showNewForm ? rpName.trim().length > 0 : Boolean(selectedProfile);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 rounded-2xl border border-border-subtle bg-surface p-6">
      <h1 className="text-xl font-bold text-fg">{DEPT_LABEL[department] ?? department} — Select Unit</h1>

      <div className="flex flex-col gap-2">
        {callsigns.map((c) => {
          const key = `${c.department}-${c.number}`;
          const isSelected = selected?.number === c.number;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(c)}
              className={cn(
                "flex items-center justify-between rounded-lg border px-4 py-3 text-left",
                isSelected ? "border-accent-blue text-accent-blue" : "border-border-subtle text-fg hover:border-fg-muted",
              )}
            >
              <span className="inline-flex items-center gap-2 font-semibold">
                <Lock size={12} className="text-fg-muted" />
                {c.number}
              </span>
              <span className="text-sm text-fg-muted">{c.rank}</span>
            </button>
          );
        })}
      </div>

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
                  "flex items-center justify-between rounded-lg border px-4 py-3 text-left",
                  selectedProfileId === p.id
                    ? "border-accent-blue text-accent-blue"
                    : "border-border-subtle text-fg hover:border-fg-muted",
                )}
              >
                <div>
                  <div className="font-semibold">{p.rpName}</div>
                  <div className="text-xs text-fg-muted">
                    {[p.agency, p.subdivision].filter(Boolean).join(" — ") || "No agency/subdivision set"}
                  </div>
                </div>
                {selectedProfileId === p.id && <Check size={16} />}
              </button>
            ))}
          </div>
          <Button
            variant="plain"
            accent="blue"
            icon={<Plus size={14} />}
            disabled={atLimit}
            onClick={() => setShowNewForm(true)}
            className="self-start"
          >
            {atLimit ? `Max ${MAX_PROFILES} units reached` : "Make a new unit"}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Label required>RP Name</Label>
            {profiles.length > 0 && (
              <button
                type="button"
                onClick={() => setShowNewForm(false)}
                className="text-xs text-accent-blue hover:underline"
              >
                Use a saved unit instead
              </button>
            )}
          </div>
          <Input
            value={rpName}
            onChange={(e) => setRpName(e.target.value)}
            placeholder="Character name for this shift"
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label>Agency</Label>
              <Input value={agency} onChange={(e) => setAgency(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Subdivision</Label>
              <Input
                value={subdivision}
                onChange={(e) => setSubdivision(e.target.value)}
                placeholder="e.g. K9, SWAT, Patrol"
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label>Items / Abilities</Label>
            <Input
              value={items}
              onChange={(e) => setItems(e.target.value)}
              placeholder="Equipment, tools, abilities"
              className="mt-1"
            />
          </div>
        </div>
      )}

      <Button
        variant="boxed"
        accent="blue"
        disabled={!selected || !canEnter || entering}
        onClick={enterCad}
        className="justify-center py-3 text-base"
      >
        {entering ? "Entering..." : "Enter CAD"}
      </Button>
    </div>
  );
}
