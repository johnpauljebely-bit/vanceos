"use client";

import { useState } from "react";
import { Send, X } from "lucide-react";
import { FloatingWindow } from "@/components/floating-window/FloatingWindow";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";

export function NineOneOneWindow({
  onClose,
  emergency = true,
}: {
  onClose: () => void;
  /** false = 311 non-emergency line: same flow, civil/low defaults, no red "911" framing. */
  emergency?: boolean;
}) {
  const [postal, setPostal] = useState("");
  const [type, setType] = useState(emergency ? "emergency" : "civil");
  const [priority, setPriority] = useState(emergency ? "medium" : "low");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const res = await fetch("/api/civilian/911", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postal, type, priority, description }),
    });
    if (res.ok) {
      setStatus("sent");
    } else {
      setStatus("error");
    }
  }

  return (
    <FloatingWindow title={emergency ? "Call 911" : "Call 311 — Non-Emergency"} onClose={onClose} width={520} accentVar="--accent-light-red">
      {status === "sent" ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-accent-light-red">
            {emergency ? "Dispatched — help is on the way." : "Sent — an available unit will follow up."}
          </p>
          <Button variant="plain" accent="neutral" icon={<X size={14} />} onClick={onClose}>
            Close
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label required>Postal</Label>
              <Input value={postal} onChange={(e) => setPostal(e.target.value)} required className="mt-1" placeholder="e.g. 2171" />
            </div>
            <div>
              <Label required>Type</Label>
              <Select value={type} onChange={(e) => setType(e.target.value)} className="mt-1">
                <option value="civil">Civil</option>
                <option value="emergency">Emergency</option>
              </Select>
            </div>
            <div>
              <Label required>Priority</Label>
              <Select value={priority} onChange={(e) => setPriority(e.target.value)} className="mt-1">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Select>
            </div>
          </div>
          <div>
            <Label required>Details</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} required className="mt-1" placeholder="What's happening?" />
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              variant="boxed"
              accent={emergency ? "red" : "status-green"}
              icon={<Send size={16} />}
              disabled={status === "sending"}
            >
              {status === "sending" ? "Sending..." : emergency ? "Call 911" : "Send 311 Report"}
            </Button>
            <Button type="button" variant="plain" accent="neutral" onClick={onClose}>
              Close
            </Button>
            {status === "error" && <span className="text-xs text-accent-red">Something went wrong.</span>}
          </div>
        </form>
      )}
    </FloatingWindow>
  );
}
