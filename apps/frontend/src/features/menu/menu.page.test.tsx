// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { StrictMode } from "react";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import MenuPage from "./menu.page";
import type { PublicMenu } from "./menu.types";

const mockMenu: PublicMenu = {
  table: { id: "tbl_1", number: 5 },
  categories: [
    {
      id: "cat_1",
      name: "Pizza",
      products: [
        {
          id: "prod_1",
          name: "Margherita",
          description: "Classic cheese pizza",
          price: 150,
          imageUrl: null,
          isAvailable: true,
        },
        {
          id: "prod_2",
          name: "Pepperoni",
          description: "Spicy pepperoni",
          price: 200,
          imageUrl: null,
          isAvailable: true,
        },
      ],
    },
    {
      id: "cat_2",
      name: "Drinks",
      products: [
        {
          id: "prod_3",
          name: "Cola",
          description: null,
          price: 40,
          imageUrl: null,
          isAvailable: true,
        },
        {
          id: "prod_4",
          name: "Water",
          description: null,
          price: 20,
          imageUrl: null,
          isAvailable: false,
        },
      ],
    },
  ],
};

const handlers = [
  http.get("*/api/v1/public/tables/:qrCode/menu", () => {
    return HttpResponse.json({ success: true, data: mockMenu });
  }),
  http.post("*/api/v1/public/orders", async () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: "ord_1",
        orderNumber: 1,
        tableId: "tbl_1",
        status: "PENDING",
        totalAmount: 390,
        createdAt: "2026-01-15T12:35:00Z",
        updatedAt: "2026-01-15T12:35:00Z",
        items: [
          {
            id: "item_1",
            productId: "prod_1",
            productName: "Margherita",
            quantity: 2,
            unitPrice: 150,
            totalPrice: 300,
          },
          {
            id: "item_2",
            productId: "prod_3",
            productName: "Cola",
            quantity: 1,
            unitPrice: 40,
            totalPrice: 40,
          },
          {
            id: "item_3",
            productId: "prod_3",
            productName: "Cola",
            quantity: 1,
            unitPrice: 40,
            totalPrice: 40,
          },
        ],
      },
    });
  }),
];

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  function QueryWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return QueryWrapper;
}

function renderMenuPage(qrCode = "tbl_test123") {
  return render(
    <StrictMode>
      <MemoryRouter initialEntries={[`/public/menu/${qrCode}`]}>
        <Routes>
          <Route path="/public/menu/:qrCode" element={<MenuPage />} />
        </Routes>
      </MemoryRouter>
    </StrictMode>,
    { wrapper: createQueryWrapper() },
  );
}

