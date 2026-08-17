"use client";

import { FloatingWindow } from "@/components/floating-window/FloatingWindow";
import { CallIntakeForm } from "./CallIntakeForm";

interface ActiveCall {
  id: string;
  title: string | null;
}

/**
 * The full structured call form (Status/Type/Origin/Primary Unit/etc) now
 * only opens as its own window — from "Edit" on a compact CallCard, or
 * "New Call" — instead of always being rendered inline. CallIntakeForm's
 * own logic (join/self-clear/broadcast/notes) is untouched, just re-homed.
 */
export function CallDetailWindow({
  call,
  canManage,
  onJoined,
  onSelfCleared,
  onClose,
  accentVar,
}: {
  call: ActiveCall | null;
  canManage: boolean;
  onJoined?: () => void;
  onSelfCleared?: () => void;
  onClose: () => void;
  accentVar?: string;
}) {
  return (
    <FloatingWindow title={call ? call.title || "Call" : "New Call"} onClose={onClose} width={640} accentVar={accentVar}>
      <CallIntakeForm
        initialCall={call}
        canManage={canManage}
        onJoined={onJoined}
        onSelfCleared={onSelfCleared}
        accentVar={accentVar}
      />
    </FloatingWindow>
  );
}
