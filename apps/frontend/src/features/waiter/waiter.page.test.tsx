// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { Order } from "@/features/orders/orders.types";
import WaiterPage from "./waiter.page";

vi.mock("@/features/auth/use-auth", () => ({
  useAuth: () => ({
    user: {
      id: "u1",
      name: "Test Waiter",
      email: "waiter@test.com",
      role: "WAITER",
    },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

function buildOrder(
  overrides: Partial<Order> & Pick<Order, "id" | "orderNumber" | "status" | "createdAt">,
): Order {
  return {
    tableId: `tbl_${overrides.id}`,
    tableNumber: 5,
    paymentStatus: "PENDING",
    totalAmount: 450,
    cancelledAt: null,
    cancelledReason: null,
    updatedAt: overrides.createdAt,
    items: [
      {
        id: `${overrides.id}_i1`,
        productId: "p1",
        productName: "Burger",
        quantity: 2,
        unitPrice: 100,
        totalPrice: 200,
      },
    ],
    ...overrides,
  };
}

const mockOrders: Order[] = [
  buildOrder({
    id: "ord_pending",
    orderNumber: 1026,
    status: "PENDING",
    createdAt: "2025-01-15T12:20:00Z",
  }),
  buildOrder({
    id: "ord_preparing",
    orderNumber: 1025,
    status: "PREPARING",
    createdAt: "2025-01-15T12:40:00Z",
  }),
  buildOrder({
    id: "ord_ready_old",
    orderNumber: 1024,
    status: "READY",
    createdAt: "2025-01-15T12:35:00Z",
  }),
  buildOrder({
    id: "ord_ready_new",
    orderNumber: 1027,
    status: "READY",
    createdAt: "2025-01-15T13:00:00Z",
  }),
];

const readyOnlyResponse = (orders: Order[]) =>
  HttpResponse.json({
    success: true,
    data: orders.filter((order) => order.status === "READY"),
    pagination: {
      page: 1,
      limit: 50,
      total: orders.filter((order) => order.status === "READY").length,
      totalPages: 1,
    },
  });

const handlers = [
  http.get("*/api/v1/orders/queue", () => readyOnlyResponse(mockOrders)),
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
  const { container } = render(<WaiterPage />, {
    wrapper: createQueryWrapper(),
  });
  return { container };
}

describe("WaiterPage", () => {
  it("renders loading skeleton initially", () => {
    server.use(
      http.get("*/api/v1/orders/queue", () => new Promise<never>(() => {})),
    );

    const { container } = renderPage();

    expect(
      container.querySelector('[aria-label="Loading ready orders"]'),
    ).toBeInTheDocument();
  });

  it("renders the header with the ready count", async () => {
    const { container } = renderPage();

    await waitFor(() => {
      expect(container.querySelector(".ready-card__number")).toBeInTheDocument();
    });

    expect(container.querySelector(".waiter__title")).toHaveTextContent(
      "Ready Orders",
    );
    expect(container.querySelector(".waiter__count")).toHaveTextContent(
      "2 Ready",
    );
  });

  it("shows only READY orders, oldest first", async () => {
    const { container } = renderPage();

    await waitFor(() => {
      expect(container.querySelector(".ready-card__number")).toBeInTheDocument();
    });

    const numbers = Array.from(
      container.querySelectorAll(".ready-card__number"),
    ).map((el) => el.textContent);

    expect(numbers).toEqual(["#1024", "#1027"]);
  });

  it("requests only READY orders from the queue endpoint", async () => {
    let receivedParams: URLSearchParams | null = null;

    server.use(
      http.get("*/api/v1/orders/queue", ({ request }) => {
        receivedParams = new URL(request.url).searchParams;
        return readyOnlyResponse(mockOrders);
      }),
    );

    renderPage();

    await waitFor(() => {
      expect(receivedParams?.get("status")).toBe("READY");
    });
  });

  it("renders error state when API fails", async () => {
    server.use(
      http.get("*/api/v1/orders/queue", () => new HttpResponse(null, { status: 500 })),
    );

    const { container } = renderPage();

    await waitFor(() => {
      const text = container.querySelector(".empty-state__title");
      expect(text?.textContent).toBe("Unable to load ready orders");
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
        return readyOnlyResponse(mockOrders);
      }),
    );

    const { container } = renderPage();

    await waitFor(() => {
      const text = container.querySelector(".empty-state__title");
      expect(text?.textContent).toBe("Unable to load ready orders");
    });

    const user = userEvent.setup();
    const tryAgainBtn = container.querySelector(
      ".empty-state__action button",
    ) as HTMLElement;
    await user.click(tryAgainBtn);

    await waitFor(() => {
      expect(container.querySelector(".ready-card__number")).toBeInTheDocument();
    });

    expect(callCount).toBe(2);
  });

  it("shows empty state when nothing is ready", async () => {
    server.use(
      http.get("*/api/v1/orders/queue", () => readyOnlyResponse([])),
    );

    const { container } = renderPage();

    await waitFor(() => {
      const title = container.querySelector(".empty-state__title");
      expect(title?.textContent).toBe("No ready orders");
    });
  });

  it("marks an order as served via PATCH with SERVED status", async () => {
    const patchBodies: unknown[] = [];

    server.use(
      http.patch("*/api/v1/orders/ord_ready_old/status", async ({ request }) => {
        patchBodies.push(await request.json());
        return HttpResponse.json({ success: true, data: mockOrders[2] });
      }),
    );

    const { container } = renderPage();

    await waitFor(() => {
      expect(container.querySelector(".ready-card__number")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const markServedBtns = Array.from(
      container.querySelectorAll(".ready-card__action-btn"),
    );
    expect(markServedBtns).toHaveLength(2);
    expect(markServedBtns[0].textContent).toBe("Mark Served");

    await user.click(markServedBtns[0]);

    await waitFor(() => {
      expect(patchBodies).toEqual([{ status: "SERVED" }]);
    });

    await waitFor(() => {
      const toast = container.querySelector(".waiter-toast--success");
      expect(toast?.textContent).toContain("Order #1024 marked as served");
    });
  });

  it("invalidates and refetches after Mark Served so the card disappears", async () => {
    let patchCalls = 0;
    let queueCalls = 0;

    server.use(
      http.get("*/api/v1/orders/queue", () => {
        queueCalls++;
        if (patchCalls > 0) {
          return readyOnlyResponse([mockOrders[3]]);
        }
        return readyOnlyResponse(mockOrders);
      }),
      http.patch("*/api/v1/orders/ord_ready_old/status", () => {
        patchCalls++;
        return HttpResponse.json({
          success: true,
          data: { ...mockOrders[2], status: "SERVED" },
        });
      }),
    );

    const { container } = renderPage();

    await waitFor(() => {
      expect(queueCalls).toBeGreaterThan(0);
    });

    const user = userEvent.setup();
    const markServedBtn = Array.from(
      container.querySelectorAll(".ready-card__action-btn"),
    )[0] as HTMLElement;
    await user.click(markServedBtn);

    await waitFor(() => {
      const numbers = Array.from(
        container.querySelectorAll(".ready-card__number"),
      ).map((el) => el.textContent);
      expect(numbers).not.toContain("#1024");
    });
    expect(patchCalls).toBe(1);
    expect(queueCalls).toBeGreaterThanOrEqual(2);
  });

  it("shows an error toast when the mutation fails", async () => {
    server.use(
      http.patch("*/api/v1/orders/ord_ready_old/status", () =>
        HttpResponse.json(
          {
            success: false,
            error: { code: "ORDER_INVALID_STATUS", message: "Invalid status" },
          },
          { status: 409 },
        ),
      ),
    );

    const { container } = renderPage();

    await waitFor(() => {
      expect(container.querySelector(".ready-card__number")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const markServedBtn = Array.from(
      container.querySelectorAll(".ready-card__action-btn"),
    )[0] as HTMLElement;
    await user.click(markServedBtn);

    await waitFor(() => {
      expect(
        container.querySelector(".waiter-toast--error"),
      ).toBeInTheDocument();
    });
  });

  it("disables only the mutating card action while updating", async () => {
    server.use(
      http.patch(
        "*/api/v1/orders/ord_ready_old/status",
        () => new Promise<never>(() => {}),
      ),
    );

    const { container } = renderPage();

    await waitFor(() => {
      expect(container.querySelector(".ready-card__number")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const firstBtn = Array.from(
      container.querySelectorAll(".ready-card__action-btn"),
    )[0] as HTMLElement;
    const secondBtn = Array.from(
      container.querySelectorAll(".ready-card__action-btn"),
    )[1] as HTMLElement;

    await user.click(firstBtn);

    await waitFor(() => {
      expect(firstBtn).toBeDisabled();
    });
    expect(secondBtn).not.toBeDisabled();
  });

  it("never renders pay, complete or cancel actions", async () => {
    const { container } = renderPage();

    await waitFor(() => {
      expect(container.querySelector(".ready-card__number")).toBeInTheDocument();
    });

    const labels = Array.from(
      container.querySelectorAll(".ready-card__action-btn"),
    ).map((btn) => btn.textContent);

    expect(labels).toHaveLength(2);
    for (const label of labels) {
      expect(label).toBe("Mark Served");
    }
  });
});
