// @vitest-environment jsdom
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PaymentSuccessModal } from "./PaymentSuccessModal";

function renderModal(
  overrides?: Partial<React.ComponentProps<typeof PaymentSuccessModal>>,
) {
  const onClose = vi.fn();
  const onComplete = vi.fn();
  const props = {
    open: true,
    orderNumber: 1024,
    amount: 480,
    onClose,
    onComplete,
    isCompleting: false,
    error: null,
    ...overrides,
  };
  const result = render(<PaymentSuccessModal {...props} />);

  const dialogs = document.querySelectorAll('[role="dialog"]');
  return { ...result, dialog: dialogs[dialogs.length - 1] as HTMLElement, onClose, onComplete };
}

describe("PaymentSuccessModal", () => {
  it("shows success feedback with order number and paid amount", () => {
    const { dialog } = renderModal();

    expect(dialog.textContent).toContain("✓");
    expect(dialog.textContent).toContain("Payment successful");
    expect(dialog.textContent).toContain("#1024");
    expect(dialog.textContent).toContain("480 EGP");
  });

  it("completes the order from the success state", async () => {
    const user = userEvent.setup();
    const { dialog, onComplete } = renderModal();

    await user.click(
      Array.from(dialog.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Complete Order"),
      ) as HTMLButtonElement,
    );

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("closes without completing", async () => {
    const user = userEvent.setup();
    const { dialog, onClose, onComplete } = renderModal();

    await user.click(
      Array.from(dialog.querySelectorAll("button")).find((b) =>
        b.textContent?.trim() === "Close",
      ) as HTMLButtonElement,
    );

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("disables buttons and shows loading while completing", () => {
    const { dialog } = renderModal({ isCompleting: true });

    const buttons = Array.from(dialog.querySelectorAll("button"));
    const complete = buttons.find((b) =>
      b.textContent?.includes("Complete Order"),
    ) as HTMLButtonElement;
    const close = buttons.find(
      (b) => b.textContent?.trim() === "Close",
    ) as HTMLButtonElement;

    expect(complete).toBeDisabled();
    expect(close).toBeDisabled();
  });

  it("renders completion error message", () => {
    const { dialog } = renderModal({
      error: "This order must be paid before it can be completed.",
    });

    expect(dialog.textContent).toContain(
      "This order must be paid before it can be completed.",
    );
  });

  it("does not render when closed", () => {
    const { container } = renderModal({ open: false });

    expect(container.innerHTML).toBe("");
  });
});
