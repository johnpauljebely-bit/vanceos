"use client";

import { useState } from "react";
import { FloatingWindow } from "@/components/floating-window/FloatingWindow";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface DispatchedUnit {
  callsignKey: string;
  department: string;
  number: number;
  postal: string | null;
  distanceKnown: boolean;
}

export function TrafficStopWindow({ onClose }: { onClose: () => void }) {
  const [vehicleDescription, setVehicleDescription] = useState("");
  const [plate, setPlate] = useState("");
  const [postal, setPostal] = useState("");
  const [needsAdditional, setNeedsAdditional] = useState<boolean | null>(null);
  const [additionalUnitsCount, setAdditionalUnitsCount] = useState(1);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [dispatchedUnits, setDispatchedUnits] = useState<DispatchedUnit[]>([]);

  const canSubmit =
    vehicleDescription.trim() &&
    plate.trim() &&
    postal.trim() &&
    needsAdditional !== null &&
    (!needsAdditional || additionalUnitsCount >= 1);

  async function submit() {
    if (!canSubmit) return;
    setSending(true);
    const res = await fetch("/api/traffic-stop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicleDescription,
        plate,
        postal,
        needsAdditional,
        additionalUnitsCount: needsAdditional ? additionalUnitsCount : undefined,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setDispatchedUnits(data.dispatchedUnits ?? []);
    }
    setSending(false);
    setSent(true);
  }

  return (
    <FloatingWindow title="Traffic Stop" onClose={onClose} width={480}>
      {sent ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-accent-status-green">Traffic stop broadcast sent.</p>
          {dispatchedUnits.length > 0 && (
            <div className="rounded-lg border border-border-subtle p-3">
              <div className="mb-2 text-xs font-bold text-fg-muted">Units Dispatched</div>
              <div className="flex flex-col gap-1.5">
                {dispatchedUnits.map((u) => (
                  <div key={u.callsignKey} className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-fg">
                      {u.department.toUpperCase()} {u.number}
                    </span>
                    <span className="text-fg-muted">
                      {u.postal ? `coming from postal ${u.postal}` : "location unknown, en route"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <Label required>Vehicle Description</Label>
            <Input
              value={vehicleDescription}
              onChange={(e) => setVehicleDescription(e.target.value)}
              placeholder="e.g. Red sedan"
              className="mt-1"
            />
          </div>
          <div>
            <Label required>Plate</Label>
            <Input value={plate} onChange={(e) => setPlate(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label required>Postal</Label>
            <Input value={postal} onChange={(e) => setPostal(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label required>Requesting Additional Units?</Label>
            <div className="mt-1 flex gap-2">
              {[
                { label: "Yes", value: true },
                { label: "No", value: false },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setNeedsAdditional(opt.value)}
                  className={cn(
                    "rounded-lg border px-4 py-2 text-sm",
                    needsAdditional === opt.value
                      ? "border-accent-teal text-accent-teal"
                      : "border-border-subtle text-fg-muted hover:text-fg",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {needsAdditional && (
            <div>
              <Label required>How Many Units?</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={additionalUnitsCount}
                onChange={(e) => setAdditionalUnitsCount(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
                className="mt-1 w-24"
              />
              <p className="mt-1 text-xs text-fg-muted">
                We&apos;ll automatically send the closest available units — same department first, other law
                enforcement if needed — and attach them to this stop.
              </p>
            </div>
          )}
          <Button variant="boxed" accent="teal" onClick={submit} disabled={!canSubmit || sending} className="self-start">
            {sending ? "Broadcasting..." : "Broadcast Traffic Stop"}
          </Button>
        </div>
      )}
    </FloatingWindow>
  );
}
