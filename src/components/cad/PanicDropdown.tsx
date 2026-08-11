"use client";

import { useState } from "react";
import { AlertTriangle, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function PanicDropdown() {
  const [open, setOpen] = useState(false);
  const [postal, setPostal] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function send() {
    if (!postal.trim()) return;
    setSending(true);
    await fetch("/api/panic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postal }),
    });
    setSending(false);
    setSent(true);
    setTimeout(() => {
      setOpen(false);
      setSent(false);
      setPostal("");
    }, 1200);
  }

  return (
    <div className="relative">
      <Button variant="boxed" accent="red" icon={<AlertTriangle size={14} />} onClick={() => setOpen((v) => !v)}>
        Panic
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-accent-red bg-surface p-3 shadow-2xl">
            {sent ? (
              <p className="text-sm text-accent-red">Panic broadcast sent.</p>
            ) : (
              <>
                <label className="mb-1 block text-xs font-bold text-fg">Current Postal</label>
                <div className="flex items-center gap-2">
                  <Input
                    value={postal}
                    onChange={(e) => setPostal(e.target.value)}
                    placeholder="e.g. 2171"
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={send}
                    disabled={!postal.trim() || sending}
                    className="text-accent-red disabled:opacity-40"
                    aria-label="Send panic broadcast"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
