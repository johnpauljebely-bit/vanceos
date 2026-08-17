"use client";

import { useState } from "react";
import { FilePlus, X } from "lucide-react";
import { FloatingWindow } from "@/components/floating-window/FloatingWindow";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import type { CharacterDetail } from "./CivilianCharacterCard";

export function VehicleRegistrationWindow({
  character,
  onClose,
  onSaved,
}: {
  character: CharacterDetail;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [plate, setPlate] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [type, setType] = useState("");
  const [colour, setColour] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    if (!plate.trim() || !make.trim() || !model.trim() || !year.trim() || !type.trim() || !colour.trim()) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/civilian/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ characterId: character.id, plate, make, model, colour }),
    });
    if (res.ok) {
      onSaved();
      onClose();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error === "plate_taken" ? "That plate is already registered." : "Something went wrong.");
      setSaving(false);
    }
  }

  return (
    <FloatingWindow title="New: Vehicle Registration" onClose={onClose} width={780} accentVar="--accent-light-red">
      <div className="flex flex-col gap-6">
        <section className="rounded-xl border border-border-subtle p-4">
          <div className="mb-3 flex items-center gap-3">
            <h3 className="text-lg font-bold text-fg">Owner Information</h3>
            <span className="rounded-lg border border-accent-teal px-2 py-1 text-xs text-accent-teal">Civilian</span>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <ReadOnly label="First Name" value={character.firstName} />
            <ReadOnly label="M.I." value={character.middleInitial ?? "N/A"} />
            <ReadOnly label="Last Name" value={character.lastName} />
            <ReadOnly label="DOB" value={character.dateOfBirth} />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ReadOnly label="Residence" value={character.address ?? "N/A"} />
            <ReadOnly label="Contact Number" value={character.phoneNumber ?? "N/A"} />
          </div>
        </section>

        <section className="rounded-xl border border-border-subtle p-4">
          <h3 className="mb-3 text-lg font-bold text-fg">Vehicle Information</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ReadOnly label="Status" value="Active" valueClassName="text-accent-status-green" />
            <div>
              <Label required>Plate</Label>
              <Input value={plate} onChange={(e) => setPlate(e.target.value)} className="mt-1" />
            </div>
            <ReadOnly label="Issued" value={new Date().toLocaleDateString()} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-5">
            <div>
              <Label required>Make</Label>
              <Input value={make} onChange={(e) => setMake(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label required>Model</Label>
              <Input value={model} onChange={(e) => setModel(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label required>Year</Label>
              <Input value={year} onChange={(e) => setYear(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label required>Type</Label>
              <Input value={type} onChange={(e) => setType(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label required>Color</Label>
              <Input value={colour} onChange={(e) => setColour(e.target.value)} className="mt-1" />
            </div>
          </div>
        </section>

        {error && <p className="text-sm text-accent-red">{error}</p>}

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

function ReadOnly({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className={`mt-1 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-fg-muted ${valueClassName ?? ""}`}>
        {value}
      </div>
    </div>
  );
}