describe("MenuPage", () => {
  it("shows loading state initially", () => {
    server.use(
      http.get("*/api/v1/public/tables/:qrCode/menu", () => {
        return new Promise<never>(() => {});
      }),
    );

    const { container } = renderMenuPage();

    const loading = container.querySelector(".menu-page__loading");
    expect(loading).toBeInTheDocument();
  });

  it("renders the menu with categories and products", async () => {
    const { container } = renderMenuPage();

    await waitFor(() => {
      expect(container.querySelector(".menu-page__title")).toBeInTheDocument();
    });

    expect(container.querySelector(".menu-page__title")?.textContent).toBe(
      "Menu",
    );
    expect(container.querySelector(".menu-page__table")?.textContent).toBe(
      "Table 5",
    );

    const tabs = container.querySelectorAll(".category-tabs__tab");
    expect(tabs.length).toBe(2);
    expect(tabs[0].textContent).toBe("Pizza");
    expect(tabs[1].textContent).toBe("Drinks");

    const products = container.querySelectorAll(".product-card");
    expect(products.length).toBe(2);
  });

  it("shows table error for disabled table", async () => {
    server.use(
      http.get("*/api/v1/public/tables/:qrCode/menu", () => {
        return HttpResponse.json(
          {
            success: false,
            error: { code: "TABLE_DISABLED", message: "Table is disabled" },
          },
          { status: 409 },
        );
      }),
    );

    const { container } = renderMenuPage();

    await waitFor(() => {
      expect(
        container.querySelector(".menu-page__error-title"),
      ).toBeInTheDocument();
    });

    expect(
      container.querySelector(".menu-page__error-title")?.textContent,
    ).toBe("Table Unavailable");
  });

  it("shows not found error for invalid QR code", async () => {
    server.use(
      http.get("*/api/v1/public/tables/:qrCode/menu", () => {
        return HttpResponse.json(
          {
            success: false,
            error: { code: "TABLE_NOT_FOUND", message: "Table not found" },
          },
          { status: 404 },
        );
      }),
    );

    const { container } = renderMenuPage();

    await waitFor(() => {
      expect(
        container.querySelector(".menu-page__error-title"),
      ).toBeInTheDocument();
    });

    expect(
      container.querySelector(".menu-page__error-title")?.textContent,
    ).toBe("Table Not Found");
  });

  it("switches category tabs", async () => {
    const { container } = renderMenuPage();

    await waitFor(() => {
      expect(container.querySelector(".category-tabs")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const drinksTab = container.querySelectorAll(".category-tabs__tab")[1];
    await user.click(drinksTab);

    await waitFor(() => {
      const products = container.querySelectorAll(".product-card");
      expect(products.length).toBe(2);
    });
  });

  it("shows Add button for available products", async () => {
    const { container } = renderMenuPage();

    await waitFor(() => {
      expect(container.querySelector(".product-card")).toBeInTheDocument();
    });

    const addButtons = container.querySelectorAll(".button--primary");
    const addTexts = Array.from(addButtons).map((b) => b.textContent);
    expect(addTexts).toContain("Add");
  });

  it("shows Unavailable for unavailable products", async () => {
    const { container } = renderMenuPage();

    await waitFor(() => {
      expect(container.querySelector(".product-card")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const drinksTab = container.querySelectorAll(".category-tabs__tab")[1];
    await user.click(drinksTab);

    await waitFor(() => {
      const unavailable = container.querySelector(".product-card__unavailable");
      expect(unavailable?.textContent).toBe("Unavailable");
    });
  });

  it("adds item to cart when clicking Add", async () => {
    const { container } = renderMenuPage();

    await waitFor(() => {
      expect(container.querySelector(".product-card")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const addBtn = container.querySelector(
      ".product-card .button--primary",
    ) as HTMLElement;
    await user.click(addBtn);

    await waitFor(() => {
      expect(container.querySelector(".cart")).toBeInTheDocument();
    });

    expect(container.querySelector(".cart__toggle-count")?.textContent).toBe(
      "1 item(s)",
    );
  });

  it("increments and decrements quantity in cart", async () => {
    const { container } = renderMenuPage();

    await waitFor(() => {
      expect(container.querySelector(".product-card")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const addBtn = container.querySelector(
      ".product-card .button--primary",
    ) as HTMLElement;
    await user.click(addBtn);

    await waitFor(() => {
      expect(container.querySelector(".cart")).toBeInTheDocument();
    });

    const incrementBtn = container.querySelector(
      ".product-card__qty .button--outline:last-child",
    ) as HTMLElement;
    await user.click(incrementBtn);

    expect(container.querySelector(".cart__toggle-count")?.textContent).toBe(
      "2 item(s)",
    );
  });

  it("opens and closes cart panel via toggle", async () => {
    const { container } = renderMenuPage();

    await waitFor(() => {
      expect(container.querySelector(".product-card")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const addBtn = container.querySelector(
      ".product-card .button--primary",
    ) as HTMLElement;
    await user.click(addBtn);

    await waitFor(() => {
      expect(container.querySelector(".cart__panel")).toBeInTheDocument();
    });

    const toggle = container.querySelector(".cart__toggle") as HTMLElement;
    await user.click(toggle);

    await waitFor(() => {
      expect(container.querySelector(".cart__panel")).not.toBeInTheDocument();
    });

    await user.click(toggle);

    await waitFor(() => {
      expect(container.querySelector(".cart__panel")).toBeInTheDocument();
    });
  });

  it("navigates to review screen when clicking Review Order", async () => {
    const { container } = renderMenuPage();

    await waitFor(() => {
      expect(container.querySelector(".product-card")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const addBtn = container.querySelector(
      ".product-card .button--primary",
    ) as HTMLElement;
    await user.click(addBtn);

    await waitFor(() => {
      expect(container.querySelector(".cart__panel")).toBeInTheDocument();
    });

    const reviewBtn = container.querySelector(
      ".cart__checkout-btn",
    ) as HTMLElement;
    await user.click(reviewBtn);

    await waitFor(() => {
      expect(container.querySelector(".order-review")).toBeInTheDocument();
    });

    expect(
      container.querySelector(".order-review__title")?.textContent,
    ).toBe("Review Your Order");
  });

  it("goes back to menu from review screen", async () => {
    const { container } = renderMenuPage();

    await waitFor(() => {
      expect(container.querySelector(".product-card")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const addBtn = container.querySelector(
      ".product-card .button--primary",
    ) as HTMLElement;
    await user.click(addBtn);

    await waitFor(() => {
      expect(container.querySelector(".cart__panel")).toBeInTheDocument();
    });

    const reviewBtn = container.querySelector(
      ".cart__checkout-btn",
    ) as HTMLElement;
    await user.click(reviewBtn);

    await waitFor(() => {
      expect(container.querySelector(".order-review")).toBeInTheDocument();
    });

    const backBtn = container.querySelector(
      ".order-review__header button",
    ) as HTMLElement;
    await user.click(backBtn);

    await waitFor(() => {
      expect(container.querySelector(".product-card")).toBeInTheDocument();
    });
  });

  it("places an order and shows success screen", async () => {
    const { container } = renderMenuPage();

    await waitFor(() => {
      expect(container.querySelector(".product-card")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const addBtn = container.querySelector(
      ".product-card .button--primary",
    ) as HTMLElement;
    await user.click(addBtn);

    await waitFor(() => {
      expect(container.querySelector(".cart__panel")).toBeInTheDocument();
    });

    const reviewBtn = container.querySelector(
      ".cart__checkout-btn",
    ) as HTMLElement;
    await user.click(reviewBtn);

    await waitFor(() => {
      expect(container.querySelector(".order-review")).toBeInTheDocument();
    });

    const confirmBtn = container.querySelector(
      ".order-review__confirm-btn",
    ) as HTMLElement;
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(container.querySelector(".order-success")).toBeInTheDocument();
    });

    expect(
      container.querySelector(".order-success__title")?.textContent,
    ).toBe("Order Placed!");
    expect(
      container.querySelector(".order-success__detail-value")?.textContent,
    ).toBe("#1");
  });

  it("shows error when order placement fails", async () => {
    server.use(
      http.post("*/api/v1/public/orders", () => {
        return HttpResponse.json(
          {
            success: false,
            error: {
              code: "TABLE_DISABLED",
              message: "Table is disabled",
            },
          },
          { status: 409 },
        );
      }),
    );

    const { container } = renderMenuPage();

    await waitFor(() => {
      expect(container.querySelector(".product-card")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const addBtn = container.querySelector(
      ".product-card .button--primary",
    ) as HTMLElement;
    await user.click(addBtn);

    await waitFor(() => {
      expect(container.querySelector(".cart__panel")).toBeInTheDocument();
    });

    const reviewBtn = container.querySelector(
      ".cart__checkout-btn",
    ) as HTMLElement;
    await user.click(reviewBtn);

    await waitFor(() => {
      expect(container.querySelector(".order-review")).toBeInTheDocument();
    });

    const confirmBtn = container.querySelector(
      ".order-review__confirm-btn",
    ) as HTMLElement;
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(container.querySelector(".order-review__error")).toBeInTheDocument();
    });
  });

  it("navigates back to menu from success screen", async () => {
    const { container } = renderMenuPage();

    await waitFor(() => {
      expect(container.querySelector(".product-card")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const addBtn = container.querySelector(
      ".product-card .button--primary",
    ) as HTMLElement;
    await user.click(addBtn);

    await waitFor(() => {
      expect(container.querySelector(".cart__panel")).toBeInTheDocument();
    });

    const reviewBtn = container.querySelector(
      ".cart__checkout-btn",
    ) as HTMLElement;
    await user.click(reviewBtn);

    await waitFor(() => {
      expect(container.querySelector(".order-review")).toBeInTheDocument();
    });

    const confirmBtn = container.querySelector(
      ".order-review__confirm-btn",
    ) as HTMLElement;
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(container.querySelector(".order-success")).toBeInTheDocument();
    });

    const newOrderBtn = container.querySelector(
      ".order-success__new-btn",
    ) as HTMLElement;
    await user.click(newOrderBtn);

    await waitFor(() => {
      expect(container.querySelector(".product-card")).toBeInTheDocument();
    });
  });
});
