const NATO_LETTERS: Record<string, string> = {
  A: "Alpha", B: "Bravo", C: "Charlie", D: "Delta", E: "Echo", F: "Foxtrot",
  G: "Golf", H: "Hotel", I: "India", J: "Juliett", K: "Kilo", L: "Lima",
  M: "Mike", N: "November", O: "Oscar", P: "Papa", Q: "Quebec", R: "Romeo",
  S: "Sierra", T: "Tango", U: "Uniform", V: "Victor", W: "Whiskey", X: "Xray",
  Y: "Yankee", Z: "Zulu",
};

const NATO_DIGITS: Record<string, string> = {
  "0": "Zero", "1": "One", "2": "Two", "3": "Three", "4": "Four",
  "5": "Five", "6": "Six", "7": "Seven", "8": "Eight", "9": "Nine",
};

/** "ABC123" -> "Alpha Bravo Charlie One Two Three" — non-alphanumeric characters are dropped. */
export function toNatoPhonetic(plate: string): string {
  return plate
    .toUpperCase()
    .split("")
    .map((char) => NATO_LETTERS[char] ?? NATO_DIGITS[char] ?? "")
    .filter(Boolean)
    .join(" ");
}
