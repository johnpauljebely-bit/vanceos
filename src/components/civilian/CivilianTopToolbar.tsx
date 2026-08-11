"use client";

import { useRouter } from "next/navigation";
import { Users, Search, Phone, ChevronDown } from "lucide-react";
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
    <div className="flex items-center gap-4 border-b border-border-subtle bg-surface px-4 py-3">
      <Button variant="boxed" accent="teal" icon={<Users size={14} />} onClick={onManageCharacters}>
        Manage Characters
      </Button>
      <Button variant="boxed" accent="neutral" icon={<Search size={14} />} onClick={onMyRecords}>
        My Records
      </Button>
      <CivilianNewRecordDropdown onSelect={onNewRecord} />

      <button
        type="button"
        onClick={() => router.push("/team-select")}
        className="mx-auto flex items-center gap-1 text-sm font-bold text-fg hover:text-accent-teal"
      >
        Civilian <ChevronDown size={14} />
      </button>

      <div className="ml-auto flex items-center gap-3">
        <Button variant="boxed" accent="red" icon={<Phone size={14} />} onClick={on911}>
          911
        </Button>
        <Button variant="boxed" accent="status-green" icon={<Phone size={14} />} onClick={on311}>
          311
        </Button>
      </div>
    </div>
  );
}
