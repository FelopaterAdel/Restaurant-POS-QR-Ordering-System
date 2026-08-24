import { describe, expect, it } from "vitest";
import { dashboardQuerySchema } from "../schemas/dashboard-query.schema.js";

describe("dashboardQuerySchema", () => {
  it("accepts an empty query", () => {
    const result = dashboardQuerySchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it("accepts a single date", () => {
    const result = dashboardQuerySchema.safeParse({ date: "2026-08-01" });

    expect(result.success).toBe(true);
  });

  it("accepts matching from/to dates", () => {
    const result = dashboardQuerySchema.safeParse({
      from: "2026-08-17",
      to: "2026-08-23",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid date formats", () => {
    const result = dashboardQuerySchema.safeParse({ date: "2026-8-1" });

    expect(result.success).toBe(false);
  });

  it("rejects impossible calendar dates", () => {
    const result = dashboardQuerySchema.safeParse({ date: "2026-02-30" });

    expect(result.success).toBe(false);
  });

  it("rejects a range where from is after to", () => {
    const result = dashboardQuerySchema.safeParse({
      from: "2026-08-23",
      to: "2026-08-17",
    });

    expect(result.success).toBe(false);
  });

  it("rejects from without to", () => {
    const result = dashboardQuerySchema.safeParse({ from: "2026-08-17" });

    expect(result.success).toBe(false);
  });

  it("rejects to without from", () => {
    const result = dashboardQuerySchema.safeParse({ to: "2026-08-23" });

    expect(result.success).toBe(false);
  });
});
