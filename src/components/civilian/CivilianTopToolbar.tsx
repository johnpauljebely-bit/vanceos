"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, Users, Search, Phone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CivilianNewRecordDropdown, type CivilianRecordType } from "./CivilianNewRecordDropdown";

export function CivilianTopToolbar({
  onManageCharacters,
  onMyRecords,
  onNewRecord,
  on911,
  on311,
}: {
  onManageCharacters: () => void;
  onMyRecords: () => void;
  onNewRecord: (type: CivilianRecordType) => void;
  on911: () => void;
  on311: () => void;
}) {
  const router = useRouter();

  return (
    <div className="relative z-20 flex items-center gap-4 border-b border-border-subtle bg-surface/80 px-5 py-3 backdrop-blur">
      <button
        type="button"
        onClick={() => router.push("/team-select")}
        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-bold text-fg transition-colors hover:bg-white/5 hover:text-accent-light-red"
      >
        <ChevronLeft size={16} />
        Civilian
      </button>

      <div className="h-5 w-px bg-border-subtle" />

      <div className="flex items-center gap-2">
        <Button
          variant="plain"
          accent="neutral"
          icon={<Users size={14} />}
          onClick={onManageCharacters}
          className="rounded-lg px-2.5 py-1.5 hover:bg-white/5"
        >
          Manage Characters
        </Button>
        <Button
          variant="plain"
          accent="neutral"
          icon={<Search size={14} />}
          onClick={onMyRecords}
          className="rounded-lg px-2.5 py-1.5 hover:bg-white/5"
        >
          My Records
        </Button>
        <CivilianNewRecordDropdown onSelect={onNewRecord} />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <Button
          variant="plain"
          accent="neutral"
          icon={<Phone size={14} />}
          onClick={on311}
          className="rounded-lg px-2.5 py-1.5 hover:bg-white/5"
        >
          311
        </Button>
        <Button variant="boxed" accent="light-red" icon={<Phone size={14} />} onClick={on911}>
          911
        </Button>
      </div>
    </div>
  );
}
