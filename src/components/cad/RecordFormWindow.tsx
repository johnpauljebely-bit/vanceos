"use client";

import { useState } from "react";
import { FilePlus, Search, X } from "lucide-react";
import { FloatingWindow } from "@/components/floating-window/FloatingWindow";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";

export type RecordType = "vehicle_citation" | "general_citation" | "arrest_report" | "accident_report";

export const RECORD_TYPE_LABEL: Record<RecordType, string> = {
  vehicle_citation: "Vehicle Citation",
  general_citation: "General Citation",
  arrest_report: "Arrest Report",
  accident_report: "Accident Report",
};

const HAS_VEHICLE_SECTION: Record<RecordType, boolean> = {
  vehicle_citation: true,
  general_citation: false,
  arrest_report: false,
  accident_report: true,
};

interface UnitHeader {
  unitNumber: string;
  agency: string;
  division: string;
  unitName: string;
}

interface DraftRecord {
  id: number;
  recordType: RecordType;
  details: Record<string, string> | null;
  subjectName: string | null;
}

export function RecordFormWindow({
  recordType,
  unitHeader,
  draft,
  onClose,
  onOpenLookup,
  onSaved,
}: {
  recordType: RecordType;
  unitHeader: UnitHeader;
  draft?: DraftRecord;
  onClose: () => void;
  onOpenLookup: (tab: "name" | "vehicle" | "licence") => void;
  onSaved: () => void;
}) {
  const initial = draft?.details ?? {};
  const [fields, setFields] = useState<Record<string, string>>(initial);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const hasVehicle = HAS_VEHICLE_SECTION[recordType];

  function set(key: string, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  const dirty = Object.values(fields).some((v) => v.trim().length > 0);

  async function persist(status: "draft" | "final") {
    const subjectName = [fields.firstName, fields.lastName].filter(Boolean).join(" ") || undefined;
    const body = {
      recordType,
      title: `${RECORD_TYPE_LABEL[recordType]}${subjectName ? ` — ${subjectName}` : ""}`,
      content: "",
      subjectName,
      details: fields,
      status,
    };
    if (draft) {
      await fetch(`/api/records/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }
  }

  async function create() {
    setSaving(true);
    await persist("final");
    setSaving(false);
    setSubmitted(true);
    onSaved();
    onClose();
  }

  function closeAndMaybeSaveDraft() {
    if (!submitted && dirty) {
      // Fire and forget — closing shouldn't block on the network.
      persist("draft").then(onSaved);
    }
    onClose();
  }

  return (
    <FloatingWindow title={`New: ${RECORD_TYPE_LABEL[recordType]}`} onClose={closeAndMaybeSaveDraft} width={780}>
      <div className="flex flex-col gap-6">
        <section className="rounded-xl border border-border-subtle p-4">
          <h3 className="mb-3 text-lg font-bold text-fg">Report Header</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <ReadOnlyField label="Record #" value="NEW" />
            <ReadOnlyField label="Unit #" value={unitHeader.unitNumber} />
            <ReadOnlyField label="Agency" value={unitHeader.agency} />
            <ReadOnlyField label="Division" value={unitHeader.division || "N/A"} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <ReadOnlyField label="Date" value={new Date().toLocaleString()} />
            <ReadOnlyField label="Unit Name" value={unitHeader.unitName} />
          </div>
        </section>

        <section className="rounded-xl border border-border-subtle p-4">
          <div className="mb-3 flex items-center gap-3">
            <h3 className="text-lg font-bold text-fg">Driver</h3>
            <Button variant="boxed" accent="blue" className="px-3 py-1 text-xs" icon={<Search size={12} />} onClick={() => onOpenLookup("name")}>
              Civilian
            </Button>
            <Button variant="boxed" accent="blue" className="px-3 py-1 text-xs" icon={<Search size={12} />} onClick={() => onOpenLookup("licence")}>
              Licence
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <Label required>First Name</Label>
              <Input value={fields.firstName ?? ""} onChange={(e) => set("firstName", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label required>Last Name</Label>
              <Input value={fields.lastName ?? ""} onChange={(e) => set("lastName", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label required>DOB</Label>
              <Input value={fields.dob ?? ""} onChange={(e) => set("dob", e.target.value)} className="mt-1" />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label>Residence</Label>
              <Input value={fields.residence ?? ""} onChange={(e) => set("residence", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Contact Number</Label>
              <Input value={fields.contactNumber ?? ""} onChange={(e) => set("contactNumber", e.target.value)} className="mt-1" />
            </div>
          </div>
          <div className="mt-3">
            <Label required>Licence Number</Label>
            <Input value={fields.licenceNumber ?? ""} onChange={(e) => set("licenceNumber", e.target.value)} className="mt-1" />
          </div>
        </section>

        {hasVehicle && (
          <section className="rounded-xl border border-border-subtle p-4">
            <div className="mb-3 flex items-center gap-3">
              <h3 className="text-lg font-bold text-fg">Vehicle</h3>
              <Button variant="boxed" accent="blue" className="px-3 py-1 text-xs" icon={<Search size={12} />} onClick={() => onOpenLookup("vehicle")}>
                Vehicle
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <Label required>Plate</Label>
                <Input value={fields.plate ?? ""} onChange={(e) => set("plate", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Make</Label>
                <Input value={fields.make ?? ""} onChange={(e) => set("make", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Model</Label>
                <Input value={fields.model ?? ""} onChange={(e) => set("model", e.target.value)} className="mt-1" />
              </div>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <Label>Type</Label>
                <Input value={fields.type ?? ""} onChange={(e) => set("type", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Year</Label>
                <Input value={fields.year ?? ""} onChange={(e) => set("year", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Color</Label>
                <Input value={fields.color ?? ""} onChange={(e) => set("color", e.target.value)} className="mt-1" />
              </div>
            </div>
          </section>
        )}

        <div className="flex gap-3">
          <Button variant="boxed" accent="blue" icon={<FilePlus size={14} />} onClick={create} disabled={saving}>
            {saving ? "Creating..." : "Create"}
          </Button>
          <Button variant="plain" accent="neutral" icon={<X size={14} />} onClick={closeAndMaybeSaveDraft}>
            Close
          </Button>
        </div>
      </div>
    </FloatingWindow>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-fg-muted">
        {value}
      </div>
    </div>
  );
}
