// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import UsersPage from "./users.page";
import type { Staff } from "./users.types";

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

const staff: Staff[] = [
  {
    id: "user_1",
    name: "Active Andy",
    email: "andy@restaurant.com",
    role: "CASHIER",
    status: "ACTIVE",
    lastLoginAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "user_2",
    name: "Deleted Dana",
    email: "dana@restaurant.com",
    role: "WAITER",
    status: "INACTIVE",
    lastLoginAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

const server = setupServer(
  http.get("*/api/v1/users", () => {
    return HttpResponse.json({ success: true, data: staff });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <UsersPage />
    </QueryClientProvider>,
  );
}

describe("UsersPage", () => {
  it("hides deactivated staff by default", async () => {
    renderPage();

    expect(await screen.findByText("Active Andy")).toBeInTheDocument();
    expect(screen.queryByText("Deleted Dana")).not.toBeInTheDocument();
  });

  it("shows deactivated staff when the toggle is on", async () => {
    renderPage();
    const user = userEvent.setup();

    await screen.findByText("Active Andy");
    await user.click(screen.getByLabelText("Show deactivated"));

    expect(await screen.findByText("Deleted Dana")).toBeInTheDocument();
  });
});
