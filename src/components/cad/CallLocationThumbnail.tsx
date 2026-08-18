"use client";

import { postalToCoords } from "@/lib/postalCoords";
import { cn } from "@/lib/cn";

/**
 * Small cropped map thumbnail centered on a call's postal, with a pin
 * marker — the "cropped map thing" every call location display should use
 * instead of a plain postal string. Reused by CallCard (active calls) and
 * the Archives list (cleared calls).
 *
 * Zoom is moderate (280%, was 500%) so it reads as a normal, legible map
 * crop rather than an overly tight/cluttered close-up — per the user's
 * "readable and normal map just cropped" ask. The pin is a real teardrop
 * marker shape (white outline + drop shadow + colored fill/dot) instead of
 * a flat icon, which was reported as "kinda sucks."
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
  const fillColor = isGreen ? "var(--accent-verify-green)" : "var(--accent-blue)";

  return (
    <div className={cn("relative overflow-hidden rounded-lg border border-border-subtle bg-black", className)}>
      {coords ? (
        <>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url(/erlcmap.webp)",
              backgroundSize: "280% 280%",
              backgroundPosition: `${coords[0]}% ${coords[1]}%`,
            }}
          />
          <svg
            className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.6)]"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M12 2C7.58 2 4 5.58 4 10c0 5.25 6.72 11.15 7.01 11.4a1.5 1.5 0 0 0 1.98 0C13.28 21.15 20 15.25 20 10c0-4.42-3.58-8-8-8Z"
              fill={fillColor}
              stroke="white"
              strokeWidth="1.5"
            />
            <circle cx="12" cy="10" r="3" fill="white" />
          </svg>
        </>
      ) : (
        <div className="flex h-full items-center justify-center text-[11px] text-fg-disabled">No location</div>
      )}
    </div>
  );
}
