// @vitest-environment jsdom
import { render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OrderHistoryRow } from "./OrderHistoryRow";
import type { OrderHistoryItem } from "../orders.types";

const mockOrder: OrderHistoryItem = {
  id: "ord_1",
  orderNumber: 1024,
  table: { number: 12 },
  status: "COMPLETED",
  totalAmount: 390,
  createdAt: "2025-08-20T10:20:00Z",
  payment: { status: "PAID", method: "CASH" },
};

function renderRow(overrides?: { order?: OrderHistoryItem }) {
  const onClick = vi.fn();

  const result = render(
    <table>
      <tbody>
        <OrderHistoryRow
          order={overrides?.order ?? mockOrder}
          onClick={onClick}
        />
      </tbody>
    </table>,
  );

  const row = result.container.querySelector("tr") as HTMLElement;
  return { ...result, row, onClick };
}

describe("OrderHistoryRow", () => {
  it("renders order number", () => {
    const { row } = renderRow();

    expect(within(row).getByText("#1024")).toBeInTheDocument();
  });

  it("renders table number", () => {
    const { row } = renderRow();

    expect(within(row).getByText("12")).toBeInTheDocument();
  });

  it("renders total amount", () => {
    const { row } = renderRow();

    expect(within(row).getByText("EGP 390")).toBeInTheDocument();
  });

  it("renders status badge", () => {
    const { row } = renderRow();

    expect(within(row).getByText("COMPLETED")).toBeInTheDocument();
  });

  it("renders formatted date", () => {
    const { row } = renderRow();

    const dateCell = within(row).getAllByText(/Aug/);
    expect(dateCell.length).toBeGreaterThanOrEqual(1);
  });

  it("calls onClick when clicked", async () => {
    const { row, onClick } = renderRow();
    const user = userEvent.setup();

    await user.click(row);

    expect(onClick).toHaveBeenCalledWith(mockOrder);
  });

  it("calls onClick on Enter key", async () => {
    const { row, onClick } = renderRow();
    const user = userEvent.setup();

    row.focus();
    await user.keyboard("{Enter}");

    expect(onClick).toHaveBeenCalledWith(mockOrder);
  });

  it("has correct aria-label", () => {
    const { row } = renderRow();

    expect(row).toHaveAttribute(
      "aria-label",
      "Order #1024, Table 12",
    );
  });
});
