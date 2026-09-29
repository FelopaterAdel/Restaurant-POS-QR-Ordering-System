// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import AnalyticsPage from "./analytics.page";

const topProducts = [
  { productId: "p1", productName: "Margherita", quantity: 12, revenue: 1800 },
  { productId: "p2", productName: "Cola", quantity: 5, revenue: 250 },
];

const revenue = [
  { key: "2026-09-20", amount: 150, orders: 2 },
  { key: "2026-09-21", amount: 0, orders: 0 },
];

const stock = {
  totalActive: 3,
  lowCount: 1,
  outOfStockCount: 0,
  lowStock: [
    {
      id: "ing_1",
      name: "Flour",
      unit: "kg",
      quantityInStock: 5,
      lowStockThreshold: 10,
    },
  ],
};

const server = setupServer(
  http.get("*/api/v1/dashboard/top-products", () => {
    return HttpResponse.json({ success: true, data: topProducts });
  }),
  http.get("*/api/v1/dashboard/revenue", () => {
    return HttpResponse.json({ success: true, data: revenue });
  }),
  http.get("*/api/v1/dashboard/stock", () => {
    return HttpResponse.json({ success: true, data: stock });
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
      <MemoryRouter>
        <AnalyticsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("AnalyticsPage", () => {
  it("renders revenue, top products and stock sections", async () => {
    renderPage();

    expect(await screen.findByText("Margherita")).toBeInTheDocument();
    expect(screen.getByText("Cola")).toBeInTheDocument();
    expect(screen.getByText("Flour (kg)")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Manage inventory" }),
    ).toHaveAttribute("href", "/inventory");
  });

  it("switches revenue granularity", async () => {
    let granularity: string | null = null;
    server.use(
      http.get("*/api/v1/dashboard/revenue", ({ request }) => {
        granularity = new URL(request.url).searchParams.get("granularity");
        return HttpResponse.json({ success: true, data: revenue });
      }),
    );
    renderPage();
    const user = userEvent.setup();

    await screen.findByText("Margherita");
    await user.click(screen.getByRole("button", { name: "Weekly" }));

    await screen.findByText("Margherita");
    expect(granularity).toBe("week");
  });
});
