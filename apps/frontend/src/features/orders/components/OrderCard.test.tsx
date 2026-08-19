// @vitest-environment jsdom
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OrderCard } from "./OrderCard";
import type { Order } from "../orders.types";

const mockOrder: Order = {
  id: "ord_1",
  orderNumber: 1024,
  tableId: "tbl_1",
  tableNumber: 5,
  status: "PREPARING",
  paymentStatus: "PENDING",
  totalAmount: 450,
  cancelledAt: null,
  cancelledReason: null,
  createdAt: "2025-01-15T12:35:00Z",
  updatedAt: "2025-01-15T12:35:00Z",
  items: [
    { id: "i1", productId: "p1", productName: "Burger", quantity: 2, unitPrice: 100, totalPrice: 200 },
    { id: "i2", productId: "p2", productName: "Fries", quantity: 1, unitPrice: 50, totalPrice: 50 },
    { id: "i3", productId: "p3", productName: "Drink", quantity: 2, unitPrice: 20, totalPrice: 40 },
  ],
};

function renderCard(overrides?: { order?: Order; onClick?: (order: Order) => void }) {
  const onClick = overrides?.onClick ?? vi.fn();
  const result = render(<OrderCard order={overrides?.order ?? mockOrder} onClick={onClick} />);
  const card = result.container.querySelector(".order-card") as HTMLElement;
  return { ...result, card, onClick };
}

describe("OrderCard", () => {
  it("renders order number and table", () => {
    const { card } = renderCard();

    expect(card.querySelector(".order-card__number")).toHaveTextContent("#1024");
    expect(card.querySelector(".order-card__table")).toHaveTextContent("Table 5");
  });

  it("renders items count", () => {
    const { card } = renderCard();

    expect(card.querySelector(".order-card__items")).toHaveTextContent("3 items");
  });

  it("renders total amount in EGP", () => {
    const { card } = renderCard();

    expect(card.querySelector(".order-card__total")).toHaveTextContent("EGP 450");
  });

  it("renders status badge", () => {
    const { card } = renderCard();

    expect(card.querySelector(".badge")).toHaveTextContent("PREPARING");
  });

  it("renders created time", () => {
    const { card } = renderCard();

    expect(card.querySelector(".order-card__time")?.textContent).toContain("Created");
  });

  it("shows singular item count for 1 item", () => {
    const singleItemOrder = { ...mockOrder, items: [mockOrder.items[0]] };
    const { card } = renderCard({ order: singleItemOrder });

    expect(card.querySelector(".order-card__items")).toHaveTextContent("1 item");
  });

  it("calls onClick when clicked", async () => {
    const { card, onClick } = renderCard();
    const user = userEvent.setup();

    await user.click(card);

    expect(onClick).toHaveBeenCalledWith(mockOrder);
  });

  it("calls onClick on Enter key", async () => {
    const { card, onClick } = renderCard();
    const user = userEvent.setup();

    card.focus();
    await user.keyboard("{Enter}");

    expect(onClick).toHaveBeenCalledWith(mockOrder);
  });
});
