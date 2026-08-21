// @vitest-environment jsdom
import { render, within, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { StaffDetailsModal } from "./StaffDetailsModal";
import type { Staff } from "../users.types";

const mockStaff: Staff = {
  id: "user_1",
  name: "John Doe",
  email: "john@restaurant.com",
  role: "CASHIER",
  status: "ACTIVE",
  lastLoginAt: "2026-01-15T10:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

let mockRole = "OWNER";

vi.mock("@/features/auth/use-auth", () => ({
  useAuth: () => ({
    user: {
      id: "u1",
      name: "Test Owner",
      email: "owner@test.com",
      role: mockRole,
    },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

function renderModal(
  overrides?: Partial<React.ComponentProps<typeof StaffDetailsModal>>,
) {
  const onClose = vi.fn();
  const onEdit = vi.fn();
  const onToggleStatus = vi.fn();

  const defaultProps = {
    open: true,
    staff: mockStaff,
    onClose,
    onEdit,
    onToggleStatus,
    ...overrides,
  };

  act(() => {
    render(<StaffDetailsModal {...defaultProps} />);
  });

  const dialogs = document.querySelectorAll('[role="dialog"]');
  const dialog = dialogs[dialogs.length - 1] as HTMLElement;
  return { dialog, onClose, onEdit, onToggleStatus };
}

describe("StaffDetailsModal", () => {
  it("shows Edit Staff button for OWNER role", () => {
    mockRole = "OWNER";
    const { dialog } = renderModal();

    expect(
      within(dialog).getByRole("button", { name: "Edit Staff" }),
    ).toBeInTheDocument();
  });

  it("hides Edit Staff button for non-OWNER roles", () => {
    mockRole = "MANAGER";
    const { dialog } = renderModal();

    expect(
      within(dialog).queryByRole("button", { name: "Edit Staff" }),
    ).not.toBeInTheDocument();
  });

  it("calls onEdit when Edit Staff is clicked", async () => {
    mockRole = "OWNER";
    const { dialog, onEdit } = renderModal();
    const user = userEvent.setup();

    await user.click(within(dialog).getByRole("button", { name: "Edit Staff" }));

    expect(onEdit).toHaveBeenCalledWith(mockStaff);
  });

  it("shows staff details", () => {
    mockRole = "OWNER";
    const { dialog } = renderModal();

    expect(within(dialog).getByText("John Doe")).toBeInTheDocument();
    expect(within(dialog).getByText("john@restaurant.com")).toBeInTheDocument();
    expect(within(dialog).getByText("CASHIER")).toBeInTheDocument();
    expect(within(dialog).getByText("ACTIVE")).toBeInTheDocument();
  });

  it("calls onClose when Close is clicked", async () => {
    mockRole = "OWNER";
    const { dialog, onClose } = renderModal();
    const user = userEvent.setup();

    const closeButtons = within(dialog).getAllByRole("button", { name: "Close" });
    const footerClose = closeButtons.find((b) => b.className.includes("button--outline"));
    await user.click(footerClose!);

    expect(onClose).toHaveBeenCalled();
  });

  it("shows Suspend button for ACTIVE staff", () => {
    mockRole = "OWNER";
    const { dialog } = renderModal();

    expect(
      within(dialog).getByRole("button", { name: "Suspend" }),
    ).toBeInTheDocument();
  });

  it("shows Activate button for SUSPENDED staff", () => {
    mockRole = "OWNER";
    const { dialog } = renderModal({
      staff: { ...mockStaff, status: "SUSPENDED" },
    });

    expect(
      within(dialog).getByRole("button", { name: "Activate" }),
    ).toBeInTheDocument();
  });

  it("shows Activate button for INACTIVE staff", () => {
    mockRole = "OWNER";
    const { dialog } = renderModal({
      staff: { ...mockStaff, status: "INACTIVE" },
    });

    expect(
      within(dialog).getByRole("button", { name: "Activate" }),
    ).toBeInTheDocument();
  });

  it("hides Suspend and Activate buttons for non-OWNER roles", () => {
    mockRole = "MANAGER";
    const { dialog } = renderModal();

    expect(
      within(dialog).queryByRole("button", { name: "Suspend" }),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: "Activate" }),
    ).not.toBeInTheDocument();
  });

  it("shows the creation date", () => {
    mockRole = "OWNER";
    const { dialog } = renderModal();

    const expected = new Date(mockStaff.createdAt).toLocaleDateString();
    expect(within(dialog).getByText(expected)).toBeInTheDocument();
  });

  it("shows the last login date and time", () => {
    mockRole = "OWNER";
    const { dialog } = renderModal();

    const expected = new Date(mockStaff.lastLoginAt!).toLocaleString();
    expect(within(dialog).getByText(expected)).toBeInTheDocument();
  });

  it("shows Never when the staff member has no last login", () => {
    mockRole = "OWNER";
    const { dialog } = renderModal({
      staff: { ...mockStaff, lastLoginAt: null },
    });

    expect(within(dialog).getByText("Never")).toBeInTheDocument();
  });
});
