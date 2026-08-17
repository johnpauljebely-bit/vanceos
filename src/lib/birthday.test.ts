import { describe, it, expect } from "vitest";
import { deriveBirthday } from "./birthday";

describe("deriveBirthday", () => {
  it("derives month/day from the creation date and shifts the year back 13", () => {
    const result = deriveBirthday("2020-03-15T12:00:00.000Z");
    expect(result).toEqual({ month: 3, day: 15, year: 2007, display: "03-15-2007" });
  });

  it("pads single-digit month/day in the display string", () => {
    const result = deriveBirthday("2018-01-05T00:00:00.000Z");
    expect(result.display).toBe("01-05-2005");
  });

  it("handles a December 31st creation date without rolling over", () => {
    const result = deriveBirthday("2015-12-31T23:59:59.000Z");
    expect(result).toEqual({ month: 12, day: 31, year: 2002, display: "12-31-2002" });
  });

  it("never derives an age under 13, even for an account created today", () => {
    const now = new Date();
    const result = deriveBirthday(now.toISOString());
    const ageToday = now.getUTCFullYear() - result.year;
    expect(ageToday).toBeGreaterThanOrEqual(13);
  });

  it("throws on an invalid date string", () => {
    expect(() => deriveBirthday("not-a-date")).toThrow(/invalid date/);
  });
});
