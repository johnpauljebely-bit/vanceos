"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { TeamTile, type TeamTileData } from "./TeamTile";
import { cn } from "@/lib/cn";

export function TeamSelectScreen({
  userName,
  userImage,
  civilianAccess,
  deltaPdAccess,
  rcmpAccess,
  bchpAccess,
}: {
  userName: string;
  userImage: string | null;
  civilianAccess: boolean;
  deltaPdAccess: boolean;
  rcmpAccess: boolean;
  bchpAccess: boolean;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [whitelistedOpen, setWhitelistedOpen] = useState(false);

  const whitelistedAccess = rcmpAccess || bchpAccess;

  const tiles: TeamTileData[] = [
    {
      key: "civilian",
      label: "Civilian",
      subtitle: "Civilian",
      image: "/brand/team-civilian.png",
      enabled: civilianAccess,
      href: "/civilian",
      accentVar: "--accent-light-red",
    },
    {
      key: "fire",
      label: "Delta Fire Rescue",
      subtitle: "Fire & Rescue",
      // Not built yet — always restricted regardless of role, per the user.
      image: "/brand/team-fire.png",
      enabled: false,
      accentVar: "--accent-verify-green",
    },
    {
      key: "police",
      label: "Delta Police",
      subtitle: "Law Enforcement",
      image: "/brand/team-police.png",
      enabled: deltaPdAccess,
      href: "/leo/delta-pd/unit-select",
      accentVar: "--accent-blue",
    },
    {
      key: "whitelisted",
      label: "Whitelisted",
      subtitle: "RCMP & BCHP",
      image: "/brand/team-whitelisted.png",
      enabled: whitelistedAccess,
      accentVar: "--accent-verify-green",
    },
  ];

  return (
    <main className="relative flex min-h-screen w-full flex-col overflow-hidden bg-black p-6 sm:p-10">
      {/* Soft ambient glow so the page doesn't read as flat black. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,var(--accent-verify-green)_0%,transparent_60%)] opacity-[0.15]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_100%,var(--accent-verify-green)_0%,transparent_60%)] opacity-10" />

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {userImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={userImage} alt="" className="h-14 w-14 rounded-full border border-white/10" />
          ) : (
            <div className="h-14 w-14 rounded-full border border-white/10 bg-white/5" />
          )}
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Back at it, {userName}!</h1>
            <p className="text-sm font-light uppercase tracking-widest text-fg-muted">Select A Team</p>
          </div>
        </div>
        <Image src="/brand/logo-white.png" alt="Triton CAD" width={44} height={44} className="opacity-90" />
      </div>

      <div className="relative z-10 flex flex-1 items-center">
        <div className="flex w-full gap-5">
          {tiles.map((tile) => (
            <TeamTile
              key={tile.key}
              tile={tile}
              hovered={hovered === tile.key}
              onHoverStart={() => setHovered(tile.key)}
              onHoverEnd={() => setHovered(null)}
              onClick={tile.key === "whitelisted" ? () => setWhitelistedOpen(true) : undefined}
            />
          ))}
        </div>
      </div>

      {whitelistedOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setWhitelistedOpen(false)}>
          <div
            className="flex w-full max-w-xs flex-col gap-3 rounded-2xl border border-white/10 bg-bg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-center text-lg font-bold text-white">Choose Unit</h2>
            {rcmpAccess && (
              <Link
                href="/leo/rcmp/unit-select"
                className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-semibold text-white hover:border-accent-verify-green hover:bg-accent-verify-green/10"
              >
                RCMP
              </Link>
            )}
            {bchpAccess && (
              <Link
                href="/leo/bchp/unit-select"
                className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-semibold text-white hover:border-accent-verify-green hover:bg-accent-verify-green/10"
              >
                BCHP
              </Link>
            )}
            <button
              type="button"
              onClick={() => setWhitelistedOpen(false)}
              className="mt-1 text-center text-xs text-white/40 hover:text-white/70"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        aria-label="Sign out"
        className={cn(
          "group absolute bottom-6 left-1/2 z-20 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full",
          "border border-white/10 bg-white/5 text-white/60 transition-all duration-200 ease-out",
          "hover:scale-110 hover:border-accent-verify-green hover:bg-accent-verify-green/10 hover:text-accent-verify-green active:scale-95",
        )}
      >
        <LogOut size={16} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
      </button>
    </main>
  );
}
