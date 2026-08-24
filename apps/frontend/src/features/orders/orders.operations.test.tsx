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
import type { Order, OrderHistoryItem } from "./orders.types";
import OrdersPage from "./orders.page";

vi.mock("@/features/auth/use-auth", () => ({
  useAuth: () => ({
    user: {
      id: "u1",
      name: "Test Owner",
      email: "owner@test.com",
      role: "OWNER",
    },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

const mockQueueOrders: Order[] = [
  {
    id: "ord_1",
    orderNumber: 1024,
    tableId: "tbl_1",
    tableNumber: 12,
    status: "PREPARING",
    paymentStatus: "PENDING",
    totalAmount: 450,
    cancelledAt: null,
    cancelledReason: null,
    createdAt: "2026-01-15T10:30:00Z",
    updatedAt: "2026-01-15T10:30:00Z",
    items: [
      { id: "i1", productId: "p1", productName: "Burger", quantity: 2, unitPrice: 100, totalPrice: 200 },
      { id: "i2", productId: "p2", productName: "Fries", quantity: 1, unitPrice: 50, totalPrice: 50 },
    ],
  },
];

const mockHistoryItems: OrderHistoryItem[] = [
  {
    id: "ord_9",
    orderNumber: 1010,
    table: { number: 3 },
    status: "COMPLETED",
    totalAmount: 320,
    createdAt: "2026-01-14T18:20:00Z",
    payment: { status: "PAID", method: "CASH" },
  },
];

let lastHistoryUrl: URL | null = null;

const handlers = [
  http.get("*/api/v1/orders/queue", () => {
    return HttpResponse.json({
      success: true,
      data: mockQueueOrders,
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
  }),
  http.get("*/api/v1/orders/history", ({ request }) => {
    lastHistoryUrl = new URL(request.url);
    return HttpResponse.json({
      success: true,
      data: mockHistoryItems,
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
  }),
  http.get("*/api/v1/orders/:orderId", ({ params }) => {
    const orderId = params.orderId as string;
    return HttpResponse.json({
      success: true,
      data: {
        ...mockQueueOrders[0],
        id: orderId,
        orderNumber: 1010,
        status: "COMPLETED",
        items: [
          { id: "i9", productId: "p9", productName: "Steak", quantity: 1, unitPrice: 320, totalPrice: 320 },
        ],
      },
    });
  }),
];

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => {
  lastHistoryUrl = null;
  server.resetHandlers();
});
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
      <OrdersPage />
    </StrictMode>,
    { wrapper: createQueryWrapper() },
  );
  return { container };
}

describe("OrdersPage as OWNER (operations dashboard)", () => {
  it("renders all eight status filter buttons", async () => {
    const { container } = renderPage();

    await waitFor(() => {
      expect(container.querySelector(".order-card__number")).toBeInTheDocument();
    });

    const filters = container.querySelectorAll(".orders-filter");
    expect(filters).toHaveLength(8);
  });

  it("fetches active orders from the queue endpoint by default", async () => {
    const { container } = renderPage();

    await waitFor(() => {
      expect(container.querySelector(".order-card__number")).toBeInTheDocument();
    });

    expect(container.textContent).toContain("#1024");
  });

  it("routes terminal status filters to the history endpoint", async () => {
    const { container } = renderPage();

    await waitFor(() => {
      expect(container.querySelector(".order-card__number")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(withinFilters(container).getByText("Completed"));

    await waitFor(() => {
      expect(lastHistoryUrl?.searchParams.get("status")).toBe("COMPLETED");
    });

    await waitFor(() => {
      expect(container.textContent).toContain("#1010");
    });
  });

  it("searches by order number through the history endpoint", async () => {
    const { container } = renderPage();

    await waitFor(() => {
      expect(container.querySelector(".order-card__number")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const searchInput = container.querySelector(
      'input[aria-label="Search orders by number"]',
    ) as HTMLInputElement;
    await user.type(searchInput, "1024");

    await waitFor(
      () => {
        expect(lastHistoryUrl?.searchParams.get("orderNumber")).toBe("1024");
      },
      { timeout: 3000 },
    );
  });

  it("renders a desktop table alongside mobile cards", async () => {
    const { container } = renderPage();

    await waitFor(() => {
      expect(
        container.querySelector(".orders-table-region .table__row"),
      ).toBeInTheDocument();
    });

    const headers = Array.from(
      container.querySelectorAll(".orders-table-region th"),
    ).map((th) => th.textContent);
    expect(headers).toContain("Order");
    expect(headers).toContain("Table");
    expect(headers).toContain("Status");

    expect(
      container.querySelector(".orders-cards-region .order-card"),
    ).toBeInTheDocument();
  });

  it("shows owner actions on actionable orders", async () => {
    server.use(
      http.get("*/api/v1/orders/queue", () => {
        return HttpResponse.json({
          success: true,
          data: [
            {
              ...mockQueueOrders[0],
              status: "PENDING",
            },
          ],
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        });
      }),
    );

    const { container } = renderPage();

    await waitFor(() => {
      expect(container.querySelector(".order-card__number")).toBeInTheDocument();
    });

    const actionLabels = Array.from(
      container.querySelectorAll(".orders-cards-region .order-card__action-btn"),
    ).map((btn) => btn.textContent);
    expect(actionLabels.join(" ")).toContain("Confirm");
    expect(actionLabels.join(" ")).toContain("Cancel");
  });

  it("shows an empty state when a terminal status has no orders", async () => {
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
      expect(container.querySelector(".order-card__number")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(withinFilters(container).getByText("Cancelled"));

    await waitFor(() => {
      const title = container.querySelector(".empty-state__title");
      expect(title?.textContent).toBe("No cancelled orders");
    });
  });

  it("retries when the history endpoint fails", async () => {
    let callCount = 0;
    server.use(
      http.get("*/api/v1/orders/history", () => {
        callCount++;
        if (callCount === 1) {
          return new HttpResponse(null, { status: 500 });
        }
        return HttpResponse.json({
          success: true,
          data: mockHistoryItems,
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        });
      }),
    );

    const { container } = renderPage();

    await waitFor(() => {
      expect(container.querySelector(".order-card__number")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(withinFilters(container).getByText("Served"));

    await waitFor(() => {
      const title = container.querySelector(".empty-state__title");
      expect(title?.textContent).toBe("Unable to load orders");
    });

    const tryAgainBtn = container.querySelector(".empty-state__action button");
    expect(tryAgainBtn).toBeDefined();
    await user.click(tryAgainBtn as HTMLElement);

    await waitFor(() => {
      expect(container.textContent).toContain("#1010");
    });
    expect(callCount).toBe(2);
  });

  it("opens order details from a history row after fetching full details", async () => {
    const { container } = renderPage();

    await waitFor(() => {
      expect(container.querySelector(".order-card__number")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(withinFilters(container).getByText("Completed"));

    await waitFor(() => {
      expect(container.textContent).toContain("#1010");
    });

    const row = container.querySelector(
      ".orders-cards-region .order-card",
    ) as HTMLElement;
    await user.click(row);

    await waitFor(() => {
      const dialog = document.body.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(document.body.textContent).toContain("Steak");
    });
  });
});

function withinFilters(container: HTMLElement) {
  const group = container.querySelector(
    ".orders-filters",
  ) as HTMLElement;
  return {
    getByText(text: string) {
      const buttons = Array.from(group.querySelectorAll("button"));
      const match = buttons.find((b) => b.textContent === text);
      if (!match) throw new Error(`Filter button "${text}" not found`);
      return match;
    },
  };
}
