import type { DashboardSummary } from "./dashboard.types";

/**
 * Mock dashboard data. Swap this module for a real API-backed loader in a
 * later phase — the page only depends on `fetchDashboardStats`.
 */
export const dashboardMock: DashboardSummary = {
  orders: {
    total: 86,
    pending: 5,
    confirmed: 3,
    preparing: 4,
    ready: 3,
    served: 0,
    completed: 68,
    cancelled: 3,
  },
  payments: {
    paidOrders: 71,
    totalSales: 12450,
  },
};

export type DashboardScenario = "data" | "empty" | "error";

let scenario: DashboardScenario = "data";

/** Dev-only helper to exercise the loading/empty/error UI states. */
export function setDashboardScenario(next: DashboardScenario): void {
  scenario = next;
}

const MOCK_DELAY_MS = 600;

export function fetchDashboardStats(): Promise<DashboardSummary | null> {
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
