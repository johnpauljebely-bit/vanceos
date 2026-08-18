"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, Shuffle, DoorOpen } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Top-right account control — hover (not click) opens a small dropdown
 * with Switch Panel (team-select) and Leave CAD (real sign-out, unlike
 * QuickActionsMenu's old "Leave" which just navigated to team-select
 * while staying logged in). Matches the old CAD's logo-hover dropdown
 * pattern, just relocated here.
 */
export function CadAccountMenu() {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  function show() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }
  function scheduleHide() {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  }

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={scheduleHide}>
      <button
        type="button"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle text-fg-muted",
          "transition-all duration-200 ease-out hover:border-accent-red hover:bg-accent-red/10 hover:text-accent-red",
        )}
      >
        <LogOut size={13} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-border-subtle bg-surface py-1 shadow-2xl">
          <button
            type="button"
            onClick={() => router.push("/team-select")}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-fg hover:bg-white/5"
          >
            <Shuffle size={14} />
            Switch Panel
          </button>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-accent-red hover:bg-white/5"
          >
            <DoorOpen size={14} />
            Leave CAD
          </button>
        </div>
      )}
    </div>
  );
}
