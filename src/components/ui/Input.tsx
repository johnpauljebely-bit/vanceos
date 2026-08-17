import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, placeholder, ...props }, ref) => (
    <input
      ref={ref}
      placeholder={placeholder ?? "N/A"}
      className={cn(
        "w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-sm text-fg placeholder:text-fg-muted",
        "focus:outline-none focus:ring-1 focus:ring-[var(--accent-focus)] focus:border-[var(--accent-focus)]",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
