// @vitest-environment jsdom
import { render, within, screen, act, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";
import { EditStaffForm } from "./EditStaffForm";
import type { Staff } from "../users.types";

vi.mock("@/features/auth/use-auth", () => ({
  useAuth: () => ({
    user: { id: "u1", name: "Test Owner", email: "owner@test.com", role: "OWNER" },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

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

function renderForm(
  overrides?: Partial<React.ComponentProps<typeof EditStaffForm>>,
) {
  const onClose = vi.fn();
  const onSubmit = vi.fn();
  const defaultProps = {
    open: true,
    staff: mockStaff,
    onClose,
    onSubmit,
    isPending: false,
    error: null,
    ...overrides,
  };

  act(() => {
    render(<EditStaffForm {...defaultProps} />);
  });

  const dialogs = document.querySelectorAll('[role="dialog"]');
  const dialog = dialogs[dialogs.length - 1] as HTMLElement;
  return { dialog, onClose, onSubmit };
}

describe("EditStaffForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders modal with Edit Staff title", () => {
    const { dialog } = renderForm();

    expect(
      within(dialog).getByRole("heading", { name: "Edit Staff" }),
    ).toBeInTheDocument();
  });

  it("pre-fills form with staff data", () => {
    const { dialog } = renderForm();

    const nameInput = within(dialog).getByDisplayValue("John Doe") as HTMLInputElement;
    const emailInput = within(dialog).getByDisplayValue("john@restaurant.com") as HTMLInputElement;
    const roleSelect = within(dialog).getByDisplayValue("CASHIER") as HTMLSelectElement;

    expect(nameInput).toBeInTheDocument();
    expect(emailInput).toBeInTheDocument();
    expect(roleSelect).toBeInTheDocument();
  });

  it("renders Save Changes and Cancel buttons", () => {
    const { dialog } = renderForm();

    expect(
      within(dialog).getByRole("button", { name: "Save Changes" }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "Cancel" }),
    ).toBeInTheDocument();
  });

  it("calls onSubmit with updated data when form is valid", async () => {
    const { dialog, onSubmit } = renderForm();
    const user = userEvent.setup();

    const nameInput = within(dialog).getByDisplayValue("John Doe") as HTMLInputElement;
    await user.clear(nameInput);
    await user.type(nameInput, "Jane Smith");

    await user.click(
      within(dialog).getByRole("button", { name: "Save Changes" }),
    );

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Jane Smith",
      email: "john@restaurant.com",
      role: "CASHIER",
    });
  });

  it("calls onClose when Cancel is clicked", async () => {
    const { dialog, onClose } = renderForm();
    const user = userEvent.setup();

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalled();
  });

  it("asks for confirmation before discarding unsaved changes", async () => {
    const { onClose } = renderForm();
    const user = userEvent.setup();

    const nameInput = screen.getByDisplayValue("John Doe") as HTMLInputElement;
    await user.clear(nameInput);
    await user.type(nameInput, "Jane Smith");

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      screen.getByRole("heading", { name: "Discard changes?" }),
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes the form when discard is confirmed", async () => {
    const { onClose } = renderForm();
    const user = userEvent.setup();

    const nameInput = screen.getByDisplayValue("John Doe") as HTMLInputElement;
    await user.clear(nameInput);
    await user.type(nameInput, "Jane Smith");

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Discard" }));

    expect(onClose).toHaveBeenCalled();
  });

  it("keeps the form open when discard is cancelled", async () => {
    const { onClose } = renderForm();
    const user = userEvent.setup();

    const nameInput = screen.getByDisplayValue("John Doe") as HTMLInputElement;
    await user.clear(nameInput);
    await user.type(nameInput, "Jane Smith");

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Keep Editing" }));

    expect(onClose).not.toHaveBeenCalled();
    expect(
      screen.getByRole("heading", { name: "Edit Staff" }),
    ).toBeInTheDocument();
  });

  it("shows validation error for short name", async () => {
    const { dialog } = renderForm();
    const user = userEvent.setup();

    const nameInput = within(dialog).getByDisplayValue("John Doe") as HTMLInputElement;
    await user.clear(nameInput);
    await user.type(nameInput, "A");

    await user.click(
      within(dialog).getByRole("button", { name: "Save Changes" }),
    );

    await within(dialog).findByText("Name must be at least 2 characters");
  });

  it("shows validation error for invalid email", async () => {
    const { dialog } = renderForm();
    const user = userEvent.setup();

    const emailInput = within(dialog).getByDisplayValue(
      "john@restaurant.com",
    ) as HTMLInputElement;
    await user.clear(emailInput);
    await user.type(emailInput, "not-an-email");

    await user.click(
      within(dialog).getByRole("button", { name: "Save Changes" }),
    );

    await within(dialog).findByText("Invalid email address");
  });

  it("allows changing role via select", async () => {
    const { dialog, onSubmit } = renderForm();
    const user = userEvent.setup();

    const roleSelect = within(dialog).getByDisplayValue(
      "CASHIER",
    ) as HTMLSelectElement;
    await user.selectOptions(roleSelect, "WAITER");

    await user.click(
      within(dialog).getByRole("button", { name: "Save Changes" }),
    );

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ role: "WAITER" }),
    );
  });

  it("displays error message from API", () => {
    const { dialog } = renderForm({
      error: "This email is already in use.",
    });

    expect(
      within(dialog).getByText("This email is already in use."),
    ).toBeInTheDocument();
  });

  it("disables buttons when isPending", () => {
    const { dialog } = renderForm({ isPending: true });

    expect(
      within(dialog).getByRole("button", { name: "Cancel" }),
    ).toBeDisabled();
    expect(
      within(dialog).getByRole("button", { name: "Saving..." }),
    ).toBeDisabled();
  });

  it("does not render when open is false", () => {
    const { container } = render(
      <EditStaffForm
        open={false}
        staff={mockStaff}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        isPending={false}
        error={null}
      />,
    );

    expect(container.innerHTML).toBe("");
  });

  it("shows all non-owner role options in select", () => {
    const { dialog } = renderForm();

    const roleSelect = within(dialog).getByRole("combobox");
    const options = Array.from(roleSelect.querySelectorAll("option")).map(
      (o) => o.value,
    );

    expect(options).toContain("MANAGER");
    expect(options).toContain("CASHIER");
    expect(options).toContain("WAITER");
    expect(options).toContain("KITCHEN");
    expect(options).not.toContain("OWNER");
  });
});
