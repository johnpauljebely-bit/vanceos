const FIRST_NAMES = [
  "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Jamie", "Avery",
  "Quinn", "Reese", "Cameron", "Drew", "Skyler", "Rowan", "Emerson",
];
const LAST_NAMES = [
  "Whitfield", "Marsh", "Kane", "Ortega", "Blackwood", "Sterling", "Delgado",
  "Voss", "Hartley", "Nakamura", "Reyes", "Callahan", "Frost", "Iverson",
];

export function generateRpName(): string {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${first} ${last}`;
}
