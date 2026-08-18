"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

const SIDE_WIDTH = 340;

/**
 * The actual splitscreen mechanic: when `wide` is true, the left panel
 * grows to fill (map shrinks to SIDE_WIDTH and moves right); when false,
 * the left panel is SIDE_WIDTH (today's default: home panel left, map
 * fills the rest). Both panels animate on explicit pixel widths (measured
 * via ResizeObserver) rather than flex-grow, since flex-basis changes
 * don't reliably transition smoothly across browsers — this is the
 * "screen pushing over" effect the user asked for.
 */
export function CadSplitLayout({
  wide,
  left,
  right,
}: {
  wide: boolean;
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => setContainerWidth(entries[0].contentRect.width));
    ro.observe(el);
    setContainerWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  const leftWidth = wide ? Math.max(containerWidth - SIDE_WIDTH, SIDE_WIDTH) : SIDE_WIDTH;
  const rightWidth = Math.max(containerWidth - leftWidth, 0);

  return (
    <div ref={containerRef} className="relative flex flex-1 overflow-hidden">
      <div
        style={{ width: containerWidth ? leftWidth : undefined }}
        className={cn(
          "shrink-0 overflow-y-auto border-r border-border-subtle bg-surface transition-[width] duration-300 ease-in-out",
          !containerWidth && (wide ? "flex-1" : "w-[340px]"),
        )}
      >
        {left}
      </div>
      <div
        style={{ width: containerWidth ? rightWidth : undefined }}
        className={cn(
          "relative flex shrink-0 flex-col overflow-hidden transition-[width] duration-300 ease-in-out",
          !containerWidth && (wide ? "w-[340px]" : "flex-1"),
        )}
      >
        {right}
      </div>
    </div>
  );
}
