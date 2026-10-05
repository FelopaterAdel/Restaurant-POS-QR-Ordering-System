// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { StrictMode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
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
import type { PublicOrder } from "./menu.types";
import OrderTrackingPage from "./order-tracking.page";

const activeOrder: PublicOrder = {
  id: "ord_1024",
  orderNumber: 1024,
  tableId: "tbl_1",
  tableNumber: 12,
  status: "PREPARING",
  totalAmount: 480,
  cancelledAt: null,
  cancelledReason: null,
  createdAt: "2026-08-22T12:00:00.000Z",
  updatedAt: "2026-08-22T12:05:00.000Z",
  items: [
    {
      id: "item_1",
      productId: "prod_1",
      productName: "Burger",
      quantity: 2,
      unitPrice: 150,
      totalPrice: 300,
    },
    {
      id: "item_2",
      productId: "prod_2",
      productName: "Pizza",
      quantity: 1,
      unitPrice: 180,
      totalPrice: 180,
    },
  ],
};

let currentOrder: PublicOrder = activeOrder;
let getOrderCalls = 0;

const handlers = [
  http.get("*/api/v1/public/tables/:qrCode/menu", () => {
    return HttpResponse.json({
      success: true,
      data: {
        table: { id: "tbl_1", number: 12 },
        restaurant: { name: "Test Restaurant", logoUrl: null },
        categories: [],
      },
    });
  }),
  http.get("*/api/v1/public/orders/:orderId", ({ request }) => {
    getOrderCalls += 1;
    const url = new URL(request.url);
    if (url.searchParams.get("qrCode") !== "tbl_test123") {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "ORDER_NOT_FOUND", message: "Order not found" },
        },
        { status: 404 },
      );
    }
    return HttpResponse.json({ success: true, data: currentOrder });
  }),
];

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
beforeEach(() => {
  currentOrder = activeOrder;
});
afterEach(() => {
  server.resetHandlers();
  window.sessionStorage.clear();
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

function renderTrackingPage() {
  return render(
    <StrictMode>
      <MemoryRouter
        initialEntries={["/public/menu/tbl_test123/orders/ord_1024"]}
      >
        <Routes>
          <Route
            path="/public/menu/:qrCode/orders/:orderId"
            element={<OrderTrackingPage />}
          />
        </Routes>
      </MemoryRouter>
    </StrictMode>,
    { wrapper: createQueryWrapper() },
  );
}

describe("OrderTrackingPage", () => {
  it("shows a loading state while fetching the order", () => {
    server.use(
      http.get("*/api/v1/public/orders/:orderId", () => {
        return new Promise<never>(() => {});
      }),
    );

    const { container } = renderTrackingPage();

    const loading = container.querySelector(".menu-page__loading");
    expect(loading).toBeInTheDocument();
    expect(loading?.textContent).toContain("Loading your order...");
  });

  it("renders branding, order details, timeline and totals from the API", async () => {
    const { container } = renderTrackingPage();

    await waitFor(() => {
      expect(
        container.querySelector(".order-tracking__title"),
      ).toBeInTheDocument();
    });

    expect(container.querySelector(".menu-page__title")?.textContent).toBe(
      "Track Order",
    );
    expect(container.querySelector(".menu-page__subtitle")?.textContent).toBe(
      "Test Restaurant",
    );
    expect(container.querySelector(".order-tracking__title")?.textContent).toBe(
      "Order #1024",
    );
    expect(container.querySelector(".order-tracking__table")?.textContent).toBe(
      "Table 12",
    );

    const done = container.querySelectorAll(
      ".order-status-timeline__step--done",
    );
    const current = container.querySelector(
      ".order-status-timeline__step--current",
    );
    const pending = container.querySelectorAll(
      ".order-status-timeline__step--pending",
    );
    expect(done.length).toBe(2);
    expect(current?.textContent).toContain("Preparing");
    expect(pending.length).toBe(3);

    const itemNames = Array.from(
      container.querySelectorAll(".order-tracking__item-name"),
    ).map((el) => el.textContent);
    expect(itemNames).toEqual(["Burger × 2", "Pizza × 1"]);

    const itemPrices = Array.from(
      container.querySelectorAll(".order-tracking__item-price"),
    ).map((el) => el.textContent);
    expect(itemPrices).toEqual(["EGP 300", "EGP 180"]);

    expect(
      container.querySelector(".order-tracking__total-amount")?.textContent,
    ).toBe("EGP 480");
  });

  it("marks every step as done when the order is completed", async () => {
    currentOrder = { ...activeOrder, status: "COMPLETED" };

    const { container } = renderTrackingPage();

    await waitFor(() => {
      expect(
        container.querySelector(".order-status-timeline"),
      ).toBeInTheDocument();
    });

    expect(
      container.querySelectorAll(".order-status-timeline__step--done").length,
    ).toBe(6);
    expect(container.querySelector(".order-status-timeline__step--current")).toBeNull();
    expect(
      container.querySelector(".order-status-timeline__cancelled"),
    ).toBeNull();
  });

  it("shows a separate cancelled state without a timeline", async () => {
    currentOrder = {
      ...activeOrder,
      status: "CANCELLED",
      cancelledAt: "2026-08-22T12:10:00.000Z",
      cancelledReason: "Cancelled by staff",
    };

    const { container } = renderTrackingPage();

    await waitFor(() => {
      expect(
        container.querySelector(".order-status-timeline__cancelled"),
      ).toBeInTheDocument();
    });

    expect(
      container.querySelector(".order-status-timeline__cancelled")?.textContent,
    ).toBe("✕ Order Cancelled");
    expect(
      container.querySelector(".order-status-timeline"),
    ).toBeNull();
    expect(
      container.querySelector(".order-tracking__cancel-reason")?.textContent,
    ).toBe("Cancelled by staff");
  });

  it("polls for status updates and stops when the order is terminal", async () => {
    vi.useFakeTimers();

    try {
      renderTrackingPage();

      await vi.waitFor(() => {
        expect(getOrderCalls).toBeGreaterThanOrEqual(1);
      });
      const initialCalls = getOrderCalls;
      expect(initialCalls).toBeGreaterThan(0);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(10_500);
      });
      await vi.waitFor(() => {
        expect(getOrderCalls).toBeGreaterThan(initialCalls);
      });

      currentOrder = { ...activeOrder, status: "COMPLETED" };

      await act(async () => {
        await vi.advanceTimersByTimeAsync(10_500);
      });

      const terminalCalls = getOrderCalls;

      await act(async () => {
        await vi.advanceTimersByTimeAsync(60_000);
      });

      expect(getOrderCalls).toBe(terminalCalls);
    } finally {
      vi.useRealTimers();
    }
  });

  it("shows an error state with retry and no technical details", async () => {
    server.use(
      http.get("*/api/v1/public/orders/:orderId", () => {
        return HttpResponse.json(
          {
            success: false,
            error: {
              code: "INTERNAL_SERVER_ERROR",
              message: "Database connection failed on host db-17",
            },
          },
          { status: 500 },
        );
      }),
    );

    const { container } = renderTrackingPage();

    await waitFor(() => {
      expect(
        container.querySelector(".menu-page__error-title"),
      ).toBeInTheDocument();
    });

    expect(
      container.querySelector(".menu-page__error-title")?.textContent,
    ).toBe("Unable to load your order");
    expect(container.textContent).not.toContain("db-17");

    server.use(
      http.get("*/api/v1/public/orders/:orderId", () => {
        return HttpResponse.json({ success: true, data: activeOrder });
      }),
    );

    const user = userEvent.setup();
    const retryBtn = container.querySelector(
      ".menu-page__error .button--primary",
    ) as HTMLElement;
    await user.click(retryBtn);

    await waitFor(() => {
      expect(
        container.querySelector(".order-tracking__title"),
      ).toBeInTheDocument();
    });
  });

  it("sends the table qr code with the order request", async () => {
    let requestUrl = "";
    server.use(
      http.get("*/api/v1/public/orders/:orderId", ({ request }) => {
        requestUrl = new URL(request.url).searchParams.get("qrCode") ?? "";
        return HttpResponse.json({ success: true, data: activeOrder });
      }),
    );

    const { container } = renderTrackingPage();

    await waitFor(() => {
      expect(
        container.querySelector(".order-tracking__title"),
      ).toBeInTheDocument();
    });

    expect(requestUrl).toBe("tbl_test123");
  });
});
