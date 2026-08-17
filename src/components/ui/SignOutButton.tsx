"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/cn";

/** Small circular icon button — matches the sign-out button on team-select, not a labeled "Sign out" link. */
export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      aria-label="Sign out"
      title="Sign out"
      className={cn(
        "group flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle text-fg-muted",
        "transition-all duration-200 ease-out hover:scale-110 hover:border-accent-red hover:bg-accent-red/10 hover:text-accent-red active:scale-95",
      )}
    >
      <LogOut size={13} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
    </button>
  );
}
