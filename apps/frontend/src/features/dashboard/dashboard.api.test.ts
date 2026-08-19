import { describe, expect, it, vi } from "vitest";
import { fetchDashboardSummary } from "./dashboard.api";
import type { DashboardSummary } from "./dashboard.types";

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
  },
}));

import { api } from "@/lib/api";

const mockGet = vi.mocked(api.get);

const mockSummary: DashboardSummary = {
  orders: {
    total: 35,
    pending: 2,
    confirmed: 0,
    preparing: 5,
    ready: 3,
    served: 0,
    completed: 22,
    cancelled: 3,
  },
  payments: {
    paidOrders: 22,
    totalSales: 4250,
  },
};

describe("fetchDashboardSummary", () => {
  it("calls GET /dashboard/summary without params", async () => {
    mockGet.mockResolvedValueOnce(mockSummary);

    const result = await fetchDashboardSummary();

    expect(mockGet).toHaveBeenCalledWith("/dashboard/summary", undefined);
    expect(result).toEqual(mockSummary);
  });

  it("passes date query param when provided", async () => {
    mockGet.mockResolvedValueOnce(mockSummary);

    await fetchDashboardSummary({ date: "2025-01-15" });

    expect(mockGet).toHaveBeenCalledWith("/dashboard/summary", {
      params: { date: "2025-01-15" },
    });
  });

  it("propagates API errors", async () => {
    mockGet.mockRejectedValueOnce(new Error("Network error"));

    await expect(fetchDashboardSummary()).rejects.toThrow("Network error");
  });
});
