"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

interface WindowManagerContextValue {
  zIndexOf: (id: string) => number;
  focus: (id: string) => void;
  register: (id: string) => void;
  unregister: (id: string) => void;
}

const WindowManagerContext = createContext<WindowManagerContextValue | null>(null);

/**
 * Tracks z-index stacking across every open FloatingWindow instance so
 * multiple windows (Lookup today, more later) can be open and dragged
 * around at once, with the last-focused one always on top. Per-window UI
 * state (minimized/fullscreen/pinned/locked/position) lives inside each
 * FloatingWindow itself — only stacking order is centralized here.
 */
export function WindowManagerProvider({
  children,
  accentVar,
}: {
  children: React.ReactNode;
  /** CSS custom property name (e.g. "--accent-light-red") applied as
   * --accent-focus on a `display: contents` wrapper — every FloatingWindow
   * opened from this provider, and the portal's own inline content, live as
   * siblings with no shared DOM ancestor otherwise, so this is the one
   * place a portal-wide focus-ring color can actually reach both. */
  accentVar?: string;
}) {
  const [zIndices, setZIndices] = useState<Record<string, number>>({});
  const counter = useRef(10);

  const focus = useCallback((id: string) => {
    counter.current += 1;
    setZIndices((prev) => ({ ...prev, [id]: counter.current }));
  }, []);

  const register = useCallback((id: string) => {
    counter.current += 1;
    setZIndices((prev) => ({ ...prev, [id]: counter.current }));
  }, []);

  const unregister = useCallback((id: string) => {
    setZIndices((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const zIndexOf = useCallback((id: string) => zIndices[id] ?? 10, [zIndices]);

  return (
    <WindowManagerContext.Provider value={{ zIndexOf, focus, register, unregister }}>
      <div className="contents" style={accentVar ? ({ "--accent-focus": `var(${accentVar})` } as React.CSSProperties) : undefined}>
        {children}
      </div>
    </WindowManagerContext.Provider>
  );
}

export function useWindowManager() {
  const ctx = useContext(WindowManagerContext);
  if (!ctx) throw new Error("useWindowManager must be used within a WindowManagerProvider");
  return ctx;
}
