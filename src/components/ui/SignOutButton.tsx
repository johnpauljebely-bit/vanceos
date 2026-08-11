"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="inline-flex items-center gap-1.5 text-xs text-fg-muted hover:text-accent-red"
    >
      <LogOut size={12} />
      Sign out
    </button>
  );
}
