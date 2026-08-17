"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";

export interface TeamTileData {
  key: string;
  label: string;
  subtitle: string;
  image: string;
  enabled: boolean;
  href?: string;
  /** CSS custom property name, e.g. "--accent-blue" — each tile gets its own accent per the user's split (civilian=red, police=blue, sheriff=green). */
  accentVar: string;
}

/**
 * Every tile is `flex-1` ALWAYS — hovering one must never resize, shift, or
 * otherwise touch its siblings. The hover effect is a `transform: scale()`
 * on the hovered tile alone, which is purely visual/compositing and can't
 * push or shrink anything else (unlike flex-grow redistribution, which
 * necessarily takes space from siblings even if their own CSS never
 * changes — that's what caused the "why did Whitelisted also move" bug).
 *
 * Per-tile accent colors are applied via inline style (not Tailwind
 * classes) since they're dynamic per tile — Tailwind can't generate a
 * class for a color it doesn't see as a literal string at build time.
 */
export function TeamTile({
  tile,
  hovered,
  onHoverStart,
  onHoverEnd,
  onClick,
}: {
  tile: TeamTileData;
  hovered: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onClick?: () => void;
}) {
  const accent = `var(${tile.accentVar})`;

  const content = (
    <div
      className={cn(
        "group relative flex h-[22rem] min-w-0 flex-1 items-end overflow-hidden rounded-3xl border bg-gradient-to-b from-surface to-bg transition-transform duration-300 ease-out sm:h-[28rem]",
        tile.enabled ? "cursor-pointer border-white/10" : "cursor-not-allowed border-white/5",
        hovered && "z-10 scale-[1.05]",
      )}
      style={hovered ? { borderColor: accent } : undefined}
      onMouseEnter={tile.enabled ? onHoverStart : undefined}
      onMouseLeave={tile.enabled ? onHoverEnd : undefined}
      onClick={tile.enabled ? onClick : undefined}
    >
      {/* Radial glow behind the character, only when this exact tile is hovered. */}
      {tile.enabled && (
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-300",
            hovered ? "opacity-25" : "opacity-0",
          )}
          style={{ background: `radial-gradient(circle at 50% 40%, ${accent} 0%, transparent 65%)` }}
        />
      )}

      {/* Character cutout — real transparency, cropped to actual content
          (source PNGs had huge transparent padding — trimmed with
          ImageMagick before landing here) in a fixed-size box near the
          label so it reads as a real character portrait, not a tiny
          floating icon. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={tile.image}
        alt=""
        className={cn(
          "absolute inset-x-0 bottom-0 h-[16rem] origin-bottom scale-125 object-contain object-bottom sm:h-[22rem]",
          !tile.enabled && "grayscale opacity-30",
        )}
      />

      <div className="relative z-10 flex w-full flex-col gap-1 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5 pt-10">
        <span className={cn("text-lg font-bold", tile.enabled ? "text-white" : "text-white/40")}>
          {tile.label}
        </span>
        {tile.enabled ? (
          <span
            className={cn(
              "overflow-hidden text-xs font-light text-white/80 transition-all duration-300",
              hovered ? "max-h-6 opacity-100" : "max-h-0 opacity-0",
            )}
          >
            {tile.subtitle}
          </span>
        ) : (
          <span className="text-xs font-light text-white/40">Restricted</span>
        )}
      </div>
    </div>
  );

  // `contents` so this wrapper generates no box of its own — the inner
  // rounded-3xl div becomes the actual flex item in the parent row. Without
  // this, the wrapper (not the div) was the real flex child and had no
  // sizing applied to it at all, which is why tiles were different widths
  // depending on whether they wrapped in an <a> or a plain <div>.
  if (!tile.enabled) {
    return <div aria-disabled="true" className="contents">{content}</div>;
  }
  if (tile.href) {
    return (
      <Link href={tile.href} className="contents">
        {content}
      </Link>
    );
  }
  return content;
}
