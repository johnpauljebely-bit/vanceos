"use client";

import { useState } from "react";
import { FloatingWindow } from "@/components/floating-window/FloatingWindow";
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

const RECORD_TYPES = [
  { value: "police_record", label: "Police Record" },
  { value: "police_report", label: "Police Report" },
  { value: "fire_record", label: "Fire Record" },
  { value: "medical_record", label: "Medical Record" },
  { value: "other", label: "Other" },
];

export function RecordsWindow({
  onClose,
  accentVar,
}: {
  onClose: () => void;
  accentVar?: string;
}) {
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
    <FloatingWindow title="Records" onClose={onClose} width={700} accentVar={accentVar}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
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
          <div className="flex flex-col gap-3 rounded-lg border border-border-subtle p-4">
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
    </FloatingWindow>
  );
}
