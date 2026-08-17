"use client";

import { RefreshCw, Pencil, Lock } from "lucide-react";

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

function Field({ label, value }: { label: React.ReactNode; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wide text-fg-muted">{label}</div>
      <div className="mt-1 text-sm text-fg">{value || "N/A"}</div>
    </div>
  );
}

function SectionDivider({ title }: { title: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="text-[11px] font-bold uppercase tracking-widest text-fg-muted">{title}</span>
      <div className="h-px flex-1 bg-border-subtle" />
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
    <div className="overflow-hidden rounded-3xl border border-border-subtle bg-surface">
      {/* Hero photo banner — name/DOB read as a badge overlay instead of a
          separate boxed "Identity" panel, and the balance moves up here as
          a pill so it reads as a stat, not a stray line of muted text. */}
      <div className="relative flex h-44 items-end justify-center overflow-hidden bg-gradient-to-b from-surface-input to-bg sm:h-56">
        {character.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={character.photoUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,var(--accent-light-red)_0%,transparent_65%)] opacity-10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

        <div className="absolute top-3 right-3 flex items-center gap-2">
          <span className="rounded-full border border-border-subtle bg-black/40 px-3 py-1 text-xs font-semibold text-fg backdrop-blur">
            $ {balance}
          </span>
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-full border border-border-subtle bg-black/40 p-1.5 text-fg-muted backdrop-blur hover:text-fg"
            aria-label="Refresh"
          >
            <RefreshCw size={14} />
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="rounded-full border border-border-subtle bg-black/40 p-1.5 text-fg-muted backdrop-blur hover:text-accent-light-red"
            aria-label="Edit"
          >
            <Pencil size={14} />
          </button>
        </div>

        <div className="relative z-10 flex w-full items-end justify-between p-5">
          <div>
            <h2 className="text-xl font-extrabold text-white">
              {character.firstName} {character.middleInitial ? `${character.middleInitial}. ` : ""}
              {character.lastName}
            </h2>
            <p className="text-xs font-light text-white/60">
              {character.dateOfBirth} &middot; Age {age(character.dateOfBirth)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 p-6">
        <div>
          <SectionDivider title="Identity" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field
              label={
                <span className="inline-flex items-center gap-1">
                  Alias <Lock size={10} />
                </span>
              }
              value={character.linkedRobloxUsername ?? ""}
            />
            <Field label="Skin Colour" value={character.skinColour ?? ""} />
            <Field label="Hair Colour" value={character.hairColour ?? ""} />
            <Field label="Eye Colour" value={character.eyeColour ?? ""} />
            <Field label="Height" value={character.height ?? ""} />
            <Field label="Weight" value={character.weight ?? ""} />
          </div>
        </div>

        <div>
          <SectionDivider title="Contact" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Residence" value={character.address ?? ""} />
            <Field label="Contact Number" value={character.phoneNumber ?? ""} />
            <div>
              <div className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-fg-muted">
                SSN <Lock size={10} />
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm text-fg">{character.ssn ?? "N/A"}</span>
                <button type="button" onClick={onRegenerateSsn} className="text-fg-muted hover:text-fg" aria-label="Regenerate SSN">
                  <RefreshCw size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
