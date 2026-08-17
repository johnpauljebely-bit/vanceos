"use client";

import { useState } from "react";
import { FloatingWindow } from "@/components/floating-window/FloatingWindow";
import { Textarea } from "@/components/ui/Textarea";

const STORAGE_KEY = "dc-cad-notepad";

export function NotepadWindow({ onClose, accentVar }: { onClose: () => void; accentVar?: string }) {
  const [text, setText] = useState(() =>
    typeof window === "undefined" ? "" : (localStorage.getItem(STORAGE_KEY) ?? ""),
  );

  function onChange(value: string) {
    setText(value);
    localStorage.setItem(STORAGE_KEY, value);
  }

  return (
    <FloatingWindow title="Notepad" onClose={onClose} width={420} accentVar={accentVar}>
      <Textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder="On-the-fly notes — saved locally in this browser."
        className="min-h-64"
      />
    </FloatingWindow>
  );
}
