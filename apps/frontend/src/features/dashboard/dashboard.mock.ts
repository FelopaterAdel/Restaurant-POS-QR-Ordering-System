import type { DashboardStats } from "./dashboard.types";

/**
 * Mock dashboard data. Swap this module for a real API-backed loader in a
 * later phase — the page only depends on `fetchDashboardStats`.
 */
export const dashboardMock: DashboardStats = {
  totalSales: 12450,
  totalOrders: 86,
  paidOrders: 71,
  activeOrders: 15,
};

export type DashboardScenario = "data" | "empty" | "error";

let scenario: DashboardScenario = "data";

/** Dev-only helper to exercise the loading/empty/error UI states. */
export function setDashboardScenario(next: DashboardScenario): void {
  scenario = next;
}

const MOCK_DELAY_MS = 600;

export function fetchDashboardStats(): Promise<DashboardStats | null> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (scenario === "error") {
        reject(new Error("Failed to load dashboard stats."));
      } else if (scenario === "empty") {
        resolve(null);
      } else {
        resolve(dashboardMock);
      }
    }, MOCK_DELAY_MS);
  });
}
