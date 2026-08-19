// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { StrictMode } from "react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { Table } from "./tables.types";
import TablesPage from "./tables.page";

vi.mock("@/features/auth/use-auth", () => ({
  useAuth: () => ({
    user: { id: "u1", name: "Test Owner", email: "owner@test.com", role: "OWNER" },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

const mockTables: Table[] = [
  {
    id: "t1",
    number: 1,
    name: "Main Hall",
    qrCode: "qr-1",
    status: "AVAILABLE",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "t2",
    number: 2,
    name: "Patio",
    qrCode: "qr-2",
    status: "OCCUPIED",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "t3",
    number: 3,
    name: "VIP Room",
    qrCode: "qr-3",
    status: "DISABLED",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
];

const handlers = [
  http.get("*/api/v1/tables", () => {
    return HttpResponse.json({ success: true, data: mockTables });
  }),
];

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  function QueryWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return QueryWrapper;
}

function renderTables() {
  const { container } = render(
    <StrictMode>
      <TablesPage />
    </StrictMode>,
    { wrapper: createQueryWrapper() },
  );
  return { container };
}

describe("TablesPage", () => {
  it("renders loading skeleton initially", () => {
    server.use(
      http.get("*/api/v1/tables", () => {
        return new Promise<never>(() => {});
      }),
    );

    const { container } = renderTables();

    const skeleton = container.querySelector('[aria-label="Loading tables"]');
    expect(skeleton).toBeInTheDocument();
  });

  it("renders tables from the API on success", async () => {
    const { container } = renderTables();

    await waitFor(() => {
      expect(container.querySelector(".table-card__name")).toBeInTheDocument();
    });

    const cards = container.querySelectorAll(".table-card__name");
    const names = Array.from(cards).map((el) => el.textContent);
    expect(names).toContain("Main Hall");
    expect(names).toContain("Patio");
    expect(names).toContain("VIP Room");

    const numbers = container.querySelectorAll(".table-card__number");
    expect(numbers.length).toBeGreaterThanOrEqual(3);
  });

  it("shows the Add Table button for OWNER role", async () => {
    const { container } = renderTables();

    await waitFor(() => {
      expect(container.querySelector(".table-card__name")).toBeInTheDocument();
    });

    const buttons = Array.from(container.querySelectorAll("button"));
    const addButton = buttons.find((b) => b.textContent?.includes("Add Table"));
    expect(addButton).toBeDefined();
  });

  it("renders error state when API fails", async () => {
    server.use(
      http.get("*/api/v1/tables", () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    const { container } = renderTables();

    await waitFor(() => {
      const text = container.querySelector(".empty-state__title");
      expect(text?.textContent).toBe("Failed to load tables");
    });
  });

  it("retries the request when clicking Try again", async () => {
    let callCount = 0;

    server.use(
      http.get("*/api/v1/tables", () => {
        callCount++;
        if (callCount === 1) {
          return new HttpResponse(null, { status: 500 });
        }
        return HttpResponse.json({ success: true, data: mockTables });
      }),
    );

    const { container } = renderTables();

    await waitFor(() => {
      const text = container.querySelector(".empty-state__title");
      expect(text?.textContent).toBe("Failed to load tables");
    });

    const user = userEvent.setup();
    const tryAgainBtn = container.querySelector(".empty-state__action button");
    expect(tryAgainBtn).toBeDefined();
    await user.click(tryAgainBtn as HTMLElement);

    await waitFor(() => {
      expect(container.querySelector(".table-card__name")).toBeInTheDocument();
    });

    expect(callCount).toBe(2);
  });

  it("filters tables by status", async () => {
    const { container } = renderTables();

    await waitFor(() => {
      expect(container.querySelector(".table-card__name")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const filters = container.querySelector(".tables-filters") as HTMLElement;
    const availableBtn = within(filters).getByText("Available");
    const occupiedBtn = within(filters).getByText("Occupied");
    const allBtn = within(filters).getByText("All");

    await user.click(availableBtn);

    const namesAfterAvailable = Array.from(
      container.querySelectorAll(".table-card__name"),
    ).map((el) => el.textContent);
    expect(namesAfterAvailable).toContain("Main Hall");
    expect(namesAfterAvailable).not.toContain("Patio");
    expect(namesAfterAvailable).not.toContain("VIP Room");

    await user.click(occupiedBtn);

    const namesAfterOccupied = Array.from(
      container.querySelectorAll(".table-card__name"),
    ).map((el) => el.textContent);
    expect(namesAfterOccupied).not.toContain("Main Hall");
    expect(namesAfterOccupied).toContain("Patio");
    expect(namesAfterOccupied).not.toContain("VIP Room");

    await user.click(allBtn);

    const namesAfterAll = Array.from(
      container.querySelectorAll(".table-card__name"),
    ).map((el) => el.textContent);
    expect(namesAfterAll).toContain("Main Hall");
    expect(namesAfterAll).toContain("Patio");
    expect(namesAfterAll).toContain("VIP Room");
  });

  it("opens Add Table modal when clicking Add Table", async () => {
    const { container } = renderTables();

    await waitFor(() => {
      expect(container.querySelector(".table-card__name")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const buttons = Array.from(container.querySelectorAll("button"));
    const addButton = buttons.find((b) => b.textContent?.includes("Add Table"))!;
    await user.click(addButton);

    await waitFor(() => {
      const createBtns = Array.from(document.querySelectorAll("button")).filter(
        (b) => b.textContent?.includes("Create Table"),
      );
      expect(createBtns.length).toBeGreaterThanOrEqual(1);
    });

    const numberInput = document.querySelector('input[type="number"]');
    expect(numberInput).toBeInTheDocument();
  });

  it("shows empty state when no tables exist", async () => {
    server.use(
      http.get("*/api/v1/tables", () => {
        return HttpResponse.json({ success: true, data: [] });
      }),
    );

    const { container } = renderTables();

    await waitFor(() => {
      const title = container.querySelector(".empty-state__title");
      expect(title?.textContent).toBe("No tables found");
    });

    const desc = container.querySelector(".empty-state__description");
    expect(desc?.textContent).toBe("Get started by adding your first table.");
  });

  it("shows empty state when no tables match filter", async () => {
    server.use(
      http.get("*/api/v1/tables", () => {
        return HttpResponse.json({ success: true, data: [mockTables[0]] });
      }),
    );

    const { container } = renderTables();

    await waitFor(() => {
      expect(container.querySelector(".table-card__name")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const filters = container.querySelector(".tables-filters") as HTMLElement;
    await user.click(within(filters).getByText("Occupied"));

    await waitFor(() => {
      const title = container.querySelector(".empty-state__title");
      expect(title?.textContent).toBe("No tables found");
    });

    const desc = container.querySelector(".empty-state__description");
    expect(desc?.textContent).toBe("No occupied tables.");
  });
});
