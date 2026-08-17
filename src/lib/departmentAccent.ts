/**
 * Department accent split, confirmed by the user: Delta PD is blue
 * everywhere (unit-select and the CAD dashboard itself); RCMP/BCHP
 * ("whitelisted") are green everywhere, including inside their own CAD.
 */
export type DeptAccentId = "blue" | "verify-green";

export function accentIdForDepartment(department: string): DeptAccentId {
  return department === "rcmp" || department === "bchp" ? "verify-green" : "blue";
}

export function accentVarForDepartment(department: string): string {
  return accentIdForDepartment(department) === "verify-green" ? "--accent-verify-green" : "--accent-blue";
}

export function accentTextClassForDepartment(department: string): string {
  return accentIdForDepartment(department) === "verify-green" ? "text-accent-verify-green" : "text-accent-blue";
}

// For components that only receive the resolved `accentVar` CSS custom
// property (e.g. every FloatingWindow-based CAD window), not the raw
// department string — same blue/green split, derived from the var name.
export function accentIdFromVar(accentVar?: string): DeptAccentId {
  return accentVar === "--accent-verify-green" ? "verify-green" : "blue";
}

export function accentTextClassFromVar(accentVar?: string): string {
  return accentIdFromVar(accentVar) === "verify-green" ? "text-accent-verify-green" : "text-accent-blue";
}

export function accentBorderTextClassFromVar(accentVar?: string): string {
  return accentIdFromVar(accentVar) === "verify-green"
    ? "border-accent-verify-green text-accent-verify-green"
    : "border-accent-blue text-accent-blue";
}

// Same idea plus a tinted background, for toggle buttons that fill in when active.
export function accentToggleActiveClassFromVar(accentVar?: string): string {
  return accentIdFromVar(accentVar) === "verify-green"
    ? "border-accent-verify-green bg-accent-verify-green/10 text-accent-verify-green"
    : "border-accent-blue bg-accent-blue/10 text-accent-blue";
}

export function accentHoverTextClassFromVar(accentVar?: string): string {
  return accentIdFromVar(accentVar) === "verify-green" ? "hover:text-accent-verify-green" : "hover:text-accent-blue";
}
