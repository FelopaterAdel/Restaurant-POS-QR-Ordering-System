// @vitest-environment jsdom
import { render, within, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CompleteConfirmationModal } from "./CompleteConfirmationModal";

function renderModal(
  overrides?: Partial<React.ComponentProps<typeof CompleteConfirmationModal>>,
) {
  const onClose = vi.fn();
  const onConfirm = vi.fn();
  const defaultProps = {
    open: true,
    orderNumber: 1024,
    tableNumber: 12,
    onClose,
    onConfirm,
    isProcessing: false,
    error: null,
    ...overrides,
  };

  act(() => {
    render(<CompleteConfirmationModal {...defaultProps} />);
  });

  const dialogs = document.querySelectorAll('[role="dialog"]');
  const dialog = dialogs[dialogs.length - 1] as HTMLElement;
  return { dialog, onClose, onConfirm };
}

function getConfirmButton(dialog: HTMLElement) {
  const buttons = within(dialog).getAllByRole("button");
  return buttons.find(
    (b) => b.textContent?.includes("Complete Order") || b.textContent?.includes("Loading"),
  ) as HTMLButtonElement;
}

describe("CompleteConfirmationModal", () => {
  it("renders modal title", () => {
    const { dialog } = renderModal();

    expect(within(dialog).getByRole("heading", { name: "Complete Order" })).toBeInTheDocument();
  });

  it("renders order number", () => {
    const { dialog } = renderModal();

    expect(within(dialog).getByText("#1024")).toBeInTheDocument();
  });

  it("renders table number", () => {
    const { dialog } = renderModal();

    expect(within(dialog).getByText("12")).toBeInTheDocument();
  });

  it("renders payment status as PAID", () => {
    const { dialog } = renderModal();

    expect(within(dialog).getByText("PAID ✓")).toBeInTheDocument();
  });

  it("renders confirmation message", () => {
    const { dialog } = renderModal();

    expect(within(dialog).getByText("Complete this order?")).toBeInTheDocument();
  });

  it("calls onConfirm when Complete Order button is clicked", async () => {
    const { dialog, onConfirm } = renderModal();
    const user = userEvent.setup();

    await user.click(getConfirmButton(dialog));

    expect(onConfirm).toHaveBeenCalled();
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
      error: "This order must be paid before it can be completed.",
    });

    expect(
      within(dialog).getByText("This order must be paid before it can be completed."),
    ).toBeInTheDocument();
  });

  it("renders Cancel and Complete Order buttons", () => {
    const { dialog } = renderModal();

    expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(getConfirmButton(dialog)).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    const { container } = render(
      <CompleteConfirmationModal
        open={false}
        orderNumber={1024}
        tableNumber={12}
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
