"use client";

import { useState } from "react";
import { Sparkles, Save, Ban, X, Lock } from "lucide-react";
import { FloatingWindow } from "@/components/floating-window/FloatingWindow";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import type { CharacterDetail } from "./CivilianCharacterCard";

function age(dob: string): number {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return 0;
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

export function CivilianCharacterEditWindow({
  character,
  onClose,
  onSaved,
}: {
  character: CharacterDetail;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [fields, setFields] = useState({
    firstName: character.firstName,
    middleInitial: character.middleInitial ?? "",
    lastName: character.lastName,
    sex: character.sex ?? "",
    skinColour: character.skinColour ?? "",
    hairColour: character.hairColour ?? "",
    eyeColour: character.eyeColour ?? "",
    height: character.height ?? "",
    weight: character.weight ?? "",
    address: character.address ?? "",
    phoneNumber: character.phoneNumber ?? "",
    photoUrl: character.photoUrl ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  function set<K extends keyof typeof fields>(key: K, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function useRobloxAvatar() {
    setAvatarLoading(true);
    const res = await fetch("/api/civilian/roblox-avatar");
    if (res.ok) {
      const { url } = await res.json();
      set("photoUrl", url);
    }
    setAvatarLoading(false);
  }

  async function save() {
    setSaving(true);
    await fetch(`/api/civilian/characters/${character.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <FloatingWindow
      title={`Civilian Character #${String(character.id).padStart(6, "0")}`}
      onClose={onClose}
      width={860}
      accentVar="--accent-light-red"
      footer={
        <div className="flex gap-3">
          <Button variant="boxed" accent="light-red" icon={<Save size={14} />} onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button variant="boxed" accent="red" icon={<Ban size={14} />} onClick={onClose}>
            Cancel
          </Button>
          <Button variant="plain" accent="neutral" icon={<X size={14} />} onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <section className="rounded-xl border border-border-subtle p-4 text-center">
          <h3 className="mb-4 text-left text-lg font-bold text-fg">Identity</h3>
          <div className="mx-auto flex h-48 w-full max-w-md items-center justify-center rounded-lg bg-bg text-sm text-fg-muted">
            {fields.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fields.photoUrl} alt="Civilian" className="h-full rounded-lg object-cover" />
            ) : (
              "Civilian Photo"
            )}
          </div>
          <Button
            variant="plain"
            accent="light-red"
            icon={<Sparkles size={14} />}
            onClick={useRobloxAvatar}
            disabled={avatarLoading}
            className="mt-4"
          >
            {avatarLoading ? "Loading..." : "Use my ROBLOX Avatar"}
          </Button>
        </section>

        <section className="rounded-xl border border-border-subtle p-4">
          <h3 className="mb-4 text-lg font-bold text-fg">Information</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <div>
              <Label required>First Name</Label>
              <Input value={fields.firstName} onChange={(e) => set("firstName", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>M.I.</Label>
              <Input value={fields.middleInitial} onChange={(e) => set("middleInitial", e.target.value)} className="mt-1" maxLength={2} />
            </div>
            <div>
              <Label required>Last Name</Label>
              <Input value={fields.lastName} onChange={(e) => set("lastName", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label required>
                <span className="inline-flex items-center gap-1.5">
                  DoB <Lock size={11} className="text-fg-muted" />
                </span>
              </Label>
              <div className="mt-1 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-fg-muted">
                {character.dateOfBirth}
              </div>
            </div>
            <div>
              <Label>Age</Label>
              <div className="mt-1 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-fg-muted">
                {age(character.dateOfBirth)}
              </div>
            </div>
          </div>

          <div className="mt-3">
            <Label>
              <span className="inline-flex items-center gap-1.5">
                Alias <Lock size={11} className="text-fg-muted" />
              </span>
            </Label>
            <div className="mt-1 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-fg-muted">
              {character.linkedRobloxUsername ?? "N/A"}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-5">
            <div>
              <Label>Skin Colour</Label>
              <Input value={fields.skinColour} onChange={(e) => set("skinColour", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Hair Colour</Label>
              <Input value={fields.hairColour} onChange={(e) => set("hairColour", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Eye Colour</Label>
              <Input value={fields.eyeColour} onChange={(e) => set("eyeColour", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Height</Label>
              <Input value={fields.height} onChange={(e) => set("height", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Weight</Label>
              <Input value={fields.weight} onChange={(e) => set("weight", e.target.value)} className="mt-1" />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label>Residence</Label>
              <Input value={fields.address} onChange={(e) => set("address", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Contact Number</Label>
              <Input value={fields.phoneNumber} onChange={(e) => set("phoneNumber", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Sex</Label>
              <Select value={fields.sex} onChange={(e) => set("sex", e.target.value)} className="mt-1">
                <option value="">N/A</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </Select>
            </div>
          </div>
        </section>
      </div>
    </FloatingWindow>
  );
}
