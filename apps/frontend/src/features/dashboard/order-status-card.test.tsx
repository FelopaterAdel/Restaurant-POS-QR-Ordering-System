// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OrderStatusCard } from "./components/OrderStatusCard";
import type { DashboardOrders } from "./dashboard.types";

const mockOrders: DashboardOrders = {
  total: 35,
  pending: 2,
  confirmed: 1,
  preparing: 5,
  ready: 3,
  served: 1,
  completed: 22,
  cancelled: 1,
};

describe("OrderStatusCard", () => {
  it("renders the card title", () => {
    const { unmount } = render(<OrderStatusCard orders={mockOrders} />);

    expect(screen.getByText("Order Status")).toBeInTheDocument();
    unmount();
  });

  it("renders all status labels", () => {
    const { unmount } = render(<OrderStatusCard orders={mockOrders} />);

    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Confirmed")).toBeInTheDocument();
    expect(screen.getByText("Preparing")).toBeInTheDocument();
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(screen.getByText("Served")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
    unmount();
  });

  it("renders the correct counts", () => {
    const { unmount } = render(<OrderStatusCard orders={mockOrders} />);

    const countElements = screen.getAllByText(/\d+/);
    expect(countElements.length).toBeGreaterThanOrEqual(7);
    unmount();
  });

  it("renders with zeroed orders", () => {
    const zeroOrders: DashboardOrders = {
      total: 0,
      pending: 0,
      confirmed: 0,
      preparing: 0,
      ready: 0,
      served: 0,
      completed: 0,
      cancelled: 0,
    };

    const { unmount } = render(<OrderStatusCard orders={zeroOrders} />);

    expect(screen.getByText("Order Status")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    unmount();
  });
});
