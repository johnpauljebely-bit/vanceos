"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

const OPTIONS = ["Male", "Female", "Non-binary", "Prefer not to say"];

export function GenderSetupForm() {
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function confirm() {
    if (!selected) return;
    setSaving(true);
    await fetch("/api/civilian/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gender: selected }),
    });
    router.push("/civilian");
    router.refresh();
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 rounded-2xl border border-border-subtle bg-surface p-6">
      <h2 className="text-lg font-bold text-fg">One more thing</h2>
      <p className="text-sm text-fg-muted">
        Roblox doesn&apos;t expose account gender, so pick one for your civilian profile. You can change it later.
      </p>
      <div className="flex flex-col gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setSelected(opt)}
            className={`rounded-lg border px-4 py-2 text-left text-sm ${
              selected === opt
                ? "border-accent-light-red text-accent-light-red"
                : "border-border-subtle text-fg hover:border-fg-muted"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      <Button variant="boxed" accent="light-red" disabled={!selected || saving} onClick={confirm}>
        {saving ? "Saving..." : "Continue"}
      </Button>
    </div>
  );
}
