import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type Accent = "teal" | "status-green" | "red" | "neutral";
type Variant = "boxed" | "plain";

const accentText: Record<Accent, string> = {
  teal: "text-accent-teal",
  "status-green": "text-accent-status-green",
  red: "text-accent-red",
  neutral: "text-fg",
};

const accentBorder: Record<Accent, string> = {
  teal: "border-accent-teal",
  "status-green": "border-accent-status-green",
  red: "border-accent-red",
  neutral: "border-border-subtle",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  accent?: Accent;
  active?: boolean;
  icon?: React.ReactNode;
}

/**
 * Two button styles per the design system:
 * - "boxed": visible rounded-rectangle outline around icon+label (top nav's
 *   Panic/Radio/Bodycam/Available).
 * - "plain": icon + colored text, no border/background, lower visual weight
 *   (toolbar actions: New Record/Get Call/Search/Records/Automations).
 * Disabled always renders grayed/lower-opacity with no hover affordance,
 * regardless of variant.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "plain", accent = "teal", active, icon, disabled, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap",
          variant === "boxed" &&
            cn(
              "rounded-lg border px-4 py-2",
              accentBorder[accent],
              accentText[accent],
              !disabled && "hover:bg-white/5",
            ),
          variant === "plain" &&
            cn(accentText[accent], !disabled && "hover:opacity-80"),
          active && variant === "plain" && "font-semibold",
          disabled && "opacity-40 pointer-events-none grayscale-[0.4]",
          className,
        )}
        {...props}
      >
        {icon}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
