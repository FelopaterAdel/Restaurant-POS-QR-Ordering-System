// @vitest-environment jsdom
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PayableOrderCard } from "./PayableOrderCard";

describe("PayableOrderCard", () => {
  function renderCard(overrides?: Partial<React.ComponentProps<typeof PayableOrderCard>>) {
    const onPay = vi.fn();
    const props = {
      orderNumber: 1024,
      tableNumber: 12,
      status: "READY" as const,
      totalAmount: 480,
      itemCount: 3,
      onPay,
      ...overrides,
    };
    const { container } = render(<PayableOrderCard {...props} />);
    return { container, onPay };
  }

  it("renders order number, padded table number, items, total, and status", () => {
    const { container } = renderCard();

    expect(container.textContent).toContain("Order #1024");
    expect(container.textContent).toContain("Table 12");
    expect(container.textContent).toContain("3 items");
    expect(container.textContent).toContain("Total: 480 EGP");
    expect(container.textContent).toContain("Status:");
    expect(container.querySelector(".badge")?.textContent).toBe("READY");
  });

  it("pads single-digit table numbers", () => {
    const { container } = renderCard({ tableNumber: 8 });

    expect(container.textContent).toContain("Table 08");
  });

  it("hides item count when unknown (search results)", () => {
    const { container } = renderCard({ itemCount: null });

    expect(container.textContent).not.toContain("items");
  });

  it("calls onPay when the Pay button is clicked", async () => {
    const user = userEvent.setup();
    const { container, onPay } = renderCard();

    const payButton = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Pay",
    );
    expect(payButton).toBeDefined();
    await user.click(payButton as HTMLButtonElement);

    expect(onPay).toHaveBeenCalledTimes(1);
  });
});
