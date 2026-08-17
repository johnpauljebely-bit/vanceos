"use client";

import { MapPin } from "lucide-react";
import { postalToCoords } from "@/lib/postalCoords";
import { cn } from "@/lib/cn";

/**
 * Small cropped/zoomed-in map thumbnail centered on a call's postal, with a
 * pin marker — the "cropped map thing" every call location display should
 * use instead of a plain postal string. Reused by CallCard (active calls)
 * and the Archives list (cleared calls).
 */
export function CallLocationThumbnail({
  postal,
  accentVar,
  className,
}: {
  postal: string | null;
  accentVar?: string;
  className?: string;
}) {
  const coords = postalToCoords(postal);
  const isGreen = accentVar === "--accent-verify-green";

  return (
    <div className={cn("relative overflow-hidden rounded-lg border border-border-subtle bg-black", className)}>
      {coords ? (
        <>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url(/erlcmap.webp)",
              backgroundSize: "500% 500%",
              backgroundPosition: `${coords[0]}% ${coords[1]}%`,
            }}
          />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <MapPin size={20} className={isGreen ? "text-accent-verify-green" : "text-accent-blue"} fill="currentColor" />
          </div>
        </>
      ) : (
        <div className="flex h-full items-center justify-center text-[11px] text-fg-disabled">No location</div>
      )}
    </div>
  );
}
