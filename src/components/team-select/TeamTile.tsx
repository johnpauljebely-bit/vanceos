import Link from "next/link";
import { cn } from "@/lib/cn";

export function TeamTile({
  href,
  label,
  icon,
  enabled,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  enabled: boolean;
}) {
  const content = (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-2xl border p-10 transition-colors",
        enabled
          ? "border-border-subtle bg-surface text-fg hover:border-accent-teal hover:bg-white/5"
          : "border-border-subtle bg-surface text-fg-disabled opacity-40 grayscale-[0.4] pointer-events-none",
      )}
    >
      <div className={cn(enabled ? "text-accent-teal" : "text-fg-disabled")}>{icon}</div>
      <span className="text-lg font-bold">{label}</span>
      {!enabled && <span className="text-xs text-fg-muted">Restricted</span>}
    </div>
  );

  if (!enabled) {
    return <div aria-disabled="true">{content}</div>;
  }
  return <Link href={href}>{content}</Link>;
}
