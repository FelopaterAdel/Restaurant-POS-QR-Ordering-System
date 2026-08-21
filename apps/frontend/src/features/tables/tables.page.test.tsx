// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { StrictMode } from "react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Table } from "./tables.types";
import TablesPage from "./tables.page";

const { mockUseAuth } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
}));

vi.mock("@/features/auth/use-auth", () => ({
  useAuth: mockUseAuth,
}));

function setAuthUser(role: string) {
  mockUseAuth.mockReturnValue({
    user: { id: "u1", name: "Test User", email: "user@test.com", role },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  });
}

const mockTables: Table[] = [
  {
    id: "t1",
    number: 1,
    name: "Main Hall",
    qrCode: "qr-1",
    status: "AVAILABLE",
    menuUrl: "http://localhost:3000/menu/table/qr-1",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "t2",
    number: 2,
    name: "Patio",
    qrCode: "qr-2",
    status: "OCCUPIED",
    menuUrl: "http://localhost:3000/menu/table/qr-2",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "t3",
    number: 3,
    name: "VIP Room",
    qrCode: "qr-3",
    status: "DISABLED",
    menuUrl: "http://localhost:3000/menu/table/qr-3",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
];

const handlers = [
  http.get("*/api/v1/tables", () => {
    return HttpResponse.json({ success: true, data: mockTables });
  }),
  http.get("*/api/v1/tables/:tableId/qr", () => {
    const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    return new HttpResponse(png, {
      headers: { "Content-Type": "image/png" },
    });
  }),
];

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  setAuthUser("OWNER");
  Object.defineProperty(URL, "createObjectURL", {
    value: vi.fn(() => "blob:qr-mock"),
    configurable: true,
    writable: true,
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    value: vi.fn(),
    configurable: true,
    writable: true,
  });
});

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

function findButton(container: HTMLElement, text: string): HTMLElement | undefined {
  return Array.from(container.querySelectorAll("button")).find(
    (b) => b.textContent?.trim() === text,
  );
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

    expect(findButton(container, "Add Table")).toBeDefined();
  });

  it("hides management actions from non-manager roles", async () => {
    server.use(
      http.get("*/api/v1/tables", () => {
        return HttpResponse.json({ success: true, data: [mockTables[0]] });
      }),
    );
    setAuthUser("WAITER");

    const { container } = renderTables();

    await waitFor(() => {
      expect(container.querySelector(".table-card__name")).toBeInTheDocument();
    });

    expect(findButton(container, "Add Table")).toBeUndefined();
    expect(findButton(container, "Edit")).toBeUndefined();
    expect(findButton(container, "Disable")).toBeUndefined();
    expect(container.querySelector(".table-card__actions")).toBeNull();
  });

  it("shows Enable and hides QR for a disabled table", async () => {
    server.use(
      http.get("*/api/v1/tables", () => {
        return HttpResponse.json({ success: true, data: [mockTables[2]] });
      }),
    );

    const { container } = renderTables();

    await waitFor(() => {
      expect(container.querySelector(".table-card__name")).toBeInTheDocument();
    });

    expect(findButton(container, "Enable")).toBeDefined();
    expect(findButton(container, "Disable")).toBeUndefined();
    expect(
      container.querySelector('.table-card__qr:not(.table-card__qr--empty)'),
    ).toBeNull();
    expect(
      container.querySelector(".table-card__qr--empty"),
    ).toBeInTheDocument();
  });

  it("calls the enable endpoint when clicking Enable", async () => {
    let enableCalls = 0;

    server.use(
      http.get("*/api/v1/tables", () => {
        return HttpResponse.json({ success: true, data: [mockTables[2]] });
      }),
      http.post("*/api/v1/tables/t3/enable", () => {
        enableCalls++;
        return HttpResponse.json({ success: true, data: mockTables[0] });
      }),
    );

    const { container } = renderTables();

    await waitFor(() => {
      expect(container.querySelector(".table-card__name")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(findButton(container, "Enable") as HTMLElement);

    await waitFor(() => {
      expect(enableCalls).toBe(1);
    });
  });

  it("opens the QR modal and copies the menu URL", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    const { container } = renderTables();

    await waitFor(() => {
      expect(container.querySelector(".table-card__name")).toBeInTheDocument();
    });

    await user.click(
      container.querySelector(
        '[aria-label="Show QR code for Table #1"]',
      ) as HTMLElement,
    );

    await waitFor(() => {
      expect(document.querySelector(".modal__title")?.textContent).toContain(
        "Table #1",
      );
    });

    await waitFor(() => {
      expect(
        document.querySelector(".table-qr-modal__image img"),
      ).toBeInTheDocument();
    });

    expect(
      document.querySelector(".table-qr-modal__url")?.textContent,
    ).toBe("http://localhost:3000/menu/table/qr-1");

    await user.click(findButton(document.body, "Copy URL") as HTMLElement);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        "http://localhost:3000/menu/table/qr-1",
      );
    });
    expect(findButton(document.body, "Copied!")).toBeDefined();
  });

  it("triggers print from the QR modal", async () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});

    const { container } = renderTables();

    await waitFor(() => {
      expect(container.querySelector(".table-card__name")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(
      container.querySelector(
        '[aria-label="Show QR code for Table #1"]',
      ) as HTMLElement,
    );

    await waitFor(() => {
      expect(
        document.querySelector(".table-qr-modal__image img"),
      ).toBeInTheDocument();
    });

    await user.click(findButton(document.body, "Print") as HTMLElement);

    expect(printSpy).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(document.querySelector(".qr-print-sheet")).toBeInTheDocument();
      expect(
        document.querySelector(".qr-print-sheet__url")?.textContent,
      ).toBe("http://localhost:3000/menu/table/qr-1");
    });

    printSpy.mockRestore();
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
    await user.click(findButton(container, "Add Table") as HTMLElement);

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
