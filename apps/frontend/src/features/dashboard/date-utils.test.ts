import { describe, expect, it } from "vitest";
import {
  addDaysToDateString,
  cairoDateString,
  formatShortDate,
  getWeekRange,
} from "./date-utils";

describe("cairoDateString", () => {
  it("returns the Cairo calendar date while the UTC day is still behind", () => {
    // 2026-08-09T21:00:00Z is midnight in Cairo (UTC+3)
    expect(cairoDateString(new Date("2026-08-09T20:59:59.000Z"))).toBe(
      "2026-08-09",
    );
    expect(cairoDateString(new Date("2026-08-09T21:00:00.000Z"))).toBe(
      "2026-08-10",
    );
  });

  it("handles standard time (UTC+2) transitions", () => {
    expect(cairoDateString(new Date("2026-01-14T22:00:00.000Z"))).toBe(
      "2026-01-15",
    );
  });
});

describe("addDaysToDateString", () => {
  it("adds days across month boundaries", () => {
    expect(addDaysToDateString("2026-08-30", 3)).toBe("2026-09-02");
  });

  it("subtracts days across year boundaries", () => {
    expect(addDaysToDateString("2026-01-01", -1)).toBe("2025-12-31");
  });
});

describe("getWeekRange", () => {
  it("starts on Saturday and ends on Friday", () => {
    const range = getWeekRange(new Date("2026-08-19T12:00:00.000Z")); // Wednesday

    expect(range.from).toBe("2026-08-15"); // Saturday
    expect(range.to).toBe("2026-08-21"); // Friday
  });

  it("returns the same week for late-night instants after Cairo midnight", () => {
    const range = getWeekRange(new Date("2026-08-20T21:30:00.000Z")); // already Fri in Cairo

    expect(range.from).toBe("2026-08-15");
    expect(range.to).toBe("2026-08-21");
  });

  it("rolls back to the previous Saturday when today is Sunday", () => {
    const range = getWeekRange(new Date("2026-08-16T10:00:00.000Z")); // Sunday

    expect(range.from).toBe("2026-08-15");
    expect(range.to).toBe("2026-08-21");
  });
});

describe("formatShortDate", () => {
  it("formats an ISO date string without timezone drift", () => {
    expect(formatShortDate("2026-08-05")).toBe("Aug 5");
    expect(formatShortDate("2026-01-01")).toBe("Jan 1");
  });
});
