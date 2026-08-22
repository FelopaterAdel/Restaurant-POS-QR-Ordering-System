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
  restaurant: {
    name: "Test Restaurant",
    logoUrl: "https://example.com/logo.png",
  },
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
          imageUrl: "https://example.com/margherita.jpg",
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

const mockOrderResult = {
  id: "ord_1",
  orderNumber: 1024,
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
      quantity: 1,
      unitPrice: 150,
      totalPrice: 150,
    },
  ],
};

const handlers = [
  http.get("*/api/v1/public/tables/:qrCode/menu", () => {
    return HttpResponse.json({ success: true, data: mockMenu });
  }),
  http.post("*/api/v1/public/orders", () => {
    return HttpResponse.json({ success: true, data: mockOrderResult });
  }),
];

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => {
  server.resetHandlers();
  window.sessionStorage.clear();
});
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

async function goToReview(container: HTMLElement) {
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

  return user;
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

  it("renders the menu with restaurant branding", async () => {
    const { container } = renderMenuPage();

    await waitFor(() => {
      expect(container.querySelector(".menu-page__title")).toBeInTheDocument();
    });

    expect(container.querySelector(".menu-page__title")?.textContent).toBe(
      "Test Restaurant",
    );
    expect(container.querySelector(".menu-page__subtitle")?.textContent).toBe(
      "Menu",
    );
    const logo = container.querySelector<HTMLImageElement>(
      ".menu-page__logo",
    );
    expect(logo).toBeInTheDocument();
    expect(logo?.src).toBe("https://example.com/logo.png");
    expect(container.querySelector(".menu-page__table")?.textContent).toBe(
      "Table 5",
    );
  });

  it("falls back to plain title when no restaurant branding exists", async () => {
    server.use(
      http.get("*/api/v1/public/tables/:qrCode/menu", () => {
        return HttpResponse.json({
          success: true,
          data: { ...mockMenu, restaurant: null },
        });
      }),
    );

    const { container } = renderMenuPage();

    await waitFor(() => {
      expect(container.querySelector(".menu-page__title")).toBeInTheDocument();
    });

    expect(container.querySelector(".menu-page__title")?.textContent).toBe(
      "Menu",
    );
    expect(container.querySelector(".menu-page__subtitle")).toBeNull();
    expect(container.querySelector(".menu-page__logo")).toBeNull();
  });

  it("shows empty state when the menu has no categories", async () => {
    server.use(
      http.get("*/api/v1/public/tables/:qrCode/menu", () => {
        return HttpResponse.json({
          success: true,
          data: { ...mockMenu, categories: [] },
        });
      }),
    );

    const { container } = renderMenuPage();

    await waitFor(() => {
      expect(container.querySelector(".menu-page__empty")).toBeInTheDocument();
    });

    expect(
      container.querySelector(".menu-page__empty-title")?.textContent,
    ).toBe("No menu available yet");
    expect(container.querySelector(".category-tabs")).toBeNull();
  });

  it("renders category tabs and products", async () => {
    const { container } = renderMenuPage();

    await waitFor(() => {
      expect(container.querySelector(".category-tabs")).toBeInTheDocument();
    });

    const tabs = container.querySelectorAll(".category-tabs__tab");
    expect(tabs.length).toBe(2);
    expect(tabs[0].textContent).toBe("Pizza");
    expect(tabs[1].textContent).toBe("Drinks");

    const products = container.querySelectorAll(".product-card");
    expect(products.length).toBe(2);
  });

  it("renders product images with fallback for missing images", async () => {
    const { container } = renderMenuPage();

    await waitFor(() => {
      expect(container.querySelector(".product-card")).toBeInTheDocument();
    });

    const image = container.querySelector<HTMLImageElement>(
      ".product-card__image img",
    );
    expect(image).toBeInTheDocument();
    expect(image?.src).toBe("https://example.com/margherita.jpg");

    const fallbacks = container.querySelectorAll(
      ".product-card__image-fallback",
    );
    expect(fallbacks.length).toBe(1);
    expect(fallbacks[0].textContent).toBe("P");
  });

  it("formats prices in EGP", async () => {
    const { container } = renderMenuPage();

    await waitFor(() => {
      expect(container.querySelector(".product-card")).toBeInTheDocument();
    });

    const prices = Array.from(
      container.querySelectorAll(".product-card__price"),
    ).map((el) => el.textContent);
    expect(prices).toContain("EGP 150");
    expect(prices).toContain("EGP 200");

    const user = userEvent.setup();
    await user.click(
      container.querySelector(".product-card .button--primary") as HTMLElement,
    );

    await waitFor(() => {
      expect(
        container.querySelector(".cart__total-amount")?.textContent,
      ).toContain("EGP");
    });
  });

  it("preserves the cart for the same table across remounts", async () => {
    const first = renderMenuPage();

    await waitFor(() => {
      expect(first.container.querySelector(".product-card")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(
      first.container.querySelector(
        ".product-card .button--primary",
      ) as HTMLElement,
    );

    await waitFor(() => {
      expect(first.container.querySelector(".cart")).toBeInTheDocument();
    });

    first.unmount();

    const second = renderMenuPage();

    await waitFor(() => {
      expect(
        second.container.querySelector(".cart"),
      ).toBeInTheDocument();
    });

    expect(second.container.textContent).toContain("Margherita");
    second.unmount();
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
    expect(addTexts).toContain("+ Add");
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
    ).toBe("#1024");
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
    const user = await goToReview(container);

    await user.click(
      container.querySelector(".order-review__confirm-btn") as HTMLElement,
    );

    await waitFor(() => {
      expect(container.querySelector(".order-review__error")).toBeInTheDocument();
    });

    expect(
      container.querySelector(".order-review__error")?.textContent,
    ).toBe(
      "This table is currently unavailable. Please ask a staff member for assistance.",
    );
    expect(
      window.sessionStorage.getItem("restaurant-pos:cart:tbl_test123"),
    ).not.toBeNull();
  });

  it("shows error when the table is not found during submission", async () => {
    server.use(
      http.post("*/api/v1/public/orders", () => {
        return HttpResponse.json(
          {
            success: false,
            error: {
              code: "TABLE_NOT_FOUND",
              message: "Table not found",
            },
          },
          { status: 404 },
        );
      }),
    );

    const { container } = renderMenuPage();
    const user = await goToReview(container);

    await user.click(
      container.querySelector(".order-review__confirm-btn") as HTMLElement,
    );

    await waitFor(() => {
      expect(container.querySelector(".order-review__error")).toBeInTheDocument();
    });

    expect(
      container.querySelector(".order-review__error")?.textContent,
    ).toBe(
      "We couldn't find your table. Please scan the QR code on your table again.",
    );
  });

  it("shows error and keeps cart when products are unavailable", async () => {
    server.use(
      http.post("*/api/v1/public/orders", () => {
        return HttpResponse.json(
          {
            success: false,
            error: {
              code: "PRODUCT_UNAVAILABLE",
              message: "Product is unavailable",
            },
          },
          { status: 400 },
        );
      }),
    );

    const { container } = renderMenuPage();
    const user = await goToReview(container);

    await user.click(
      container.querySelector(".order-review__confirm-btn") as HTMLElement,
    );

    await waitFor(() => {
      expect(container.querySelector(".order-review__error")).toBeInTheDocument();
    });

    expect(
      container.querySelector(".order-review__error")?.textContent,
    ).toBe(
      "Some items are no longer available. Please go back and update your order.",
    );
    expect(
      window.sessionStorage.getItem("restaurant-pos:cart:tbl_test123"),
    ).not.toBeNull();
  });

  it("sends only tableId and items to the create order API", async () => {
    let requestBody: unknown;
    server.use(
      http.post("*/api/v1/public/orders", async ({ request }) => {
        requestBody = await request.json();
        return HttpResponse.json({ success: true, data: mockOrderResult });
      }),
    );

    const { container } = renderMenuPage();
    const user = await goToReview(container);

    await user.click(
      container.querySelector(".order-review__confirm-btn") as HTMLElement,
    );

    await waitFor(() => {
      expect(container.querySelector(".order-success")).toBeInTheDocument();
    });

    expect(requestBody).toEqual({
      tableId: "tbl_1",
      items: [{ productId: "prod_1", quantity: 1 }],
    });
  });

  it("disables confirm button and prevents double submit while creating the order", async () => {
    let callCount = 0;
    let releaseOrder: (() => void) | undefined;
    server.use(
      http.post("*/api/v1/public/orders", async () => {
        callCount += 1;
        await new Promise<void>((resolve) => {
          releaseOrder = resolve;
        });
        return HttpResponse.json({ success: true, data: mockOrderResult });
      }),
    );

    const { container } = renderMenuPage();
    const user = await goToReview(container);

    const confirmBtn = container.querySelector(
      ".order-review__confirm-btn",
    ) as HTMLButtonElement;

    await user.click(confirmBtn);

    await waitFor(() => {
      expect(confirmBtn).toBeDisabled();
      expect(confirmBtn.textContent).toBe("Placing Order…");
    });

    await user.click(confirmBtn).catch(() => {});

    releaseOrder?.();

    await waitFor(() => {
      expect(container.querySelector(".order-success")).toBeInTheDocument();
    });

    expect(callCount).toBe(1);
  });

  it("clears the cart only after success and shows backend totals", async () => {
    const { container } = renderMenuPage();
    const user = await goToReview(container);

    expect(
      window.sessionStorage.getItem("restaurant-pos:cart:tbl_test123"),
    ).not.toBeNull();

    await user.click(
      container.querySelector(".order-review__confirm-btn") as HTMLElement,
    );

    await waitFor(() => {
      expect(container.querySelector(".order-success")).toBeInTheDocument();
    });

    const detailValues = Array.from(
      container.querySelectorAll(".order-success__detail-value"),
    ).map((el) => el.textContent);
    expect(detailValues[0]).toBe("#1024");
    expect(detailValues[1]).toBe("5");
    expect(detailValues[2]).toBe("EGP 390");

    expect(
      window.sessionStorage.getItem("restaurant-pos:cart:tbl_test123"),
    ).toBeNull();
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
