export type LayoutMode = "windows" | "split";

const STORAGE_KEY = "dc-cad-layout-mode";

export function loadLayoutMode(): LayoutMode {
  if (typeof window === "undefined") return "split";
  return sessionStorage.getItem(STORAGE_KEY) === "windows" ? "windows" : "split";
}

export function saveLayoutMode(mode: LayoutMode) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, mode);
}
