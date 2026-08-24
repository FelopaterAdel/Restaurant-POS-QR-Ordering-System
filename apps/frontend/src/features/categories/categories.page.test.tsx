// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import CategoriesPage from "./categories.page";
import type { Category } from "./categories.types";

vi.mock("@/features/auth/use-auth", () => ({
  useAuth: () => ({
    user: { id: "1", name: "Test Owner", role: "OWNER" },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

const mockCategories: Category[] = [
  {
    id: "c1",
    name: "Burgers",
    description: "Beef & chicken",
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "c2",
    name: "Drinks",
    description: null,
    isActive: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

const handlers = [
  http.get("*/api/v1/categories", () => {
    return HttpResponse.json({ success: true, data: mockCategories });
  }),
  http.post("*/api/v1/categories", async ({ request }) => {
    const body = (await request.json()) as { name: string };
    return HttpResponse.json({
      success: true,
      data: { id: "c_new", name: body.name, description: null, isActive: true },
    });
  }),
  http.patch("*/api/v1/categories/:id", async ({ request, params }) => {
    const body = (await request.json()) as Partial<Category>;
    const existing = mockCategories.find((c) => c.id === params.id)!;
    return HttpResponse.json({
      success: true,
      data: { ...existing, ...body },
    });
  }),
  http.delete("*/api/v1/categories/:id", ({ params }) => {
    const existing = mockCategories.find((c) => c.id === params.id)!;
    return HttpResponse.json({
      success: true,
      data: { ...existing, isActive: false },
    });
  }),
];

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };
}

describe("CategoriesPage", () => {
  it("renders loading skeleton then categories list", async () => {
    render(<CategoriesPage />, { wrapper: createWrapper() });
    expect(screen.getByLabelText("Loading categories")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("Burgers")).toBeInTheDocument();
    });
    expect(screen.getByText("Drinks")).toBeInTheDocument();
  });

  it("opens create modal and submits new category", async () => {
    render(<CategoriesPage />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("Burgers"));
    await userEvent.click(screen.getByRole("button", { name: /add category/i }));
    const nameInput = await screen.findByLabelText("Category name");
    await userEvent.type(nameInput, "Sides");
    await userEvent.click(screen.getByRole("button", { name: /create/i }));
    await waitFor(() => {
      expect(screen.queryByText("Create category")).not.toBeInTheDocument();
    });
  });

  it("opens edit modal and saves changes", async () => {
    render(<CategoriesPage />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("Burgers"));
    await userEvent.click(screen.getAllByRole("button", { name: /edit/i })[0]);
    const nameInput = await screen.findByDisplayValue("Burgers");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Beef Burgers");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => {
      expect(screen.queryByText("Edit category")).not.toBeInTheDocument();
    });
  });

  it("toggles category active state via dialog", async () => {
    render(<CategoriesPage />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("Burgers"));
    await userEvent.click(screen.getAllByRole("button", { name: /disable/i })[0]);
    await screen.findByText(/disable this category/i);
    await userEvent.click(screen.getByRole("button", { name: /disable/i }));
    await waitFor(() => {
      expect(screen.queryByText("Disable category")).not.toBeInTheDocument();
    });
  });

  it("shows empty state when no categories", async () => {
    server.use(
      http.get("*/api/v1/categories", () => HttpResponse.json({ success: true, data: [] })),
    );
    render(<CategoriesPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("No categories yet")).toBeInTheDocument();
    });
  });

  it("shows error state on fetch failure", async () => {
    server.use(http.get("*/api/v1/categories", () => new HttpResponse(null, { status: 500 })));
    render(<CategoriesPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("Unable to load categories")).toBeInTheDocument();
    });
  });
});
