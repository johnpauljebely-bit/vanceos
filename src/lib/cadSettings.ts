// Small persisted CAD preferences, separate from layoutMode.ts since these
// are sticky across sessions (localStorage) rather than per-tab-session
// (sessionStorage) — a muted alert or hidden widget should stay that way
// tomorrow, unlike the splitscreen/windows layout choice.

const DISPATCH_ALERT_MUTED_KEY = "dc-cad-dispatch-alert-muted";
const MAP_OVERVIEW_VISIBLE_KEY = "dc-cad-map-overview-visible";
const CLOCK_FORMAT_KEY = "dc-cad-clock-format";

export type ClockFormat = "24h" | "12h";

export function loadDispatchAlertMuted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(DISPATCH_ALERT_MUTED_KEY) === "1";
}

export function saveDispatchAlertMuted(muted: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DISPATCH_ALERT_MUTED_KEY, muted ? "1" : "0");
}

export function loadMapOverviewVisible(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(MAP_OVERVIEW_VISIBLE_KEY) !== "0";
}

export function saveMapOverviewVisible(visible: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MAP_OVERVIEW_VISIBLE_KEY, visible ? "1" : "0");
}

export function loadClockFormat(): ClockFormat {
  if (typeof window === "undefined") return "24h";
  return localStorage.getItem(CLOCK_FORMAT_KEY) === "12h" ? "12h" : "24h";
}

export function saveClockFormat(format: ClockFormat) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLOCK_FORMAT_KEY, format);
}
