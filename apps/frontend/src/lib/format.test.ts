import { describe, expect, it } from "vitest";
import { formatCurrency, formatNumber, formatPaidAt, formatTime } from "./format";

describe("formatCurrency", () => {
  it("formats amounts with the currency suffix and thousands separators", () => {
    expect(formatCurrency(480)).toBe("480 EGP");
    expect(formatCurrency(1250)).toBe("1,250 EGP");
    expect(formatCurrency(12450)).toBe("12,450 EGP");
  });

  it("handles zero and fractional values", () => {
    expect(formatCurrency(0)).toBe("0 EGP");
    expect(formatCurrency(99.5)).toBe("99.5 EGP");
  });
});

describe("formatNumber", () => {
  it("groups thousands", () => {
    expect(formatNumber(38)).toBe("38");
    expect(formatNumber(1234567)).toBe("1,234,567");
  });
});

describe("formatTime", () => {
  it("renders a 24-hour HH:mm time", () => {
    expect(formatTime("2026-08-23T09:30:00.000Z")).toMatch(/^\d{2}:\d{2}$/);
  });

  it("produces stable output for the same instant", () => {
    const iso = "2026-01-15T23:05:00.000Z";
    expect(formatTime(iso)).toBe(formatTime(iso));
  });
});

describe("formatPaidAt", () => {
  it("returns an em dash when no date is available", () => {
    expect(formatPaidAt(null)).toBe("—");
  });

  it("includes day, month, year and time", () => {
    const formatted = formatPaidAt("2026-08-23T09:30:00.000Z");
    expect(formatted).toContain("2026");
    expect(formatted).toMatch(/Aug/);
    expect(formatted).toMatch(/AM|PM/);
  });
});
