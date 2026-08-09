import { describe, expect, it } from "vitest";
import {
  getDayRangeForDateInTimeZone,
  getDayRangeInTimeZone,
} from "../use-cases/get-dashboard-summary.use-case.js";

describe("getDayRangeInTimeZone", () => {
  it("resolves the local day during Cairo daylight saving time (UTC+3)", () => {
    const now = new Date("2026-08-09T18:30:00.000Z");

    const range = getDayRangeInTimeZone(now, "Africa/Cairo");

    expect(range.start.toISOString()).toBe("2026-08-08T21:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-08-09T21:00:00.000Z");
  });

  it("resolves the local day when Cairo is on standard time (UTC+2)", () => {
    const now = new Date("2026-01-15T18:30:00.000Z");

    const range = getDayRangeInTimeZone(now, "Africa/Cairo");

    expect(range.start.toISOString()).toBe("2026-01-14T22:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-01-15T22:00:00.000Z");
  });

  it("starts a new day at local midnight even though UTC is still the previous day", () => {
    const beforeMidnight = new Date("2026-08-09T20:59:59.000Z");
    const atMidnight = new Date("2026-08-09T21:00:00.000Z");

    const beforeRange = getDayRangeInTimeZone(beforeMidnight, "Africa/Cairo");
    const atRange = getDayRangeInTimeZone(atMidnight, "Africa/Cairo");

    expect(beforeRange.start.toISOString()).toBe("2026-08-08T21:00:00.000Z");
    expect(atRange.start.toISOString()).toBe("2026-08-09T21:00:00.000Z");
  });
});

describe("getDayRangeForDateInTimeZone", () => {
  it("resolves the full day range for a given date in the restaurant timezone", () => {
    const range = getDayRangeForDateInTimeZone("2026-08-01", "Africa/Cairo");

    expect(range.start.toISOString()).toBe("2026-07-31T21:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-08-01T21:00:00.000Z");
  });

  it("handles month boundaries", () => {
    const range = getDayRangeForDateInTimeZone("2026-03-01", "Africa/Cairo");

    expect(range.start.toISOString()).toBe("2026-02-28T22:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-03-01T22:00:00.000Z");
  });

  it("handles year boundaries", () => {
    const range = getDayRangeForDateInTimeZone("2026-01-01", "Africa/Cairo");

    expect(range.start.toISOString()).toBe("2025-12-31T22:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-01-01T22:00:00.000Z");
  });
});
