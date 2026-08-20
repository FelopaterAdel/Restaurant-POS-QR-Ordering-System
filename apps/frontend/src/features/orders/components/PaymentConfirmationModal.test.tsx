// @vitest-environment jsdom
import { render, within, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PaymentConfirmationModal } from "./PaymentConfirmationModal";
function renderModal(
  overrides?: Partial<React.ComponentProps<typeof PaymentConfirmationModal>>,
) {
  const onClose = vi.fn();
  const onConfirm = vi.fn();
  const defaultProps = {
    open: true,
    orderNumber: 1024,
    totalAmount: 390,
    onClose,
    onConfirm,
    isProcessing: false,
    error: null,
    ...overrides,
  };

  act(() => {
    render(<PaymentConfirmationModal {...defaultProps} />);
  });

  const dialogs = document.querySelectorAll('[role="dialog"]');
  const dialog = dialogs[dialogs.length - 1] as HTMLElement;
  return { dialog, onClose, onConfirm };
}

function getConfirmButton(dialog: HTMLElement) {
  const buttons = within(dialog).getAllByRole("button");
  return buttons.find(
    (b) => b.textContent?.includes("Confirm Payment") || b.textContent?.includes("Loading"),
  ) as HTMLButtonElement;
}

describe("PaymentConfirmationModal", () => {
  it("renders order number and total", () => {
    const { dialog } = renderModal();

    expect(within(dialog).getByText("#1024")).toBeInTheDocument();
    expect(within(dialog).getByText("EGP 390")).toBeInTheDocument();
  });

  it("renders modal title", () => {
    const { dialog } = renderModal();

    expect(within(dialog).getByRole("heading", { name: "Confirm Payment" })).toBeInTheDocument();
  });

  it("renders payment method options", () => {
    const { dialog } = renderModal();

    expect(within(dialog).getByText("Cash")).toBeInTheDocument();
    expect(within(dialog).getByText("Card")).toBeInTheDocument();
  });

  it("defaults to Cash payment method", () => {
    const { dialog } = renderModal();

    const cashRadio = within(dialog).getByDisplayValue("CASH") as HTMLInputElement;
    expect(cashRadio.checked).toBe(true);
  });

  it("allows selecting Card payment method", () => {
    const { dialog } = renderModal();

    const cardLabel = within(dialog).getByText("Card").closest("label")!;
    fireEvent.click(cardLabel);

    expect(cardLabel.className).toContain("payment-confirm__method-option--selected");
  });

  it("calls onConfirm with selected method", async () => {
    const { dialog, onConfirm } = renderModal();
    const user = userEvent.setup();

    const cardRadio = within(dialog).getByDisplayValue("CARD");
    fireEvent.click(cardRadio);

    await user.click(getConfirmButton(dialog));

    expect(onConfirm).toHaveBeenCalledWith("CARD");
  });

  it("defaults to CASH when confirming without changing", async () => {
    const { dialog, onConfirm } = renderModal();
    const user = userEvent.setup();

    await user.click(getConfirmButton(dialog));

    expect(onConfirm).toHaveBeenCalledWith("CASH");
  });

  it("calls onClose when Cancel is clicked", async () => {
    const { dialog, onClose } = renderModal();
    const user = userEvent.setup();

    const cancelBtn = within(dialog).getByRole("button", { name: "Cancel" });
    await user.click(cancelBtn);

    expect(onClose).toHaveBeenCalled();
  });

  it("disables buttons when processing", () => {
    const { dialog } = renderModal({ isProcessing: true });

    const cancelBtn = within(dialog).getByRole("button", { name: "Cancel" });
    const confirmBtn = getConfirmButton(dialog);

    expect(cancelBtn).toBeDisabled();
    expect(confirmBtn).toBeDisabled();
  });

  it("shows spinner when processing", () => {
    const { dialog } = renderModal({ isProcessing: true });

    const confirmBtn = getConfirmButton(dialog);
    expect(confirmBtn).toBeDisabled();
    expect(within(confirmBtn).getByText("Loading…")).toBeInTheDocument();
  });

  it("displays error message", () => {
    const { dialog } = renderModal({
      error: "This order cannot be paid in its current status.",
    });

    expect(
      within(dialog).getByText("This order cannot be paid in its current status."),
    ).toBeInTheDocument();
  });

  it("renders Cancel and Confirm Payment buttons", () => {
    const { dialog } = renderModal();

    expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(getConfirmButton(dialog)).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    const { container } = render(
      <PaymentConfirmationModal
        open={false}
        orderNumber={1024}
        totalAmount={390}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        isProcessing={false}
        error={null}
      />,
    );

    expect(container.innerHTML).toBe("");
  });

  it("prevents closing modal while processing", async () => {
    const { dialog, onClose } = renderModal({ isProcessing: true });
    const user = userEvent.setup();

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(onClose).not.toHaveBeenCalled();
  });
});
