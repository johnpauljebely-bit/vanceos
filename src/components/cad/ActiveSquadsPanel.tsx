"use client";

import { Columns3, LayoutGrid, Users, Search as SearchIcon, X, ExternalLink, Plus } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { useLiveQuery } from "@/lib/useLiveQuery";

interface Squad {
  id: number;
  name: string;
}

export function ActiveSquadsPanel() {
  const { data } = useLiveQuery<{ squads: Squad[] }>("/api/squads");
  const squads = data?.squads ?? [];

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-2">
        <h3 className="text-sm font-bold text-fg">Active Squads</h3>
        <button type="button" className="text-fg-muted hover:text-fg" aria-label="List view">
          <Columns3 size={14} />
        </button>
        <button type="button" className="text-fg-muted hover:text-fg" aria-label="Grid view">
          <LayoutGrid size={14} />
        </button>
        <button type="button" className="text-fg-muted hover:text-fg" aria-label="Squads">
          <Users size={14} />
        </button>
        <div className="relative ml-auto w-48">
          <SearchIcon size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-fg-muted" />
          <Input placeholder="Search" className="pl-7 py-1 text-xs" />
        </div>
        <button type="button" className="text-fg-muted hover:text-fg" aria-label="Clear"><X size={14} /></button>
        <button type="button" className="text-fg-muted hover:text-fg" aria-label="Open"><ExternalLink size={14} /></button>
        <button type="button" className="text-fg-muted hover:text-fg" aria-label="Add"><Plus size={14} /></button>
      </div>

      <DataTable columns={["Unit", "Call", "Units", "Status"]} isEmpty={squads.length === 0} />
    </div>
  );
}
