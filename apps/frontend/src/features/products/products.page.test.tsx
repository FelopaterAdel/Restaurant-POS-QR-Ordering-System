// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ProductsPage from "./products.page";
import type { Product } from "./products.types";
import type { Category } from "@/features/categories/categories.types";

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
    description: null,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

const mockProducts: Product[] = [
  {
    id: "p1",
    categoryId: "c1",
    name: "Classic Burger",
    description: "Beef patty",
    price: 150,
    imageUrl: null,
    isAvailable: true,
    isDeleted: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

const handlers = [
  http.get("*/api/v1/categories", () =>
    HttpResponse.json({ success: true, data: mockCategories }),
  ),
  http.get("*/api/v1/products", () =>
    HttpResponse.json({ success: true, data: mockProducts }),
  ),
  http.post("*/api/v1/products", async ({ request }) => {
    const body = (await request.json()) as Partial<Product>;
    return HttpResponse.json({
      success: true,
      data: { id: "p_new", ...body },
    });
  }),
  http.patch("*/api/v1/products/:id", async ({ request, params }) => {
    const body = (await request.json()) as Partial<Product>;
    const existing = mockProducts.find((p) => p.id === params.id)!;
    return HttpResponse.json({ success: true, data: { ...existing, ...body } });
  }),
  http.delete("*/api/v1/products/:id", ({ params }) => {
    const existing = mockProducts.find((p) => p.id === params.id)!;
    return HttpResponse.json({
      success: true,
      data: { ...existing, isAvailable: false },
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

describe("ProductsPage", () => {
  it("renders products with category name", async () => {
    render(<ProductsPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("Classic Burger")).toBeInTheDocument();
      expect(screen.getByText("Burgers")).toBeInTheDocument();
    });
  });

  it("opens create product modal and submits", async () => {
    render(<ProductsPage />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("Classic Burger"));
    await userEvent.click(screen.getByRole("button", { name: /add product/i }));
    const name = await screen.findByLabelText("Product name");
    await userEvent.type(name, "Fries");
    const price = screen.getByLabelText("Price");
    await userEvent.type(price, "45");
    await userEvent.click(screen.getByRole("button", { name: /create/i }));
    await waitFor(() => {
      expect(screen.queryByText("Create product")).not.toBeInTheDocument();
    });
  });
});
