"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Pin, Minus, Maximize2, Lock, Unlock, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useWindowManager } from "./WindowManagerProvider";

export function FloatingWindow({
  title,
  onClose,
  initial = { x: 160, y: 120 },
  width = 720,
  accentVar = "--accent-teal",
  children,
}: {
  title: string;
  onClose: () => void;
  initial?: { x: number; y: number };
  width?: number;
  /** CSS custom property name tinting pin/lock active state — lets each
   * department/portal (civilian=red, police=blue, ...) keep its own accent
   * on a shared window chrome instead of every window looking identical. */
  accentVar?: string;
  children: React.ReactNode;
}) {
  const accent = `var(${accentVar})`;
  const id = useId();
  const { zIndexOf, focus, register, unregister } = useWindowManager();

  const [pos, setPos] = useState(initial);
  const [pinned, setPinned] = useState(false);
  const [locked, setLocked] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    register(id);
    return () => unregister(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function onTitlePointerDown(e: React.PointerEvent) {
    focus(id);
    if (locked || fullscreen) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, originX: pos.x, originY: pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onTitlePointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const maxX = window.innerWidth - 100;
    const maxY = window.innerHeight - 40;
    setPos({
      x: Math.min(Math.max(0, dragRef.current.originX + dx), maxX),
      y: Math.min(Math.max(0, dragRef.current.originY + dy), maxY),
    });
  }
  function onTitlePointerUp() {
    dragRef.current = null;
  }

  // No outside-click-to-close: the brief requires several windows to be
  // open and draggable at once, which an auto-close-on-outside-click would
  // directly break (confirmed by testing — it closed window A the moment
  // window B's open button was clicked). Windows only close via their own
  // close (X) button or the caller's own logic. `pinned` is tracked as
  // UI state for a future auto-close trigger, if one is ever specified.

  return (
    <>
      <div
        ref={rootRef}
        role="dialog"
        aria-label={title}
        onPointerDown={() => focus(id)}
        className={cn(
          "fixed overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-2xl",
          fullscreen && "inset-6",
        )}
        style={
          fullscreen
            ? { zIndex: zIndexOf(id) }
            : { left: pos.x, top: pos.y, width, zIndex: zIndexOf(id) }
        }
      >
        <div className="h-[2px] w-full" style={{ background: accent }} />
        <div
          onPointerDown={onTitlePointerDown}
          onPointerMove={onTitlePointerMove}
          onPointerUp={onTitlePointerUp}
          className="flex cursor-move items-center justify-between border-b border-border-subtle bg-surface-input px-4 py-2 select-none"
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setPinned((p) => !p)}
              className="text-fg-muted hover:text-fg"
              style={pinned ? { color: accent } : undefined}
              aria-label="Pin window"
              title="Pin (prevents auto-close)"
            >
              <Pin size={14} />
            </button>
            <span className="text-sm font-bold text-fg">{title}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setMinimized((m) => !m)}
              className="text-fg-muted hover:text-fg"
              aria-label="Minimize"
              title="Minimize"
            >
              <Minus size={14} />
            </button>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setFullscreen((f) => !f)}
              className="text-fg-muted hover:text-fg"
              aria-label="Fullscreen"
              title="Fullscreen"
            >
              <Maximize2 size={14} />
            </button>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setLocked((l) => !l)}
              className="text-fg-muted hover:text-fg"
              style={locked ? { color: accent } : undefined}
              aria-label="Lock position"
              title="Lock position"
            >
              {locked ? <Lock size={14} /> : <Unlock size={14} />}
            </button>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onClose}
              className="text-fg-muted hover:text-accent-red"
              aria-label="Close"
              title="Close"
            >
              <X size={14} />
            </button>
          </div>
        </div>
        {!minimized && <div className="p-4">{children}</div>}
      </div>
    </>
  );
}
