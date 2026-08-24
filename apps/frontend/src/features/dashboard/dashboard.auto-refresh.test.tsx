// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  DASHBOARD_REFETCH_INTERVAL_MS,
  useDashboardQuery,
} from "./dashboard.queries";
import type { DashboardSummary } from "./dashboard.types";

const mockSummary: DashboardSummary = {
  orders: {
    total: 10,
    pending: 1,
    confirmed: 0,
    preparing: 2,
    ready: 1,
    served: 0,
    completed: 5,
    cancelled: 1,
  },
  payments: {
    paidOrders: 6,
    totalSales: 900,
  },
  sales: {
    granularity: "hourly",
    points: Array.from({ length: 24 }, (_, hour) => ({
      key: String(hour).padStart(2, "0"),
      amount: 0,
    })),
  },
};

let requestCount = 0;

const server = setupServer(
  http.get("*/api/v1/dashboard/summary", () => {
    requestCount += 1;
    return HttpResponse.json({ success: true, data: mockSummary });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe("useDashboardQuery auto refresh", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    requestCount = 0;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fetches once on mount and then refetches every interval", async () => {
    const { result } = renderHook(
      () => useDashboardQuery({ date: "2026-08-24" }),
      { wrapper: createWrapper() },
    );

    await vi.advanceTimersByTimeAsync(0);
    await vi.waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(requestCount).toBe(1);

    await vi.advanceTimersByTimeAsync(DASHBOARD_REFETCH_INTERVAL_MS);
    expect(requestCount).toBe(2);

    await vi.advanceTimersByTimeAsync(DASHBOARD_REFETCH_INTERVAL_MS);
    expect(requestCount).toBe(3);
  });

  it("does not refetch before the interval elapses", async () => {
    renderHook(() => useDashboardQuery(), { wrapper: createWrapper() });

    await vi.advanceTimersByTimeAsync(0);
    await vi.waitFor(() => {
      expect(requestCount).toBe(1);
    });

    await vi.advanceTimersByTimeAsync(DASHBOARD_REFETCH_INTERVAL_MS - 1_000);
    expect(requestCount).toBe(1);
  });
});
