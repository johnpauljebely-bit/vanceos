"use client";

import { useState } from "react";
import { FloatingWindow } from "@/components/floating-window/FloatingWindow";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { DataTable, DataRow, DataCell } from "@/components/ui/DataTable";
import { useLiveQuery } from "@/lib/useLiveQuery";
import { accentIdFromVar, accentBorderTextClassFromVar } from "@/lib/departmentAccent";
import { cn } from "@/lib/cn";

interface Warrant {
  id: number;
  subjectName: string;
  charges: string;
  signature: string | null;
}
interface Bolo {
  id: number;
  subjectName: string | null;
  description: string;
  type: string;
}

export function WarrantsBolosWindow({
  onClose,
  initialTab = "warrants",
  autoShowForm = false,
  accentVar,
}: {
  onClose: () => void;
  initialTab?: "warrants" | "bolos";
  autoShowForm?: boolean;
  accentVar?: string;
}) {
  const [tab, setTab] = useState<"warrants" | "bolos">(initialTab);
  const { data: warrantsData, mutate: mutateWarrants } = useLiveQuery<{ warrants: Warrant[] }>("/api/warrants");
  const { data: bolosData, mutate: mutateBolos } = useLiveQuery<{ bolos: Bolo[] }>("/api/bolos");

  const [showForm, setShowForm] = useState(autoShowForm);
  const [subjectName, setSubjectName] = useState("");
  const [charges, setCharges] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function createWarrant() {
    if (!subjectName.trim() || !charges.trim()) return;
    setSaving(true);
    await fetch("/api/warrants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectName, charges }),
    });
    setSubjectName("");
    setCharges("");
    setShowForm(false);
    mutateWarrants();
    setSaving(false);
  }

  async function createBolo() {
    if (!description.trim()) return;
    setSaving(true);
    await fetch("/api/bolos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectName: subjectName || undefined, description, type: "general" }),
    });
    setSubjectName("");
    setDescription("");
    setShowForm(false);
    mutateBolos();
    setSaving(false);
  }

  async function closeWarrant(id: number) {
    await fetch(`/api/warrants/${id}/close`, { method: "POST" });
    mutateWarrants();
  }
  async function closeBolo(id: number) {
    await fetch(`/api/bolos/${id}/close`, { method: "POST" });
    mutateBolos();
  }

  const accentId = accentIdFromVar(accentVar);
  const activeTabClass = accentBorderTextClassFromVar(accentVar);

  return (
    <FloatingWindow title="Active Warrants & BOLOs" onClose={onClose} width={680} accentVar={accentVar}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex gap-2">
            {(["warrants", "bolos"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTab(t);
                  setShowForm(false);
                }}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium capitalize",
                  tab === t ? activeTabClass : "border-transparent text-fg-muted hover:text-fg",
                )}
              >
                {t === "warrants" ? "Warrants" : "BOLOs"}
              </button>
            ))}
          </div>
          <Button variant="boxed" accent={accentId} onClick={() => setShowForm((v) => !v)} className="px-3 py-1 text-xs">
            {showForm ? "Cancel" : tab === "warrants" ? "New Warrant" : "New BOLO"}
          </Button>
        </div>

        {showForm && (
          <div className="flex flex-col gap-3 rounded-lg border border-border-subtle p-4">
            <div>
              <Label required={tab === "warrants"}>Subject Name</Label>
              <Input value={subjectName} onChange={(e) => setSubjectName(e.target.value)} className="mt-1" />
            </div>
            {tab === "warrants" ? (
              <div>
                <Label required>Charges</Label>
                <Textarea value={charges} onChange={(e) => setCharges(e.target.value)} className="mt-1" />
              </div>
            ) : (
              <div>
                <Label required>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" />
              </div>
            )}
            <Button
              variant="boxed"
              accent={accentId}
              onClick={tab === "warrants" ? createWarrant : createBolo}
              disabled={saving}
              className="self-start"
            >
              {saving ? "Saving..." : "Create"}
            </Button>
          </div>
        )}

        {tab === "warrants" ? (
          <DataTable columns={["Subject", "Charges", "Signature", ""]} isEmpty={(warrantsData?.warrants ?? []).length === 0}>
            {(warrantsData?.warrants ?? []).map((w) => (
              <DataRow key={w.id}>
                <DataCell>{w.subjectName}</DataCell>
                <DataCell>{w.charges}</DataCell>
                <DataCell>{w.signature ?? "---"}</DataCell>
                <DataCell>
                  <Button variant="plain" accent={accentId} onClick={() => closeWarrant(w.id)} className="px-0 text-xs">
                    Close Warrant
                  </Button>
                </DataCell>
              </DataRow>
            ))}
          </DataTable>
        ) : (
          <DataTable columns={["Subject", "Description", "Type", ""]} isEmpty={(bolosData?.bolos ?? []).length === 0}>
            {(bolosData?.bolos ?? []).map((b) => (
              <DataRow key={b.id}>
                <DataCell>{b.subjectName ?? "---"}</DataCell>
                <DataCell>{b.description}</DataCell>
                <DataCell className="capitalize">{b.type}</DataCell>
                <DataCell>
                  <Button variant="plain" accent={accentId} onClick={() => closeBolo(b.id)} className="px-0 text-xs">
                    Clear
                  </Button>
                </DataCell>
              </DataRow>
            ))}
          </DataTable>
        )}
      </div>
    </FloatingWindow>
  );
}
