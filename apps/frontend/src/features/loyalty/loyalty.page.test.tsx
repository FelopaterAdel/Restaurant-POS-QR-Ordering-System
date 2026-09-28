// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import LoyaltyPage from "./loyalty.page";

const balance = {
  phone: "01012345678",
  balance: 120,
  lifetimePoints: 600,
  tier: "Silver",
};

const server = setupServer(
  http.get("*/api/v1/public/loyalty", ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get("phone") === "01012345678") {
      return HttpResponse.json({ success: true, data: balance });
    }
    return HttpResponse.json(
      {
        success: false,
        error: {
          code: "LOYALTY_ACCOUNT_NOT_FOUND",
          message: "No loyalty account found",
        },
      },
      { status: 404 },
    );
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());

function renderPage() {
  return render(
    <MemoryRouter>
      <LoyaltyPage />
    </MemoryRouter>,
  );
}

describe("LoyaltyPage", () => {
  it("shows balance and tier for a known phone number", async () => {
    renderPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Phone number"), "01012345678");
    await user.click(screen.getByRole("button", { name: "Check balance" }));

    expect(await screen.findByText("Silver")).toBeInTheDocument();
    expect(screen.getByText("120 points")).toBeInTheDocument();
    expect(screen.getByText(/600 lifetime points/)).toBeInTheDocument();
  });

  it("shows a friendly message for an unknown phone number", async () => {
    renderPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Phone number"), "01999999999");
    await user.click(screen.getByRole("button", { name: "Check balance" }));

    expect(
      await screen.findByText("No loyalty points found for this number yet."),
    ).toBeInTheDocument();
  });
});
