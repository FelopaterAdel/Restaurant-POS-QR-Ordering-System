// @vitest-environment jsdom
import { render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OrderFilters, queueFilterToStatus } from "./OrderFilters";

describe("OrderFilters", () => {
  it("renders all filter buttons", () => {
    const onChange = vi.fn();
    const { container } = render(<OrderFilters active="all" onChange={onChange} />);
    const group = container.querySelector('[role="group"]') as HTMLElement;

    expect(within(group).getByText("All")).toBeInTheDocument();
    expect(within(group).getByText("Pending")).toBeInTheDocument();
    expect(within(group).getByText("Confirmed")).toBeInTheDocument();
    expect(within(group).getByText("Preparing")).toBeInTheDocument();
    expect(within(group).getByText("Ready")).toBeInTheDocument();
  });

  it("marks the active filter", () => {
    const onChange = vi.fn();
    const { container } = render(<OrderFilters active="PREPARING" onChange={onChange} />);
    const group = container.querySelector('[role="group"]') as HTMLElement;

    const preparingBtn = within(group).getByText("Preparing");
    expect(preparingBtn).toHaveAttribute("aria-pressed", "true");

    const allBtn = within(group).getByText("All");
    expect(allBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onChange when a filter is clicked", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<OrderFilters active="all" onChange={onChange} />);
    const group = container.querySelector('[role="group"]') as HTMLElement;

    await user.click(within(group).getByText("Pending"));

    expect(onChange).toHaveBeenCalledWith("PENDING");
  });

  it("calls onChange with all when All is clicked", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<OrderFilters active="PENDING" onChange={onChange} />);
    const group = container.querySelector('[role="group"]') as HTMLElement;

    await user.click(within(group).getByText("All"));

    expect(onChange).toHaveBeenCalledWith("all");
  });
});

describe("queueFilterToStatus", () => {
  it("returns undefined for all", () => {
    expect(queueFilterToStatus("all")).toBeUndefined();
  });

  it("returns the matching OrderStatus for specific filters", () => {
    expect(queueFilterToStatus("PENDING")).toBe("PENDING");
    expect(queueFilterToStatus("CONFIRMED")).toBe("CONFIRMED");
    expect(queueFilterToStatus("PREPARING")).toBe("PREPARING");
    expect(queueFilterToStatus("READY")).toBe("READY");
  });
});
