export type LayoutMode = "windows" | "split";

const STORAGE_KEY = "dc-cad-layout-mode";

export function loadLayoutMode(): LayoutMode {
  if (typeof window === "undefined") return "windows";
  return sessionStorage.getItem(STORAGE_KEY) === "split" ? "split" : "windows";
}

export function saveLayoutMode(mode: LayoutMode) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, mode);
}
