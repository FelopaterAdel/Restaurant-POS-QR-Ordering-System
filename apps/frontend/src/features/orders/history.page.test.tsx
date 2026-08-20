// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { StrictMode } from "react";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { OrderHistoryItem } from "./orders.types";
import OrderHistoryPage from "./history.page";

vi.mock("@/features/auth/use-auth", () => ({
  useAuth: () => ({
    user: { id: "u1", name: "Test Cashier", email: "cashier@test.com", role: "CASHIER" },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

const mockHistoryOrders: OrderHistoryItem[] = [
  {
    id: "ord_1",
    orderNumber: 1024,
    table: { number: 12 },
    status: "COMPLETED",
    totalAmount: 390,
    createdAt: "2025-08-20T10:20:00Z",
    payment: { status: "PAID", method: "CASH" },
  },
  {
    id: "ord_2",
    orderNumber: 1023,
    table: { number: 5 },
    status: "CANCELLED",
    totalAmount: 250,
    createdAt: "2025-08-20T09:45:00Z",
    payment: { status: "PENDING", method: null },
  },
  {
    id: "ord_3",
    orderNumber: 1022,
    table: { number: 8 },
    status: "COMPLETED",
    totalAmount: 180,
    createdAt: "2025-08-19T15:30:00Z",
    payment: { status: "PAID", method: "CARD" },
  },
];

const handlers = [
  http.get("*/api/v1/orders/history", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const page = Number(url.searchParams.get("page") ?? "1");

    let filtered = mockHistoryOrders;
    if (status) {
      filtered = mockHistoryOrders.filter((o) => o.status === status);
    }

    return HttpResponse.json({
      success: true,
      data: filtered,
      pagination: { page, limit: 20, total: filtered.length, totalPages: 1 },
    });
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

function renderPage() {
  const { container } = render(
    <StrictMode>
      <OrderHistoryPage />
    </StrictMode>,
    { wrapper: createQueryWrapper() },
  );
  return { container };
}

describe("OrderHistoryPage", () => {
  it("renders loading skeleton initially", () => {
    server.use(
      http.get("*/api/v1/orders/history", () => {
        return new Promise<never>(() => {});
      }),
    );

    const { container } = renderPage();

    const skeleton = container.querySelector('[aria-label="Loading order history"]');
    expect(skeleton).toBeInTheDocument();
  });

  it("renders order history table on success", async () => {
    const { container } = renderPage();

    await waitFor(() => {
      expect(container.querySelector("table")).toBeInTheDocument();
    });

    expect(container.textContent).toContain("#1024");
    expect(container.textContent).toContain("#1023");
    expect(container.textContent).toContain("#1022");
  });

  it("renders filter inputs", async () => {
    const { container } = renderPage();

    await waitFor(() => {
      expect(container.querySelector("table")).toBeInTheDocument();
    });

    expect(container.querySelector('[type="number"]')).toBeInTheDocument();
    expect(container.querySelector("select")).toBeInTheDocument();
    expect(container.querySelector('[type="date"]')).toBeInTheDocument();
  });

  it("renders the Refresh button", async () => {
    const { container } = renderPage();

    await waitFor(() => {
      expect(container.querySelector("table")).toBeInTheDocument();
    });

    const buttons = Array.from(container.querySelectorAll("button"));
    const refreshBtn = buttons.find((b) => b.textContent?.includes("Refresh"));
    expect(refreshBtn).toBeDefined();
  });

  it("renders error state when API fails", async () => {
    server.use(
      http.get("*/api/v1/orders/history", () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    const { container } = renderPage();

    await waitFor(() => {
      const text = container.querySelector(".empty-state__title");
      expect(text?.textContent).toBe("Unable to load order history");
    });
  });

  it("retries the request when clicking Try Again", async () => {
    let callCount = 0;

    server.use(
      http.get("*/api/v1/orders/history", () => {
        callCount++;
        if (callCount === 1) {
          return new HttpResponse(null, { status: 500 });
        }
        return HttpResponse.json({
          success: true,
          data: mockHistoryOrders,
          pagination: { page: 1, limit: 20, total: 3, totalPages: 1 },
        });
      }),
    );

    const { container } = renderPage();

    await waitFor(() => {
      const text = container.querySelector(".empty-state__title");
      expect(text?.textContent).toBe("Unable to load order history");
    });

    const user = userEvent.setup();
    const tryAgainBtn = container.querySelector(".empty-state__action button");
    expect(tryAgainBtn).toBeDefined();
    await user.click(tryAgainBtn as HTMLElement);

    await waitFor(() => {
      expect(container.querySelector("table")).toBeInTheDocument();
    });

    expect(callCount).toBe(2);
  });

  it("shows empty state when no orders match filters", async () => {
    server.use(
      http.get("*/api/v1/orders/history", () => {
        return HttpResponse.json({
          success: true,
          data: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        });
      }),
    );

    const { container } = renderPage();

    await waitFor(() => {
      const title = container.querySelector(".empty-state__title");
      expect(title?.textContent).toBe("No orders found");
    });
  });

  it("sends correct status filter to API", async () => {
    let receivedParams: URLSearchParams | null = null;

    server.use(
      http.get("*/api/v1/orders/history", ({ request }) => {
        receivedParams = new URL(request.url).searchParams;
        return HttpResponse.json({
          success: true,
          data: mockHistoryOrders,
          pagination: { page: 1, limit: 20, total: 3, totalPages: 1 },
        });
      }),
    );

    const { container } = renderPage();

    await waitFor(() => {
      expect(container.querySelector("table")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const select = container.querySelector("select") as HTMLSelectElement;
    await user.selectOptions(select, "COMPLETED");

    await waitFor(() => {
      expect(receivedParams?.get("status")).toBe("COMPLETED");
    });
  });

  it("sends correct date filter to API", async () => {
    let receivedParams: URLSearchParams | null = null;

    server.use(
      http.get("*/api/v1/orders/history", ({ request }) => {
        receivedParams = new URL(request.url).searchParams;
        return HttpResponse.json({
          success: true,
          data: mockHistoryOrders,
          pagination: { page: 1, limit: 20, total: 3, totalPages: 1 },
        });
      }),
    );

    const { container } = renderPage();

    await waitFor(() => {
      expect(container.querySelector("table")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const dateInput = container.querySelector('[type="date"]') as HTMLInputElement;
    await user.type(dateInput, "2025-08-20");

    await waitFor(() => {
      expect(receivedParams?.get("date")).toBe("2025-08-20");
    });
  });

  it("resets to page 1 when filters change", async () => {
    let receivedParams: URLSearchParams | null = null;

    server.use(
      http.get("*/api/v1/orders/history", ({ request }) => {
        receivedParams = new URL(request.url).searchParams;
        return HttpResponse.json({
          success: true,
          data: mockHistoryOrders,
          pagination: { page: 1, limit: 20, total: 3, totalPages: 1 },
        });
      }),
    );

    const { container } = renderPage();

    await waitFor(() => {
      expect(container.querySelector("table")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const select = container.querySelector("select") as HTMLSelectElement;
    await user.selectOptions(select, "CANCELLED");

    await waitFor(() => {
      expect(receivedParams?.get("page")).toBe("1");
    });
  });
});
