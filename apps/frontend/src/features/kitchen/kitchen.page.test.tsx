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
import KitchenPage from "./kitchen.page";

vi.mock("@/features/auth/use-auth", () => ({
  useAuth: () => ({
    user: {
      id: "u1",
      name: "Test Kitchen",
      email: "kitchen@test.com",
      role: "KITCHEN",
    },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

const mockOrders: Order[] = [
  {
    id: "ord_pending",
    orderNumber: 1026,
    tableId: "tbl_3",
    tableNumber: 8,
    status: "PENDING",
    paymentStatus: "PENDING",
    totalAmount: 350,
    cancelledAt: null,
    cancelledReason: null,
    createdAt: "2025-01-15T12:20:00Z",
    updatedAt: "2025-01-15T12:20:00Z",
    items: [],
  },
  {
    id: "ord_confirmed",
    orderNumber: 1024,
    tableId: "tbl_1",
    tableNumber: 12,
    status: "CONFIRMED",
    paymentStatus: "PENDING",
    totalAmount: 450,
    cancelledAt: null,
    cancelledReason: null,
    createdAt: "2025-01-15T12:35:00Z",
    updatedAt: "2025-01-15T12:35:00Z",
    items: [
      {
        id: "i1",
        productId: "p1",
        productName: "Burger",
        quantity: 2,
        unitPrice: 100,
        totalPrice: 200,
      },
      {
        id: "i2",
        productId: "p2",
        productName: "Fries",
        quantity: 1,
        unitPrice: 50,
        totalPrice: 50,
      },
    ],
  },
  {
    id: "ord_preparing",
    orderNumber: 1025,
    tableId: "tbl_2",
    tableNumber: 8,
    status: "PREPARING",
    paymentStatus: "PENDING",
    totalAmount: 300,
    cancelledAt: null,
    cancelledReason: null,
    createdAt: "2025-01-15T12:40:00Z",
    updatedAt: "2025-01-15T12:40:00Z",
    items: [
      {
        id: "i3",
        productId: "p3",
        productName: "Pizza",
        quantity: 1,
        unitPrice: 200,
        totalPrice: 200,
      },
      {
        id: "i4",
        productId: "p4",
        productName: "Salad",
        quantity: 2,
        unitPrice: 50,
        totalPrice: 100,
      },
    ],
  },
  {
    id: "ord_ready",
    orderNumber: 1023,
    tableId: "tbl_4",
    tableNumber: 3,
    status: "READY",
    paymentStatus: "PENDING",
    totalAmount: 150,
    cancelledAt: null,
    cancelledReason: null,
    createdAt: "2025-01-15T12:10:00Z",
    updatedAt: "2025-01-15T12:30:00Z",
    items: [
      {
        id: "i5",
        productId: "p5",
        productName: "Soup",
        quantity: 1,
        unitPrice: 150,
        totalPrice: 150,
      },
    ],
  },
];

const queueResponse = () =>
  HttpResponse.json({
    success: true,
    data: mockOrders,
    pagination: { page: 1, limit: 50, total: 4, totalPages: 1 },
  });

const handlers = [http.get("*/api/v1/orders/queue", queueResponse)];

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
  const { container } = render(<KitchenPage />, {
    wrapper: createQueryWrapper(),
  });
  return { container };
}

describe("KitchenPage", () => {
  it("renders loading skeleton initially", () => {
    server.use(
      http.get("*/api/v1/orders/queue", () => {
        return new Promise<never>(() => {});
      }),
    );

    const { container } = renderPage();

    expect(
      container.querySelector('[aria-label="Loading kitchen orders"]'),
    ).toBeInTheDocument();
  });

  it("renders the header with active orders count", async () => {
    const { container } = renderPage();

    await waitFor(() => {
      expect(
        container.querySelector(".kitchen-card__number"),
      ).toBeInTheDocument();
    });

    expect(container.querySelector(".kitchen__title")).toHaveTextContent(
      "Kitchen",
    );
    expect(container.querySelector(".kitchen__count")).toHaveTextContent(
      "3 Active Orders",
    );
  });

  it("shows only CONFIRMED, PREPARING and READY orders", async () => {
    const { container } = renderPage();

    await waitFor(() => {
      expect(
        container.querySelector(".kitchen-card__number"),
      ).toBeInTheDocument();
    });

    const numbers = Array.from(
      container.querySelectorAll(".kitchen-card__number"),
    ).map((el) => el.textContent);

    expect(numbers).toContain("#1023");
    expect(numbers).toContain("#1024");
    expect(numbers).toContain("#1025");
    expect(numbers).not.toContain("#1026");
  });

  it("orders cards oldest first", async () => {
    const { container } = renderPage();

    await waitFor(() => {
      expect(
        container.querySelector(".kitchen-card__number"),
      ).toBeInTheDocument();
    });

    const numbers = Array.from(
      container.querySelectorAll(".kitchen-card__number"),
    ).map((el) => el.textContent);

    expect(numbers).toEqual(["#1023", "#1024", "#1025"]);
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
      expect(text?.textContent).toBe("Unable to load kitchen orders");
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
        return queueResponse();
      }),
    );

    const { container } = renderPage();

    await waitFor(() => {
      const text = container.querySelector(".empty-state__title");
      expect(text?.textContent).toBe("Unable to load kitchen orders");
    });

    const user = userEvent.setup();
    const tryAgainBtn = container.querySelector(
      ".empty-state__action button",
    ) as HTMLElement;
    await user.click(tryAgainBtn);

    await waitFor(() => {
      expect(container.querySelector(".kitchen-card__number")).toBeInTheDocument();
    });

    expect(callCount).toBe(2);
  });

  it("shows empty state when no kitchen orders exist", async () => {
    server.use(
      http.get("*/api/v1/orders/queue", () => {
        return HttpResponse.json({
          success: true,
          data: [],
          pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
        });
      }),
    );

    const { container } = renderPage();

    await waitFor(() => {
      const title = container.querySelector(".empty-state__title");
      expect(title?.textContent).toBe("No active kitchen orders");
    });
  });

  it("moves a CONFIRMED order to PREPARING via Start Preparing", async () => {
    const patchBodies: unknown[] = [];

    server.use(
      http.patch("*/api/v1/orders/ord_confirmed/status", async ({ request }) => {
        patchBodies.push(await request.json());
        return HttpResponse.json({ success: true, data: mockOrders[1] });
      }),
    );

    const { container } = renderPage();

    await waitFor(() => {
      expect(
        container.querySelector(".kitchen-card__number"),
      ).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const startBtn = Array.from(
      container.querySelectorAll(".kitchen-card__action-btn"),
    ).find((btn) => btn.textContent === "Start Preparing") as HTMLElement;
    expect(startBtn).toBeDefined();

    await user.click(startBtn);

    await waitFor(() => {
      expect(patchBodies).toEqual([{ status: "PREPARING" }]);
    });

    await waitFor(() => {
      const toast = container.querySelector(".kitchen-toast");
      expect(toast).toBeInTheDocument();
      expect(toast?.textContent).toContain("Order #1024");
    });
  });

  it("moves a PREPARING order to READY via Mark Ready", async () => {
    const patchBodies: unknown[] = [];

    server.use(
      http.patch("*/api/v1/orders/ord_preparing/status", async ({ request }) => {
        patchBodies.push(await request.json());
        return HttpResponse.json({ success: true, data: mockOrders[2] });
      }),
    );

    const { container } = renderPage();

    await waitFor(() => {
      expect(
        container.querySelector(".kitchen-card__number"),
      ).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const readyBtn = Array.from(
      container.querySelectorAll(".kitchen-card__action-btn"),
    ).find((btn) => btn.textContent === "Mark Ready") as HTMLElement;
    expect(readyBtn).toBeDefined();

    await user.click(readyBtn);

    await waitFor(() => {
      expect(patchBodies).toEqual([{ status: "READY" }]);
    });
  });

  it("invalidates and refetches orders after a successful mutation", async () => {
    let queueCalls = 0;
    let patchCalls = 0;
    const updatedOrders = mockOrders.map((order) =>
      order.id === "ord_confirmed" ? { ...order, status: "PREPARING" } : order,
    );

    server.use(
      http.get("*/api/v1/orders/queue", () => {
        queueCalls++;
        if (patchCalls > 0) {
          return HttpResponse.json({
            success: true,
            data: updatedOrders,
            pagination: { page: 1, limit: 50, total: 4, totalPages: 1 },
          });
        }
        return queueResponse();
      }),
      http.patch("*/api/v1/orders/ord_confirmed/status", () => {
        patchCalls++;
        return HttpResponse.json({
          success: true,
          data: { ...mockOrders[1], status: "PREPARING" },
        });
      }),
    );

    const { container } = renderPage();

    await waitFor(() => {
      expect(queueCalls).toBeGreaterThan(0);
    });

    const user = userEvent.setup();
    const startBtn = Array.from(
      container.querySelectorAll(".kitchen-card__action-btn"),
    ).find((btn) => btn.textContent === "Start Preparing") as HTMLElement;
    await user.click(startBtn);

    // After invalidation the query refetches and the card no longer offers
    // "Start Preparing" (order is now PREPARING → next action is Mark Ready).
    await waitFor(() => {
      const labels = Array.from(
        container.querySelectorAll(".kitchen-card__action-btn"),
      ).map((btn) => btn.textContent);
      expect(labels).not.toContain("Start Preparing");
    });
    expect(patchCalls).toBe(1);
    expect(queueCalls).toBeGreaterThanOrEqual(2);
  });

  it("shows an error toast when the mutation fails", async () => {
    server.use(
      http.patch("*/api/v1/orders/ord_confirmed/status", () => {
        return HttpResponse.json(
          {
            success: false,
            error: { code: "ORDER_INVALID_STATUS", message: "Invalid status" },
          },
          { status: 409 },
        );
      }),
    );

    const { container } = renderPage();

    await waitFor(() => {
      expect(
        container.querySelector(".kitchen-card__number"),
      ).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const startBtn = Array.from(
      container.querySelectorAll(".kitchen-card__action-btn"),
    ).find((btn) => btn.textContent === "Start Preparing") as HTMLElement;
    await user.click(startBtn);

    await waitFor(() => {
      const toast = container.querySelector(".kitchen-toast--error");
      expect(toast).toBeInTheDocument();
    });
  });

  it("does not show pay, complete or cancel actions", async () => {
    const { container } = renderPage();

    await waitFor(() => {
      expect(
        container.querySelector(".kitchen-card__number"),
      ).toBeInTheDocument();
    });

    const labels = Array.from(
      container.querySelectorAll(".kitchen-card__action-btn"),
    ).map((btn) => btn.textContent);

    // DOM order: #1023 (READY, no action), #1024 (CONFIRMED), #1025 (PREPARING)
    expect(labels).toEqual(["Start Preparing", "Mark Ready"]);
    for (const label of labels) {
      expect(label).not.toContain("Pay");
      expect(label).not.toContain("Complete");
      expect(label).not.toContain("Cancel");
    }
  });

  it("disables only the mutating card action while updating", async () => {
    server.use(
      http.patch(
        "*/api/v1/orders/ord_confirmed/status",
        () => new Promise<never>(() => {}),
      ),
    );

    const { container } = renderPage();

    await waitFor(() => {
      expect(
        container.querySelector(".kitchen-card__number"),
      ).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const startBtn = Array.from(
      container.querySelectorAll(".kitchen-card__action-btn"),
    ).find((btn) => btn.textContent === "Start Preparing") as HTMLElement;
    const otherBtn = Array.from(
      container.querySelectorAll(".kitchen-card__action-btn"),
    ).find((btn) => btn.textContent === "Mark Ready") as HTMLElement;

    await user.click(startBtn);

    await waitFor(() => {
      expect(startBtn).toBeDisabled();
    });
    expect(otherBtn).not.toBeDisabled();
  });
});
