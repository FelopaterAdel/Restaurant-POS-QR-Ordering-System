// @vitest-environment jsdom
import { cleanup, render, within, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DeleteStaffDialog } from "./DeleteStaffDialog";
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

function renderDialog(isPending = false) {
  const onClose = vi.fn();
  const onConfirm = vi.fn();

  act(() => {
    render(
      <DeleteStaffDialog
        open
        staff={mockStaff}
        onClose={onClose}
        onConfirm={onConfirm}
        isPending={isPending}
      />,
    );
  });

  const dialogs = document.querySelectorAll('[role="dialog"]');
  const dialog = dialogs[dialogs.length - 1] as HTMLElement;
  return { dialog, onClose, onConfirm };
}

describe("DeleteStaffDialog", () => {
  afterEach(() => {
    cleanup();
  });

  it("names the staff member being deleted", () => {
    const { dialog } = renderDialog();

    expect(within(dialog).getByText("John Doe")).toBeInTheDocument();
  });

  it("confirms with the staff id", async () => {
    const { dialog, onConfirm } = renderDialog();
    const user = userEvent.setup();

    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(onConfirm).toHaveBeenCalledWith("user_1");
  });

  it("disables buttons while deleting", () => {
    const { dialog } = renderDialog(true);

    expect(
      within(dialog).getByRole("button", { name: "Deleting..." }),
    ).toBeDisabled();
    expect(
      within(dialog).getByRole("button", { name: "Cancel" }),
    ).toBeDisabled();
  });
});
