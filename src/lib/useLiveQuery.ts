"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/**
 * Polling today (~4s). No WebSocket source exists yet — that requires the
 * bot's live_units cache table (BOT_SIDE_INSTRUCTIONS.md #3). Every live
 * board consumes this single hook so swapping the transport later touches
 * one file, not every component.
 */
export function useLiveQuery<T>(url: string, intervalMs = 4000) {
  return useSWR<T>(url, fetcher, { refreshInterval: intervalMs });
}
