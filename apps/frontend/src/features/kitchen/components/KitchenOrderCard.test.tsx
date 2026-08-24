// @vitest-environment jsdom
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Order } from "@/features/orders/orders.types";
import type { StatusAction } from "@/features/orders/orders.role-config";
import { KitchenOrderCard } from "./KitchenOrderCard";

const mockOrder: Order = {
  id: "ord_1",
  orderNumber: 1024,
  tableId: "tbl_1",
  tableNumber: 12,
  status: "CONFIRMED",
  paymentStatus: "PENDING",
  totalAmount: 450,
  cancelledAt: null,
  cancelledReason: null,
  createdAt: "2025-01-15T12:35:00Z",
  updatedAt: "2025-01-15T12:35:00Z",
  items: [
    {
      id: "i1",
      productId: "p1",
      productName: "Burger",
      quantity: 2,
      unitPrice: 100,
      totalPrice: 200,
    },
    {
      id: "i2",
      productId: "p2",
      productName: "Fries",
      quantity: 1,
      unitPrice: 50,
      totalPrice: 50,
    },
  ],
};

function renderCard(overrides?: {
  order?: Order;
  onNextAction?: (order: Order, action: StatusAction) => void;
  isUpdating?: boolean;
}) {
  const onNextAction = overrides?.onNextAction ?? vi.fn();
  const result = render(
    <KitchenOrderCard
      order={overrides?.order ?? mockOrder}
      onNextAction={onNextAction}
      isUpdating={overrides?.isUpdating}
    />,
  );
  const card = result.container.querySelector(".kitchen-card") as HTMLElement;
  return { ...result, card, onNextAction };
}

describe("KitchenOrderCard", () => {
  it("renders order number and table", () => {
    const { card } = renderCard();

    expect(card.querySelector(".kitchen-card__number")).toHaveTextContent(
      "#1024",
    );
    expect(card.querySelector(".kitchen-card__table")).toHaveTextContent(
      "Table 12",
    );
  });

  it("renders each item with its quantity", () => {
    const { card } = renderCard();

    const items = card.querySelectorAll(".kitchen-card__item");
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toContain("Burger");
    expect(items[0].querySelector(".kitchen-card__item-qty")).toHaveTextContent(
      "×2",
    );
    expect(items[1].textContent).toContain("Fries");
    expect(items[1].querySelector(".kitchen-card__item-qty")).toHaveTextContent(
      "×1",
    );
  });

  it("renders the current status badge", () => {
    const { card } = renderCard();

    expect(card.querySelector(".badge")).toHaveTextContent("CONFIRMED");
  });

  it("renders the created time", () => {
    const { card } = renderCard();

    expect(card.querySelector(".kitchen-card__time")?.textContent).toContain(
      "Created",
    );
  });

  it("does not render financial details", () => {
    const { card } = renderCard();

    expect(card.textContent).not.toContain("EGP");
    expect(card.querySelector(".kitchen-card__total")).toBeNull();
  });

  it("shows Start Preparing for CONFIRMED orders", () => {
    const { card } = renderCard();

    const btn = card.querySelector(".kitchen-card__action-btn");
    expect(btn?.textContent).toBe("Start Preparing");
  });

  it("shows Mark Ready for PREPARING orders", () => {
    const { card } = renderCard({
      order: { ...mockOrder, status: "PREPARING" },
    });

    const btn = card.querySelector(".kitchen-card__action-btn");
    expect(btn?.textContent).toBe("Mark Ready");
  });

  it("shows no action button for READY orders", () => {
    const { card } = renderCard({ order: { ...mockOrder, status: "READY" } });

    expect(card.querySelector(".kitchen-card__action-btn")).toBeNull();
    expect(card.className).toContain("kitchen-card--done");
  });

  it("calls onNextAction with the order and next action", async () => {
    const onNextAction = vi.fn();
    const { card } = renderCard({ onNextAction });
    const user = userEvent.setup();

    await user.click(
      card.querySelector(".kitchen-card__action-btn") as HTMLElement,
    );

    expect(onNextAction).toHaveBeenCalledTimes(1);
    expect(onNextAction.mock.calls[0][0]).toEqual(mockOrder);
    expect(onNextAction.mock.calls[0][1]).toEqual({
      label: "Start Preparing",
      nextStatus: "PREPARING",
      variant: "primary",
    });
  });

  it("disables the action button while updating", () => {
    const { card } = renderCard({ isUpdating: true });

    const btn = card.querySelector(".kitchen-card__action-btn") as HTMLElement;
    expect(btn).toBeDisabled();
  });

  it("never renders payment, complete or cancel actions", () => {
    for (const status of [
      "CONFIRMED",
      "PREPARING",
      "READY",
      "PENDING",
    ] as const) {
      const { card } = renderCard({ order: { ...mockOrder, status } });
      const labels = Array.from(
        card.querySelectorAll(".kitchen-card__action-btn"),
      ).map((btn) => btn.textContent);

      for (const label of labels) {
        expect(label).not.toContain("Pay");
        expect(label).not.toContain("Complete");
        expect(label).not.toContain("Cancel");
      }
    }
  });
});
