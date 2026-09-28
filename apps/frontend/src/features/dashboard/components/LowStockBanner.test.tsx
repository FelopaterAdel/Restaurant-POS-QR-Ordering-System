// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { LowStockBanner } from "./LowStockBanner";

const lowIngredient = {
  id: "ing_1",
  name: "Flour",
  unit: "kg",
  quantityInStock: 5,
  lowStockThreshold: 10,
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderBanner() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LowStockBanner />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("LowStockBanner", () => {
  it("renders nothing when nothing is low on stock", async () => {
    server.use(
      http.get("*/api/v1/ingredients/low-stock", () => {
        return HttpResponse.json({ success: true, data: [] });
      }),
    );

    const { container } = renderBanner();

    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
    expect(container).toBeEmptyDOMElement();
  });

  it("shows low-stock ingredients with a link to inventory", async () => {
    server.use(
      http.get("*/api/v1/ingredients/low-stock", () => {
        return HttpResponse.json({ success: true, data: [lowIngredient] });
      }),
    );

    renderBanner();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Low stock (1 ingredient)");
    expect(alert).toHaveTextContent("Flour");
    expect(screen.getByRole("link", { name: "Review inventory" })).toHaveAttribute(
      "href",
      "/inventory",
    );
  });
});
