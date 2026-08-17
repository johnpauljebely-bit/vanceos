"use client";

import { Radar, PhoneIncoming, Search, BookOpen, Gavel, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { UnitBadgePill } from "@/components/ui/Pill";
import { NewRecordDropdown } from "./NewRecordDropdown";
import { UNIT_STATUS_COLOR, type UnitStatus } from "@/lib/unitStatus";
import type { RecordType } from "./RecordFormWindow";

export function SecondaryToolbar({
  callsign,
  department,
  status,
  onSearch,
  onGetCall,
  onRecords,
  onWarrants,
  onCreateRecord,
  onOpenDraft,
  onOpenUnitManager,
}: {
  callsign: string;
  department: string;
  status: UnitStatus;
  onSearch: () => void;
  onGetCall: () => void;
  onRecords: () => void;
  onWarrants: (tab?: "warrants" | "bolos") => void;
  onCreateRecord: (type: RecordType) => void;
  onOpenDraft: (draft: { id: number; recordType: RecordType; createdAt: string }) => void;
  onOpenUnitManager: () => void;
}) {
  return (
    <div className="flex items-center gap-6 border-b border-border-subtle bg-bg px-4 py-2">
      <div className="flex items-center gap-2 text-fg">
        <Radar size={16} className="text-accent-blue" />
        <span className="text-sm font-bold">VanceOS</span>
      </div>

      <NewRecordDropdown
        onCreateNew={onCreateRecord}
        onOpenDraft={onOpenDraft}
        onOpenWarrantsBolos={onWarrants}
      />
      <Button variant="plain" accent="blue" icon={<PhoneIncoming size={14} />} onClick={onGetCall}>
        Get Call
      </Button>
      <Button variant="plain" accent="blue" icon={<Search size={14} />} onClick={onSearch}>
        Search
      </Button>
      <Button variant="plain" accent="blue" icon={<BookOpen size={14} />} onClick={onRecords}>
        Records
      </Button>
      <Button variant="plain" accent="blue" icon={<Gavel size={14} />} onClick={() => onWarrants()}>
        Warrants
      </Button>

      <button type="button" className="text-fg-muted hover:text-fg" aria-label="More">
        <MoreVertical size={16} />
      </button>

      <div className="ml-auto">
        <UnitBadgePill
          callsign={callsign}
          department={department.toUpperCase()}
          colorClassName={UNIT_STATUS_COLOR[status].bg}
          onClick={onOpenUnitManager}
        />
      </div>
    </div>
  );
}
