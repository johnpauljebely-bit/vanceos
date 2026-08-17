"use client";

import { useEffect, useState } from "react";
import { FilePlus, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { RECORD_TYPE_LABEL, type RecordType } from "./RecordFormWindow";

interface DraftSummary {
  id: number;
  recordType: RecordType;
  createdAt: string;
}

const MENU: { category: string; items: { type: RecordType }[] }[] = [
  { category: "Records", items: [{ type: "vehicle_citation" }, { type: "general_citation" }, { type: "arrest_report" }] },
  { category: "Reports", items: [{ type: "accident_report" }] },
];

export function NewRecordDropdown({
  onCreateNew,
  onOpenDraft,
  onOpenWarrantsBolos,
}: {
  onCreateNew: (type: RecordType) => void;
  onOpenDraft: (draft: DraftSummary) => void;
  onOpenWarrantsBolos: (tab: "warrants" | "bolos") => void;
}) {
  const [open, setOpen] = useState(false);
  const [drafts, setDrafts] = useState<DraftSummary[]>([]);

  function refreshDrafts() {
    fetch("/api/records?drafts=1")
      .then((r) => r.json())
      .then((data) => setDrafts(data.records ?? []));
  }

  useEffect(() => {
    refreshDrafts();
    const id = setInterval(refreshDrafts, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative">
      <Button
        variant="plain"
        accent="blue"
        icon={<FilePlus size={14} />}
        onClick={() => setOpen((v) => !v)}
      >
        {drafts.length > 0 ? `Drafts (${drafts.length})` : "New Record"}
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-lg border border-border-subtle bg-surface py-1 shadow-2xl">
            {drafts.length > 0 && (
              <>
                <div className="px-3 pt-2 pb-1 text-xs font-bold text-fg-muted">Drafts</div>
                {drafts.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      onOpenDraft(d);
                      setOpen(false);
                    }}
                    className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-white/5"
                  >
                    <span className="flex items-center gap-2 text-sm text-fg">
                      <FileText size={14} className="text-accent-blue" />
                      {RECORD_TYPE_LABEL[d.recordType]}
                    </span>
                    <span className="text-xs text-fg-muted">
                      {new Date(d.createdAt).toLocaleString()}
                    </span>
                  </button>
                ))}
                <div className="my-1 border-t border-border-subtle" />
              </>
            )}

            {MENU.map((group) => (
              <div key={group.category}>
                <div className="px-3 pt-2 pb-1 text-xs font-bold text-fg-muted">{group.category}</div>
                {group.items.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => {
                      onCreateNew(item.type);
                      setOpen(false);
                    }}
                    className={cn("flex w-full items-center px-3 py-2 text-left text-sm text-fg hover:bg-white/5")}
                  >
                    {RECORD_TYPE_LABEL[item.type]}
                  </button>
                ))}
              </div>
            ))}

            <div className="px-3 pt-2 pb-1 text-xs font-bold text-fg-muted">Other</div>
            <button
              type="button"
              onClick={() => {
                onOpenWarrantsBolos("bolos");
                setOpen(false);
              }}
              className="flex w-full items-center px-3 py-2 text-left text-sm text-fg hover:bg-white/5"
            >
              BOLO
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenWarrantsBolos("warrants");
                setOpen(false);
              }}
              className="flex w-full items-center px-3 py-2 text-left text-sm text-fg hover:bg-white/5"
            >
              Arrest Warrant
            </button>
          </div>
        </>
      )}
    </div>
  );
}
