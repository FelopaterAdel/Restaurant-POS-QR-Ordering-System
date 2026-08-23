// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  render,
  waitFor,
} from "@testing-library/react";
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
import OrdersPage from "./orders.page";
import type { Order } from "./orders.types";
import type { OrderStatus, PaymentStatus } from "@/components/ui";

const authMock = vi.hoisted(() => ({ role: "CASHIER" }));

vi.mock("@/features/auth/use-auth", () => ({
  useAuth: () => ({
    user: {
      id: "u1",
      name: "Test Cashier",
      email: "cashier@test.com",
      role: authMock.role,
    },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

interface MockOrderState {
  id: string;
  orderNumber: number;
  tableId: string;
  tableNumber: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
}

const state = {
  orders: [
    { id: "ord_1", orderNumber: 1024, tableId: "tbl_1", tableNumber: 5, status: "READY", paymentStatus: "PENDING" },
    { id: "ord_2", orderNumber: 1025, tableId: "tbl_2", tableNumber: 2, status: "PREPARING", paymentStatus: "PENDING" },
    { id: "ord_3", orderNumber: 1026, tableId: "tbl_3", tableNumber: 8, status: "SERVED", paymentStatus: "PENDING" },
  ] as MockOrderState[],
  paymentCalls: [] as Array<{ orderId: string; body: unknown }>,
  completeCalls: 0,
};

function resetState() {
  state.orders = [
    { id: "ord_1", orderNumber: 1024, tableId: "tbl_1", tableNumber: 5, status: "READY", paymentStatus: "PENDING" },
    { id: "ord_2", orderNumber: 1025, tableId: "tbl_2", tableNumber: 2, status: "PREPARING", paymentStatus: "PENDING" },
    { id: "ord_3", orderNumber: 1026, tableId: "tbl_3", tableNumber: 8, status: "SERVED", paymentStatus: "PENDING" },
  ];
  state.paymentCalls = [];
  state.completeCalls = 0;
}

function toItem(order: MockOrderState) {
  return {
    id: `item_${order.id}`,
    productId: `prod_${order.id}`,
    productName: "Burger",
    quantity: 2,
    unitPrice: 100,
    totalPrice: 200,
  };
}

function toApiOrder(order: MockOrderState): Order {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    tableId: order.tableId,
    tableNumber: order.tableNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    totalAmount: 200,
    cancelledAt: null,
    cancelledReason: null,
    createdAt: "2025-01-15T12:35:00Z",
    updatedAt: "2025-01-15T12:35:00Z",
    items: [toItem(order)],
  };
}

const server = setupServer(
  http.get("*/api/v1/orders/queue", () => {
    return HttpResponse.json({
      success: true,
      data: state.orders.map(toApiOrder),
      pagination: { page: 1, limit: 20, total: state.orders.length, totalPages: 1 },
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
    if (!["READY", "SERVED"].includes(order.status)) {
      return HttpResponse.json(
        { success: false, error: { code: "PAYMENT_NOT_ALLOWED", message: "Order cannot be paid" } },
        { status: 409 },
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
        amount: 200,
        method: body?.method ?? "CASH",
        status: "PAID",
        paidAt: "2025-01-15T13:00:00Z",
        createdAt: "2025-01-15T13:00:00Z",
      },
    });
  }),
  http.post("*/api/v1/orders/:orderId/complete", async ({ params }) => {
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

async function openOrderDetails(container: HTMLElement, orderNumber: number) {
  await waitFor(() => {
    expect(container.querySelector(".order-card__number")).toBeInTheDocument();
  });

  const user = userEvent.setup();
  const cards = container.querySelectorAll(".order-card");
  const card = Array.from(cards).find((c) =>
    c.textContent?.includes(`#${orderNumber}`),
  ) as HTMLElement;
  await user.click(card);

  await waitFor(() => {
    expect(document.body.querySelector('[role="dialog"]')).toBeInTheDocument();
  });

  const dialogs = document.body.querySelectorAll('[role="dialog"]');
  return { user, dialog: dialogs[dialogs.length - 1] as HTMLElement };
}

describe("OrdersPage staff payment workflow", () => {
  it("shows Pay Order for CASHIER on READY unpaid order", async () => {
    const { container } = render(
      <StrictMode>
        <OrdersPage />
      </StrictMode>,
      { wrapper: createQueryWrapper() },
    );

    const { dialog } = await openOrderDetails(container, 1024);

    expect(
      Array.from(dialog.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Pay Order"),
      ),
    ).toBeDefined();
  });

  it("does not show Pay or Complete actions on non-payable order statuses", async () => {
    const { container } = render(
      <StrictMode>
        <OrdersPage />
      </StrictMode>,
      { wrapper: createQueryWrapper() },
    );

    const { dialog } = await openOrderDetails(container, 1025);

    const buttons = Array.from(dialog.querySelectorAll("button"));
    expect(
      buttons.find((b) => b.textContent?.includes("Pay Order")),
    ).toBeUndefined();
    expect(
      buttons.find((b) => b.textContent?.includes("Complete Order")),
    ).toBeUndefined();
  });

  it("does not show Pay action for WAITER", async () => {
    authMock.role = "WAITER";

    const { container } = render(
      <StrictMode>
        <OrdersPage />
      </StrictMode>,
      { wrapper: createQueryWrapper() },
    );

    const { dialog } = await openOrderDetails(container, 1024);

    expect(
      Array.from(dialog.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Pay Order"),
      ),
    ).toBeUndefined();

    authMock.role = "CASHIER";
  });

  it("pays an order and reflects PAID state after refetch", async () => {
    const { container } = render(
      <StrictMode>
        <OrdersPage />
      </StrictMode>,
      { wrapper: createQueryWrapper() },
    );

    const { user, dialog } = await openOrderDetails(container, 1024);

    await user.click(
      Array.from(dialog.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Pay Order"),
      ) as HTMLElement,
    );

    await waitFor(() => {
      expect(
        document.body.querySelector(".payment-confirm"),
      ).toBeInTheDocument();
    });

    const payDialogs = document.body.querySelectorAll('[role="dialog"]');
    const payDialog = payDialogs[payDialogs.length - 1] as HTMLElement;
    await user.click(
      Array.from(payDialog.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Confirm Payment"),
      ) as HTMLElement,
    );

    await waitFor(() => {
      expect(state.paymentCalls).toHaveLength(1);
    });
    expect(state.paymentCalls[0]).toEqual({
      orderId: "ord_1",
      body: { method: "CASH" },
    });

    await waitFor(() => {
      const toast = document.body.querySelector(".status-toast__message");
      expect(toast?.textContent).toBe("Payment recorded");
    });

    await waitFor(() => {
      expect(document.body.querySelector(".payment-confirm")).toBeNull();
    });

    const { dialog: detailsAgain } = await openOrderDetails(container, 1024);
    const paidBadge = detailsAgain.querySelector(".badge--success");
    expect(paidBadge?.textContent).toBe("Paid");
  });

  it("shows a clear message when the order was already paid concurrently", async () => {
    server.use(
      http.post("*/api/v1/orders/:orderId/payment", () => {
        return HttpResponse.json(
          {
            success: false,
            error: {
              code: "PAYMENT_ALREADY_EXISTS",
              message: "Order is already paid",
            },
          },
          { status: 409 },
        );
      }),
    );

    const { container } = render(
      <StrictMode>
        <OrdersPage />
      </StrictMode>,
      { wrapper: createQueryWrapper() },
    );

    const { user, dialog } = await openOrderDetails(container, 1024);

    await user.click(
      Array.from(dialog.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Pay Order"),
      ) as HTMLElement,
    );

    const payDialogs = document.body.querySelectorAll('[role="dialog"]');
    const payDialog = payDialogs[payDialogs.length - 1] as HTMLElement;
    await user.click(
      Array.from(payDialog.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Confirm Payment"),
      ) as HTMLElement,
    );

    await waitFor(() => {
      const error = document.body.querySelector(".payment-confirm__error");
      expect(error?.textContent).toBe("This order has already been paid.");
    });

    expect(document.body.querySelector(".payment-confirm")).not.toBeNull();
  });

  it("completes a paid order and releases it", async () => {
    const { container } = render(
      <StrictMode>
        <OrdersPage />
      </StrictMode>,
      { wrapper: createQueryWrapper() },
    );

    let { user, dialog } = await openOrderDetails(container, 1024);
    await user.click(
      Array.from(dialog.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Pay Order"),
      ) as HTMLElement,
    );

    await waitFor(() => {
      expect(document.body.querySelector(".payment-confirm")).toBeInTheDocument();
    });

    const payDialogs = document.body.querySelectorAll('[role="dialog"]');
    await user.click(
      Array.from(payDialogs[payDialogs.length - 1].querySelectorAll("button")).find(
        (b) => b.textContent?.includes("Confirm Payment"),
      ) as HTMLElement,
    );

    await waitFor(() => {
      const toast = document.body.querySelector(".status-toast__message");
      expect(toast?.textContent).toBe("Payment recorded");
    });

    await waitFor(() => {
      expect(document.body.querySelector(".payment-confirm")).toBeNull();
    });

    await user.click(
      document.body.querySelector(".status-toast__dismiss") as HTMLElement,
    );
    await waitFor(() => {
      expect(document.body.querySelector(".status-toast")).toBeNull();
    });

    const reopened = await openOrderDetails(container, 1024);
    user = reopened.user;
    dialog = reopened.dialog;

    const completeBtn = Array.from(dialog.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Complete Order"),
    );
    expect(completeBtn).toBeDefined();
    await user.click(completeBtn as HTMLElement);

    await waitFor(() => {
      expect(
        document.body.querySelector(".complete-confirm"),
      ).toBeInTheDocument();
    });

    const completeDialogs = document.body.querySelectorAll('[role="dialog"]');
    const completeDialog = completeDialogs[
      completeDialogs.length - 1
    ] as HTMLElement;
    await user.click(
      Array.from(completeDialog.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Complete Order"),
      ) as HTMLElement,
    );

    await waitFor(() => {
      expect(state.completeCalls).toBe(1);
    });

    await waitFor(() => {
      const toast = document.body.querySelector(".status-toast__message");
      expect(toast?.textContent).toBe("Order completed");
    });

    expect(state.orders.find((o) => o.id === "ord_1")?.status).toBe("COMPLETED");
  });
});
