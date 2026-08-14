"use client";

import { useState } from "react";
import { Volume2 } from "lucide-react";
import { unlockAudio } from "@/lib/dispatchAudio";

/**
 * One-time gate before dispatch alerts (beep + spoken callsign) can play.
 * Browsers block audio until a real user gesture, and there's no API to
 * check actual device/tab volume — this ensures audio CAN play, it can't
 * verify your volume is actually up. Disappears permanently for this tab
 * once clicked.
 */
export function AudioGateOverlay() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  async function enable() {
    await unlockAudio();
    setDismissed(true);
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-accent-teal bg-surface p-8 text-center shadow-2xl">
        <Volume2 size={32} className="text-accent-teal" />
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
          className="rounded-lg border border-accent-teal px-6 py-2.5 text-sm font-bold text-accent-teal hover:bg-accent-teal/10"
        >
          Enable Audio
        </button>
      </div>
    </div>
  );
}
