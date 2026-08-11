import { cn } from "@/lib/cn";

export function Label({
  children,
  required,
  className,
}: {
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={cn("text-sm font-bold text-fg", className)}>
      {children}
      {required && <span className="text-accent-red">*</span>}
    </label>
  );
}
