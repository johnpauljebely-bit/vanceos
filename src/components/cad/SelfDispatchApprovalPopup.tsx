"use client";

import { useEffect, useState } from "react";
import { ShieldQuestion } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { accentIdFromVar, accentTextClassFromVar } from "@/lib/departmentAccent";
import { cn } from "@/lib/cn";

interface PendingRequest {
  id: number;
  requesterCallsignKey: string;
}

/**
 * Mounted once inside CadPanel regardless of whether this unit is
 * currently requesting Self Dispatch — anyone with an eligible rank could
 * be asked to approve someone else's request at any time.
 */
export function SelfDispatchApprovalPopup({ accentVar }: { accentVar?: string } = {}) {
  const [pending, setPending] = useState<PendingRequest | null>(null);
  const [responding, setResponding] = useState(false);
  const accentTextClass = accentTextClassFromVar(accentVar);
  const accentBorderClass = accentIdFromVar(accentVar) === "verify-green" ? "border-accent-verify-green" : "border-accent-blue";

  useEffect(() => {
    const id = setInterval(() => {
      fetch("/api/self-dispatch/pending")
        .then((r) => r.json())
        .then((data) => setPending(data.request ?? null))
        .catch(() => {});
    }, 3000);
    return () => clearInterval(id);
  }, []);

  async function respond(approved: boolean) {
    if (!pending) return;
    setResponding(true);
    await fetch("/api/self-dispatch/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: pending.id, approved }),
    });
    setPending(null);
    setResponding(false);
  }

  if (!pending) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60">
      <div className={cn("w-full max-w-sm rounded-2xl border bg-surface p-6 text-center shadow-2xl", accentBorderClass)}>
        <ShieldQuestion size={32} className={cn("mx-auto mb-3", accentTextClass)} />
        <p className="text-sm text-fg">
          <span className="font-bold">{pending.requesterCallsignKey.split("-")[1]}</span> wants the ability to
          self dispatch this session.
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <Button variant="boxed" accent="status-green" onClick={() => respond(true)} disabled={responding}>
            Accept
          </Button>
          <Button variant="boxed" accent="red" onClick={() => respond(false)} disabled={responding}>
            Deny
          </Button>
        </div>
      </div>
    </div>
  );
}
