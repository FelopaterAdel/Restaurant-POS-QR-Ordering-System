// @vitest-environment jsdom
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Order } from "@/features/orders/orders.types";
import type { StatusAction } from "@/features/orders/orders.role-config";
import { ReadyOrderCard } from "./ReadyOrderCard";

const mockOrder: Order = {
  id: "ord_1",
  orderNumber: 1024,
  tableId: "tbl_1",
  tableNumber: 12,
  status: "READY",
  paymentStatus: "PENDING",
  totalAmount: 450,
  cancelledAt: null,
  cancelledReason: null,
  createdAt: "2025-01-15T12:35:00Z",
  updatedAt: "2025-01-15T12:40:00Z",
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

const servedAction: StatusAction = {
  label: "Mark Served",
  nextStatus: "SERVED",
  variant: "primary",
};

function renderCard(overrides?: {
  order?: Order;
  onMarkServed?: (order: Order, action: StatusAction) => void;
  isUpdating?: boolean;
}) {
  const onMarkServed = overrides?.onMarkServed ?? vi.fn();
  const result = render(
    <ReadyOrderCard
      order={overrides?.order ?? mockOrder}
      onMarkServed={onMarkServed}
      isUpdating={overrides?.isUpdating}
    />,
  );
  const card = result.container.querySelector(".ready-card") as HTMLElement;
  return { ...result, card, onMarkServed };
}

describe("ReadyOrderCard", () => {
  it("renders order number and table", () => {
    const { card } = renderCard();

    expect(card.querySelector(".ready-card__number")).toHaveTextContent(
      "#1024",
    );
    expect(card.querySelector(".ready-card__table")).toHaveTextContent(
      "Table 12",
    );
  });

  it("renders each item with its quantity", () => {
    const { card } = renderCard();

    const items = card.querySelectorAll(".ready-card__item");
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toContain("Burger");
    expect(items[0].querySelector(".ready-card__item-qty")).toHaveTextContent(
      "×2",
    );
    expect(items[1].textContent).toContain("Fries");
    expect(items[1].querySelector(".ready-card__item-qty")).toHaveTextContent(
      "×1",
    );
  });

  it("renders the READY badge and created time", () => {
    const { card } = renderCard();

    expect(card.querySelector(".badge")).toHaveTextContent("READY");
    expect(card.querySelector(".ready-card__time")?.textContent).toContain(
      "Created",
    );
  });

  it("does not render financial details", () => {
    const { card } = renderCard();

    expect(card.textContent).not.toContain("EGP");
    expect(card.textContent).not.toContain("450");
  });

  it("shows Mark Served for READY orders", () => {
    const { card } = renderCard();

    const btn = card.querySelector(".ready-card__action-btn");
    expect(btn?.textContent).toBe("Mark Served");
  });

  it("calls onMarkServed with the order and the SERVED action", async () => {
    const onMarkServed = vi.fn();
    const { card } = renderCard({ onMarkServed });
    const user = userEvent.setup();

    await user.click(
      card.querySelector(".ready-card__action-btn") as HTMLElement,
    );

    expect(onMarkServed).toHaveBeenCalledTimes(1);
    expect(onMarkServed.mock.calls[0][0]).toEqual(mockOrder);
    expect(onMarkServed.mock.calls[0][1]).toEqual(servedAction);
  });

  it("disables the action button while updating", () => {
    const { card } = renderCard({ isUpdating: true });

    const btn = card.querySelector(".ready-card__action-btn") as HTMLElement;
    expect(btn).toBeDisabled();
  });

  it("never renders pay, complete or cancel actions", () => {
    for (const status of [
      "READY",
      "PENDING",
      "CONFIRMED",
      "PREPARING",
      "SERVED",
    ] as const) {
      const { card } = renderCard({ order: { ...mockOrder, status } });
      const labels = Array.from(
        card.querySelectorAll(".ready-card__action-btn"),
      ).map((btn) => btn.textContent);

      if (status !== "READY") {
        expect(labels).toHaveLength(0);
        continue;
      }
      for (const label of labels) {
        expect(label).toBe("Mark Served");
      }
    }
  });
});
