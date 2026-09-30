// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import AuditPage from "./audit.page";

const entries = [
  {
    id: "log_1",
    action: "REFUND_APPROVED",
    entityType: "REFUND",
    entityId: "ref_1",
    details: null,
    createdAt: "2026-09-28T10:00:00.000Z",
    user: {
      id: "u1",
      name: "Mona Manager",
      email: "mona@test.com",
      role: "MANAGER",
    },
  },
  {
    id: "log_2",
    action: "DISCOUNT_APPLIED",
    entityType: "ORDER",
    entityId: "ord_9",
    details: null,
    createdAt: "2026-09-28T09:00:00.000Z",
    user: null,
  },
];

let lastParams: Record<string, string> | null = null;

const server = setupServer(
  http.get("*/api/v1/audit-log", ({ request }) => {
    const params: Record<string, string> = {};
    new URL(request.url).searchParams.forEach((value, key) => {
      params[key] = value;
    });
    lastParams = params;
    return HttpResponse.json({
      success: true,
      data: entries,
      pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
    });
  }),
  http.get("*/api/v1/users", () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: "u1",
          name: "Mona Manager",
          email: "mona@test.com",
          role: "MANAGER",
          status: "ACTIVE",
          lastLoginAt: null,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  lastParams = null;
});
afterAll(() => server.close());

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuditPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("AuditPage", () => {
  it("lists audit entries with actor and entity", async () => {
    renderPage();

    expect(await screen.findByText("REFUND ref_1")).toBeInTheDocument();
    const table = screen.getByRole("table");
    expect(within(table).getByText("REFUND_APPROVED")).toBeInTheDocument();
    expect(
      within(table).getByText("Mona Manager (MANAGER)"),
    ).toBeInTheDocument();
    expect(within(table).getByText("DISCOUNT_APPLIED")).toBeInTheDocument();
    expect(within(table).getByText("System")).toBeInTheDocument();
  });

  it("filters by action", async () => {
    renderPage();
    const user = userEvent.setup();

    await screen.findByText("REFUND_APPROVED");
    await user.selectOptions(
      screen.getByLabelText("Filter by action"),
      "ORDER_CANCELLED",
    );

    expect(lastParams).toMatchObject({ action: "ORDER_CANCELLED", page: "1" });
  });
});
