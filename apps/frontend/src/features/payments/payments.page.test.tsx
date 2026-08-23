// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { StrictMode } from "react";
import { MemoryRouter } from "react-router-dom";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { Order, OrderHistoryItem } from "@/features/orders/orders.types";
import PaymentsPage from "./payments.page";

vi.mock("@/features/auth/use-auth", () => ({
  useAuth: () => ({
    user: { id: "u1", name: "Test Manager", email: "manager@test.com", role: "MANAGER" },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

interface MockOrderState {
  id: string;
  orderNumber: number;
  tableNumber: number;
  status: Order["status"];
  paymentStatus: Order["paymentStatus"];
}

const state = {
  orders: [
    { id: "ord_1", orderNumber: 1024, tableNumber: 12, status: "READY", paymentStatus: "PENDING" },
    { id: "ord_2", orderNumber: 1025, tableNumber: 8, status: "SERVED", paymentStatus: "PENDING" },
    { id: "ord_3", orderNumber: 1026, tableNumber: 3, status: "PREPARING", paymentStatus: "PENDING" },
    { id: "ord_4", orderNumber: 1027, tableNumber: 5, status: "READY", paymentStatus: "PAID" },
  ] as MockOrderState[],
  history: [] as Array<{ orderNumber: number; status: Order["status"] }>,
  paymentCalls: [] as Array<{ orderId: string; body: unknown }>,
  completeCalls: 0,
};

function resetState() {
  state.orders = [
    { id: "ord_1", orderNumber: 1024, tableNumber: 12, status: "READY", paymentStatus: "PENDING" },
    { id: "ord_2", orderNumber: 1025, tableNumber: 8, status: "SERVED", paymentStatus: "PENDING" },
    { id: "ord_3", orderNumber: 1026, tableNumber: 3, status: "PREPARING", paymentStatus: "PENDING" },
    { id: "ord_4", orderNumber: 1027, tableNumber: 5, status: "READY", paymentStatus: "PAID" },
  ];
  state.history = [];
  state.paymentCalls = [];
  state.completeCalls = 0;
}

function toApiOrder(order: MockOrderState): Order {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    tableId: `tbl_${order.id}`,
    tableNumber: order.tableNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    totalAmount: 480,
    cancelledAt: null,
    cancelledReason: null,
    createdAt: "2025-01-15T12:35:00Z",
    updatedAt: "2025-01-15T12:35:00Z",
    items: [
      { id: `${order.id}-i1`, productId: "p1", productName: "Burger", quantity: 2, unitPrice: 150, totalPrice: 300 },
      { id: `${order.id}-i2`, productId: "p2", productName: "Pizza", quantity: 1, unitPrice: 180, totalPrice: 180 },
      { id: `${order.id}-i3`, productId: "p3", productName: "Soda", quantity: 1, unitPrice: 0, totalPrice: 0 },
    ],
  };
}

function toHistoryItem(order: MockOrderState): OrderHistoryItem {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    table: { number: order.tableNumber },
    status: order.status,
    totalAmount: 480,
    createdAt: "2025-01-15T12:35:00Z",
    payment: { status: order.paymentStatus, method: null },
  };
}

const server = setupServer(
  http.get("*/api/v1/orders", ({ request }) => {
    const params = new URL(request.url).searchParams;
    if (params.get("limit") !== "100") {
      return HttpResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "bad limit" } },
        { status: 400 },
      );
    }
    return HttpResponse.json({
      success: true,
      data: state.orders.map(toApiOrder),
      pagination: { page: 1, limit: 100, total: state.orders.length, totalPages: 1 },
    });
  }),
  http.get("*/api/v1/orders/history", ({ request }) => {
    const params = new URL(request.url).searchParams;
    const orderNumber = Number(params.get("orderNumber"));
    const status = params.get("status");
    const match = state.orders.find(
      (o) => o.orderNumber === orderNumber && o.status === status,
    );
    return HttpResponse.json({
      success: true,
      data: match ? [toHistoryItem(match)] : [],
      pagination: { page: 1, limit: 10, total: match ? 1 : 0, totalPages: match ? 1 : 0 },
    });
  }),
  http.post("*/api/v1/orders/:orderId/payment", async ({ request, params }) => {
    const body = (await request.json()) as { method?: string };
    const orderId = String(params.orderId);
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) {
      return HttpResponse.json(
        { success: false, error: { code: "ORDER_NOT_FOUND", message: "Order not found" } },
        { status: 404 },
      );
    }
    if (order.paymentStatus === "PAID") {
      return HttpResponse.json(
        { success: false, error: { code: "PAYMENT_ALREADY_EXISTS", message: "Order is already paid" } },
        { status: 409 },
      );
    }
    state.paymentCalls.push({ orderId, body });
    order.paymentStatus = "PAID";
    return HttpResponse.json({
      success: true,
      data: {
        id: "pay_1",
        orderId,
        amount: 480,
        method: body?.method ?? "CASH",
        status: "PAID",
        paidAt: "2025-01-15T13:00:00Z",
        createdAt: "2025-01-15T13:00:00Z",
      },
    });
  }),
  http.post("*/api/v1/orders/:orderId/complete", ({ params }) => {
    const orderId = String(params.orderId);
    const order = state.orders.find((o) => o.id === orderId);
    if (!order || order.paymentStatus !== "PAID") {
      return HttpResponse.json(
        { success: false, error: { code: "ORDER_NOT_PAID", message: "Order must be paid first" } },
        { status: 409 },
      );
    }
    state.completeCalls += 1;
    order.status = "COMPLETED";
    return HttpResponse.json({ success: true, data: toApiOrder(order) });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetState();
});
afterAll(() => server.close());

