import { describe, it, expect } from "vitest";
import { deriveBirthday } from "./birthday";

describe("deriveBirthday", () => {
  it("derives month/day from the creation date and shifts the year back 10", () => {
    const result = deriveBirthday("2020-03-15T12:00:00.000Z");
    expect(result).toEqual({ month: 3, day: 15, year: 2010, display: "03-15-2010" });
  });

  it("pads single-digit month/day in the display string", () => {
    const result = deriveBirthday("2018-01-05T00:00:00.000Z");
    expect(result.display).toBe("01-05-2008");
  });

  it("handles a December 31st creation date without rolling over", () => {
    const result = deriveBirthday("2015-12-31T23:59:59.000Z");
    expect(result).toEqual({ month: 12, day: 31, year: 2005, display: "12-31-2005" });
  });

  it("throws on an invalid date string", () => {
    expect(() => deriveBirthday("not-a-date")).toThrow(/invalid date/);
  });
});
