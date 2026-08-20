// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { DashboardPage } from "./dashboard.page";
import type { DashboardSummary } from "./dashboard.types";

vi.mock("@/features/auth/use-auth", () => ({
  useAuth: () => ({
    user: { id: "1", name: "Test Owner", role: "OWNER" },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock("@/features/settings/restaurant-context", () => ({
  useRestaurant: () => ({
    restaurant: { id: "1", name: "Test Restaurant" },
    isLoading: false,
    error: null,
  }),
}));

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

const emptySummary: DashboardSummary = {
  orders: {
    total: 0,
    pending: 0,
    confirmed: 0,
    preparing: 0,
    ready: 0,
    served: 0,
    completed: 0,
    cancelled: 0,
  },
  payments: {
    paidOrders: 0,
    totalSales: 0,
  },
};

const handlers = [
  http.get("*/api/v1/dashboard/summary", () => {
    return HttpResponse.json({ success: true, data: mockSummary });
  }),
];

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  function QueryWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return QueryWrapper;
}

function renderDashboard() {
  return render(<DashboardPage />, { wrapper: createQueryWrapper() });
}

describe("DashboardPage", () => {
  it("renders loading skeleton initially", () => {
    server.use(
      http.get("*/api/v1/dashboard/summary", () => {
        return new Promise<never>(() => {});
      }),
    );

    renderDashboard();

    expect(screen.getByLabelText("Loading dashboard")).toBeInTheDocument();
  });

  it("renders greeting with restaurant name", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getAllByText(/Test Restaurant/).length).toBeGreaterThan(0);
    });
  });

  it("renders stats from the API on success", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getAllByText("Total Sales").length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText("EGP 4,250").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Total Orders").length).toBeGreaterThan(0);
    expect(screen.getAllByText("35").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Paid Orders").length).toBeGreaterThan(0);
    expect(screen.getAllByText("22").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Active Orders").length).toBeGreaterThan(0);
    expect(screen.getAllByText("10").length).toBeGreaterThan(0);
  });

  it("renders order status breakdown", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getAllByText("Order Status").length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText("Pending").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Preparing").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ready").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Completed").length).toBeGreaterThan(0);
  });

  it("renders date filter with Today active by default", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getAllByText("Today").length).toBeGreaterThan(0);
    });

    const todayTabs = screen.getAllByRole("button", { name: "Today" });
    expect(todayTabs[0]).toHaveAttribute("aria-pressed", "true");
  });

  it("renders empty state when data has no activity", async () => {
    server.use(
      http.get("*/api/v1/dashboard/summary", () => {
        return HttpResponse.json({ success: true, data: emptySummary });
      }),
    );

    renderDashboard();

    await waitFor(() => {
      expect(screen.getAllByText("No data yet").length).toBeGreaterThan(0);
    });

    expect(
      screen.getAllByText("There is no activity to display for this date.").length,
    ).toBeGreaterThan(0);
  });

  it("renders error state when API fails", async () => {
    server.use(
      http.get("*/api/v1/dashboard/summary", () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    renderDashboard();

    await waitFor(() => {
      expect(screen.getAllByText("Unable to load dashboard data").length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText("Try Again").length).toBeGreaterThan(0);
  });

  it("retries the request when clicking Try Again", async () => {
    let callCount = 0;

    server.use(
      http.get("*/api/v1/dashboard/summary", () => {
        callCount++;
        if (callCount === 1) {
          return new HttpResponse(null, { status: 500 });
        }
        return HttpResponse.json({ success: true, data: mockSummary });
      }),
    );

    renderDashboard();

    await waitFor(() => {
      expect(screen.getAllByText("Unable to load dashboard data").length).toBeGreaterThan(0);
    });

    const user = userEvent.setup();
    await user.click(screen.getAllByText("Try Again")[0]);

    await waitFor(() => {
      expect(screen.getAllByText("Total Sales").length).toBeGreaterThan(0);
    });

    expect(callCount).toBe(2);
  });

  it("renders refresh button", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getAllByText("Total Sales").length).toBeGreaterThan(0);
    });

    expect(
      screen.getAllByRole("button", { name: "Refresh dashboard" }).length,
    ).toBeGreaterThan(0);
  });
});
