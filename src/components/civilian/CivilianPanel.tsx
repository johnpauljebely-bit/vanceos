"use client";

import { useState } from "react";
import { WindowManagerProvider } from "@/components/floating-window/WindowManagerProvider";
import { CivilianTopToolbar } from "./CivilianTopToolbar";
import { CivilianCharacterCard, type CharacterDetail } from "./CivilianCharacterCard";
import { CivilianCharacterEditWindow } from "./CivilianCharacterEditWindow";
import { ManageCharactersWindow } from "./ManageCharactersWindow";
import { CitationsWindow } from "./CitationsWindow";
import { NineOneOneWindow } from "./NineOneOneWindow";
import { VehicleRegistrationWindow } from "./VehicleRegistrationWindow";
import { DriversLicenceWindow } from "./DriversLicenceWindow";
import type { CivilianRecordType } from "./CivilianNewRecordDropdown";
import { Select } from "@/components/ui/Select";
import { Label } from "@/components/ui/Label";

export function CivilianPanel({
  initialCharacters,
  balance,
}: {
  initialCharacters: CharacterDetail[];
  balance: string;
}) {
  const [characters, setCharacters] = useState(initialCharacters);
  const [selectedId, setSelectedId] = useState<number | null>(initialCharacters[0]?.id ?? null);
  const [manageOpen, setManageOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [citationsOpen, setCitationsOpen] = useState(false);
  const [nineOneOneOpen, setNineOneOneOpen] = useState(false);
  const [threeOneOneOpen, setThreeOneOneOpen] = useState(false);
  const [recordForm, setRecordForm] = useState<CivilianRecordType | null>(null);

  const selected = characters.find((c) => c.id === selectedId) ?? characters[0] ?? null;

  function refreshCharacters() {
    fetch("/api/civilian/characters")
      .then((r) => r.json())
      .then((data) => setCharacters(data.characters ?? []));
  }

  async function regenerateSsn() {
    if (!selected) return;
    await fetch(`/api/civilian/characters/${selected.id}/regenerate-ssn`, { method: "POST" });
    refreshCharacters();
  }

  return (
    <WindowManagerProvider>
      <div className="flex flex-1 flex-col">
        <CivilianTopToolbar
          onManageCharacters={() => setManageOpen(true)}
          onMyRecords={() => setCitationsOpen(true)}
          onNewRecord={(type) => setRecordForm(type)}
          on911={() => setNineOneOneOpen(true)}
          on311={() => setThreeOneOneOpen(true)}
        />

        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-8">
          <div className="rounded-2xl border border-border-subtle bg-surface p-4">
            <Label>Select Character</Label>
            <Select
              value={selectedId ?? ""}
              onChange={(e) => setSelectedId(Number(e.target.value))}
              className="mt-1"
            >
              {characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} ({c.dateOfBirth})
                </option>
              ))}
            </Select>
          </div>

          {selected && (
            <CivilianCharacterCard
              character={selected}
              balance={balance}
              onEdit={() => setEditOpen(true)}
              onRegenerateSsn={regenerateSsn}
              onRefresh={refreshCharacters}
            />
          )}
        </div>
      </div>

      {manageOpen && (
        <ManageCharactersWindow
          currentCharacterId={selectedId}
          onClose={() => setManageOpen(false)}
          onSelect={(id) => {
            setSelectedId(id);
            refreshCharacters();
            setManageOpen(false);
          }}
        />
      )}
      {editOpen && selected && (
        <CivilianCharacterEditWindow character={selected} onClose={() => setEditOpen(false)} onSaved={refreshCharacters} />
      )}
      {citationsOpen && <CitationsWindow onClose={() => setCitationsOpen(false)} />}
      {nineOneOneOpen && <NineOneOneWindow onClose={() => setNineOneOneOpen(false)} />}
      {threeOneOneOpen && <NineOneOneWindow emergency={false} onClose={() => setThreeOneOneOpen(false)} />}
      {recordForm === "vehicle_registration" && selected && (
        <VehicleRegistrationWindow character={selected} onClose={() => setRecordForm(null)} onSaved={() => {}} />
      )}
      {recordForm === "drivers_licence" && selected && (
        <DriversLicenceWindow character={selected} onClose={() => setRecordForm(null)} onSaved={() => {}} />
      )}
    </WindowManagerProvider>
  );
}
