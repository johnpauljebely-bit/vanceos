"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { DataTable, DataRow, DataCell } from "@/components/ui/DataTable";
import { useLiveQuery } from "@/lib/useLiveQuery";
import { accentIdFromVar, accentBorderTextClassFromVar } from "@/lib/departmentAccent";
import { cn } from "@/lib/cn";

interface RecordRow {
  id: number;
  recordType: string;
  title: string;
  subjectName: string | null;
  status: string;
}
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

const RECORD_TYPES = [
  { value: "police_record", label: "Police Record" },
  { value: "police_report", label: "Police Report" },
  { value: "fire_record", label: "Fire Record" },
  { value: "medical_record", label: "Medical Record" },
  { value: "other", label: "Other" },
];

export type RecordsWarrantsCategory = "records" | "warrants" | "bolos";

/**
 * Records + Warrants + BOLOs, merged into one category with three internal
 * tabs (was two separate sidebar entries / FloatingWindows) — used both
 * inside a FloatingWindow (windows mode) and directly in the splitscreen
 * panel (split mode).
 */
export function RecordsWarrantsContent({
  accentVar,
  expanded = false,
  initialCategory = "records",
}: {
  accentVar?: string;
  expanded?: boolean;
  initialCategory?: RecordsWarrantsCategory;
}) {
  const [category, setCategory] = useState<RecordsWarrantsCategory>(initialCategory);
  const activeTabClass = accentBorderTextClassFromVar(accentVar);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 border-b border-border-subtle pb-3">
        {([
          { id: "records", label: "Records" },
          { id: "warrants", label: "Warrants" },
          { id: "bolos", label: "BOLOs" },
        ] as const).map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-medium",
              category === c.id ? activeTabClass : "border-transparent text-fg-muted hover:text-fg",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {category === "records" ? (
        <RecordsSection accentVar={accentVar} expanded={expanded} />
      ) : (
        <WarrantsBolosSection accentVar={accentVar} category={category} />
      )}
    </div>
  );
}

function RecordsSection({ accentVar, expanded }: { accentVar?: string; expanded: boolean }) {
  const [tab, setTab] = useState<"all" | "mine">("all");
  const { data, mutate } = useLiveQuery<{ records: RecordRow[] }>(`/api/records?mine=${tab === "mine" ? 1 : 0}`);

  const [showForm, setShowForm] = useState(false);
  const [recordType, setRecordType] = useState("police_record");
  const [title, setTitle] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const accentId = accentIdFromVar(accentVar);
  const activeTabClass = accentBorderTextClassFromVar(accentVar);

  async function create(status: "draft" | "final") {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    await fetch("/api/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recordType, title, content, subjectName: subjectName || undefined, status }),
    });
    setTitle("");
    setSubjectName("");
    setContent("");
    setShowForm(false);
    mutate();
    setSaving(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(["all", "mine"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium",
                tab === t ? activeTabClass : "border-transparent text-fg-muted hover:text-fg",
              )}
            >
              {t === "all" ? "All Records" : "My Files"}
            </button>
          ))}
        </div>
        <Button variant="boxed" accent={accentId} onClick={() => setShowForm((v) => !v)} className="px-3 py-1 text-xs">
          {showForm ? "Cancel" : "New Record"}
        </Button>
      </div>

      {showForm && (
        <div className={cn("flex flex-col gap-3 rounded-lg border border-border-subtle p-4", expanded && "sm:max-w-xl")}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label required>Type</Label>
              <Select value={recordType} onChange={(e) => setRecordType(e.target.value)} className="mt-1">
                {RECORD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Subject Name</Label>
              <Input value={subjectName} onChange={(e) => setSubjectName(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label required>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label required>Content</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} className="mt-1 min-h-32" />
          </div>
          <div className="flex gap-3">
            <Button variant="boxed" accent={accentId} onClick={() => create("final")} disabled={saving} className="self-start">
              {saving ? "Saving..." : "Create Record"}
            </Button>
            <Button variant="plain" accent="neutral" onClick={() => create("draft")} disabled={saving}>
              Save as Draft
            </Button>
          </div>
        </div>
      )}

      <DataTable columns={["Type", "Title", "Subject", "Status"]} isEmpty={(data?.records ?? []).length === 0}>
        {(data?.records ?? []).map((r) => (
          <DataRow key={r.id}>
            <DataCell className="capitalize">{r.recordType.replace("_", " ")}</DataCell>
            <DataCell>{r.title}</DataCell>
            <DataCell>{r.subjectName ?? "---"}</DataCell>
            <DataCell className="capitalize">{r.status}</DataCell>
          </DataRow>
        ))}
      </DataTable>
    </div>
  );
}

function WarrantsBolosSection({ accentVar, category }: { accentVar?: string; category: "warrants" | "bolos" }) {
  const { data: warrantsData, mutate: mutateWarrants } = useLiveQuery<{ warrants: Warrant[] }>("/api/warrants");
  const { data: bolosData, mutate: mutateBolos } = useLiveQuery<{ bolos: Bolo[] }>("/api/bolos");

  const [showForm, setShowForm] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [charges, setCharges] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const accentId = accentIdFromVar(accentVar);

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

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button variant="boxed" accent={accentId} onClick={() => setShowForm((v) => !v)} className="px-3 py-1 text-xs">
          {showForm ? "Cancel" : category === "warrants" ? "New Warrant" : "New BOLO"}
        </Button>
      </div>

      {showForm && (
        <div className="flex flex-col gap-3 rounded-lg border border-border-subtle p-4">
          <div>
            <Label required={category === "warrants"}>Subject Name</Label>
            <Input value={subjectName} onChange={(e) => setSubjectName(e.target.value)} className="mt-1" />
          </div>
          {category === "warrants" ? (
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
            onClick={category === "warrants" ? createWarrant : createBolo}
            disabled={saving}
            className="self-start"
          >
            {saving ? "Saving..." : "Create"}
          </Button>
        </div>
      )}

      {category === "warrants" ? (
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
  );
}
