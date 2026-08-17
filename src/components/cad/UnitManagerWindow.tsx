"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LogOut, Plus } from "lucide-react";
import { FloatingWindow } from "@/components/floating-window/FloatingWindow";
import { Button } from "@/components/ui/Button";
import { DataTable, DataRow, DataCell } from "@/components/ui/DataTable";
import { accentIdFromVar, accentTextClassFromVar } from "@/lib/departmentAccent";
import { cn } from "@/lib/cn";

interface UnitRow {
  department: string;
  number: number;
  rank: string;
  agency: string | null;
  subdivision: string | null;
  items: string | null;
}

const DEPT_LABEL: Record<string, string> = { "delta-pd": "Delta Police", rcmp: "RCMP", bchp: "BCHP" };

export function UnitManagerWindow({
  currentDepartment,
  currentNumber,
  onClose,
  accentVar,
}: {
  currentDepartment: string;
  currentNumber: number;
  onClose: () => void;
  accentVar?: string;
}) {
  const [units, setUnits] = useState<UnitRow[] | null>(null);
  const router = useRouter();
  const accentId = accentIdFromVar(accentVar);
  const accentClass = accentTextClassFromVar(accentVar);
  const accentHoverClass = accentId === "verify-green" ? "hover:text-accent-verify-green" : "hover:text-accent-blue";

  useEffect(() => {
    fetch("/api/leo/units")
      .then((r) => r.json())
      .then((data) => setUnits(data.units ?? []));
  }, []);

  async function switchTo(unit: UnitRow) {
    if (unit.department === currentDepartment && unit.number === currentNumber) return;
    // Rank/agency/subdivision/items carry over from the target row; RP name
    // stays whatever this session already has (Unit Manager only switches
    // which callsign you're operating as, not your character name).
    await fetch("/api/leo/unit-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        department: unit.department,
        number: unit.number,
        rpName: "Unit Manager Switch",
        agency: unit.agency ?? undefined,
        subdivision: unit.subdivision ?? undefined,
        items: unit.items ?? undefined,
      }),
    });
    router.push(`/leo/${unit.department}/cad`);
    router.refresh();
  }

  async function logOut() {
    await fetch("/api/leo/unit-session/logout", { method: "POST" });
    router.push("/team-select");
  }

  return (
    <FloatingWindow title="Unit Manager" onClose={onClose} width={720} accentVar={accentVar}>
      <div className="flex flex-col gap-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-fg">Manage Units</h2>
          <p className="mt-1 text-sm text-fg-muted">View and manage all your units</p>
        </div>

        <DataTable
          columns={["", "Unit Number", "Agency", "Name", "Rank", "Subdivision", "Items"]}
          isEmpty={!units || units.length === 0}
        >
          {units?.map((u) => {
            const isCurrent = u.department === currentDepartment && u.number === currentNumber;
            return (
              <DataRow key={`${u.department}-${u.number}`}>
                <DataCell>{isCurrent && <Check size={14} className={accentClass} />}</DataCell>
                <DataCell>
                  <button type="button" onClick={() => switchTo(u)} className={cn("text-fg", accentHoverClass)}>
                    {u.number}
                  </button>
                </DataCell>
                <DataCell>{u.agency ?? DEPT_LABEL[u.department] ?? u.department}</DataCell>
                <DataCell>---</DataCell>
                <DataCell>{u.rank}</DataCell>
                <DataCell>{u.subdivision ?? "N/A"}</DataCell>
                <DataCell>{u.items ?? "None"}</DataCell>
              </DataRow>
            );
          })}
        </DataTable>

        <div className="flex items-center justify-between border-t border-border-subtle pt-4">
          <Button variant="plain" accent="neutral" onClick={onClose}>
            Close
          </Button>
          <Button variant="boxed" accent="red" icon={<LogOut size={14} />} onClick={logOut}>
            Log-out of Unit
          </Button>
          <Button
            variant="boxed"
            accent={accentId}
            icon={<Plus size={14} />}
            onClick={() => router.push(`/leo/${currentDepartment}/unit-select`)}
          >
            Add Unit
          </Button>
        </div>
      </div>
    </FloatingWindow>
  );
}
