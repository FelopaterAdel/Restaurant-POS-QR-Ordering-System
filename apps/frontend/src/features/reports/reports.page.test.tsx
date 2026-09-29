// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ReportsPage from "./reports.page";

const report = {
  id: "rep_1",
  date: "2026-09-27",
  provider: "anthropic",
  model: "model-x",
  summary: "Strong Friday with 40 orders.",
  recommendations: ["Add Friday staff", "Restock buns"],
  createdAt: "2026-09-28T06:00:00.000Z",
};

const server = setupServer(
  http.get("*/api/v1/reports/latest", () => {
    return HttpResponse.json({ success: true, data: report });
  }),
  http.get("*/api/v1/reports", () => {
    return HttpResponse.json({ success: true, data: [report] });
  }),
  http.post("*/api/v1/reports/generate", () => {
    return HttpResponse.json({ success: true, data: report }, { status: 201 });
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
        <ReportsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ReportsPage", () => {
  it("renders the latest report with recommendations and history", async () => {
    renderPage();

    expect(await screen.findByText("Report for 2026-09-27")).toBeInTheDocument();
    expect(
      screen.getByText("Strong Friday with 40 orders."),
    ).toBeInTheDocument();
    expect(screen.getByText("Add Friday staff")).toBeInTheDocument();
    expect(screen.getByText("2 recommendations")).toBeInTheDocument();
  });

  it("shows a friendly error when AI generation is not configured", async () => {
    server.use(
      http.post("*/api/v1/reports/generate", () => {
        return HttpResponse.json(
          {
            success: false,
            error: {
              code: "AI_PROVIDER_NOT_CONFIGURED",
              message: "AI report generation is not configured",
            },
          },
          { status: 400 },
        );
      }),
    );
    renderPage();
    const user = userEvent.setup();

    await screen.findByText("Report for 2026-09-27");
    await user.click(
      screen.getByRole("button", { name: "Generate report" }),
    );

    expect(
      await screen.findByText(/ANTHROPIC_API_KEY/),
    ).toBeInTheDocument();
  });
});
