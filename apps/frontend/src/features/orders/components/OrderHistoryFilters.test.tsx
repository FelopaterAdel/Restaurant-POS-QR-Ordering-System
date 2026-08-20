// @vitest-environment jsdom
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OrderHistoryFilters } from "./OrderHistoryFilters";

afterEach(cleanup);

function renderFilters(
  overrides?: Partial<React.ComponentProps<typeof OrderHistoryFilters>>,
) {
  const onStatusChange = vi.fn();
  const onDateChange = vi.fn();
  const onOrderNumberChange = vi.fn();
  const onClear = vi.fn();
  const defaultProps = {
    status: "" as const,
    date: "",
    orderNumber: "",
    onStatusChange,
    onDateChange,
    onOrderNumberChange,
    onClear,
    ...overrides,
  };

  const result = render(<OrderHistoryFilters {...defaultProps} />);
  return { ...result, onStatusChange, onDateChange, onOrderNumberChange, onClear };
}

describe("OrderHistoryFilters", () => {
  it("renders Order #, Status, and Date inputs", () => {
    renderFilters();

    expect(screen.getByLabelText("Order #")).toBeInTheDocument();
    expect(screen.getByLabelText("Status")).toBeInTheDocument();
    expect(screen.getByLabelText("Date")).toBeInTheDocument();
  });

  it("renders all status options including All Statuses", () => {
    renderFilters();

    const select = screen.getByLabelText("Status") as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => o.text);
    expect(options).toContain("All Statuses");
    expect(options).toContain("PENDING");
    expect(options).toContain("COMPLETED");
    expect(options).toContain("CANCELLED");
  });

  it("calls onStatusChange when status changes", async () => {
    const { onStatusChange } = renderFilters();
    const user = userEvent.setup();

    await user.selectOptions(screen.getByLabelText("Status"), "COMPLETED");

    expect(onStatusChange).toHaveBeenCalledWith("COMPLETED");
  });

  it("calls onDateChange when date changes", async () => {
    const { onDateChange } = renderFilters();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Date"), "2025-08-20");

    expect(onDateChange).toHaveBeenCalled();
  });

  it("calls onOrderNumberChange when order number changes", async () => {
    const { onOrderNumberChange } = renderFilters();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Order #"), "1024");

    expect(onOrderNumberChange).toHaveBeenCalled();
  });

  it("shows Clear Filters button when filters are active", () => {
    renderFilters({ status: "COMPLETED" });

    expect(screen.getByRole("button", { name: "Clear Filters" })).toBeInTheDocument();
  });

  it("hides Clear Filters button when no filters are active", () => {
    renderFilters();

    expect(screen.queryByRole("button", { name: "Clear Filters" })).not.toBeInTheDocument();
  });

  it("calls onClear when Clear Filters is clicked", async () => {
    const { onClear } = renderFilters({ date: "2025-08-20" });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Clear Filters" }));

    expect(onClear).toHaveBeenCalled();
  });
});
