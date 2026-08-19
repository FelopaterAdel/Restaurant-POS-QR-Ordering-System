import { describe, expect, it } from "vitest";
import {
  dashboardMock,
  fetchDashboardStats,
  setDashboardScenario,
} from "./dashboard.mock";

describe("dashboard mock", () => {
  it("resolves with the mock stats in the data scenario", async () => {
    setDashboardScenario("data");
    expect(await fetchDashboardStats()).toEqual(dashboardMock);
  });

  it("resolves to null in the empty scenario", async () => {
    setDashboardScenario("empty");
    expect(await fetchDashboardStats()).toBeNull();
  });

  it("rejects in the error scenario", async () => {
    setDashboardScenario("error");
    await expect(fetchDashboardStats()).rejects.toThrow(
      "Failed to load dashboard stats.",
    );
  });
});
