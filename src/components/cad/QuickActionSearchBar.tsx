"use client";

/**
 * Ported from /Users/Test/portfolio/components/kokonutui/action-search-bar.tsx
 * (@kokonutui, MIT license, https://kokonutui.com) and restyled to the CAD's
 * design tokens. Replaces the Radio/Bodycam button slots in the top nav —
 * those were placeholders with no real function; this is a real command
 * bar wired to actual CAD actions (Lookup, Records, Warrants, navigation).
 */

import { Search, Send } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/cn";

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
  end?: string;
}

interface SearchResult {
  actions: QuickAction[];
}

const ANIMATION_VARIANTS = {
  container: {
    hidden: { opacity: 0, height: 0 },
    show: { opacity: 1, height: "auto", transition: { height: { duration: 0.3 }, staggerChildren: 0.06 } },
    exit: { opacity: 0, height: 0, transition: { height: { duration: 0.2 }, opacity: { duration: 0.15 } } },
  },
  item: {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, y: -6, transition: { duration: 0.15 } },
  },
} as const;

export function QuickActionSearchBar({
  actions,
  onActionSelect,
  placeholder = "Quick actions...",
}: {
  actions: QuickAction[];
  onActionSelect: (action: QuickAction) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debouncedQuery = useDebounce(query, 150);

  const filteredActions = useMemo(() => {
    if (!debouncedQuery) return actions;
    const q = debouncedQuery.toLowerCase().trim();
    return actions.filter((a) => `${a.label} ${a.description ?? ""}`.toLowerCase().includes(q));
  }, [debouncedQuery, actions]);

  // Derived, not stored: avoids a setState-in-effect render cascade for
  // what's really just "what should the dropdown show right now."
  const result: SearchResult | null = useMemo(
    () => (isFocused ? { actions: filteredActions } : null),
    [isFocused, filteredActions],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!result?.actions.length) return;
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prev) => (prev < result.actions.length - 1 ? prev + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : result.actions.length - 1));
          break;
        case "Enter":
          e.preventDefault();
          if (activeIndex >= 0 && result.actions[activeIndex]) {
            onActionSelect(result.actions[activeIndex]);
            setQuery("");
            setIsFocused(false);
          }
          break;
        case "Escape":
          setIsFocused(false);
          setActiveIndex(-1);
          break;
      }
    },
    [result, activeIndex, onActionSelect],
  );

  function handleActionClick(action: QuickAction) {
    onActionSelect(action);
    setQuery("");
    setIsFocused(false);
  }

  return (
    <div className="relative w-56">
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={isFocused}
          className="h-8 py-1 pr-8 text-xs"
        />
        <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
          {query.length > 0 ? <Send size={13} className="text-fg-muted" /> : <Search size={13} className="text-fg-muted" />}
        </div>
      </div>

      <AnimatePresence>
        {isFocused && result && (
          <motion.div
            initial="hidden"
            animate="show"
            exit="exit"
            variants={ANIMATION_VARIANTS.container}
            className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-2xl"
          >
            <motion.ul role="listbox">
              {result.actions.length === 0 ? (
                <li className="px-3 py-3 text-xs text-fg-muted">No matching actions</li>
              ) : (
                result.actions.map((action, i) => (
                  <motion.li
                    key={action.id}
                    variants={ANIMATION_VARIANTS.item}
                    onMouseDown={() => handleActionClick(action)}
                    className={cn(
                      "flex cursor-pointer items-center justify-between px-3 py-2 text-sm",
                      i === activeIndex ? "bg-white/5" : "hover:bg-white/5",
                    )}
                  >
                    <span className="flex items-center gap-2 text-fg">
                      {action.icon}
                      {action.label}
                    </span>
                    {action.end && <span className="text-xs text-fg-muted">{action.end}</span>}
                  </motion.li>
                ))
              )}
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
