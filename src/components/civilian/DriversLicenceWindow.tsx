"use client";

import { useState } from "react";
import { FilePlus, X } from "lucide-react";
import { FloatingWindow } from "@/components/floating-window/FloatingWindow";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import type { CharacterDetail } from "./CivilianCharacterCard";

function age(dob: string): number {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return 0;
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

export function DriversLicenceWindow({
  character,
  onClose,
  onSaved,
}: {
  character: CharacterDetail;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);

  async function create() {
    setSaving(true);
    await fetch("/api/civilian/licences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ characterId: character.id, type: "Driver" }),
    });
    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <FloatingWindow title="New: Drivers Licence" onClose={onClose} width={780} accentVar="--accent-light-red">
      <div className="flex flex-col gap-6">
        <section className="rounded-xl border border-border-subtle p-4 text-center">
          <h3 className="mb-4 text-left text-lg font-bold text-fg">Photo</h3>
          <div className="mx-auto flex h-48 w-full max-w-md items-center justify-center rounded-lg bg-bg text-sm text-fg-muted">
            {character.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={character.photoUrl} alt="Driver" className="h-full rounded-lg object-cover" />
            ) : (
              "Driver Photo (from your civilian character)"
            )}
          </div>
        </section>

        <section className="rounded-xl border border-border-subtle p-4">
          <h3 className="mb-3 text-lg font-bold text-fg">Licence Information</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label>Licence</Label>
              <div className="mt-1 text-sm text-accent-status-green">Active</div>
            </div>
            <ReadOnly label="Licence Number" value="Generated upon creation" />
            <div>
              <Label>Status</Label>
              <div className="mt-1 text-sm text-fg">Valid</div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <ReadOnly label="Points" value="0" />
            <ReadOnly label="Issued" value={new Date().toLocaleDateString()} />
          </div>
        </section>

        <section className="rounded-xl border border-border-subtle p-4">
          <div className="mb-3 flex items-center gap-3">
            <h3 className="text-lg font-bold text-fg">Driver Information</h3>
            <span className="rounded-lg border border-accent-teal px-2 py-1 text-xs text-accent-teal">Civilian</span>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <ReadOnly label="First Name" value={character.firstName} />
            <ReadOnly label="Last Name" value={character.lastName} />
            <ReadOnly label="DOB" value={character.dateOfBirth} />
            <ReadOnly label="Age" value={String(age(character.dateOfBirth))} />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ReadOnly label="Residence" value={character.address ?? "N/A"} />
            <ReadOnly label="Contact Number" value={character.phoneNumber ?? "N/A"} />
          </div>
        </section>

        <div className="flex gap-3">
          <Button variant="boxed" accent="teal" icon={<FilePlus size={14} />} onClick={create} disabled={saving}>
            {saving ? "Creating..." : "Create"}
          </Button>
          <Button variant="plain" accent="neutral" icon={<X size={14} />} onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </FloatingWindow>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-fg-muted">{value}</div>
    </div>
  );
}