function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
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
  return render(
    <StrictMode>
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>
    </StrictMode>,
    { wrapper: createQueryWrapper() },
  );
}

async function waitForCards(container: HTMLElement) {
  await waitFor(() => {
    expect(container.querySelector(".payable-card")).toBeInTheDocument();
  });
  return Array.from(container.querySelectorAll(".payable-card"));
}

describe("PaymentsPage", () => {
  it("shows only payable (READY/SERVED unpaid) orders in the queue", async () => {
    const { container } = renderPage();

    const cards = await waitForCards(container);
    expect(cards).toHaveLength(2);
    expect(container.textContent).toContain("Order #1024");
    expect(container.textContent).toContain("Table 12");
    expect(container.textContent).toContain("3 items");
    expect(container.textContent).toContain("Total: 480 EGP");
    expect(container.textContent).toContain("Order #1025");
    expect(container.textContent).toContain("Table 08");
    expect(container.textContent).not.toContain("#1026");
    expect(container.textContent).not.toContain("#1027");
  });

  it("searches by order number through the existing orders API", async () => {
    const { container } = renderPage();
    await waitForCards(container);

    const user = userEvent.setup();
    await user.type(
      container.querySelector("#payments-search-input") as HTMLInputElement,
      "1025",
    );
    await user.click(
      container.querySelector(".payments-search__submit") as HTMLButtonElement,
    );

    await waitFor(() => {
      expect(container.textContent).toContain("Showing results for order #1025");
    });

    const cards = container.querySelectorAll(".payable-card");
    expect(cards).toHaveLength(1);
    expect(cards[0].textContent).toContain("Order #1025");

    await waitFor(() => {
      expect(container.textContent).not.toContain("Order #1024");
    });
  });

  it("shows an empty state when a searched order is not payable", async () => {
    const { container } = renderPage();
    await waitForCards(container);

    const user = userEvent.setup();
    await user.type(
      container.querySelector("#payments-search-input") as HTMLInputElement,
      "9999",
    );
    await user.click(
      container.querySelector(".payments-search__submit") as HTMLButtonElement,
    );

    await waitFor(() => {
      const title = document.body.querySelector(".empty-state__title");
      expect(title?.textContent).toBe("No payable order found");
    });
  });

  it("pays an order and shows the success state with the backend amount", async () => {
    const { container } = renderPage();
    const cards = await waitForCards(container);

    const user = userEvent.setup();
    const target = cards.find((c) => c.textContent?.includes("#1024")) as HTMLElement;
    await user.click(target.querySelector(".payable-card__pay-btn") as HTMLButtonElement);

    await waitFor(() => {
      expect(document.body.querySelector(".payment-confirm")).toBeInTheDocument();
    });

    const payDialogs = document.body.querySelectorAll('[role="dialog"]');
    await user.click(
      Array.from(payDialogs[payDialogs.length - 1].querySelectorAll("button")).find(
        (b) => b.textContent?.includes("Confirm Payment"),
      ) as HTMLButtonElement,
    );

    await waitFor(() => {
      expect(state.paymentCalls).toHaveLength(1);
    });
    expect(state.paymentCalls[0]).toEqual({
      orderId: "ord_1",
      body: { method: "CASH" },
    });

    const successDialogs = await waitFor(() => {
      const dialogs = document.body.querySelectorAll('[role="dialog"]');
      const success = Array.from(dialogs).find((d) =>
        d.querySelector(".payment-success"),
      );
      expect(success).toBeDefined();
      return dialogs;
    });
    const successDialog = Array.from(successDialogs)
      .find((d) => d.querySelector(".payment-success")) as HTMLElement;

    expect(successDialog.textContent).toContain("Payment successful");
    expect(successDialog.textContent).toContain("#1024");
    expect(successDialog.textContent).toContain("480 EGP");
  });

  it("completes the order from the success state and refreshes the queue", async () => {
    const { container } = renderPage();
    let cards = await waitForCards(container);
    expect(cards).toHaveLength(2);

    const user = userEvent.setup();
    const target = cards.find((c) => c.textContent?.includes("#1024")) as HTMLElement;
    await user.click(target.querySelector(".payable-card__pay-btn") as HTMLButtonElement);

    await waitFor(() => {
      expect(document.body.querySelector(".payment-confirm")).toBeInTheDocument();
    });

    let dialogs = document.body.querySelectorAll('[role="dialog"]');
    await user.click(
      Array.from(dialogs[dialogs.length - 1].querySelectorAll("button")).find(
        (b) => b.textContent?.includes("Confirm Payment"),
      ) as HTMLButtonElement,
    );

    await waitFor(() => {
      const success = Array.from(
        document.body.querySelectorAll(".payment-success"),
      );
      expect(success.length).toBeGreaterThan(0);
    });

    await user.click(
      Array.from(document.body.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Complete Order"),
      ) as HTMLButtonElement,
    );

    await waitFor(() => {
      expect(state.completeCalls).toBe(1);
    });

    await waitFor(() => {
      const toast = document.body.querySelector(".status-toast__message");
      expect(toast?.textContent).toBe("Order completed");
    });

    expect(state.orders.find((o) => o.id === "ord_1")?.status).toBe("COMPLETED");

    await waitFor(() => {
      const remaining = container.querySelectorAll(".payable-card");
      expect(remaining).toHaveLength(1);
      expect(remaining[0].textContent).toContain("#1025");
    });
    cards = Array.from(container.querySelectorAll(".payable-card"));
    expect(cards).toHaveLength(1);
  });

  it("maps PAYMENT_ALREADY_EXISTS to a clear message on concurrent payment", async () => {
    server.use(
      http.post("*/api/v1/orders/:orderId/payment", () =>
        HttpResponse.json(
          {
            success: false,
            error: {
              code: "PAYMENT_ALREADY_EXISTS",
              message: "Order is already paid",
            },
          },
          { status: 409 },
        ),
      ),
    );

    const { container } = renderPage();
    const cards = await waitForCards(container);

    const user = userEvent.setup();
    const target = cards.find((c) => c.textContent?.includes("#1024")) as HTMLElement;
    await user.click(target.querySelector(".payable-card__pay-btn") as HTMLButtonElement);

    await waitFor(() => {
      expect(document.body.querySelector(".payment-confirm")).toBeInTheDocument();
    });

    const dialogs = document.body.querySelectorAll('[role="dialog"]');
    await user.click(
      Array.from(dialogs[dialogs.length - 1].querySelectorAll("button")).find(
        (b) => b.textContent?.includes("Confirm Payment"),
      ) as HTMLButtonElement,
    );

    await waitFor(() => {
      const error = document.body.querySelector(".payment-confirm__error");
      expect(error?.textContent).toBe("This order has already been paid.");
    });

    expect(state.paymentCalls).toHaveLength(0);
  });

  it("renders loading skeletons before data arrives", () => {
    server.use(
      http.get("*/api/v1/orders", () => new Promise<never>(() => {})),
    );

    const { container } = renderPage();

    expect(
      document.body.querySelector('[aria-label="Loading payments"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[aria-label="Loading payments"]'),
    ).toBeInTheDocument();
  });
});
