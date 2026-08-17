"use client";

import { useEffect, useState } from "react";
import { Check, Plus } from "lucide-react";
import { FloatingWindow } from "@/components/floating-window/FloatingWindow";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { DataTable, DataRow, DataCell } from "@/components/ui/DataTable";

interface CharacterRow {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
}

export function ManageCharactersWindow({
  currentCharacterId,
  onClose,
  onSelect,
}: {
  currentCharacterId: number | null;
  onClose: () => void;
  onSelect: (id: number) => void;
}) {
  const [characters, setCharacters] = useState<CharacterRow[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Characters must be 13+ — also enforced server-side, this just keeps the
  // date picker from offering invalid dates in the first place.
  const maxDob = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 13);
    return d.toISOString().slice(0, 10);
  })();

  function refresh() {
    fetch("/api/civilian/characters")
      .then((r) => r.json())
      .then((data) => setCharacters(data.characters ?? []));
  }

  useEffect(refresh, []);

  async function addCharacter(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    const res = await fetch("/api/civilian/characters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, dateOfBirth }),
    });
    if (res.ok) {
      const { character } = await res.json();
      setFirstName("");
      setLastName("");
      setDateOfBirth("");
      setShowForm(false);
      refresh();
      onSelect(character.id);
    } else {
      const body = await res.json().catch(() => null);
      const fieldError = body?.details?.fieldErrors?.dateOfBirth?.[0];
      setFormError(fieldError ?? "Couldn't save that character — check the fields and try again.");
    }
    setSaving(false);
  }

  return (
    <FloatingWindow title="Manage Characters" onClose={onClose} width={720} accentVar="--accent-light-red">
      <div className="flex flex-col gap-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-fg">Manage Characters</h2>
          <p className="mt-1 text-sm text-fg-muted">View and manage all your civilian characters</p>
        </div>

        {showForm && (
          <form onSubmit={addCharacter} className="grid grid-cols-1 gap-3 rounded-lg border border-border-subtle p-4 sm:grid-cols-3">
            <div>
              <Label required>First Name</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="mt-1" />
            </div>
            <div>
              <Label required>Last Name</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required className="mt-1" />
            </div>
            <div>
              <Label required>Date of Birth</Label>
              <Input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={maxDob}
                required
                className="mt-1"
              />
            </div>
            {formError && <p className="text-xs text-accent-red sm:col-span-3">{formError}</p>}
            <Button type="submit" variant="boxed" accent="blue" disabled={saving} className="self-start sm:col-span-3">
              {saving ? "Saving..." : "Save"}
            </Button>
          </form>
        )}

        <DataTable columns={["", "First Name", "Last Name", "DoB"]} isEmpty={!characters || characters.length === 0}>
          {characters?.map((c) => (
            <DataRow key={c.id}>
              <DataCell>{c.id === currentCharacterId && <Check size={14} className="text-accent-blue" />}</DataCell>
              <DataCell>
                <button type="button" onClick={() => onSelect(c.id)} className="text-fg hover:text-accent-blue">
                  {c.firstName}
                </button>
              </DataCell>
              <DataCell>{c.lastName}</DataCell>
              <DataCell>{c.dateOfBirth}</DataCell>
            </DataRow>
          ))}
        </DataTable>

        <div className="flex items-center justify-between border-t border-border-subtle pt-4">
          <Button variant="plain" accent="neutral" onClick={onClose}>
            Close
          </Button>
          <Button variant="boxed" accent="blue" icon={<Plus size={14} />} onClick={() => setShowForm((v) => !v)}>
            Add Character
          </Button>
        </div>
      </div>
    </FloatingWindow>
  );
}
