// @vitest-environment jsdom
import { render, within, act, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToggleStaffStatusDialog } from "./ToggleStaffStatusDialog";
import type { Staff } from "../users.types";

const mockStaff: Staff = {
  id: "user_1",
  name: "John Doe",
  email: "john@restaurant.com",
  role: "CASHIER",
  status: "ACTIVE",
  lastLoginAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function renderDialog(
  overrides?: Partial<React.ComponentProps<typeof ToggleStaffStatusDialog>>,
) {
  const onClose = vi.fn();
  const onConfirm = vi.fn();

  const defaultProps = {
    open: true,
    staff: mockStaff,
    onClose,
    onConfirm,
    isPending: false,
    ...overrides,
  };

  act(() => {
    render(<ToggleStaffStatusDialog {...defaultProps} />);
  });

  const dialogs = document.querySelectorAll('[role="dialog"]');
  const dialog = dialogs[dialogs.length - 1] as HTMLElement;
  return { dialog, onClose, onConfirm };
}

describe("ToggleStaffStatusDialog", () => {
  afterEach(() => {
    cleanup();
  });

  it("asks for confirmation before suspending an ACTIVE staff member", () => {
    const { dialog } = renderDialog();

    expect(
      within(dialog).getByRole("heading", { name: "Suspend Staff Member?" }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("John Doe", { exact: false }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        "will no longer be able to access the restaurant system.",
        { exact: false },
      ),
    ).toBeInTheDocument();
  });

  it("asks for confirmation before activating a SUSPENDED staff member", () => {
    const { dialog } = renderDialog({
      staff: { ...mockStaff, status: "SUSPENDED" },
    });

    expect(
      within(dialog).getByRole("heading", {
        name: "Activate Staff Member?",
      }),
    ).toBeInTheDocument();
  });

  it("confirms suspension with the target status", async () => {
    const { dialog, onConfirm } = renderDialog();
    const user = userEvent.setup();

    await user.click(within(dialog).getByRole("button", { name: "Suspend" }));

    expect(onConfirm).toHaveBeenCalledWith("user_1", "SUSPENDED");
  });

  it("confirms activation with the target status", async () => {
    const { dialog, onConfirm } = renderDialog({
      staff: { ...mockStaff, status: "INACTIVE" },
    });
    const user = userEvent.setup();

    await user.click(within(dialog).getByRole("button", { name: "Activate" }));

    expect(onConfirm).toHaveBeenCalledWith("user_1", "ACTIVE");
  });

  it("calls onClose when Cancel is clicked", async () => {
    const { dialog, onClose } = renderDialog();
    const user = userEvent.setup();

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalled();
  });

  it("shows pending state while confirming", () => {
    const { dialog } = renderDialog({ isPending: true });

    expect(
      within(dialog).getByRole("button", { name: "Suspending..." }),
    ).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeDisabled();
  });

  it("renders nothing when no staff is selected", () => {
    const { container } = render(
      <ToggleStaffStatusDialog
        open={true}
        staff={null}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        isPending={false}
      />,
    );

    expect(container.innerHTML).toBe("");
  });
});
