import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "w-full appearance-none rounded-lg border border-border-subtle bg-surface-input px-3 py-2 pr-8 text-sm text-fg",
          "focus:outline-none focus:ring-1 focus:ring-accent-blue focus:border-accent-blue",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted"
      />
    </div>
  ),
);
Select.displayName = "Select";
