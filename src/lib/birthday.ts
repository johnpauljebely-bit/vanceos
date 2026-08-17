/**
 * Civilian birthday derivation (confirmed spec): month/day come from the
 * Roblox account's creation date, year is the creation year minus 13 —
 * the floor is a hard legal minimum (no under-13 characters), not just a
 * "plausible adult" nudge. Since age = currentYear - (createdYear - 13) =
 * (currentYear - createdYear) + 13 and currentYear is always >= createdYear,
 * this guarantees age >= 13 for any account, at creation and for all time
 * after. Locked field — never editable.
 *
 * Pure function, deliberately separated from any Roblox API call so it's
 * unit-testable without network access.
 */
export function deriveBirthday(createdAtIso: string): {
  month: number; // 1-12
  day: number;
  year: number;
  display: string; // MM-DD-YYYY
} {
  const created = new Date(createdAtIso);
  if (Number.isNaN(created.getTime())) {
    throw new Error(`deriveBirthday: invalid date "${createdAtIso}"`);
  }
  const month = created.getUTCMonth() + 1;
  const day = created.getUTCDate();
  const year = created.getUTCFullYear() - 13;
  const pad = (n: number) => String(n).padStart(2, "0");
  return { month, day, year, display: `${pad(month)}-${pad(day)}-${year}` };
}
