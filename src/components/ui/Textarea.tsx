import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, placeholder, ...props }, ref) => (
  <textarea
    ref={ref}
    placeholder={placeholder ?? "N/A"}
    className={cn(
      "w-full min-h-24 resize-y rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-sm text-fg placeholder:text-fg-muted",
      "focus:outline-none focus:ring-1 focus:ring-accent-teal focus:border-accent-teal",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
