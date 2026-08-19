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
import type { Order } from "./orders.types";
import OrdersPage from "./orders.page";

vi.mock("@/features/auth/use-auth", () => ({
  useAuth: () => ({
    user: { id: "u1", name: "Test Kitchen", email: "kitchen@test.com", role: "KITCHEN" },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

const mockOrders: Order[] = [
  {
    id: "ord_1",
    orderNumber: 1024,
    tableId: "tbl_1",
    tableNumber: 5,
    status: "PREPARING",
    paymentStatus: "PENDING",
    totalAmount: 450,
    cancelledAt: null,
    cancelledReason: null,
    createdAt: "2025-01-15T12:35:00Z",
    updatedAt: "2025-01-15T12:35:00Z",
    items: [
      { id: "i1", productId: "p1", productName: "Burger", quantity: 2, unitPrice: 100, totalPrice: 200 },
      { id: "i2", productId: "p2", productName: "Fries", quantity: 1, unitPrice: 50, totalPrice: 50 },
    ],
  },
  {
    id: "ord_2",
    orderNumber: 1025,
    tableId: "tbl_2",
    tableNumber: 2,
    status: "READY",
    paymentStatus: "PENDING",
    totalAmount: 200,
    cancelledAt: null,
    cancelledReason: null,
    createdAt: "2025-01-15T12:40:00Z",
    updatedAt: "2025-01-15T12:40:00Z",
    items: [
      { id: "i3", productId: "p3", productName: "Pizza", quantity: 1, unitPrice: 200, totalPrice: 200 },
    ],
  },
  {
    id: "ord_3",
    orderNumber: 1026,
    tableId: "tbl_3",
    tableNumber: 8,
    status: "PENDING",
    paymentStatus: "PENDING",
    totalAmount: 350,
    cancelledAt: null,
    cancelledReason: null,
    createdAt: "2025-01-15T12:45:00Z",
    updatedAt: "2025-01-15T12:45:00Z",
    items: [],
  },
];

const handlers = [
  http.get("*/api/v1/orders/queue", () => {
    return HttpResponse.json({
      success: true,
      data: mockOrders,
      pagination: { page: 1, limit: 20, total: 3, totalPages: 1 },
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
      <OrdersPage />
    </StrictMode>,
    { wrapper: createQueryWrapper() },
  );
  return { container };
}

describe("OrdersPage", () => {
  it("renders loading skeleton initially", () => {
    server.use(
      http.get("*/api/v1/orders/queue", () => {
        return new Promise<never>(() => {});
      }),
    );

    const { container } = renderPage();

    const skeleton = container.querySelector('[aria-label="Loading orders"]');
    expect(skeleton).toBeInTheDocument();
  });

  it("renders orders from the API on success", async () => {
    const { container } = renderPage();

    await waitFor(() => {
      expect(container.querySelector(".order-card__number")).toBeInTheDocument();
    });

    const numbers = container.querySelectorAll(".order-card__number");
    const orderNumbers = Array.from(numbers).map((el) => el.textContent);
    expect(orderNumbers).toContain("#1024");
    expect(orderNumbers).toContain("#1025");
    expect(orderNumbers).toContain("#1026");
  });

  it("renders filter buttons", async () => {
    const { container } = renderPage();

    await waitFor(() => {
      expect(container.querySelector(".order-card__number")).toBeInTheDocument();
    });

    const filters = container.querySelector(".orders-filters");
    expect(filters).toBeInTheDocument();
    expect(filters?.querySelectorAll(".orders-filter").length).toBe(5);
  });

  it("renders the Refresh button", async () => {
    const { container } = renderPage();

    await waitFor(() => {
      expect(container.querySelector(".order-card__number")).toBeInTheDocument();
    });

    const buttons = Array.from(container.querySelectorAll("button"));
    const refreshBtn = buttons.find((b) => b.textContent?.includes("Refresh"));
    expect(refreshBtn).toBeDefined();
  });

  it("renders error state when API fails", async () => {
    server.use(
      http.get("*/api/v1/orders/queue", () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    const { container } = renderPage();

    await waitFor(() => {
      const text = container.querySelector(".empty-state__title");
      expect(text?.textContent).toBe("Unable to load orders");
    });
  });

  it("retries the request when clicking Try Again", async () => {
    let callCount = 0;

    server.use(
      http.get("*/api/v1/orders/queue", () => {
        callCount++;
        if (callCount === 1) {
          return new HttpResponse(null, { status: 500 });
        }
        return HttpResponse.json({
          success: true,
          data: mockOrders,
          pagination: { page: 1, limit: 20, total: 3, totalPages: 1 },
        });
      }),
    );

    const { container } = renderPage();

    await waitFor(() => {
      const text = container.querySelector(".empty-state__title");
      expect(text?.textContent).toBe("Unable to load orders");
    });

    const user = userEvent.setup();
    const tryAgainBtn = container.querySelector(".empty-state__action button");
    expect(tryAgainBtn).toBeDefined();
    await user.click(tryAgainBtn as HTMLElement);

    await waitFor(() => {
      expect(container.querySelector(".order-card__number")).toBeInTheDocument();
    });

    expect(callCount).toBe(2);
  });

  it("shows empty state when no orders exist", async () => {
    server.use(
      http.get("*/api/v1/orders/queue", () => {
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
      expect(title?.textContent).toBe("No active orders");
    });
  });

  it("opens order details modal when clicking an order card", async () => {
    const { container } = renderPage();

    await waitFor(() => {
      expect(container.querySelector(".order-card__number")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const card = container.querySelector(".order-card") as HTMLElement;
    await user.click(card);

    await waitFor(() => {
      const dialog = document.body.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
    });
  });

  it("sends correct status filter to API", async () => {
    let receivedParams: URLSearchParams | null = null;

    server.use(
      http.get("*/api/v1/orders/queue", ({ request }) => {
        receivedParams = new URL(request.url).searchParams;
        return HttpResponse.json({
          success: true,
          data: mockOrders,
          pagination: { page: 1, limit: 20, total: 3, totalPages: 1 },
        });
      }),
    );

    const { container } = renderPage();

    await waitFor(() => {
      expect(container.querySelector(".order-card__number")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const pendingFilter = container.querySelectorAll(".orders-filter")[1];
    await user.click(pendingFilter);

    await waitFor(() => {
      expect(receivedParams?.get("status")).toBe("PENDING");
    });
  });
});

