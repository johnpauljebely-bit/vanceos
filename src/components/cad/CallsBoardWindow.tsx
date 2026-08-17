"use client";

import { FloatingWindow } from "@/components/floating-window/FloatingWindow";
import { CallsBoardContent, type BoardCall } from "./CallsBoardContent";

export type { BoardCall };

export function CallsBoardWindow({
  onOpenCall,
  onClose,
  onJoined,
  accentVar,
}: {
  onOpenCall: (call: BoardCall) => void;
  onClose: () => void;
  onJoined?: () => void;
  accentVar?: string;
}) {
  return (
    <FloatingWindow title="Calls" onClose={onClose} width={520} accentVar={accentVar}>
      <CallsBoardContent onOpenCall={onOpenCall} onJoined={onJoined} accentVar={accentVar} />
    </FloatingWindow>
  );
}
