"use client";

import { useState } from "react";
import { Folder } from "lucide-react";
import { Button } from "@/components/ui/Button";

export type CivilianRecordType = "vehicle_registration" | "drivers_licence";

export function CivilianNewRecordDropdown({ onSelect }: { onSelect: (type: CivilianRecordType) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button variant="boxed" accent="neutral" icon={<Folder size={14} />} onClick={() => setOpen((v) => !v)}>
        New Record
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-lg border border-border-subtle bg-surface py-1 shadow-2xl">
            <div className="px-3 pt-2 pb-1 text-xs font-bold text-fg-muted">Registrations</div>
            <button
              type="button"
              onClick={() => {
                onSelect("vehicle_registration");
                setOpen(false);
              }}
              className="flex w-full items-center px-3 py-2 text-left text-sm text-fg hover:bg-white/5"
            >
              Vehicle Registration
            </button>
            <div className="my-1 border-t border-border-subtle" />
            <div className="px-3 pt-2 pb-1 text-xs font-bold text-fg-muted">Licences</div>
            <button
              type="button"
              onClick={() => {
                onSelect("drivers_licence");
                setOpen(false);
              }}
              className="flex w-full items-center px-3 py-2 text-left text-sm text-fg hover:bg-white/5"
            >
              Drivers Licence
            </button>
          </div>
        </>
      )}
    </div>
  );
}
