"use client";

import { useState } from "react";
import { FloatingWindow } from "@/components/floating-window/FloatingWindow";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export function TrafficStopWindow({ onClose }: { onClose: () => void }) {
  const [vehicleDescription, setVehicleDescription] = useState("");
  const [plate, setPlate] = useState("");
  const [postal, setPostal] = useState("");
  const [needsAdditional, setNeedsAdditional] = useState<boolean | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const canSubmit = vehicleDescription.trim() && plate.trim() && postal.trim() && needsAdditional !== null;

  async function submit() {
    if (!canSubmit) return;
    setSending(true);
    await fetch("/api/traffic-stop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicleDescription, plate, postal, needsAdditional }),
    });
    setSending(false);
    setSent(true);
  }

  return (
    <FloatingWindow title="Traffic Stop" onClose={onClose} width={480}>
      {sent ? (
        <p className="text-sm text-accent-status-green">Traffic stop broadcast sent.</p>
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
          <Button variant="boxed" accent="teal" onClick={submit} disabled={!canSubmit || sending} className="self-start">
            {sending ? "Broadcasting..." : "Broadcast Traffic Stop"}
          </Button>
        </div>
      )}
    </FloatingWindow>
  );
}
