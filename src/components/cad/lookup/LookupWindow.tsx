"use client";

import { FloatingWindow } from "@/components/floating-window/FloatingWindow";
import { LookupContent, type TabId } from "./LookupContent";

export function LookupWindow({
  onClose,
  initialTab = "name",
  accentVar,
}: {
  onClose: () => void;
  initialTab?: TabId;
  accentVar?: string;
}) {
  return (
    <FloatingWindow title="Lookup" onClose={onClose} width={760} accentVar={accentVar}>
      <LookupContent initialTab={initialTab} accentVar={accentVar} />
    </FloatingWindow>
  );
}
