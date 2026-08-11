"use client";

import { RefreshCw, Pencil, Lock } from "lucide-react";
import { Label } from "@/components/ui/Label";

export interface CharacterDetail {
  id: number;
  firstName: string;
  middleInitial: string | null;
  lastName: string;
  dateOfBirth: string;
  sex: string | null;
  linkedRobloxUsername: string | null;
  skinColour: string | null;
  hairColour: string | null;
  eyeColour: string | null;
  height: string | null;
  weight: string | null;
  address: string | null;
  phoneNumber: string | null;
  ssn: string | null;
  photoUrl: string | null;
}

function age(dob: string): number {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return 0;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1 text-sm text-fg">{value || "N/A"}</div>
    </div>
  );
}

export function CivilianCharacterCard({
  character,
  balance,
  onEdit,
  onRegenerateSsn,
  onRefresh,
}: {
  character: CharacterDetail;
  balance: string;
  onEdit: () => void;
  onRegenerateSsn: () => void;
  onRefresh: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-fg">Civilian Character</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-fg-muted">$ {balance}</span>
          <button type="button" onClick={onRefresh} className="text-fg-muted hover:text-fg" aria-label="Refresh">
            <RefreshCw size={16} />
          </button>
          <button type="button" onClick={onEdit} className="text-fg-muted hover:text-accent-teal" aria-label="Edit">
            <Pencil size={16} />
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-border-subtle p-4">
        <h3 className="mb-4 text-sm font-bold text-fg">Identity</h3>
        <div className="flex h-48 items-center justify-center rounded-lg bg-bg text-sm text-fg-muted">
          {character.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={character.photoUrl} alt="Civilian" className="h-full rounded-lg object-cover" />
          ) : (
            "Civilian Photo"
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border-subtle p-4">
        <h3 className="mb-4 text-sm font-bold text-fg">Information</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <Field label="First Name" value={character.firstName} />
          <Field label="M.I." value={character.middleInitial ?? ""} />
          <Field label="Last Name" value={character.lastName} />
          <Field label="DoB" value={character.dateOfBirth} />
          <Field label="Age" value={String(age(character.dateOfBirth))} />
        </div>
        <div className="mt-4">
          <Label>
            <span className="inline-flex items-center gap-1.5">
              Alias <Lock size={11} className="text-fg-muted" />
            </span>
          </Label>
          <div className="mt-1 text-sm text-fg">{character.linkedRobloxUsername ?? "N/A"}</div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <Field label="Skin Colour" value={character.skinColour ?? ""} />
          <Field label="Hair Colour" value={character.hairColour ?? ""} />
          <Field label="Eye Colour" value={character.eyeColour ?? ""} />
          <Field label="Height" value={character.height ?? ""} />
          <Field label="Weight" value={character.weight ?? ""} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Residence" value={character.address ?? ""} />
          <Field label="Contact Number" value={character.phoneNumber ?? ""} />
          <div>
            <Label>
              <span className="inline-flex items-center gap-1.5">
                SSN <Lock size={11} className="text-fg-muted" />
              </span>
            </Label>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm text-fg-muted">{character.ssn ?? "N/A"}</span>
              <button type="button" onClick={onRegenerateSsn} className="text-fg-muted hover:text-fg" aria-label="Regenerate SSN">
                <RefreshCw size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
