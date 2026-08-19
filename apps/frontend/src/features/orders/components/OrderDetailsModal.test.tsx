// @vitest-environment jsdom
import { render, within, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OrderDetailsModal } from "./OrderDetailsModal";
import type { Order } from "../orders.types";

const mockOrder: Order = {
  id: "ord_1",
  orderNumber: 1024,
  tableId: "tbl_1",
  tableNumber: 5,
  status: "PREPARING",
  paymentStatus: "PENDING",
  totalAmount: 290,
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

function renderModal(overrides?: { order?: Order | null; role?: string; isUpdating?: boolean }) {
  const onClose = vi.fn();
  const onStatusUpdate = vi.fn();
  const onPayOrder = vi.fn();
  act(() => {
    render(
      <OrderDetailsModal
        open={true}
        order={overrides?.order ?? mockOrder}
        role={(overrides?.role ?? "KITCHEN") as "KITCHEN"}
        onClose={onClose}
        onStatusUpdate={onStatusUpdate}
        onPayOrder={onPayOrder}
        isUpdating={overrides?.isUpdating ?? false}
      />,
    );
  });
  const dialogs = document.querySelectorAll('[role="dialog"]');
  const dialog = dialogs[dialogs.length - 1] as HTMLElement;
  return { dialog, onClose, onStatusUpdate, onPayOrder };
}

describe("OrderDetailsModal", () => {
  it("renders order number and table", () => {
    const { dialog } = renderModal();

    expect(within(dialog).getByText("Order #1024")).toBeInTheDocument();
    expect(within(dialog).getByText(/Table 5/)).toBeInTheDocument();
  });

  it("renders all order items", () => {
    const { dialog } = renderModal();

    expect(within(dialog).getByText("Burger")).toBeInTheDocument();
    expect(within(dialog).getByText("Fries")).toBeInTheDocument();
    expect(within(dialog).getByText("Drink")).toBeInTheDocument();
  });

  it("renders item quantities and prices", () => {
    const { dialog } = renderModal();

    const quantities = within(dialog).getAllByText(/^x\d+$/);
    expect(quantities.length).toBeGreaterThanOrEqual(1);
    expect(within(dialog).getByText("EGP 200")).toBeInTheDocument();
    expect(within(dialog).getByText("EGP 50")).toBeInTheDocument();
    expect(within(dialog).getByText("EGP 40")).toBeInTheDocument();
  });

  it("renders total amount", () => {
    const { dialog } = renderModal();

    const totals = within(dialog).getAllByText("EGP 290");
    expect(totals.length).toBeGreaterThanOrEqual(1);
  });

  it("renders status badge", () => {
    const { dialog } = renderModal();

    expect(within(dialog).getByText("PREPARING")).toBeInTheDocument();
  });

  it("shows Mark as Ready button for KITCHEN role on PREPARING order", () => {
    const { dialog } = renderModal({ role: "KITCHEN" });

    expect(within(dialog).getByText("Mark as Ready")).toBeInTheDocument();
  });

  it("shows Cancel Order button for OWNER role on PREPARING order", () => {
    const { dialog } = renderModal({ role: "OWNER" });

    expect(within(dialog).getByText("Mark as Ready")).toBeInTheDocument();
    expect(within(dialog).getByText("Cancel Order")).toBeInTheDocument();
  });

  it("shows Start Preparing button for MANAGER role on CONFIRMED order", () => {
    const { dialog } = renderModal({
      role: "MANAGER",
      order: { ...mockOrder, status: "CONFIRMED" },
    });

    expect(within(dialog).getByText("Start Preparing")).toBeInTheDocument();
    expect(within(dialog).getByText("Cancel Order")).toBeInTheDocument();
  });

  it("shows no action buttons for CASHIER role", () => {
    const { dialog } = renderModal({ role: "CASHIER" });

    expect(within(dialog).queryByRole("button", { name: /Mark/ })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: /Cancel/ })).not.toBeInTheDocument();
  });

  it("shows Mark as Served button for WAITER on READY order", () => {
    const { dialog } = renderModal({
      role: "WAITER",
      order: { ...mockOrder, status: "READY" },
    });

    expect(within(dialog).getByText("Mark as Served")).toBeInTheDocument();
  });

  it("shows no action buttons for WAITER on PREPARING order", () => {
    const { dialog } = renderModal({ role: "WAITER" });

    expect(within(dialog).queryByRole("button", { name: /Mark/ })).not.toBeInTheDocument();
  });

  it("calls onStatusUpdate when action button is clicked", async () => {
    const { dialog, onStatusUpdate } = renderModal({ role: "KITCHEN" });
    const user = userEvent.setup();

    await user.click(within(dialog).getByText("Mark as Ready"));

    expect(onStatusUpdate).toHaveBeenCalledWith("ord_1", "READY");
  });

  it("disables action buttons when isUpdating", () => {
    const { dialog } = renderModal({ role: "KITCHEN", isUpdating: true });

    const actionButtons = within(dialog).getAllByRole("button");
    const actionButton = actionButtons.find(
      (btn) => btn.closest(".order-details__actions") !== null,
    );
    expect(actionButton).toBeDefined();
    expect(actionButton).toBeDisabled();
  });

  it("does not render when order is null", () => {
    const { container } = render(
      <OrderDetailsModal
        open={true}
        order={null}
        role="KITCHEN"
        onClose={vi.fn()}
        onStatusUpdate={vi.fn()}
        onPayOrder={vi.fn()}
        isUpdating={false}
      />,
    );

    expect(container.innerHTML).toBe("");
  });

  it("renders payment status badge", () => {
    const { dialog } = renderModal();

    expect(within(dialog).getByText("Unpaid")).toBeInTheDocument();
  });

  it("renders Paid badge when payment is completed", () => {
    const { dialog } = renderModal({
      order: { ...mockOrder, paymentStatus: "PAID" },
    });

    expect(within(dialog).getByText("Paid")).toBeInTheDocument();
  });

  it("renders Refunded badge when payment is voided", () => {
    const { dialog } = renderModal({
      order: { ...mockOrder, paymentStatus: "VOIDED" },
    });

    expect(within(dialog).getByText("Refunded")).toBeInTheDocument();
  });

  it("shows Pay Order button for OWNER on READY unpaid order", () => {
    const { dialog } = renderModal({
      role: "OWNER",
      order: { ...mockOrder, status: "READY", paymentStatus: "PENDING" },
    });

    expect(within(dialog).getByText("Pay Order")).toBeInTheDocument();
  });

  it("shows Pay Order button for MANAGER on READY unpaid order", () => {
    const { dialog } = renderModal({
      role: "MANAGER",
      order: { ...mockOrder, status: "READY", paymentStatus: "PENDING" },
    });

    expect(within(dialog).getByText("Pay Order")).toBeInTheDocument();
  });

  it("shows Pay Order button for CASHIER on READY unpaid order", () => {
    const { dialog } = renderModal({
      role: "CASHIER",
      order: { ...mockOrder, status: "READY", paymentStatus: "PENDING" },
    });

    expect(within(dialog).getByText("Pay Order")).toBeInTheDocument();
  });

  it("shows Pay Order button for CASHIER on SERVED unpaid order", () => {
    const { dialog } = renderModal({
      role: "CASHIER",
      order: { ...mockOrder, status: "SERVED", paymentStatus: "PENDING" },
    });

    expect(within(dialog).getByText("Pay Order")).toBeInTheDocument();
  });

  it("does NOT show Pay Order for WAITER on READY order", () => {
    const { dialog } = renderModal({
      role: "WAITER",
      order: { ...mockOrder, status: "READY", paymentStatus: "PENDING" },
    });

    expect(within(dialog).queryByText("Pay Order")).not.toBeInTheDocument();
  });

  it("does NOT show Pay Order for KITCHEN on READY order", () => {
    const { dialog } = renderModal({
      role: "KITCHEN",
      order: { ...mockOrder, status: "READY", paymentStatus: "PENDING" },
    });

    expect(within(dialog).queryByText("Pay Order")).not.toBeInTheDocument();
  });

  it("does NOT show Pay Order when order is already paid", () => {
    const { dialog } = renderModal({
      role: "OWNER",
      order: { ...mockOrder, status: "READY", paymentStatus: "PAID" },
    });

    expect(within(dialog).queryByText("Pay Order")).not.toBeInTheDocument();
  });

  it("does NOT show Pay Order when order is in PREPARING status", () => {
    const { dialog } = renderModal({
      role: "OWNER",
      order: { ...mockOrder, status: "PREPARING", paymentStatus: "PENDING" },
    });

    expect(within(dialog).queryByText("Pay Order")).not.toBeInTheDocument();
  });

  it("calls onPayOrder when Pay Order button is clicked", async () => {
    const { dialog, onPayOrder } = renderModal({
      role: "OWNER",
      order: { ...mockOrder, status: "READY", paymentStatus: "PENDING" },
    });
    const user = userEvent.setup();

    await user.click(within(dialog).getByText("Pay Order"));

    expect(onPayOrder).toHaveBeenCalledWith("ord_1");
  });

  it("renders subtotal row", () => {
    const { dialog } = renderModal();

    expect(within(dialog).getByText("Subtotal")).toBeInTheDocument();
    expect(within(dialog).getByText("Total")).toBeInTheDocument();
  });
});
