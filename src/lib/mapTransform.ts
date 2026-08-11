/**
 * Real ER:LC world (x, z) → `public/erlcmap.webp` pixel position, as a
 * percentage of image width/height (top-left origin), assuming an
 * axis-aligned map (no rotation — standard for these top-down layouts).
 *
 * Calibrated 2026-08-11 from 3 live samples (a real player standing at
 * postal 900, 300, and 700, coordinates read from `live_players` while
 * confirming their postal in-game) — least-squares fit, not guessed. See
 * COORDINATION.md for the raw sample points. Residuals were small (~0.2-2%)
 * across all 3; if positions ever look visibly off, a few more samples
 * spread across the map would tighten this further.
 */
const X_SCALE = 0.0329;
const X_OFFSET = -1.234;
const Z_SCALE = 0.02911;
const Z_OFFSET = 1.941;

export function worldToPct(x: number, z: number): [number, number] {
  const xPct = X_SCALE * x + X_OFFSET;
  const zPct = Z_SCALE * z + Z_OFFSET;
  return [Math.min(100, Math.max(0, xPct)), Math.min(100, Math.max(0, zPct))];
}
