"use client";

import { useEffect, useState } from "react";
import { FloatingWindow } from "@/components/floating-window/FloatingWindow";
import { DataTable, DataRow, DataCell } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";

interface Citation {
  id: number;
  offense: string;
  amount: string;
  status: string;
}

export function CitationsWindow({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<Citation[] | null>(null);
  const [payingId, setPayingId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/civilian/citations")
      .then((r) => r.json())
      .then((data) => setItems(data.citations ?? []));
  }, []);

  async function pay(id: number) {
    setPayingId(id);
    const res = await fetch("/api/civilian/citations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ citationId: id }),
    });
    if (res.ok) {
      setItems((prev) => (prev ? prev.map((c) => (c.id === id ? { ...c, status: "paid" } : c)) : prev));
    }
    setPayingId(null);
  }

  return (
    <FloatingWindow title="Citations" onClose={onClose} width={620} accentVar="--accent-light-red">
      <DataTable columns={["Offense", "Amount", "Status", ""]} isEmpty={!items || items.length === 0}>
        {items?.map((c) => (
          <DataRow key={c.id}>
            <DataCell>{c.offense}</DataCell>
            <DataCell>${c.amount}</DataCell>
            <DataCell className="capitalize">{c.status}</DataCell>
            <DataCell>
              {c.status === "unpaid" && (
                <Button
                  variant="boxed"
                  accent="light-red"
                  onClick={() => pay(c.id)}
                  disabled={payingId === c.id}
                  className="px-3 py-1 text-xs"
                >
                  {payingId === c.id ? "Paying..." : "Pay Fine"}
                </Button>
              )}
            </DataCell>
          </DataRow>
        ))}
      </DataTable>
    </FloatingWindow>
  );
}
