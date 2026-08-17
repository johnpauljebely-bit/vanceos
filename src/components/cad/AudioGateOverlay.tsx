"use client";

import { useState } from "react";
import { Volume2 } from "lucide-react";
import { unlockAudio } from "@/lib/dispatchAudio";
import { accentIdFromVar, accentTextClassFromVar } from "@/lib/departmentAccent";
import { AUDIO_GATE_SESSION_KEY } from "@/lib/audioGateSession";
import { cn } from "@/lib/cn";

/**
 * One-time-per-CAD-session gate before dispatch alerts (beep + spoken
 * callsign) can play. Browsers block audio until a real user gesture, and
 * there's no API to check actual device/tab volume — this ensures audio
 * CAN play, it can't verify your volume is actually up.
 *
 * "Dismissed" is tracked in sessionStorage, not component state, so it
 * survives incidental remounts of this panel while you're on the CAD
 * (switching units, etc. — otherwise the gate would pop back up mid-shift,
 * which is exactly the "showing randomly" bug reported). Team-select clears
 * that key on load (see AUDIO_GATE_SESSION_KEY), so re-entering the CAD
 * through team-select always shows it fresh again.
 */
export function AudioGateOverlay({ accentVar }: { accentVar?: string } = {}) {
  const [dismissed, setDismissed] = useState(
    () => typeof window !== "undefined" && sessionStorage.getItem(AUDIO_GATE_SESSION_KEY) === "1",
  );
  const accentTextClass = accentTextClassFromVar(accentVar);
  const accentBorderClass = accentIdFromVar(accentVar) === "verify-green" ? "border-accent-verify-green" : "border-accent-blue";
  const accentHoverBgClass =
    accentIdFromVar(accentVar) === "verify-green" ? "hover:bg-accent-verify-green/10" : "hover:bg-accent-blue/10";

  if (dismissed) return null;

  async function enable() {
    await unlockAudio();
    sessionStorage.setItem(AUDIO_GATE_SESSION_KEY, "1");
    setDismissed(true);
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className={cn("flex max-w-sm flex-col items-center gap-4 rounded-2xl border bg-surface p-8 text-center shadow-2xl", accentBorderClass)}>
        <Volume2 size={32} className={accentTextClass} />
        <div>
          <h2 className="text-lg font-bold text-fg">Enable Dispatch Alerts</h2>
          <p className="mt-2 text-sm text-fg-muted">
            When you&apos;re auto-assigned to a call, the CAD plays a tone and reads it out loud.
            Click below once so your browser allows that — make sure your volume is on.
          </p>
        </div>
        <button
          type="button"
          onClick={enable}
          className={cn(
            "rounded-lg border px-6 py-2.5 text-sm font-bold",
            accentBorderClass,
            accentTextClass,
            accentHoverBgClass,
          )}
        >
          Enable Audio
        </button>
      </div>
    </div>
  );
}
