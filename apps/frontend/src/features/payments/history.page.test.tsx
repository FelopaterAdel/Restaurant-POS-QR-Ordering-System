// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
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
import type {
  PaginatedPaymentHistory,
  PaymentHistoryItem,
} from "./history.types";
import type { PaymentSummary } from "./history.types";
import PaymentHistoryPage from "./history.page";

type MockRole = "OWNER" | "MANAGER" | "CASHIER";

let mockRole: MockRole = "MANAGER";

vi.mock("@/features/auth/use-auth", () => ({
  useAuth: () => ({
    user: {
      id: "u1",
      name: "Test User",
      email: "user@test.com",
      role: mockRole,
    },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

function buildPayment(
  overrides: Partial<PaymentHistoryItem> = {},
): PaymentHistoryItem {
  return {
    id: "pay_1",
    orderNumber: 1024,
    tableNumber: 12,
    amount: 480,
    method: "CASH",
    status: "PAID",
    paidAt: "2026-08-23T09:30:00.000Z",
    ...overrides,
  };
}

const state = {
  payments: [] as PaymentHistoryItem[],
};

function resetState() {
  state.payments = [
    buildPayment(),
    buildPayment({
      id: "pay_2",
      orderNumber: 1023,
      tableNumber: 8,
      amount: 320,
      method: "CARD",
      paidAt: "2026-08-23T09:15:00.000Z",
    }),
  ];
}

resetState();

function paginated(items: PaymentHistoryItem[], page = 1) {
  const body: PaginatedPaymentHistory = {
    data: items,
    pagination: {
      page,
      limit: 20,
      total: items.length,
      totalPages: Math.ceil(items.length / 20),
    },
  };
  return HttpResponse.json(body);
}

const summaryBody: PaymentSummary = { totalSales: 12450, paidCount: 38 };

let historyRequests: URLSearchParams[] = [];

const server = setupServer(
  http.get("*/api/v1/payments/history", ({ request }) => {
    const params = new URL(request.url).searchParams;
    historyRequests.push(params);
    const page = Number(params.get("page") ?? "1");
    const orderNumber = params.get("orderNumber");

    let items = state.payments;
    if (orderNumber) {
      items = items.filter(
        (payment) => payment.orderNumber === Number(orderNumber),
      );
    }

    return paginated(items, page);
  }),
  http.get("*/api/v1/payments/summary", () =>
    HttpResponse.json({ success: true, data: summaryBody }),
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetState();
  mockRole = "MANAGER";
});
afterAll(() => server.close());

beforeEach(() => {
  historyRequests = [];
});

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

function renderPage(initialPath = "/payments/history") {
  return render(
    <StrictMode>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/payments/history" element={<PaymentHistoryPage />} />
          <Route path="/403" element={<div>Access Denied</div>} />
        </Routes>
      </MemoryRouter>
    </StrictMode>,
    { wrapper: createQueryWrapper() },
  );
}

describe("PaymentHistoryPage", () => {
  it("redirects non owner/manager roles to /403", () => {
    mockRole = "CASHIER";

    renderPage();

    expect(screen.getByText("Access Denied")).toBeInTheDocument();

    mockRole = "MANAGER";
  });

  it("renders paid payments and the summary cards", async () => {
    const { container } = renderPage();

    await waitFor(() => {
      expect(container.querySelector(".table")).toBeInTheDocument();
    });

    expect(container.textContent).toContain("#1024");
    expect(container.textContent).toContain("#1023");
    expect(container.textContent).toContain("EGP 480");
    expect(container.textContent).toContain("EGP 320");

    expect(container.textContent).toContain("Total Sales");
    expect(container.textContent).toContain("EGP 12,450");
    expect(container.textContent).toContain("Payments");
    expect(container.textContent).toMatch(/Payments38|Payments\s*38/);
  });

  it("sends today's date range as from/to query params", async () => {
    const { container } = renderPage();

    await waitFor(() => {
      expect(container.querySelector(".table")).toBeInTheDocument();
    });

    const params = historyRequests[0];
    expect(params).toBeDefined();

    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    expect(params!.get("from")).toBe(iso);
    expect(params!.get("to")).toBe(iso);
  });

  it("shows the empty state when no payments exist", async () => {
    state.payments = [];

    const { container } = renderPage();

    await waitFor(() => {
      expect(
        screen.getByText("No payments found for this period."),
      ).toBeInTheDocument();
    });
    expect(container.querySelector(".table")).toBeNull();
  });

  it("shows the error state with retry", async () => {
    server.use(
      http.get("*/api/v1/payments/history", () =>
        HttpResponse.json(
          {
            success: false,
            error: { code: "INTERNAL", message: "boom" },
          },
          { status: 500 },
        ),
      ),
    );

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText("Unable to load payment history"),
      ).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: "Try Again" }));
  });

  it("opens read-only payment details when clicking a row", async () => {
    const { container } = renderPage();

    await waitFor(() => {
      expect(container.querySelector(".table__row.history-row")).toBeTruthy();
    });

    await userEvent.click(container.querySelector(".history-row")!);

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog.textContent).toContain("Payment Details");
    expect(dialog.textContent).toContain("Order #1024");
    expect(dialog.textContent).toContain("Table 12");
    expect(dialog.textContent).toContain("EGP 480");
    expect(dialog.textContent).toContain("Amount");
    expect(dialog.textContent).toContain("Paid At");
  });

  it("filters by order number via search", async () => {
    const { container } = renderPage();

    await waitFor(() => {
      expect(container.querySelector(".table")).toBeInTheDocument();
    });

    await userEvent.type(
      screen.getByLabelText("Search Order #"),
      "1023",
    );
    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => {
      expect(container.textContent).not.toContain("#1024");
    });
    expect(container.textContent).toContain("#1023");
  });

  it("paginates through the payment list without loading everything at once", async () => {
    server.use(
      http.get("*/api/v1/payments/history", ({ request }) => {
        const params = new URL(request.url).searchParams;
        historyRequests.push(params);
        const page = Number(params.get("page") ?? "1");

        return HttpResponse.json({
          success: true,
          data:
            page === 1
              ? [buildPayment()]
              : [
                  buildPayment({
                    id: "pay_50",
                    orderNumber: 975,
                    tableNumber: 4,
                    amount: 210,
                  }),
                ],
          pagination: { page, limit: 20, total: 45, totalPages: 3 },
        });
      }),
    );

    const { container } = renderPage();

    await waitFor(() => {
      expect(container.textContent).toContain("#1024");
    });
    expect(container.textContent).toContain("Showing 1–20 of 45 payments");

    await userEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(container.textContent).toContain("#975");
    });
    expect(container.textContent).not.toContain("#1024");

    const lastRequest = historyRequests[historyRequests.length - 1];
    expect(lastRequest!.get("page")).toBe("2");
  });
});
