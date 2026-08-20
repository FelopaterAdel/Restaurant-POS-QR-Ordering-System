// @vitest-environment jsdom
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OrderCard } from "./OrderCard";
import type { Order } from "../orders.types";
import type { StatusAction } from "../orders.role-config";

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

const mockAction: StatusAction = {
  label: "Mark Ready",
  nextStatus: "READY",
  variant: "primary",
};

function renderCard(overrides?: {
  order?: Order;
  onClick?: (order: Order) => void;
  actions?: StatusAction[];
  onAction?: (order: Order, action: StatusAction) => void;
  isUpdating?: boolean;
}) {
  const onClick = overrides?.onClick ?? vi.fn();
  const onAction = overrides?.onAction ?? vi.fn();
  const result = render(
    <OrderCard
      order={overrides?.order ?? mockOrder}
      onClick={onClick}
      actions={overrides?.actions}
      onAction={overrides?.actions ? onAction : undefined}
      isUpdating={overrides?.isUpdating}
    />,
  );
  const card = result.container.querySelector(".order-card") as HTMLElement;
  return { ...result, card, onClick, onAction };
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

  describe("action buttons", () => {
    it("renders action bar when actions are provided", () => {
      const { card } = renderCard({ actions: [mockAction] });

      expect(card.querySelector(".order-card__action-bar")).toBeInTheDocument();
      expect(card.querySelector(".order-card__action-btn")).toBeInTheDocument();
    });

    it("does not render action bar when no actions", () => {
      const { card } = renderCard();

      expect(card.querySelector(".order-card__action-bar")).not.toBeInTheDocument();
    });

    it("renders action label with checkmark for primary variant", () => {
      const { card } = renderCard({ actions: [mockAction] });

      const btn = card.querySelector(".order-card__action-btn");
      expect(btn?.textContent).toContain("✓");
      expect(btn?.textContent).toContain("Mark Ready");
    });

    it("does not render checkmark for danger variant", () => {
      const dangerAction: StatusAction = {
        label: "Cancel Order",
        nextStatus: "CANCELLED",
        variant: "danger",
      };
      const { card } = renderCard({ actions: [dangerAction] });

      const btn = card.querySelector(".order-card__action-btn");
      expect(btn?.textContent).toContain("Cancel Order");
      expect(btn?.textContent).not.toContain("✓");
    });

    it("calls onAction when action button is clicked", async () => {
      const { card, onAction } = renderCard({ actions: [mockAction] });
      const user = userEvent.setup();

      const btn = card.querySelector(".order-card__action-btn") as HTMLElement;
      await user.click(btn);

      expect(onAction).toHaveBeenCalledWith(mockOrder, mockAction);
    });

    it("does not call onClick when action button is clicked", async () => {
      const { card, onClick } = renderCard({ actions: [mockAction] });
      const user = userEvent.setup();

      const btn = card.querySelector(".order-card__action-btn") as HTMLElement;
      await user.click(btn);

      expect(onClick).not.toHaveBeenCalled();
    });

    it("disables action button when isUpdating", () => {
      const { card } = renderCard({
        actions: [mockAction],
        isUpdating: true,
      });

      const btn = card.querySelector(".order-card__action-btn") as HTMLElement;
      expect(btn).toBeDisabled();
    });

    it("renders multiple action buttons", () => {
      const actions: StatusAction[] = [
        { label: "Mark Ready", nextStatus: "READY", variant: "primary" },
        { label: "Cancel Order", nextStatus: "CANCELLED", variant: "danger" },
      ];
      const { card } = renderCard({ actions });

      const btns = card.querySelectorAll(".order-card__action-btn");
      expect(btns).toHaveLength(2);
    });
  });
});
