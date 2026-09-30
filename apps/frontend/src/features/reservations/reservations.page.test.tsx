// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ReservationsPage from "./reservations.page";

vi.mock("@/features/auth/use-auth", () => ({
  useAuth: () => ({
    user: { id: "1", name: "Test Owner", role: "OWNER" },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

const reservations = [
  {
    id: "res_1",
    customerName: "Ahmed Samy",
    phone: "01012345678",
    partySize: 4,
    tableId: "tbl_1",
    reservedFor: "2030-01-15T19:00:00.000Z",
    status: "PENDING",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    table: { id: "tbl_1", number: 5, name: "Table 5" },
  },
];

const tables = [
  {
    id: "tbl_1",
    number: 5,
    name: "Table 5",
    qrCode: "tbl_abc",
    status: "AVAILABLE",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

let postedBody: unknown;

const server = setupServer(
  http.get("*/api/v1/reservations", () => {
    return HttpResponse.json({ success: true, data: reservations });
  }),
  http.get("*/api/v1/tables", () => {
    return HttpResponse.json({ success: true, data: tables });
  }),
  http.post("*/api/v1/reservations", async ({ request }) => {
    postedBody = await request.json();
    return HttpResponse.json(
      { success: true, data: reservations[0] },
      { status: 201 },
    );
  }),
  http.patch("*/api/v1/reservations/:id/status", () => {
    return HttpResponse.json({
      success: true,
      data: { ...reservations[0], status: "CONFIRMED" },
    });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  postedBody = undefined;
});
afterAll(() => server.close());

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ReservationsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ReservationsPage", () => {
  it("lists reservations for the day with actions", async () => {
    renderPage();

    expect(await screen.findByText("Ahmed Samy")).toBeInTheDocument();
    expect(screen.getByText("Table 5")).toBeInTheDocument();
    expect(screen.getByText("PENDING")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Confirm" }),
    ).toBeInTheDocument();
  });

  it("creates a reservation through the modal", async () => {
    renderPage();
    const user = userEvent.setup();

    await screen.findByText("Ahmed Samy");
    await user.click(
      screen.getByRole("button", { name: "+ New reservation" }),
    );

    await user.type(screen.getByLabelText("Customer name"), "Mona Ali");
    await user.type(screen.getByLabelText("Phone"), "01112345678");
    const partySize = screen.getByLabelText("Party size");
    await user.clear(partySize);
    await user.type(partySize, "2");
    await user.selectOptions(
      screen.getByLabelText("Table", { selector: "select" }),
      "tbl_1",
    );
    await user.type(screen.getByLabelText("Date and time"), "2030-02-01T20:00");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await screen.findByText("Ahmed Samy");
    expect(postedBody).toMatchObject({
      customerName: "Mona Ali",
      phone: "01112345678",
      partySize: 2,
      tableId: "tbl_1",
    });
  });
});
